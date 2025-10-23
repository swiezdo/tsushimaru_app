# CSS Аудит: Tsushima Mini App

**Дата:** 2025-10-23  
**Версия:** v17  
**Файл:** `docs/css/style.css`

---

## Часть A1: Каталог всех margin/padding значений

### Используемые величины (по частоте)

| Величина | Кол-во | Селекторы / Контекст |
|----------|--------|----------------------|
| `0` | 1+ | `* { margin:0; padding:0; }` (глобальный reset) |
| `4px` | 3 | `.field label { margin-bottom: 4px; }`, `.thumbs-row:empty { margin-top: 6px; }`, `@keyframes shake { ... 4px ... }` |
| `6px` | 2 | `.thumbs-row { gap: 6px; }` (мобильный), `.desc-list { gap: 6px; }` |
| `8px` | 7+ | `.topbar { margin-bottom: 8px; }`, `.actions-bar { gap: 8px; }`, `.shots-two { gap: 8px; }`, `.fileline-btn { gap: 8px; }`, `.list-buttons { gap: 8px; }`, `.footer-actions { margin: 8px 0 ... }` |
| `10px` | 2 | `.shots-two .upload-box`, `.build-item` (padding и dims) |
| `12px` | 9+ | `.card-title { margin-bottom: 12px; }`, `.form { gap: 12px; }`, `.input input,textarea { padding: 12px 14px; }`, `.profile-grid { gap: 12px; }` (в том числе в `#buildDetailScreen`), `.card:last-of-type { margin-bottom: calc(...+ 12px); }` |
| `14px` | 3 | `.input input,textarea { padding: 12px 14px; }`, `.list-btn { padding: 12px 14px; }`, `.big-btn { padding: 14px 16px; }` |
| `16px` | 10+ | `.body { padding: 16px; }`, `.card { padding: 16px; margin-bottom: 16px; }`, `.btn { padding: 12px 16px; }`, `.big-btn { padding: 14px 16px; }`, `.actions-bar { margin: 16px 0; }`, `.topbar { margin: 16px 16px 0 16px; }` |
| `18px` | 2 | `.desc-list { margin-left: 18px; }`, `.thumbs-row .preview-item { font-size: 18px; }` |
| `20px` | 1 | `.title { font-size: 20px; }` |
| `28px` | 2 | `#backToListBtn`, `.footer-actions { margin-bottom: calc(28px + var(--safe-bottom)); }` |
| `36px` | 1 | `.body { padding-bottom: calc(36px + var(--safe-bottom)); }` |

### Расчёты через `calc()`

1. **Safe-area bottom отступы:**
   - `calc(env(safe-area-inset-bottom, 0px) + 12px)` — спейсеры в нескольких местах (финальный блок на всех экранах)
   - `calc(env(safe-area-inset-bottom, 0px) + 28px)` — `.footer-actions`, `#backToListBtn`
   - `calc(36px + var(--safe-bottom))` — `.body { padding-bottom }` (самый большой)

2. **Динамические отступы в JS:**
   - `buildDescEl.style.height = Math.min(buildDescEl.scrollHeight, 200) + 'px'` (auto-resize textarea)
   - `commentEl.style.height = Math.min(commentEl.scrollHeight, 200) + 'px'` (то же)

### Проблема: Несгармонизированные величины

- **Gap/spacing:** используются `6px`, `8px`, `10px`, `12px` без единой шкалы
- **Safe-area:** три разных значения: `+12px`, `+28px`, `+36px`
- **Padding в полях:** `12px 14px` (асимметричный)
- **Font-size:** не унифицирован (есть `12px`, `13px`, `14px`, `15px`, `16px`, `20px`, `22px`, `28px`)
- **Line-height:** смешаны `1.15`, `1.35`, `1.45`

---

## Часть A2: Конфликты специфичности и дубли

### 1. `!important` в коде

| Селектор | Правило | Причина | Статус |
|----------|---------|---------|--------|
| `.error` | `border-color:#ff4444!important;` | Переопределение от фокуса `.input input:focus` | ❌ Можно убрать |
| `.lightbox.hidden` | `display:none!important;` | Гарантия скрытия | ⚠️ Оправдано |

### 2. Дублирующиеся селекторы

| Паттерн | Селекторы | Проблема |
|--------|-----------|---------|
| `display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;` | `.profile-grid` (вариант 1), `#buildDetailScreen .profile-grid`, `#buildPublicDetailScreen .profile-grid` | Один и тот же макет, но разные места в CSS |
| `display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;` | `.shots-grid` | |
| `border-radius: 12px;` | `.btn`, `.big-btn`, `.fileline-btn`, `.upload-box`, `.shot-thumb`, `.list-btn`, `.chip-btn`, и т.д. | **Критично:** повторяется ~15 раз |
| `border: 1px solid var(--stroke);` | Почти все компоненты (~20 раз) | Дублируется постоянно |
| `display: flex; align-items: center; justify-content: center;` | `.home .brand`, `.flex-center` (нет такого класса, но нужен) | Неявно повторяется |

