# Миграция HTML: Старые классы → Новые утилиты

**Дата:** 2025-10-23  
**Статус:** План миграции для Этапа D  
**Файлы:** `docs/index.html` + `docs/css/style.css`

---

## Содержание

1. [Mapping таблица](#mapping-таблица)
2. [Регулярные выражения для замены](#regex-замены)
3. [Ручные изменения](#ручные-изменения)
4. [CSS-удаления](#css-удаления)
5. [Чек-лист](#чек-лист)

---

## Mapping таблица

### Группа 1: Layout и Grid

| Старый класс | Новый способ | Файлы | Причина | Приоритет |
|--------------|-------------|-------|--------|-----------|
| Нет изменений | Остаётся `.profile-grid` | index.html | Специфичный компонент | LOW |
| `.profile-grid` (в detail screen) | `.profile-grid.grid-1` или просто оставить | index.html | Переопределение в CSS | DONE |
| `.form { gap: 12px }` | Оставить в CSS | index.html | Базовый стиль | LOW |
| `.shots-grid` | Оставить | index.html | Специфичный компонент | LOW |
| `.list-buttons` | Оставить | index.html | Специфичный компонент | LOW |
| `.actions-bar` | Оставить (используется везде) | index.html | Компонент | LOW |

### Группа 2: Spacing (потенциальные утилиты)

| Паттерн | Текущее состояние | Статус | Приоритет |
|--------|-----------------|--------|-----------|
| `margin-bottom: 8px` | В `.footer-actions`, `#submitInlineBtn` | OK (в CSS) | LOW |
| `margin-bottom: 16px` | В `.card` | OK (в CSS) | LOW |
| `margin-top: 8px` | В `.hint` (не видел) | NEED CHECK | MEDIUM |
| `margin-bottom: 12px` | В `.brand`, `.card-title` | OK (в CSS) | LOW |
| `gap: 8px` | В `.actions-bar`, `.chips`, и т.д. | OK (в CSS) | LOW |
| `gap: 12px` | В `.form`, `.profile-grid` | OK (в CSS) | LOW |

### Группа 3: Компоненты (без изменений)

| Компонент | Статус | Причина |
|-----------|--------|---------|
| `.card` | ✅ OK | Фундаментальный компонент |
| `.btn`, `.btn.primary`, `.btn.danger` | ✅ OK | Фундаментальные компоненты |
| `.chip-btn`, `.chip-btn.active` | ✅ OK | Специализированный компонент |
| `.big-btn`, `.big-btn.primary` | ✅ OK | Специализированный компонент |
| `.input`, `.input input`, `.input textarea` | ✅ OK | Специализированный компонент |
| `.field`, `.field label` | ✅ OK | Специализированный компонент |
| `.list-btn` | ✅ OK | Специализированный компонент |
| `.build-item`, `.build-icon` | ✅ OK | Специализированный компонент |

### Группа 4: Состояния и утилиты (уже используются)

| Класс | Использование | Статус |
|-------|----------------|--------|
| `.hidden` | Везде в JS для скрытия/показа | ✅ OK (не менять) |
| `.active` | `.chip-btn.active` | ✅ OK (не менять) |
| `.muted` | `.list-btn .right`, `.muted` текст | ✅ OK (не менять) |
| `.shake` | Error animations | ✅ OK (не менять) |
| `.error` | Input validation | ✅ OK (не менять) |

### Группа 5: Inline стили в HTML (потенциальные замены)

| Старый стиль | HTML элементы | Новый способ | Приоритет |
|-------------|-------------------|------------|-----------|
| `style="display:none"` | `<div style="height: ...">` spейсеры | Оставить (safe-area расчёты) | LOW |
| `style="margin-top: 8px"` | `.hint` элемент | Не найдено | LOW |
| `style="display: none"` (в JS) | `noBuildsHint`, `noAllBuildsHint` | REPLACE ON `.hidden` | MEDIUM |

---

## Regex-замены

### Замена 1: Удаление дублирующихся дефинций в CSS

**В `style.css`** (уже сделано):
- ✅ `.profile-grid { gap: 12px; }` остаётся одна дефиниция
- ✅ Объединены `.topbar` правила
- ✅ Заменены все хардкод значения на переменные

**Regex для проверки дублей:**
```regex
^(.+)\s*\{\s*$
```
(найти повторяющиеся селекторы)

### Замена 2: Нет глобальных замен в HTML

**Статус:** ❌ **НЕ ТРЕБУЕТСЯ**

HTML структура остаётся без изменений. Все классы уже оптимальны.

---

## Ручные изменения

### В `builds.js` (Этап E)

**Файл:** `docs/js/builds.js`

```javascript
// ❌ БЫЛО (строка ~137)
if (!items.length) { noBuildsHint.style.display = 'block'; return; }
noBuildsHint.style.display = 'none';

// ✅ СТАЛО
if (!items.length) { noBuildsHint.classList.remove('hidden'); return; }
noBuildsHint.classList.add('hidden');
```

**Аналогично строка ~168:**
```javascript
// ❌ БЫЛО
if (!items.length) { noAllBuildsHint.style.display = 'block'; return; }
noAllBuildsHint.style.display = 'none';

// ✅ СТАЛО
if (!items.length) { noAllBuildsHint.classList.remove('hidden'); return; }
noAllBuildsHint.classList.add('hidden');
```

### В `trophies.js` (Этап E)

**Файл:** `docs/js/trophies.js`

Здесь динамический height для textarea — **оставить как есть** (это бизнес-логика).

```javascript
// ✅ OK - оставить
commentEl.style.height = 'auto';
commentEl.style.height = Math.min(commentEl.scrollHeight, 200) + 'px';
```

---

## CSS-удаления

### Из `style.css` (Этап D3)

**Удалить/обновить дублирующиеся правила:**

✅ **УЖЕ СДЕЛАНО в Этапе B:**
- Удалены дубли `border-radius`
- Удалены дубли `border: 1px solid`
- Заменены все хардкод margin/padding на переменные
- Объединены конфликтующие `.topbar` правила

**Осталось проверить:**
- [ ] `#proofForm { gap: 8px; }` — специфичное правило, оставить (редкий случай)
- [ ] `#buildsScreen .card:last-of-type` — оставить (специфичное правило для safe-area)

---

## Чек-лист

### D1: Mapping (DONE ✅)

- [x] Создана таблица всех селекторов и их статуса
- [x] Выявлены паттерны для замены
- [x] Документированы приоритеты

### D2: HTML замены (NOT REQUIRED)

Текущая HTML структура оптимальна:
- ✅ Классы соответствуют компонентам
- ✅ Inline стили используются только для safe-area расчётов
- ✅ Нет дублирующихся классов

**Вывод:** HTML изменять **не нужно**. Переходим на Этап E (JS).

### D3: CSS очистка (DONE ✅)

- [x] Удалены/объединены дубли
- [x] Специфичность снижена
- [x] Все значения → переменные
- [x] Структура логична и читаема

---

## Итоговый статус Этапа D

| Подзадача | Статус | Комментарий |
|-----------|--------|------------|
| D1: Mapping | ✅ DONE | Таблица создана, анализ завершён |
| D2: HTML замены | ⚠️ NOT NEEDED | HTML уже оптимален, изменения не требуются |
| D3: CSS очистка | ✅ DONE | В Этапе B+C, дубли удалены |
| D.Next → E | ✅ READY | Переходим на Этап E (JS перепривязка) |

---

## Что дальше

### Этап E: JS-перепривязка (следующий)

**Файлы для изменения:**
1. `docs/js/builds.js` — заменить `style.display` на `.hidden`
2. `docs/js/trophies.js` — проверить (скорее всего OK)

**Строки для замены:**
- `builds.js:137-138` → `classList.remove('hidden')`
- `builds.js:168-169` → `classList.remove('hidden')`

**Время:** ~15 минут

---

**Документ подготовлен:** 2025-10-23  
**Следующий этап:** E (JS перепривязка)
