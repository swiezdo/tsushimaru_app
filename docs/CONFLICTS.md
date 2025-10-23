# CSS Конфликты и проблемы специфичности

**Файл:** `docs/css/style.css`  
**Версия:** v17  
**Статус:** Критичные и умеренные проблемы перед рефакторингом

---

## 1. Дубли селекторов с одинаковыми правилами

### 1.1 Border-radius = 12px (ШАГ КРИТИЧНЫЙ)

**Повторяется 15+ раз:**

```css
.btn { border-radius: 12px; }
.big-btn { border-radius: 16px; } /* Отличается */
.chip-btn { border-radius: 999px; } /* Отличается */
.fileline-btn { border-radius: 12px; }
.upload-box { border-radius: 12px; }
.shot-thumb { border-radius: 12px; }
.list-btn { border-radius: 12px; }
.profile-grid .field label { /* Нет border-radius, но есть вложенность */}
.shots-two .upload-box { border-radius: 12px; }
.shots-two .shot-thumb { border-radius: 12px; }
.shots-grid .shot-thumb { border-radius: 10px; }
.card { border-radius: var(--radius); /* var(--radius) = 16px */ }
.lightbox img { border-radius: 12px; }
.preview-item, .preview-more { border-radius: 10px; }
```

**Решение:** Ввести переменные `--radius-md: 12px`, `--radius-sm: 10px`, `--radius-lg: 16px` и заменить все.

---

### 1.2 Border = 1px solid var(--stroke) (ШАГ КРИТИЧНЫЙ)

**Повторяется ~20 раз в:**
- `.btn`
- `.big-btn`
- `.chip-btn`
- `.input input, .input textarea`
- `.upload-box`
- `.shot-thumb`
- `.list-btn`
- `.preview-item`, `.preview-more`
- `.fileline-btn`
- `.card`
- `.lightbox img`
- и т.д.

**Решение:** Создать базовый класс `.bordered` или добавить в компонентные базовые стили.

---

### 1.3 Grid-layout для 2 столбцов (ДУБЛИ)

```css
.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

#buildDetailScreen .profile-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

#buildPublicDetailScreen .profile-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.shots-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
```