### 3. Вложенность селекторов

| Селектор | Уровни вложенности | Возможное упрощение |
|----------|-------------------|---------------------|
| `#buildDetailScreen .profile-grid` | 2 (ID + class) | Можно просто `.profile-grid`, так как это уникально используется |
| `.thumbs-row .preview-item.removable::after` | 3 (class > class > pseudo) | Нормально для стилизации после |
| `@media(max-width:640px)` → `.profile-grid { grid-template-columns:1fr; }` | Переопределение с нормальной специфичностью | OK |

### 4. Переопределения (каскад)

| Что | Где | Проблема |
|-----|-----|---------|
| `.profile-grid` | Определено в base, переопределено в `#buildDetailScreen` + `#buildPublicDetailScreen` | Специфичность растёт, хотя правила идентичны |
| `.topbar { margin-bottom: 8px; }` vs `margin: 16px 16px 0 16px;` | Было `margin-bottom: 8px;`, затем добавлено `margin: 16px 16px 0;` | Конфликт margin-bottom |
| `.form { gap: 12px; }` vs `#proofForm { gap: 8px; }` | Переопределение gap для одной формы | ID даёт высокую специфичность |

### 5. Отсутствующие (но нужные) утилиты

- `.hidden` — есть, но не используется везде (в JS используется `style.display = 'none'`)
- `.text-muted`, `.opacity-75` — не существуют (используются `.muted`, но это только текст)
- `.grid-2`, `.gap-*` — не существуют (нужны)
- `.flex-center`, `.flex-between` — не существуют (много повторяющихся flex комбинаций)

---

## Часть A3: Снимок текущего визуала (Pixel-parity)

### Скриншоты и размеры (снято в dev tools на 375px ширине)

#### Home Screen
- **Logo:** 128×128px, centered
- **Brand title:** 22px bold, margin-bottom 12px
- **Gap между brand и buttons:** 8px
- **Buttons (big-btn):** min-height 50px, full width, gap 10px между собой
- **Padding body:** 16px sides, 36px + safe-bottom bottom
- **Topbar:** margin-bottom 8px (сейчас выглядит тонким)

#### Profile Screen
- **"Ваш профиль" card:** 16px padding, margin-bottom 16px
- **Grid:** 2 столбца, gap 12px (на 375px выглядит тесновато: ~160px на поле)
- **Field label:** 12px, color muted, margin-bottom 4px
- **Value text:** 15px, line-height 1.45
- **Chips:** gap 8px, wrap

#### Trophies Screen
- **Список трофеев (list-btn):** gap 8px между элементами, min-height 48px
- **Trophy detail (desc-list):** margin-left 18px, gap 6px
- **Preview items (thumbs-row):** gap 6px, width 52px (каждая)

#### Builds Screen
- **"Мои билды" section:** card с padding 16px
- **Build item (list-btn):** grid 48px icon + 1fr text, gap 10px, min-height 48px
- **No-builds hint:** margin-top 8px, color muted, display none by default
- **Actions-bar (create button):** margin-top 8px(?), full width

#### Build Detail
- **Скриншоты (shots-grid):** grid 2×1 (в портретной ориентации), gap 8px, height 160px
- **Actions-bar (publish/delete):** gap 8px, margin 16px 0
- **Текстовое описание:** line-height 1.15 в detail view

---

## Резюме проблем для фиксации

### Критичные (нужны для плана)
1. ✅ **Нет unified spacing scale** — используются случайные значения без системы
2. ✅ **Дубли border-radius** — `12px` повторяется ~15 раз без переменной
3. ✅ **Дубли grid-layout** — grid 2×1 с gap 12px/8px повторяется 3+ раза
4. ✅ **Высокая специфичность** — много ID-селекторов для переопределений
5. ✅ **Смешаны line-height** — 1.15, 1.35, 1.45 без системы

### Умеренные
6. ⚠️ **Safe-area расчёты** — три разные формулы (+12px, +28px, +36px) можно унифицировать
7. ⚠️ **Отсутствующие утилиты** — нет `.gap-*`, `.flex-center`, `.grid-2`
8. ⚠️ **Вложенность ID в CSS** — для переопределений `.profile-grid` нужны более низкая специфичность

### Возможные исправления при рефакторе
9. `!important` в `.error` — можно убрать, если пересчитать каскад
10. `#proofForm { gap: 8px; }` — переписать на базовые стили, не ID

---

## Контрольный список для A2 и A3

- [x] Каталог margin/padding (A1)
- [ ] Подробный CONFLICTS.md (A2 — следующий)
- [ ] Скриншоты визуала на разных ширинах (A3 — следующий)
- [ ] Описание визуальных характеристик каждого экрана (A3 — в процессе)
