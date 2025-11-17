#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для аудита CSS файла на наличие дубликатов:
- Повторяющиеся селекторы
- Одинаковые правила у разных селекторов
- Дубликаты значений свойств
- Частичные дубликаты
"""

import re
import json
from collections import defaultdict
from typing import Dict, List, Tuple, Set
from dataclasses import dataclass, field


@dataclass
class CSSRule:
    """Представляет одно CSS правило"""
    selector: str
    properties: Dict[str, str]
    line_start: int
    line_end: int
    context: str = ""  # Медиа-запрос или другой контекст
    
    def normalized_properties(self) -> str:
        """Возвращает нормализованную строку свойств для сравнения"""
        # Сортируем свойства по ключу для сравнения
        sorted_props = sorted(self.properties.items())
        return "; ".join(f"{k}: {v}" for k, v in sorted_props)
    
    def properties_set(self) -> Set[Tuple[str, str]]:
        """Возвращает множество свойств для быстрого сравнения"""
        return set(self.properties.items())


class CSSParser:
    """Парсер CSS файла"""
    
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.rules: List[CSSRule] = []
        self.current_context = ""
        
    def parse(self) -> List[CSSRule]:
        """Парсит CSS файл и возвращает список правил"""
        with open(self.filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
        
        # Удаляем комментарии
        content = self._remove_comments(content)
        
        # Парсим медиа-запросы и обычные правила
        self._parse_content(content, lines)
        
        return self.rules
    
    def _remove_comments(self, content: str) -> str:
        """Удаляет CSS комментарии"""
        # Удаляем многострочные комментарии /* ... */
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        return content
    
    def _parse_content(self, content: str, lines: List[str]):
        """Парсит CSS контент"""
        # Разбиваем на блоки (медиа-запросы и обычные правила)
        # Сначала извлекаем медиа-запросы
        media_pattern = r'@media[^{]+\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}'
        media_matches = list(re.finditer(media_pattern, content, re.DOTALL))
        
        # Удаляем медиа-запросы из контента для дальнейшего парсинга
        content_without_media = content
        for match in reversed(media_matches):
            media_query = match.group(0)
            media_content = match.group(1)
            # Парсим правила внутри медиа-запроса
            self._parse_rules_block(media_content, lines, f"@media {match.group(0)[:50]}...")
            # Удаляем из основного контента
            content_without_media = content_without_media.replace(media_query, '', 1)
        
        # Парсим остальные правила
        self._parse_rules_block(content_without_media, lines, "")
    
    def _parse_rules_block(self, content: str, lines: List[str], context: str):
        """Парсит блок CSS правил"""
        # Паттерн для поиска правил: селектор { свойства }
        # Учитываем вложенные правила (например, псевдоклассы)
        pattern = r'([^{]+)\{([^}]+)\}'
        
        for match in re.finditer(pattern, content):
            selector_part = match.group(1).strip()
            properties_part = match.group(2).strip()
            
            if not selector_part or not properties_part:
                continue
            
            # Разбиваем селекторы (могут быть через запятую)
            selectors = [s.strip() for s in selector_part.split(',')]
            
            # Парсим свойства
            properties = self._parse_properties(properties_part)
            
            if not properties:
                continue
            
            # Находим номера строк для этого правила
            start_pos = match.start()
            end_pos = match.end()
            line_start, line_end = self._find_line_numbers(content, start_pos, end_pos)
            
            # Создаем правило для каждого селектора
            for selector in selectors:
                if selector and not selector.startswith('@'):
                    rule = CSSRule(
                        selector=selector.strip(),
                        properties=properties,
                        line_start=line_start,
                        line_end=line_end,
                        context=context
                    )
                    self.rules.append(rule)
    
    def _parse_properties(self, properties_str: str) -> Dict[str, str]:
        """Парсит строку свойств в словарь"""
        properties = {}
        # Разбиваем по точкам с запятой
        props = re.split(r';(?![^()]*\))', properties_str)
        
        for prop in props:
            prop = prop.strip()
            if not prop or ':' not in prop:
                continue
            
            # Разделяем на ключ и значение
            parts = prop.split(':', 1)
            if len(parts) == 2:
                key = parts[0].strip()
                value = parts[1].strip()
                # Нормализуем значение (убираем лишние пробелы)
                value = re.sub(r'\s+', ' ', value)
                properties[key] = value
        
        return properties
    
    def _find_line_numbers(self, content: str, start_pos: int, end_pos: int) -> Tuple[int, int]:
        """Находит номера строк для позиций в контенте"""
        # Подсчитываем переводы строк до start_pos
        line_start = content[:start_pos].count('\n') + 1
        line_end = content[:end_pos].count('\n') + 1
        return line_start, line_end


class CSSDuplicateFinder:
    """Находит дубликаты в CSS"""
    
    def __init__(self, rules: List[CSSRule]):
        self.rules = rules
    
    def find_duplicate_selectors(self) -> Dict[str, List[CSSRule]]:
        """Находит селекторы, определенные несколько раз"""
        selector_groups = defaultdict(list)
        
        for rule in self.rules:
            # Нормализуем селектор (убираем лишние пробелы)
            normalized = re.sub(r'\s+', ' ', rule.selector.strip())
            selector_groups[normalized].append(rule)
        
        # Возвращаем только те, что встречаются более одного раза
        return {sel: rules for sel, rules in selector_groups.items() if len(rules) > 1}
    
    def find_duplicate_rules(self) -> List[Tuple[List[CSSRule], str]]:
        """Находит правила с идентичными свойствами у разных селекторов"""
        # Группируем правила по нормализованным свойствам
        rules_by_props = defaultdict(list)
        
        for rule in self.rules:
            normalized = rule.normalized_properties()
            if normalized:  # Игнорируем пустые правила
                rules_by_props[normalized].append(rule)
        
        # Возвращаем группы с более чем одним правилом
        duplicates = []
        for props_str, rules in rules_by_props.items():
            if len(rules) > 1:
                # Исключаем случаи, когда это один и тот же селектор
                unique_selectors = {rule.selector for rule in rules}
                if len(unique_selectors) > 1:
                    duplicates.append((rules, props_str))
        
        return duplicates
    
    def find_duplicate_values(self) -> Dict[str, List[Tuple[str, CSSRule]]]:
        """Находит одинаковые значения у разных свойств/селекторов"""
        # Группируем по значениям свойств
        value_groups = defaultdict(list)
        
        for rule in self.rules:
            for prop_name, prop_value in rule.properties.items():
                # Нормализуем значение
                normalized_value = prop_value.strip()
                if normalized_value:
                    value_groups[normalized_value].append((prop_name, rule))
        
        # Возвращаем только значения, встречающиеся более одного раза
        return {val: items for val, items in value_groups.items() if len(items) > 1}
    
    def find_partial_duplicates(self, min_common: int = 2) -> List[Tuple[CSSRule, CSSRule, Set[Tuple[str, str]]]]:
        """Находит частичные дубликаты (общие свойства)"""
        partial_duplicates = []
        
        # Сравниваем каждую пару правил
        for i, rule1 in enumerate(self.rules):
            props1 = rule1.properties_set()
            if not props1:
                continue
            
            for rule2 in self.rules[i+1:]:
                props2 = rule2.properties_set()
                if not props2:
                    continue
                
                # Находим общие свойства
                common = props1 & props2
                
                if len(common) >= min_common:
                    # Проверяем, что это разные селекторы
                    if rule1.selector != rule2.selector:
                        partial_duplicates.append((rule1, rule2, common))
        
        return partial_duplicates


def generate_report(parser: CSSParser, finder: CSSDuplicateFinder, output_file: str):
    """Генерирует отчет о дубликатах"""
    
    duplicate_selectors = finder.find_duplicate_selectors()
    duplicate_rules = finder.find_duplicate_rules()
    duplicate_values = finder.find_duplicate_values()
    partial_duplicates = finder.find_partial_duplicates()
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Отчет: Дубликаты в CSS\n\n")
        f.write("## Дата анализа\n")
        from datetime import datetime
        f.write(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("## Методология\n\n")
        f.write("Анализ выполнен автоматически с помощью скрипта `audit_css_duplicates.py`.\n")
        f.write("Проверены следующие типы дубликатов:\n")
        f.write("- Повторяющиеся селекторы\n")
        f.write("- Одинаковые правила у разных селекторов\n")
        f.write("- Дубликаты значений свойств\n")
        f.write("- Частичные дубликаты (общие свойства)\n\n")
        
        f.write("## Статистика\n\n")
        f.write(f"- Всего правил в CSS: {len(parser.rules)}\n")
        f.write(f"- Уникальных селекторов: {len(set(r.selector for r in parser.rules))}\n")
        f.write(f"- Селекторов с дубликатами: {len(duplicate_selectors)}\n")
        f.write(f"- Групп правил с идентичными свойствами: {len(duplicate_rules)}\n")
        f.write(f"- Уникальных значений свойств с дубликатами: {len(duplicate_values)}\n")
        f.write(f"- Пар правил с частичными дубликатами: {len(partial_duplicates)}\n\n")
        
        # Дубликаты селекторов
        f.write("## 1. Дубликаты селекторов\n\n")
        if duplicate_selectors:
            f.write("Найдены селекторы, которые определены несколько раз в файле:\n\n")
            for selector, rules in sorted(duplicate_selectors.items()):
                f.write(f"### Селектор: `{selector}`\n\n")
                f.write(f"**Количество определений:** {len(rules)}\n\n")
                for i, rule in enumerate(rules, 1):
                    f.write(f"**Определение {i}:**\n")
                    f.write(f"- Строки: {rule.line_start}-{rule.line_end}\n")
                    if rule.context:
                        f.write(f"- Контекст: {rule.context}\n")
                    f.write(f"- Свойства ({len(rule.properties)}):\n")
                    for prop, value in sorted(rule.properties.items()):
                        f.write(f"  - `{prop}: {value}`\n")
                    f.write("\n")
                f.write("**Рекомендация:** Объединить все определения в одно правило.\n\n")
        else:
            f.write("Дубликаты селекторов не найдены.\n\n")
        
        # Дубликаты правил
        f.write("## 2. Правила с идентичными свойствами\n\n")
        if duplicate_rules:
            f.write("Найдены разные селекторы с полностью идентичными наборами свойств:\n\n")
            for rules, props_str in duplicate_rules:
                f.write(f"### Группа из {len(rules)} правил\n\n")
                f.write("**Идентичные свойства:**\n")
                for prop in sorted([p.split(':')[0] for p in props_str.split('; ')]):
                    f.write(f"- `{prop}`\n")
                f.write("\n**Селекторы:**\n")
                for rule in rules:
                    f.write(f"- `{rule.selector}` (строки {rule.line_start}-{rule.line_end})\n")
                    if rule.context:
                        f.write(f"  - Контекст: {rule.context}\n")
                f.write("\n**Рекомендация:** Объединить селекторы через запятую или создать общий класс.\n\n")
        else:
            f.write("Правила с идентичными свойствами не найдены.\n\n")
        
        # Дубликаты значений
        f.write("## 3. Дубликаты значений свойств\n\n")
        if duplicate_values:
            # Группируем по частоте использования
            sorted_values = sorted(duplicate_values.items(), key=lambda x: len(x[1]), reverse=True)
            f.write("Найдены одинаковые значения, используемые в разных свойствах/селекторах:\n\n")
            f.write("### Топ-20 наиболее часто используемых значений\n\n")
            for value, items in sorted_values[:20]:
                f.write(f"**Значение:** `{value}`\n\n")
                f.write(f"**Используется:** {len(items)} раз(а)\n\n")
                # Группируем по имени свойства
                by_prop = defaultdict(list)
                for prop_name, rule in items:
                    by_prop[prop_name].append(rule)
                
                for prop_name, rules in sorted(by_prop.items()):
                    f.write(f"- Свойство `{prop_name}` ({len(rules)} раз):\n")
                    for rule in rules[:5]:  # Показываем первые 5
                        f.write(f"  - `{rule.selector}` (строка {rule.line_start})\n")
                    if len(rules) > 5:
                        f.write(f"  - ... и еще {len(rules) - 5}\n")
                f.write("\n")
        else:
            f.write("Дубликаты значений не найдены.\n\n")
        
        # Частичные дубликаты
        f.write("## 4. Частичные дубликаты (общие свойства)\n\n")
        if partial_duplicates:
            # Группируем по количеству общих свойств
            sorted_partial = sorted(partial_duplicates, key=lambda x: len(x[2]), reverse=True)
            f.write("Найдены пары правил с общими свойствами:\n\n")
            f.write("### Топ-30 пар с наибольшим количеством общих свойств\n\n")
            for rule1, rule2, common in sorted_partial[:30]:
                f.write(f"**Пара:**\n")
                f.write(f"- `{rule1.selector}` (строки {rule1.line_start}-{rule1.line_end})\n")
                f.write(f"- `{rule2.selector}` (строки {rule2.line_start}-{rule2.line_end})\n\n")
                f.write(f"**Общих свойств:** {len(common)}\n\n")
                f.write("**Общие свойства:**\n")
                for prop, value in sorted(common):
                    f.write(f"- `{prop}: {value}`\n")
                f.write("\n**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.\n\n")
        else:
            f.write("Частичные дубликаты не найдены.\n\n")
        
        f.write("## Рекомендации по оптимизации\n\n")
        f.write("1. **Объединить дубликаты селекторов** - если один селектор определен несколько раз, объедините все свойства в одно правило.\n")
        f.write("2. **Использовать общие классы** - если разные селекторы имеют одинаковые свойства, создайте общий класс.\n")
        f.write("3. **Использовать CSS переменные** - для часто повторяющихся значений создайте CSS переменные в `:root`.\n")
        f.write("4. **Рассмотреть миксины** - для частичных дубликатов можно использовать общие классы-утилиты.\n\n")


def main():
    """Главная функция"""
    css_file = '/root/tsushimaru_app/docs/css/style.css'
    output_file = '/root/tsushimaru_app/docs/CSS_DUPLICATES_REPORT.md'
    
    print("Парсинг CSS файла...")
    parser = CSSParser(css_file)
    rules = parser.parse()
    print(f"Найдено правил: {len(rules)}")
    
    print("Поиск дубликатов...")
    finder = CSSDuplicateFinder(rules)
    
    print("Генерация отчета...")
    generate_report(parser, finder, output_file)
    
    print(f"Отчет сохранен в {output_file}")


if __name__ == '__main__':
    main()