**Проблема:**
- Правила в ID-селекторах (#buildDetailScreen) переопределяют базовый класс
- Для `shots-grid` используется `gap: 8px` вместо `12px`
- Нет утилит типа `.grid-2` и `.gap-*`

**Решение:** 
- Создать утилиты `.grid-2`, `.grid-1`
- Использовать `.gap-2` (8px), `.gap-3` (12px)
- Переопределения на ID заменить на модификаторы класса

---

### 1.4 Display: flex с выравниванием (НЕЯВНЫЕ ДУБЛИ)

```css
.home .brand { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.shots-two { display: grid; grid-template-columns: repeat(2, auto); gap: 8px; justify-content: flex-start; }
.thumbs-row { display: flex; gap: 6px; /* мобильный */ ... flex-wrap: nowrap; }
.build-item { display: grid; grid-template-columns: 48px 1fr; gap: 10px; align-items: center; }
```

**Решение:** Создать утилиты:
- `.flex-center` (display: flex; align-items: center; justify-content: center)
- `.flex-between` (display: flex; justify-content: space-between; align-items: center)
- `.flex-col` (display: flex; flex-direction: column)

---

## 2. Проблемы специфичности

### 2.1 ID-селекторы для переопределений (ВЫСОКАЯ СПЕЦИФИЧНОСТЬ)

| Селектор | Специфичность | Проблема | Решение |
|----------|----------------|---------|--------|
| `#buildDetailScreen .profile-grid` | (1,1,0) | Переопределение base класса | Использовать `.profile-grid.detail` или `.profile-grid--single` |
| `#buildPublicDetailScreen .profile-grid` | (1,1,0) | Дубль выше | Использовать тот же модификатор |
| `#proofForm { gap: 8px; }` | (1,0,0) | Переопределение `.form { gap: 12px; }` | Использовать `.form.compact` |
| `#buildsScreen .card:last-of-type` | (1,1,1) | Специфичное правило | Использовать контекстный класс |

### 2.2 !important (ГРАНИЧНЫЕ СЛУЧАИ)

```css
.error { border-color: #ff4444 !important; }
/* Причина: переопределяет .input input:focus { border-color: var(--accent); } */

.lightbox.hidden { display: none !important; }
/* Причина: гарантия скрытия лайтбокса */
```

**Статус:**
- ❌ `.error` — можно убрать, переорганизовав каскад (увеличить специфичность `.error`)
- ✅ `.lightbox.hidden` — оправдано, оставить

---

### 2.3 Каскадные конфликты

#### Topbar margin (КОНФЛИКТ)
```css
.topbar { margin-bottom: 8px; }  /* line 40 */
.topbar { margin: 16px 16px 0 16px; }  /* line 380 (позднее) */
```
**Последний выигрывает:** `margin: 16px 16px 0 16px`, что overrides margin-bottom.  
**Решение:** Объединить оба правила или комментировать.

---

#### Form gap (ПЕРЕОПРЕДЕЛЕНИЕ)
```css
.form { gap: 12px; }  /* line 61 */
#proofForm { gap: 8px; }  /* line 293 */
```
**Специфичность:** ID выигрывает.  
**Решение:** Использовать класс, не ID: `.form.compact { gap: 8px; }`

---

## 3. Отсутствующие утилиты (НУЖНЫ)

| Утилита | Кол-во применений | Пример |
|---------|------------------|--------|
| `.gap-*` (.gap-1, .gap-2, .gap-3, .gap-4) | 10+ | Сейчас gap вколочены в компоненты |
| `.m-*` (.m-1, .m-2, .m-3, .m-4) | 5+ | margin-bottom на отдельные блоки |
| `.p-*` (.p-1, .p-2, .p-3, .p-4) | 3+ | padding на span элементы |
| `.text-muted` | 5+ | Для `color: var(--tg-hint)` |
| `.opacity-75` | 2+ | Для `.muted { opacity: 0.7; }`, `.ghost { opacity: 0.95; }` |
| `.flex-center` | 3+ | `display: flex; align-items: center; justify-content: center;` |
| `.flex-between` | 2+ | `display: flex; justify-content: space-between; align-items: center;` |
| `.grid-2` | 3+ | grid 2 столбца |
| `.grid-1` | 3+ | grid 1 столбец (в mobile/переопределении) |
| `.truncate`, `.line-clamp` | 1+ | Для `.build-title { text-overflow: ellipsis; }` |

---

## 4. Несогласованные значения (ШКАЛА)

### 4.1 Spacing значения без системы

| Значение | Контекст | Почему странно |
|----------|----------|----------------|
| `4px` | `.field label { margin-bottom: 4px; }` | Очень мало, не выравнивается с остальным |
| `6px` | `.thumbs-row { gap: 6px; }`, `.desc-list { gap: 6px; }` | Не кратно 8px |
| `8px` | Base gap | OK |
| `10px` | `.big-btn { padding: 14px 16px; }`, `.build-item { gap: 10px; }` | Не в шкале |
| `12px` | Most gap | OK, но не 8px кратно |
| `14px` | Input padding | Асимметричный (12px 14px) |
| `18px` | `.desc-list { margin-left: 18px; }` | Странное значение |
| `28px`, `36px` | Safe-area | Три разные формулы |

**Решение:** Ввести шкалу на базе 8px.

---

### 4.2 Font-size без системы

```
12px, 13px, 14px, 15px, 16px, 20px, 22px, 28px
```

**Нет прогрессии!** Каждый селектор вводит свой размер.

**Решение:** Создать переменные `--fs-12`, `--fs-14`, `--fs-16`, `--fs-20`, `--fs-22` и использовать везде.

---

### 4.3 Line-height без системы

```css
body { line-height: 1.45; }  /* базовый */
.input textarea { line-height: 1.35; }  /* поля */
#trophiesScreen .value { line-height: 1.15; }  /* detail */
```

**Решение:** Переменные `--lh-base: 1.45`, `--lh-normal: 1.35`, `--lh-tight: 1.15`

---

## 5. Вложенность селекторов (МОЖЕТ БЫТЬ ВЫШЕ)

| Селектор | Уровни | Оценка | Примечание |
|----------|--------|--------|-----------|
| `.profile-grid` | 0 | ✅ | OK |
| `.input label` | 1 | ✅ | OK, компонентный стиль |
| `.thumbs-row .preview-item.removable::after` | 3 | ⚠️ | Можно, но глубоко. Оправдано для стилизации after |
| `#buildDetailScreen .profile-grid` | 2 (ID + class) | ❌ | Высокая специфичность для переопределения |
| `@media(max-width: 640px) .profile-grid` | Многоуровневая | ✅ | Нормальное переопределение |
| `.shots-grid .shot-thumb img` | 2 | ✅ | OK |

---

## 6. Резюме критичных действий

### ШАГ 1: Токены (B этап)
- [ ] Создать переменные `--radius-sm`, `--radius-md`, `--radius-lg`
- [ ] Создать переменные `--space-0` ... `--space-10` (8px модуль)
- [ ] Создать переменные `--fs-*` и `--lh-*`

### ШАГ 2: Утилиты (C1 этап)
- [ ] `.grid-1`, `.grid-2`
- [ ] `.gap-1`, `.gap-2`, `.gap-3`, `.gap-4`
- [ ] `.m-*`, `.p-*`, `.mt-*`, `.mb-*` и т.д.
- [ ] `.flex-center`, `.flex-between`, `.flex-col`
- [ ] `.text-muted`, `.opacity-*`

### ШАГ 3: Дедупликация (D этап)
- [ ] Удалить дубли border-radius, заменить на переменные
- [ ] Удалить дубли grid, заменить на утилиты
- [ ] Заменить ID-селекторы на классы с модификаторами

### ШАГ 4: Каскад (C2, D этапы)
- [ ] Убрать `!important` из `.error`, пересчитать специфичность
- [ ] Объединить конфликтующие `.topbar` правила
- [ ] Заменить `#proofForm` на `.form.compact`

---

## Контрольный список решения

- [x] Каталог проблем (этот файл)
- [ ] Применить в B этапе (токены)
- [ ] Применить в C этапе (утилиты и реструктура)
- [ ] Проверить D этап (миграция HTML)
