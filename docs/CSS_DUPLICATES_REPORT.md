# Отчет: Дубликаты в CSS

## Дата анализа
2025-11-17 20:37:01

## Методология

Анализ выполнен автоматически с помощью скрипта `audit_css_duplicates.py`.
Проверены следующие типы дубликатов:
- Повторяющиеся селекторы
- Одинаковые правила у разных селекторов
- Дубликаты значений свойств
- Частичные дубликаты (общие свойства)

## Статистика

- Всего правил в CSS: 427
- Уникальных селекторов: 396
- Селекторов с дубликатами: 26
- Групп правил с идентичными свойствами: 58
- Уникальных значений свойств с дубликатами: 166
- Пар правил с частичными дубликатами: 3041

## 1. Дубликаты селекторов

Найдены селекторы, которые определены несколько раз в файле:

### Селектор: `#masteryApplicationSubmitBtn`

**Количество определений:** 2

**Определение 1:**
- Строки: 293-298
- Свойства (1):
  - `width: 100%`

**Определение 2:**
- Строки: 524-541
- Свойства (10):
  - `background: none !important`
  - `background-image: url('../assets/system/green.png') !important`
  - `background-position: center !important`
  - `background-repeat: no-repeat !important`
  - `background-size: cover !important`
  - `border-color: transparent !important`
  - `color: #fff !important`
  - `position: relative`
  - `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
  - `z-index: 1`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.actions-bar`

**Количество определений:** 2

**Определение 1:**
- Строки: 4-5
- Контекст: @media @media (max-width: 640px) {
  .profile-grid { grid...
- Свойства (2):
  - `gap: var(--space-2)`
  - `grid-template-columns: 1fr`

**Определение 2:**
- Строки: 281-289
- Свойства (4):
  - `display: grid`
  - `gap: 0`
  - `grid-template-columns: 1fr 1fr`
  - `margin: var(--space-4)`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.btn`

**Количество определений:** 2

**Определение 1:**
- Строки: 375-387
- Свойства (8):
  - `background: transparent`
  - `border: 1px solid var(--color-border)`
  - `border-radius: var(--radius-md)`
  - `color: var(--tg-tx)`
  - `cursor: pointer`
  - `font-size: var(--fs-16)`
  - `min-height: var(--size-touch)`
  - `padding: var(--space-3) var(--space-4)`

**Определение 2:**
- Строки: 1687-1697
- Свойства (5):
  - `-moz-user-select: none`
  - `-webkit-tap-highlight-color: transparent`
  - `-webkit-user-select: none`
  - `touch-action: manipulation`
  - `user-select: none`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.build-icon img`

**Количество определений:** 2

**Определение 1:**
- Строки: 618-631
- Свойства (1):
  - `pointer-events: auto`

**Определение 2:**
- Строки: 1572-1578
- Свойства (4):
  - `height: 70%`
  - `object-fit: contain`
  - `opacity: .95`
  - `width: 70%`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.build-item`

**Количество определений:** 2

**Определение 1:**
- Строки: 1558-1565
- Свойства (11):
  - `align-items: center`
  - `background: transparent`
  - `border: 1px solid var(--color-border)`
  - `border-radius: var(--radius-md)`
  - `color: var(--tg-tx)`
  - `cursor: pointer`
  - `display: grid`
  - `gap: var(--space-3)`
  - `grid-template-columns: var(--size-icon) 1fr`
  - `min-height: var(--size-icon)`
  - `padding: var(--space-2) var(--space-3)`

**Определение 2:**
- Строки: 1687-1697
- Свойства (5):
  - `-moz-user-select: none`
  - `-webkit-tap-highlight-color: transparent`
  - `-webkit-user-select: none`
  - `touch-action: manipulation`
  - `user-select: none`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.build-stat-icon`

**Количество определений:** 2

**Определение 1:**
- Строки: 618-631
- Свойства (1):
  - `pointer-events: auto`

**Определение 2:**
- Строки: 1622-1629
- Свойства (4):
  - `flex-shrink: 0`
  - `height: 14px`
  - `opacity: 0.8`
  - `width: 14px`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.chip-btn`

**Количество определений:** 2

**Определение 1:**
- Строки: 356-369
- Свойства (11):
  - `align-items: center`
  - `background: transparent`
  - `border: 1px solid var(--color-border)`
  - `border-radius: 999px`
  - `color: var(--tg-tx)`
  - `cursor: pointer`
  - `display: inline-flex`
  - `font-size: var(--fs-15)`
  - `gap: var(--space-1)`
  - `min-height: var(--size-touch)`
  - `padding: var(--space-2) var(--space-3)`

**Определение 2:**
- Строки: 1687-1697
- Свойства (5):
  - `-moz-user-select: none`
  - `-webkit-tap-highlight-color: transparent`
  - `-webkit-user-select: none`
  - `touch-action: manipulation`
  - `user-select: none`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.class-tab`

**Количество определений:** 2

**Определение 1:**
- Строки: 1687-1697
- Свойства (5):
  - `-moz-user-select: none`
  - `-webkit-tap-highlight-color: transparent`
  - `-webkit-user-select: none`
  - `touch-action: manipulation`
  - `user-select: none`

**Определение 2:**
- Строки: 1707-1721
- Свойства (11):
  - `align-items: center`
  - `background: var(--icon-bg)`
  - `border: 1px solid var(--color-border)`
  - `border-radius: var(--radius-md)`
  - `cursor: pointer`
  - `display: inline-flex`
  - `height: var(--size-touch)`
  - `justify-content: center`
  - `padding: 0`
  - `transition: background-color var(--transition-base), border-color var(--transition-base), transform var(--transition-fast)`
  - `width: var(--size-touch)`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.input input`

**Количество определений:** 3

**Определение 1:**
- Строки: 1-7
- Контекст: @media @media (max-width: 768px) {
  .input input,
  .inp...
- Свойства (2):
  - `min-height: var(--size-touch)`
  - `padding: var(--space-3) var(--space-3)`

**Определение 2:**
- Строки: 1-5
- Контекст: @media @media screen and (-webkit-min-device-pixel-ratio:...
- Свойства (1):
  - `font-size: 16px`

**Определение 3:**
- Строки: 260-273
- Свойства (10):
  - `background: transparent`
  - `border: 1px solid var(--color-border)`
  - `border-radius: var(--radius-md)`
  - `color: var(--tg-tx)`
  - `font-size: var(--fs-16)`
  - `line-height: var(--lh-normal)`
  - `outline: none`
  - `padding: var(--space-3) var(--space-3)`
  - `transition: border-color .2s, box-shadow .2s`
  - `width: 100%`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.input textarea`

**Количество определений:** 5

**Определение 1:**
- Строки: 1-7
- Контекст: @media @media (max-width: 768px) {
  .input input,
  .inp...
- Свойства (2):
  - `min-height: var(--size-touch)`
  - `padding: var(--space-3) var(--space-3)`

**Определение 2:**
- Строки: 1-5
- Контекст: @media @media screen and (-webkit-min-device-pixel-ratio:...
- Свойства (1):
  - `font-size: 16px`

**Определение 3:**
- Строки: 260-273
- Свойства (10):
  - `background: transparent`
  - `border: 1px solid var(--color-border)`
  - `border-radius: var(--radius-md)`
  - `color: var(--tg-tx)`
  - `font-size: var(--fs-16)`
  - `line-height: var(--lh-normal)`
  - `outline: none`
  - `padding: var(--space-3) var(--space-3)`
  - `transition: border-color .2s, box-shadow .2s`
  - `width: 100%`

**Определение 4:**
- Строки: 273-279
- Свойства (4):
  - `max-height: 200px`
  - `min-height: calc(1em + 24px)`
  - `overflow-y: auto`
  - `resize: none`

**Определение 5:**
- Строки: 2356-2367
- Свойства (4):
  - `-webkit-appearance: none`
  - `-webkit-border-radius: var(--radius-md)`
  - `appearance: none`
  - `border-radius: var(--radius-md)`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.lightbox img`

**Количество определений:** 2

**Определение 1:**
- Строки: 631-643
- Свойства (6):
  - `-moz-user-select: auto`
  - `-ms-user-select: auto`
  - `-webkit-user-drag: auto`
  - `-webkit-user-select: auto`
  - `pointer-events: auto`
  - `user-select: auto`

**Определение 2:**
- Строки: 1660-1672
- Свойства (10):
  - `-webkit-user-drag: none`
  - `border: 1px solid var(--color-border)`
  - `border-radius: var(--radius-md)`
  - `max-height: 88vh`
  - `max-width: 92vw`
  - `pointer-events: auto`
  - `touch-action: pan-x pan-y pinch-zoom`
  - `transform-origin: center center`
  - `transition: transform 0.2s ease-out`
  - `user-select: none`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.list-btn`

**Количество определений:** 2

**Определение 1:**
- Строки: 1334-1347
- Свойства (11):
  - `align-items: center`
  - `background: transparent`
  - `border: 1px solid var(--color-border)`
  - `border-radius: var(--radius-md)`
  - `color: var(--tg-tx)`
  - `cursor: pointer`
  - `display: flex`
  - `font-size: var(--fs-16)`
  - `gap: var(--space-3)`
  - `min-height: 64px`
  - `padding: var(--space-2) var(--space-3)`

**Определение 2:**
- Строки: 1687-1697
- Свойства (5):
  - `-moz-user-select: none`
  - `-webkit-tap-highlight-color: transparent`
  - `-webkit-user-select: none`
  - `touch-action: manipulation`
  - `user-select: none`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.mastery-icon`

**Количество определений:** 2

**Определение 1:**
- Строки: 618-631
- Свойства (1):
  - `pointer-events: auto`

**Определение 2:**
- Строки: 1900-1911
- Свойства (7):
  - `background-position: center`
  - `background-repeat: no-repeat`
  - `background-size: contain`
  - `filter: drop-shadow(0 0 6px rgba(212, 175, 55, 0.6)) drop-shadow(0 0 10px rgba(212, 175, 55, 0.35))`
  - `height: 100%`
  - `opacity: 0.95`
  - `width: 100%`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.profile-grid`

**Количество определений:** 2

**Определение 1:**
- Строки: 1-2
- Контекст: @media @media (max-width: 640px) {
  .profile-grid { grid...
- Свойства (1):
  - `grid-template-columns: 1fr`

**Определение 2:**
- Строки: 250-253
- Свойства (3):
  - `display: grid`
  - `gap: var(--space-3)`
  - `grid-template-columns: repeat(2, 1fr)`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.shot-thumb img`

**Количество определений:** 2

**Определение 1:**
- Строки: 618-631
- Свойства (1):
  - `pointer-events: auto`

**Определение 2:**
- Строки: 1645-1646
- Свойства (3):
  - `height: 100%`
  - `object-fit: cover`
  - `width: 100%`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.shots-grid`

**Количество определений:** 2

**Определение 1:**
- Строки: 2-3
- Контекст: @media @media (max-width: 640px) {
  .profile-grid { grid...
- Свойства (1):
  - `grid-template-columns: 1fr`

**Определение 2:**
- Строки: 1637-1640
- Свойства (3):
  - `display: grid`
  - `gap: var(--space-2)`
  - `grid-template-columns: repeat(2, 1fr)`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.shots-two`

**Количество определений:** 2

**Определение 1:**
- Строки: 3-4
- Контекст: @media @media (max-width: 640px) {
  .profile-grid { grid...
- Свойства (2):
  - `gap: var(--space-2)`
  - `grid-template-columns: repeat(2, auto)`

**Определение 2:**
- Строки: 308-316
- Свойства (4):
  - `display: grid`
  - `gap: var(--space-2)`
  - `grid-template-columns: repeat(2, auto)`
  - `justify-content: flex-start`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.story-scroll-images`

**Количество определений:** 2

**Определение 1:**
- Строки: 1-4
- Контекст: @media @media (max-width: 640px) {
  .story-scroll-images...
- Свойства (1):
  - `flex-direction: row`

**Определение 2:**
- Строки: 1114-1120
- Свойства (3):
  - `display: flex`
  - `gap: var(--space-2)`
  - `margin-bottom: var(--space-2)`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.story-scroll-images img`

**Количество определений:** 2

**Определение 1:**
- Строки: 631-643
- Свойства (6):
  - `-moz-user-select: auto`
  - `-ms-user-select: auto`
  - `-webkit-user-drag: auto`
  - `-webkit-user-select: auto`
  - `pointer-events: auto`
  - `user-select: auto`

**Определение 2:**
- Строки: 1120-1133
- Свойства (10):
  - `-moz-user-select: auto`
  - `-ms-user-select: auto`
  - `-webkit-user-drag: auto`
  - `-webkit-user-select: auto`
  - `border: 1px solid var(--color-border)`
  - `border-radius: var(--radius-md)`
  - `object-fit: cover`
  - `pointer-events: auto`
  - `user-select: auto`
  - `width: 50%`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.thumbs-row`

**Количество определений:** 2

**Определение 1:**
- Строки: 1-2
- Контекст: @media @media (max-width: 360px) {
  .thumbs-row { gap: v...
- Свойства (1):
  - `gap: var(--space-1)`

**Определение 2:**
- Строки: 1466-1475
- Свойства (5):
  - `display: flex`
  - `flex-wrap: nowrap`
  - `gap: var(--space-1)`
  - `margin-top: var(--space-1)`
  - `overflow: visible`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.thumbs-row .preview-item`

**Количество определений:** 2

**Определение 1:**
- Строки: 2-4
- Контекст: @media @media (max-width: 360px) {
  .thumbs-row { gap: v...
- Свойства (2):
  - `height: 48px`
  - `width: 48px`

**Определение 2:**
- Строки: 1476-1491
- Свойства (12):
  - `align-items: center`
  - `background: var(--elem-bg)`
  - `border: 1px solid var(--color-border)`
  - `border-radius: var(--radius-sm)`
  - `display: flex`
  - `flex: 0 0 auto`
  - `font-size: 18px`
  - `height: var(--size-thumb-sm)`
  - `justify-content: center`
  - `overflow: hidden`
  - `position: relative`
  - `width: var(--size-thumb-sm)`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.thumbs-row .preview-more`

**Количество определений:** 3

**Определение 1:**
- Строки: 2-4
- Контекст: @media @media (max-width: 360px) {
  .thumbs-row { gap: v...
- Свойства (2):
  - `height: 48px`
  - `width: 48px`

**Определение 2:**
- Строки: 1476-1491
- Свойства (12):
  - `align-items: center`
  - `background: var(--elem-bg)`
  - `border: 1px solid var(--color-border)`
  - `border-radius: var(--radius-sm)`
  - `display: flex`
  - `flex: 0 0 auto`
  - `font-size: 18px`
  - `height: var(--size-thumb-sm)`
  - `justify-content: center`
  - `overflow: hidden`
  - `position: relative`
  - `width: var(--size-thumb-sm)`

**Определение 3:**
- Строки: 1495-1499
- Свойства (3):
  - `border: 1px dashed var(--color-border)`
  - `font-weight: 700`
  - `opacity: .9`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.waves-table td`

**Количество определений:** 2

**Определение 1:**
- Строки: 1156-1163
- Свойства (4):
  - `border-bottom: 1px solid var(--color-border)`
  - `font-size: var(--fs-14)`
  - `height: 38px`
  - `padding: 0 var(--space-1)`

**Определение 2:**
- Строки: 1168-1171
- Свойства (1):
  - `vertical-align: middle`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `.waves-table th`

**Количество определений:** 2

**Определение 1:**
- Строки: 1156-1163
- Свойства (4):
  - `border-bottom: 1px solid var(--color-border)`
  - `font-size: var(--fs-14)`
  - `height: 38px`
  - `padding: 0 var(--space-1)`

**Определение 2:**
- Строки: 1171-1178
- Свойства (5):
  - `color: var(--tg-hint)`
  - `font-size: var(--fs-12)`
  - `font-weight: 600`
  - `letter-spacing: 0.05em`
  - `text-transform: uppercase`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `50%`

**Количество определений:** 2

**Определение 1:**
- Строки: 1554-1555
- Свойства (1):
  - `transform: translateX(4px)`

**Определение 2:**
- Строки: 2093-2096
- Свойства (1):
  - `filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.5)) drop-shadow(0 0 20px rgba(212, 175, 55, 0.25))`

**Рекомендация:** Объединить все определения в одно правило.

### Селектор: `body`

**Количество определений:** 2

**Определение 1:**
- Строки: 85-86
- Свойства (1):
  - `height: 100%`

**Определение 2:**
- Строки: 86-104
- Свойства (15):
  - `-khtml-user-select: none`
  - `-moz-user-select: none`
  - `-ms-user-select: none`
  - `-webkit-font-smoothing: antialiased`
  - `-webkit-overflow-scrolling: touch`
  - `-webkit-touch-callout: none`
  - `-webkit-user-select: none`
  - `background: var(--tg-bg)`
  - `color: var(--tg-tx)`
  - `font: var(--fs-16) / var(--lh-base) system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu`
  - `margin: auto`
  - `max-width: 920px`
  - `overscroll-behavior-y: contain`
  - `touch-action: pan-y`
  - `user-select: none`

**Рекомендация:** Объединить все определения в одно правило.

## 2. Правила с идентичными свойствами

Найдены разные селекторы с полностью идентичными наборами свойств:

### Группа из 2 правил

**Идентичные свойства:**
- `min-height`
- `padding`

**Селекторы:**
- `.input input` (строки 1-7)
  - Контекст: @media @media (max-width: 768px) {
  .input input,
  .inp...
- `.input textarea` (строки 1-7)
  - Контекст: @media @media (max-width: 768px) {
  .input input,
  .inp...

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `opacity`

**Селекторы:**
- `.input input::placeholder` (строки 7-13)
  - Контекст: @media @media (max-width: 768px) {
  .input input,
  .inp...
- `.input textarea::placeholder` (строки 7-13)
  - Контекст: @media @media (max-width: 768px) {
  .input input,
  .inp...

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `font-size`

**Селекторы:**
- `.input input` (строки 1-5)
  - Контекст: @media @media screen and (-webkit-min-device-pixel-ratio:...
- `.input textarea` (строки 1-5)
  - Контекст: @media @media screen and (-webkit-min-device-pixel-ratio:...

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `height`
- `width`

**Селекторы:**
- `.thumbs-row .preview-item` (строки 2-4)
  - Контекст: @media @media (max-width: 360px) {
  .thumbs-row { gap: v...
- `.thumbs-row .preview-more` (строки 2-4)
  - Контекст: @media @media (max-width: 360px) {
  .thumbs-row { gap: v...

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `grid-template-columns`

**Селекторы:**
- `.profile-grid` (строки 1-2)
  - Контекст: @media @media (max-width: 640px) {
  .profile-grid { grid...
- `.shots-grid` (строки 2-3)
  - Контекст: @media @media (max-width: 640px) {
  .profile-grid { grid...

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `height`

**Селекторы:**
- `html` (строки 85-86)
- `body` (строки 85-86)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 5 правил

**Идентичные свойства:**
- `display`

**Селекторы:**
- `.hidden` (строки 114-116)
- `.hidden-input` (строки 116-117)
- `.waves-empty.hidden` (строки 1263-1266)
- `.waves-meta-list--empty` (строки 1280-1283)
- `.thumbs-row:empty` (строки 1475-1476)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `margin-top`

**Селекторы:**
- `.mt-sm` (строки 117-118)
- `.waves-meta-section-title` (строки 1272-1275)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `height`
- `object-fit`
- `width`

**Селекторы:**
- `.topbar-action img` (строки 146-152)
- `.waves-meta-icon` (строки 1288-1293)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 3 правил

**Идентичные свойства:**
- `display`

**Селекторы:**
- `.topbar-action.hidden` (строки 161-165)
- `.lightbox.hidden` (строки 1672-1673)
- `.filter-modal.hidden` (строки 2168-2172)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 4 правил

**Идентичные свойства:**
- `margin-bottom`

**Селекторы:**
- `.card:last-child` (строки 176-178)
- `#profileEditScreen .actions-bar` (строки 2327-2333)
- `#buildCreateScreen .actions-bar` (строки 2327-2333)
- `#buildDetailScreen .actions-bar:last-of-type` (строки 2327-2333)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `background`
- `border`
- `border-radius`
- `color`
- `font-size`
- `line-height`
- `outline`
- `padding`
- `transition`
- `width`

**Селекторы:**
- `.input input` (строки 260-273)
- `.input textarea` (строки 260-273)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `border-color`

**Селекторы:**
- `.input input:focus` (строки 279-281)
- `.input textarea:focus` (строки 279-281)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 4 правил

**Идентичные свойства:**
- `width`

**Селекторы:**
- `#masteryApplicationSubmitBtn` (строки 293-298)
- `#masteryApplicationCard .actions-bar .btn` (строки 293-298)
- `.btn.wide` (строки 600-601)
- `.home-hero .actions-bar .btn` (строки 750-754)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `margin-left`
- `margin-right`

**Селекторы:**
- `#masteryApplicationCard .actions-bar` (строки 298-304)
- `#trophyApplicationCard .actions-bar` (строки 298-304)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 6 правил

**Идентичные свойства:**
- `background`
- `background-image`
- `background-position`
- `background-repeat`
- `background-size`
- `border-color`
- `color`
- `position`
- `text-shadow`
- `z-index`

**Селекторы:**
- `#sendFeedbackBtn` (строки 389-407)
- `#profileEditBtn` (строки 389-407)
- `#createBuildBtn` (строки 389-407)
- `#joinTelegramBtn` (строки 389-407)
- `#publishBuildBtn:not(.btn--red):not(.danger)` (строки 420-434)
- `button.btn[data-bg-image="blue"]` (строки 554-567)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 18 правил

**Идентичные свойства:**
- `background`
- `border-radius`
- `content`
- `inset`
- `pointer-events`
- `position`
- `z-index`

**Селекторы:**
- `#sendFeedbackBtn::before` (строки 407-420)
- `#profileEditBtn::before` (строки 407-420)
- `#createBuildBtn::before` (строки 407-420)
- `#joinTelegramBtn::before` (строки 407-420)
- `#publishBuildBtn:not(.btn--red):not(.danger)::before` (строки 434-444)
- `#feedbackSubmitBtn::before` (строки 461-474)
- `#profileSaveBtn::before` (строки 461-474)
- `#buildSubmitBtn::before` (строки 461-474)
- `#buildEditSubmitBtn::before` (строки 461-474)
- `#deleteBuildBtn::before` (строки 488-498)
- `#publishBuildBtn.btn--red::before` (строки 513-524)
- `#publishBuildBtn.danger::before` (строки 513-524)
- `button.btn.primary[type="submit"]::before` (строки 541-554)
- `button.btn.primary[data-bg-image="green"]::before` (строки 541-554)
- `button.btn[data-bg-image="green"]::before` (строки 541-554)
- `#masteryApplicationSubmitBtn::before` (строки 541-554)
- `button.btn[data-bg-image="blue"]::before` (строки 567-577)
- `button.btn[data-bg-image="red"]::before` (строки 590-600)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 8 правил

**Идентичные свойства:**
- `background`
- `background-image`
- `background-position`
- `background-repeat`
- `background-size`
- `border-color`
- `color`
- `position`
- `text-shadow`
- `z-index`

**Селекторы:**
- `#feedbackSubmitBtn` (строки 444-461)
- `#profileSaveBtn` (строки 444-461)
- `#buildSubmitBtn` (строки 444-461)
- `#buildEditSubmitBtn` (строки 444-461)
- `button.btn.primary[type="submit"]` (строки 524-541)
- `button.btn.primary[data-bg-image="green"]` (строки 524-541)
- `button.btn[data-bg-image="green"]` (строки 524-541)
- `#masteryApplicationSubmitBtn` (строки 524-541)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 4 правил

**Идентичные свойства:**
- `background`
- `background-image`
- `background-position`
- `background-repeat`
- `background-size`
- `border-color`
- `color`
- `position`
- `text-shadow`
- `z-index`

**Селекторы:**
- `#deleteBuildBtn` (строки 474-488)
- `#publishBuildBtn.btn--red` (строки 498-513)
- `#publishBuildBtn.danger` (строки 498-513)
- `button.btn[data-bg-image="red"]` (строки 577-590)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 7 правил

**Идентичные свойства:**
- `transform`

**Селекторы:**
- `.btn:active` (строки 601-602)
- `.list-btn:active` (строки 1347-1351)
- `.fileline-btn:active` (строки 1465-1466)
- `.build-item:active` (строки 1565-1566)
- `.class-tab:active` (строки 1721-1725)
- `.badge-btn:active` (строки 1787-1788)
- `.author-chip:active` (строки 2248-2252)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `-moz-user-select`
- `-ms-user-select`
- `-webkit-user-drag`
- `-webkit-user-select`
- `pointer-events`
- `user-select`

**Селекторы:**
- `img` (строки 609-618)
- `svg` (строки 609-618)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 9 правил

**Идентичные свойства:**
- `pointer-events`

**Селекторы:**
- `button img` (строки 618-631)
- `button svg` (строки 618-631)
- `a img` (строки 618-631)
- `a svg` (строки 618-631)
- `.build-icon img` (строки 618-631)
- `.build-stat-icon` (строки 618-631)
- `.mastery-icon` (строки 618-631)
- `.shot-thumb img` (строки 618-631)
- `.upload-box img` (строки 618-631)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 3 правил

**Идентичные свойства:**
- `-moz-user-select`
- `-ms-user-select`
- `-webkit-user-drag`
- `-webkit-user-select`
- `pointer-events`
- `user-select`

**Селекторы:**
- `.shots-grid .shot-thumb img` (строки 631-643)
- `.story-scroll-images img` (строки 631-643)
- `.lightbox img` (строки 631-643)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `align-items`
- `display`
- `gap`
- `position`
- `right`
- `top`
- `z-index`

**Селекторы:**
- `.waves-mod-icons` (строки 659-668)
- `.badge-btn .rotation-mod-icons` (строки 681-692)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `height`
- `object-fit`
- `width`

**Селекторы:**
- `.home-hero-logo img` (строки 737-743)
- `.waves-mod-icon img` (строки 961-966)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `display`
- `flex-direction`
- `gap`

**Селекторы:**
- `.start-screen-options` (строки 754-760)
- `.waves-meta-list` (строки 1275-1280)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `display`
- `flex-direction`
- `gap`
- `list-style`
- `margin`
- `padding`

**Селекторы:**
- `.recent-events-list` (строки 786-796)
- `.recent-comments-list` (строки 862-870)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 3 правил

**Идентичные свойства:**
- `border-radius`
- `display`
- `height`
- `object-fit`
- `width`

**Селекторы:**
- `.recent-event-avatar img` (строки 820-828)
- `.recent-comment-avatar img` (строки 892-900)
- `.thumbs-row .preview-item img` (строки 1491-1495)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `color`

**Селекторы:**
- `.theme-light .recent-comment-author` (строки 951-957)
- `.theme-light .recent-comment-text` (строки 951-957)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 3 правил

**Идентичные свойства:**
- `opacity`

**Селекторы:**
- `.waves-meta-card--with-bg::after` (строки 1048-1052)
- `.waves-meta-card--with-bg::before` (строки 1048-1052)
- `.build-edit-btn:active` (строки 2396-2400)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `text-shadow`

**Селекторы:**
- `.waves-meta-card--with-bg .waves-title` (строки 1055-1059)
- `.waves-meta-card--with-bg .waves-header` (строки 1055-1059)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `margin-top`

**Селекторы:**
- `.story-mod-row + .muted` (строки 1103-1108)
- `.reactions-field` (строки 2252-2257)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `border-bottom`
- `font-size`
- `height`
- `padding`

**Селекторы:**
- `.waves-table th` (строки 1156-1163)
- `.waves-table td` (строки 1156-1163)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 3 правил

**Идентичные свойства:**
- `border-bottom`

**Селекторы:**
- `.waves-table td:first-child` (строки 1163-1168)
- `.waves-table td:nth-child(2)` (строки 1163-1168)
- `.waves-table td:nth-child(3)` (строки 1163-1168)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 4 правил

**Идентичные свойства:**
- `align-items`
- `display`
- `gap`

**Селекторы:**
- `.waves-meta-item` (строки 1283-1288)
- `.list-btn-trailing` (строки 1394-1400)
- `.author-field` (строки 2218-2225)
- `.reactions-container` (строки 2257-2263)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `display`
- `gap`

**Селекторы:**
- `.grid-list` (строки 1331-1334)
- `.list-buttons` (строки 1960-1966)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 4 правил

**Идентичные свойства:**
- `height`
- `object-fit`
- `width`

**Селекторы:**
- `.list-btn-avatar img` (строки 1380-1386)
- `.shot-thumb img` (строки 1645-1646)
- `.avatar-preview` (строки 2426-2432)
- `.avatar-display img` (строки 2460-2466)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `align-items`
- `background`
- `border`
- `border-radius`
- `display`
- `flex`
- `font-size`
- `height`
- `justify-content`
- `overflow`
- `position`
- `width`

**Селекторы:**
- `.thumbs-row .preview-item` (строки 1476-1491)
- `.thumbs-row .preview-more` (строки 1476-1491)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `transform`

**Селекторы:**
- `25%` (строки 1553-1554)
- `75%` (строки 1555-1556)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `display`
- `gap`
- `grid-template-columns`

**Селекторы:**
- `#buildDetailScreen .profile-grid` (строки 1673-1681)
- `#buildPublicDetailScreen .profile-grid` (строки 1673-1681)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `margin-top`

**Селекторы:**
- `#buildDetailScreen .card .profile-grid` (строки 1681-1687)
- `#buildPublicDetailScreen .card .profile-grid` (строки 1681-1687)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 7 правил

**Идентичные свойства:**
- `-moz-user-select`
- `-webkit-tap-highlight-color`
- `-webkit-user-select`
- `touch-action`
- `user-select`

**Селекторы:**
- `button` (строки 1687-1697)
- `.btn` (строки 1687-1697)
- `.list-btn` (строки 1687-1697)
- `.chip-btn` (строки 1687-1697)
- `.build-item` (строки 1687-1697)
- `.upload-box` (строки 1687-1697)
- `.class-tab` (строки 1687-1697)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 3 правил

**Идентичные свойства:**
- `background`
- `border-radius`
- `content`
- `inset`
- `pointer-events`
- `position`
- `z-index`

**Селекторы:**
- `.badge-btn[style*="background-image"]::before` (строки 1770-1781)
- `.mastery-header-card[style*="background-image"]::before` (строки 1941-1953)
- `.mastery-level-card[style*="background-image"]::before` (строки 1941-1953)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 3 правил

**Идентичные свойства:**
- `position`
- `z-index`

**Селекторы:**
- `.badge-btn > *` (строки 1781-1787)
- `.mastery-header-card > *` (строки 1953-1960)
- `.mastery-level-card > *` (строки 1953-1960)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 8 правил

**Идентичные свойства:**
- `color`
- `text-shadow`

**Селекторы:**
- `.badge-btn.badge-btn--with-bg .mastery-level-name` (строки 1792-1800)
- `.badge-btn.badge-btn--with-bg .mastery-level-number` (строки 1806-1813)
- `.badge-btn.badge-btn--with-bg .rotation-mode-text` (строки 1813-1824)
- `.badge-btn.badge-btn--with-bg .rotation-mode-name` (строки 1813-1824)
- `.badge-btn.badge-btn--with-bg .rotation-mode-map` (строки 1813-1824)
- `.mastery-header-card.mastery-header-card--with-bg .reward-detail-header` (строки 1824-1834)
- `.mastery-header-card.mastery-header-card--with-bg .mastery-level-name` (строки 1824-1834)
- `.mastery-level-card.mastery-header-card--with-bg .mastery-level-name` (строки 1824-1834)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `stroke`

**Селекторы:**
- `.theme-light .badge-btn:not(.badge-btn--with-bg) .mastery-progress-svg [data-role="progress-bg"]` (строки 1841-1846)
- `.theme-light .mastery-header-card:not(.mastery-header-card--with-bg) .mastery-progress-svg [data-role="progress-bg"]` (строки 1841-1846)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `stroke`

**Селекторы:**
- `.badge-btn.badge-btn--with-bg .mastery-progress-svg [data-role="progress-bg"]` (строки 1846-1851)
- `.mastery-header-card.mastery-header-card--with-bg .mastery-progress-svg [data-role="progress-bg"]` (строки 1846-1851)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `stroke`

**Селекторы:**
- `.theme-light .badge-btn.badge-btn--with-bg .mastery-progress-svg [data-role="progress-bg"]` (строки 1851-1856)
- `.theme-light .mastery-header-card.mastery-header-card--with-bg .mastery-progress-svg [data-role="progress-bg"]` (строки 1851-1856)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `text-shadow`

**Селекторы:**
- `.theme-light #whatsNewPreviewCard .mastery-level-name` (строки 1885-1891)
- `.theme-light #whatsNewPreviewCard .mastery-category-name` (строки 1885-1891)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `padding`

**Селекторы:**
- `#trophyDetailContainer .card` (строки 2011-2016)
- `#masteryDetailContainer .card` (строки 2036-2041)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `color`
- `font-size`
- `line-height`
- `margin-top`

**Селекторы:**
- `.trophy-description` (строки 2016-2023)
- `.mastery-description` (строки 2055-2062)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `align-items`
- `display`
- `justify-content`
- `margin`

**Селекторы:**
- `.mastery-detail-icon-wrapper` (строки 2068-2078)
- `.trophy-detail-icon-wrapper` (строки 2068-2078)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `animation`
- `height`
- `object-fit`
- `width`

**Селекторы:**
- `.mastery-detail-icon` (строки 2078-2087)
- `.trophy-detail-icon` (строки 2078-2087)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 5 правил

**Идентичные свойства:**
- `padding-top`

**Селекторы:**
- `#profileScreen` (строки 2314-2322)
- `#buildsScreen` (строки 2314-2322)
- `#buildCreateScreen` (строки 2314-2322)
- `#buildDetailScreen` (строки 2314-2322)
- `#buildPublicDetailScreen` (строки 2314-2322)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `margin-top`

**Селекторы:**
- `#buildsScreen .actions-bar:first-of-type` (строки 2322-2327)
- `#buildDetailScreen .actions-bar:first-of-type` (строки 2322-2327)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `transform`
- `transition`

**Селекторы:**
- `.input input:active` (строки 2333-2346)
- `.input textarea:active` (строки 2333-2346)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 4 правил

**Идентичные свойства:**
- `-webkit-appearance`
- `-webkit-border-radius`
- `appearance`
- `border-radius`

**Селекторы:**
- `.input input[type="text"]` (строки 2356-2367)
- `.input input[type="email"]` (строки 2356-2367)
- `.input input[type="password"]` (строки 2356-2367)
- `.input textarea` (строки 2356-2367)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

### Группа из 2 правил

**Идентичные свойства:**
- `height`
- `opacity`
- `width`

**Селекторы:**
- `.build-edit-btn img` (строки 2400-2407)
- `.build-edit-btn svg` (строки 2400-2407)

**Рекомендация:** Объединить селекторы через запятую или создать общий класс.

## 3. Дубликаты значений свойств

Найдены одинаковые значения, используемые в разных свойствах/селекторах:

### Топ-20 наиболее часто используемых значений

**Значение:** `0`

**Используется:** 114 раз(а)

- Свойство `--space-0` (1 раз):
  - `:root` (строка 1)
- Свойство `border-spacing` (1 раз):
  - `.waves-table` (строка 1149)
- Свойство `bottom` (1 раз):
  - `.bottom-nav` (строка 2466)
- Свойство `flex-shrink` (15 раз):
  - `.card-title-icon` (строка 186)
  - `.comment-avatar` (строка 228)
  - `.recent-event-avatar` (строка 802)
  - `.recent-comment-avatar` (строка 876)
  - `.rotation-mod-icons` (строка 1005)
  - ... и еще 10
- Свойство `gap` (3 раз):
  - `.actions-bar` (строка 281)
  - `.home-hero .actions-bar` (строка 743)
  - `.bottom-nav` (строка 2466)
- Свойство `inset` (27 раз):
  - `#sendFeedbackBtn::before` (строка 407)
  - `#profileEditBtn::before` (строка 407)
  - `#createBuildBtn::before` (строка 407)
  - `#joinTelegramBtn::before` (строка 407)
  - `#publishBuildBtn:not(.btn--red):not(.danger)::before` (строка 434)
  - ... и еще 22
- Свойство `left` (1 раз):
  - `.bottom-nav` (строка 2466)
- Свойство `margin` (7 раз):
  - `*` (строка 83)
  - `.home-hero .actions-bar` (строка 743)
  - `.recent-events-list` (строка 786)
  - `.recent-comments-list` (строка 862)
  - `.changelog-list` (строка 1305)
  - ... и еще 2
- Свойство `margin-bottom` (7 раз):
  - `.card:last-child` (строка 176)
  - `.rotation-countdown-title` (строка 699)
  - `.home-hero` (строка 715)
  - `.author-field label` (строка 2225)
  - `#profileEditScreen .actions-bar` (строка 2327)
  - ... и еще 2
- Свойство `margin-left` (2 раз):
  - `#masteryApplicationCard .actions-bar` (строка 298)
  - `#trophyApplicationCard .actions-bar` (строка 298)
- Свойство `margin-right` (2 раз):
  - `#masteryApplicationCard .actions-bar` (строка 298)
  - `#trophyApplicationCard .actions-bar` (строка 298)
- Свойство `margin-top` (2 раз):
  - `#buildsScreen .actions-bar:first-of-type` (строка 2322)
  - `#buildDetailScreen .actions-bar:first-of-type` (строка 2322)
- Свойство `min-width` (2 раз):
  - `.list-btn-content` (строка 1386)
  - `.list-btn-info` (строка 1406)
- Свойство `opacity` (2 раз):
  - `.waves-meta-card::after` (строка 1027)
  - `.waves-meta-card::before` (строка 1039)
- Свойство `padding` (12 раз):
  - `*` (строка 83)
  - `.topbar-action` (строка 130)
  - `.recent-events-list` (строка 786)
  - `.recent-event-avatar` (строка 802)
  - `.recent-event-headline` (строка 835)
  - ... и еще 7
- Свойство `padding-bottom` (1 раз):
  - `.home-hero` (строка 715)
- Свойство `padding-top` (5 раз):
  - `#profileScreen` (строка 2314)
  - `#buildsScreen` (строка 2314)
  - `#buildCreateScreen` (строка 2314)
  - `#buildDetailScreen` (строка 2314)
  - `#buildPublicDetailScreen` (строка 2314)
- Свойство `right` (1 раз):
  - `.bottom-nav` (строка 2466)
- Свойство `top` (1 раз):
  - `.bottom-nav-btn::before` (строка 2513)
- Свойство `width` (1 раз):
  - `.bottom-nav-btn::before` (строка 2513)
- Свойство `z-index` (20 раз):
  - `#sendFeedbackBtn::before` (строка 407)
  - `#profileEditBtn::before` (строка 407)
  - `#createBuildBtn::before` (строка 407)
  - `#joinTelegramBtn::before` (строка 407)
  - `#publishBuildBtn:not(.btn--red):not(.danger)::before` (строка 434)
  - ... и еще 15

**Значение:** `none`

**Используется:** 112 раз(а)

- Свойство `-khtml-user-select` (1 раз):
  - `body` (строка 86)
- Свойство `-moz-user-select` (11 раз):
  - `body` (строка 86)
  - `img` (строка 609)
  - `svg` (строка 609)
  - `.list-btn .mastery-icon` (строка 1428)
  - `button` (строка 1687)
  - ... и еще 6
- Свойство `-ms-user-select` (4 раз):
  - `body` (строка 86)
  - `img` (строка 609)
  - `svg` (строка 609)
  - `.list-btn .mastery-icon` (строка 1428)
- Свойство `-webkit-appearance` (5 раз):
  - `.badge-btn` (строка 1748)
  - `.input input[type="text"]` (строка 2356)
  - `.input input[type="email"]` (строка 2356)
  - `.input input[type="password"]` (строка 2356)
  - `.input textarea` (строка 2356)
- Свойство `-webkit-touch-callout` (1 раз):
  - `body` (строка 86)
- Свойство `-webkit-user-drag` (4 раз):
  - `img` (строка 609)
  - `svg` (строка 609)
  - `.list-btn .mastery-icon` (строка 1428)
  - `.lightbox img` (строка 1660)
- Свойство `-webkit-user-select` (11 раз):
  - `body` (строка 86)
  - `img` (строка 609)
  - `svg` (строка 609)
  - `.list-btn .mastery-icon` (строка 1428)
  - `button` (строка 1687)
  - ... и еще 6
- Свойство `appearance` (5 раз):
  - `.badge-btn` (строка 1748)
  - `.input input[type="text"]` (строка 2356)
  - `.input input[type="email"]` (строка 2356)
  - `.input input[type="password"]` (строка 2356)
  - `.input textarea` (строка 2356)
- Свойство `background` (2 раз):
  - `.recent-event-headline` (строка 835)
  - `.recent-event-link` (строка 847)
- Свойство `border` (4 раз):
  - `.recent-event-avatar` (строка 802)
  - `.recent-event-headline` (строка 835)
  - `.recent-event-link` (строка 847)
  - `.bottom-nav-btn` (строка 2498)
- Свойство `border-bottom` (1 раз):
  - `.waves-table tr:last-child td` (строка 1235)
- Свойство `box-shadow` (1 раз):
  - `.topbar-action` (строка 130)
- Свойство `display` (5 раз):
  - `.hidden` (строка 114)
  - `.hidden-input` (строка 116)
  - `.waves-empty.hidden` (строка 1263)
  - `.waves-meta-list--empty` (строка 1280)
  - `.thumbs-row:empty` (строка 1475)
- Свойство `filter` (1 раз):
  - `.list-btn .mastery-icon` (строка 1428)
- Свойство `hyphens` (1 раз):
  - `.build-title > div:first-child` (строка 1591)
- Свойство `list-style` (3 раз):
  - `.recent-events-list` (строка 786)
  - `.recent-comments-list` (строка 862)
  - `.changelog-list` (строка 1305)
- Свойство `outline` (2 раз):
  - `.input input` (строка 260)
  - `.input textarea` (строка 260)
- Свойство `pointer-events` (29 раз):
  - `#sendFeedbackBtn::before` (строка 407)
  - `#profileEditBtn::before` (строка 407)
  - `#createBuildBtn::before` (строка 407)
  - `#joinTelegramBtn::before` (строка 407)
  - `#publishBuildBtn:not(.btn--red):not(.danger)::before` (строка 434)
  - ... и еще 24
- Свойство `resize` (1 раз):
  - `.input textarea` (строка 273)
- Свойство `text-decoration` (1 раз):
  - `#telegramGroupBtn` (строка 602)
- Свойство `text-shadow` (2 раз):
  - `.theme-light #whatsNewPreviewCard .mastery-level-name` (строка 1885)
  - `.theme-light #whatsNewPreviewCard .mastery-category-name` (строка 1885)
- Свойство `transform` (2 раз):
  - `.list-btn.is-static:active` (строка 1363)
  - `.badge-btn:disabled` (строка 1788)
- Свойство `user-select` (15 раз):
  - `body` (строка 86)
  - `.shots-two .upload-box` (строка 316)
  - `img` (строка 609)
  - `svg` (строка 609)
  - `.list-btn .mastery-icon` (строка 1428)
  - ... и еще 10

**Значение:** `center`

**Используется:** 102 раз(а)

- Свойство `align-items` (60 раз):
  - `.topbar` (строка 118)
  - `.topbar-action` (строка 130)
  - `.card-title` (строка 178)
  - `.comment-header` (строка 212)
  - `.comment-author` (строка 219)
  - ... и еще 55
- Свойство `background-position` (2 раз):
  - `.waves-meta-card::after` (строка 1027)
  - `.mastery-icon` (строка 1900)
- Свойство `justify-content` (30 раз):
  - `.topbar` (строка 118)
  - `.topbar-action` (строка 130)
  - `.shots-two .upload-box` (строка 316)
  - `.shots-two .shot-thumb` (строка 332)
  - `.waves-mod-icon` (строка 668)
  - ... и еще 25
- Свойство `object-position` (1 раз):
  - `.shots-two .shot-thumb img` (строка 345)
- Свойство `text-align` (9 раз):
  - `.title` (строка 129)
  - `#telegramGroupBtn` (строка 602)
  - `.home-hero` (строка 715)
  - `.waves-table` (строка 1149)
  - `.waves-icon` (строка 1178)
  - ... и еще 4

**Значение:** `flex`

**Используется:** 75 раз(а)

- Свойство `display` (75 раз):
  - `.topbar` (строка 118)
  - `.card-title` (строка 178)
  - `.comments-list` (строка 193)
  - `.comment-header` (строка 212)
  - `.comment-author` (строка 219)
  - ... и еще 70

**Значение:** `var(--space-2)`

**Используется:** 47 раз(а)

- Свойство `gap` (32 раз):
  - `.shots-two` (строка 3)
  - `.actions-bar` (строка 4)
  - `.card-title` (строка 178)
  - `.comment-author` (строка 219)
  - `.shots-two` (строка 308)
  - ... и еще 27
- Свойство `margin-bottom` (5 раз):
  - `.comment-header` (строка 212)
  - `.card-header-row` (строка 706)
  - `.story-scroll-title` (строка 1108)
  - `.story-scroll-images` (строка 1114)
  - `.class-tabs-container` (строка 1697)
- Свойство `margin-left` (1 раз):
  - `.list-btn .right` (строка 1442)
- Свойство `margin-top` (5 раз):
  - `.mt-sm` (строка 117)
  - `.story-mod-row` (строка 1090)
  - `.waves-meta-section-title` (строка 1272)
  - `.trophy-description` (строка 2016)
  - `.mastery-description` (строка 2055)
- Свойство `padding` (2 раз):
  - `.filter-option` (строка 2196)
  - `.bottom-nav-btn` (строка 2498)
- Свойство `padding-left` (1 раз):
  - `.waves-number` (строка 1238)
- Свойство `padding-right` (1 раз):
  - `.waves-number` (строка 1238)

**Значение:** `100%`

**Используется:** 47 раз(а)

- Свойство `height` (16 раз):
  - `html` (строка 85)
  - `body` (строка 85)
  - `.shots-two .shot-thumb img` (строка 345)
  - `.home-hero-logo img` (строка 737)
  - `.recent-event-avatar img` (строка 820)
  - ... и еще 11
- Свойство `width` (31 раз):
  - `.input input` (строка 260)
  - `.input textarea` (строка 260)
  - `.actions-bar .wide` (строка 289)
  - `#masteryApplicationSubmitBtn` (строка 293)
  - `#masteryApplicationCard .actions-bar .btn` (строка 293)
  - ... и еще 26

**Значение:** `1`

**Используется:** 46 раз(а)

- Свойство `aspect-ratio` (1 раз):
  - `.tile-btn` (строка 1978)
- Свойство `flex` (10 раз):
  - `.recent-event-body` (строка 828)
  - `.recent-comment-body` (строка 900)
  - `.rotation-mode-text` (строка 972)
  - `.waves-meta-text` (строка 1293)
  - `.changelog-text` (строка 1326)
  - ... и еще 5
- Свойство `line-height` (5 раз):
  - `.shots-two .upload-box` (строка 316)
  - `.waves-icon-tag` (строка 1214)
  - `.preview-badge` (строка 1530)
  - `.build-stat-count` (строка 1629)
  - `.mastery-level-number` (строка 1911)
- Свойство `opacity` (6 раз):
  - `.waves-meta-card--with-bg::after` (строка 1048)
  - `.waves-meta-card--with-bg::before` (строка 1048)
  - `.class-tab.active img` (строка 1743)
  - `.build-edit-btn:active` (строка 2396)
  - `.bottom-nav-btn.active .bottom-nav-icon` (строка 2540)
  - ... и еще 1
- Свойство `z-index` (24 раз):
  - `#sendFeedbackBtn` (строка 389)
  - `#profileEditBtn` (строка 389)
  - `#createBuildBtn` (строка 389)
  - `#joinTelegramBtn` (строка 389)
  - `#publishBuildBtn:not(.btn--red):not(.danger)` (строка 420)
  - ... и еще 19

**Значение:** `auto`

**Используется:** 41 раз(а)

- Свойство `-moz-user-select` (4 раз):
  - `.shots-grid .shot-thumb img` (строка 631)
  - `.story-scroll-images img` (строка 631)
  - `.lightbox img` (строка 631)
  - `.story-scroll-images img` (строка 1120)
- Свойство `-ms-user-select` (4 раз):
  - `.shots-grid .shot-thumb img` (строка 631)
  - `.story-scroll-images img` (строка 631)
  - `.lightbox img` (строка 631)
  - `.story-scroll-images img` (строка 1120)
- Свойство `-webkit-user-drag` (4 раз):
  - `.shots-grid .shot-thumb img` (строка 631)
  - `.story-scroll-images img` (строка 631)
  - `.lightbox img` (строка 631)
  - `.story-scroll-images img` (строка 1120)
- Свойство `-webkit-user-select` (4 раз):
  - `.shots-grid .shot-thumb img` (строка 631)
  - `.story-scroll-images img` (строка 631)
  - `.lightbox img` (строка 631)
  - `.story-scroll-images img` (строка 1120)
- Свойство `margin` (1 раз):
  - `body` (строка 86)
- Свойство `overflow-y` (3 раз):
  - `main.container` (строка 104)
  - `.input textarea` (строка 273)
  - `.filter-modal-content` (строка 2172)
- Свойство `pointer-events` (15 раз):
  - `button img` (строка 618)
  - `button svg` (строка 618)
  - `a img` (строка 618)
  - `a svg` (строка 618)
  - `.build-icon img` (строка 618)
  - ... и еще 10
- Свойство `right` (1 раз):
  - `.build-edit-btn--left` (строка 2391)
- Свойство `user-select` (4 раз):
  - `.shots-grid .shot-thumb img` (строка 631)
  - `.story-scroll-images img` (строка 631)
  - `.lightbox img` (строка 631)
  - `.story-scroll-images img` (строка 1120)
- Свойство `width` (1 раз):
  - `.author-chip` (строка 2230)

**Значение:** `relative`

**Используется:** 41 раз(а)

- Свойство `position` (41 раз):
  - `main.container` (строка 104)
  - `.topbar` (строка 118)
  - `.card` (строка 165)
  - `#sendFeedbackBtn` (строка 389)
  - `#profileEditBtn` (строка 389)
  - ... и еще 36

**Значение:** `absolute`

**Используется:** 37 раз(а)

- Свойство `position` (37 раз):
  - `.topbar-action` (строка 130)
  - `#sendFeedbackBtn::before` (строка 407)
  - `#profileEditBtn::before` (строка 407)
  - `#createBuildBtn::before` (строка 407)
  - `#joinTelegramBtn::before` (строка 407)
  - ... и еще 32

**Значение:** `var(--space-3)`

**Используется:** 37 раз(а)

- Свойство `gap` (14 раз):
  - `.comments-list` (строка 193)
  - `.profile-grid` (строка 250)
  - `.home-hero` (строка 715)
  - `.start-screen-option` (строка 760)
  - `.recent-events-list` (строка 786)
  - ... и еще 9
- Свойство `left` (2 раз):
  - `.story-hero-mod-main` (строка 1068)
  - `.build-edit-btn--left` (строка 2391)
- Свойство `margin-bottom` (3 раз):
  - `.card-title` (строка 178)
  - `.version-date` (строка 1298)
  - `.filter-modal-title` (строка 2183)
- Свойство `margin-top` (5 раз):
  - `.rotation-countdown-title` (строка 699)
  - `.story-mod-row + .muted` (строка 1103)
  - `.story-scroll-title` (строка 1108)
  - `.trophy-proof.with-divider` (строка 2030)
  - `.reactions-field` (строка 2252)
- Свойство `padding` (3 раз):
  - `.comment-item` (строка 205)
  - `.start-screen-option` (строка 760)
  - `.badge-btn` (строка 1748)
- Свойство `padding-top` (1 раз):
  - `.trophy-proof.with-divider` (строка 2030)
- Свойство `right` (4 раз):
  - `.waves-mod-icons` (строка 659)
  - `.badge-btn .rotation-mod-icons` (строка 681)
  - `.story-hero-mod-chapters` (строка 1075)
  - `}





.build-edit-btn` (строка 2367)
- Свойство `top` (5 раз):
  - `.waves-mod-icons` (строка 659)
  - `.badge-btn .rotation-mod-icons` (строка 681)
  - `.story-hero-mod-main` (строка 1068)
  - `.story-hero-mod-chapters` (строка 1075)
  - `}





.build-edit-btn` (строка 2367)

**Значение:** `1px solid var(--color-border)`

**Используется:** 35 раз(а)

- Свойство `border` (28 раз):
  - `.topbar-action` (строка 130)
  - `.card` (строка 165)
  - `.comment-item` (строка 205)
  - `.input input` (строка 260)
  - `.input textarea` (строка 260)
  - ... и еще 23
- Свойство `border-bottom` (5 раз):
  - `.waves-table th` (строка 1156)
  - `.waves-table td` (строка 1156)
  - `.waves-table td:first-child` (строка 1163)
  - `.waves-table td:nth-child(2)` (строка 1163)
  - `.waves-table td:nth-child(3)` (строка 1163)
- Свойство `border-top` (2 раз):
  - `.trophy-proof.with-divider` (строка 2030)
  - `.bottom-nav` (строка 2466)

**Значение:** `inherit`

**Используется:** 28 раз(а)

- Свойство `border-radius` (23 раз):
  - `.shots-two .shot-thumb img` (строка 345)
  - `#sendFeedbackBtn::before` (строка 407)
  - `#profileEditBtn::before` (строка 407)
  - `#createBuildBtn::before` (строка 407)
  - `#joinTelegramBtn::before` (строка 407)
  - ... и еще 18
- Свойство `color` (1 раз):
  - `.recent-event-link` (строка 847)
- Свойство `font` (1 раз):
  - `.recent-event-link` (строка 847)
- Свойство `font-family` (1 раз):
  - `.badge-btn` (строка 1748)
- Свойство `font-size` (1 раз):
  - `.badge-btn` (строка 1748)
- Свойство `line-height` (1 раз):
  - `.badge-btn` (строка 1748)

**Значение:** `var(--radius-md)`

**Используется:** 23 раз(а)

- Свойство `-webkit-border-radius` (4 раз):
  - `.input input[type="text"]` (строка 2356)
  - `.input input[type="email"]` (строка 2356)
  - `.input input[type="password"]` (строка 2356)
  - `.input textarea` (строка 2356)
- Свойство `border-radius` (19 раз):
  - `.topbar-action` (строка 130)
  - `.comment-item` (строка 205)
  - `.input input` (строка 260)
  - `.input textarea` (строка 260)
  - `.shots-two .upload-box` (строка 316)
  - ... и еще 14

**Значение:** `transparent`

**Используется:** 23 раз(а)

- Свойство `-webkit-tap-highlight-color` (8 раз):
  - `button` (строка 1687)
  - `.btn` (строка 1687)
  - `.list-btn` (строка 1687)
  - `.chip-btn` (строка 1687)
  - `.build-item` (строка 1687)
  - ... и еще 3
- Свойство `background` (11 раз):
  - `.input input` (строка 260)
  - `.input textarea` (строка 260)
  - `.chip-btn` (строка 356)
  - `.btn` (строка 375)
  - `.recent-comment-build` (строка 917)
  - ... и еще 6
- Свойство `border-color` (4 раз):
  - `.chip-btn.active` (строка 369)
  - `.btn.primary` (строка 387)
  - `.btn.danger` (строка 388)
  - `.class-tab.active` (строка 1738)

**Значение:** `""`

**Используется:** 23 раз(а)

- Свойство `content` (23 раз):
  - `#sendFeedbackBtn::before` (строка 407)
  - `#profileEditBtn::before` (строка 407)
  - `#createBuildBtn::before` (строка 407)
  - `#joinTelegramBtn::before` (строка 407)
  - `#publishBuildBtn:not(.btn--red):not(.danger)::before` (строка 434)
  - ... и еще 18

**Значение:** `hidden`

**Используется:** 22 раз(а)

- Свойство `overflow` (21 раз):
  - `.shots-two .shot-thumb` (строка 332)
  - `.waves-meta-card` (строка 650)
  - `.recent-event-avatar` (строка 802)
  - `.recent-comment-avatar` (строка 876)
  - `.recent-comment-build span` (строка 933)
  - ... и еще 16
- Свойство `overflow-x` (1 раз):
  - `main.container` (строка 104)

**Значение:** `600`

**Используется:** 22 раз(а)

- Свойство `font-weight` (22 раз):
  - `.title` (строка 129)
  - `.card-title` (строка 178)
  - `.comment-author` (строка 219)
  - `.chip-btn.active` (строка 369)
  - `.rotation-countdown-timer` (строка 692)
  - ... и еще 17

**Значение:** `none !important`

**Используется:** 21 раз(а)

- Свойство `background` (18 раз):
  - `#sendFeedbackBtn` (строка 389)
  - `#profileEditBtn` (строка 389)
  - `#createBuildBtn` (строка 389)
  - `#joinTelegramBtn` (строка 389)
  - `#publishBuildBtn:not(.btn--red):not(.danger)` (строка 420)
  - ... и еще 13
- Свойство `display` (3 раз):
  - `.topbar-action.hidden` (строка 161)
  - `.lightbox.hidden` (строка 1672)
  - `.filter-modal.hidden` (строка 2168)

**Значение:** `contain`

**Используется:** 20 раз(а)

- Свойство `background-size` (1 раз):
  - `.mastery-icon` (строка 1900)
- Свойство `object-fit` (17 раз):
  - `.topbar-action img` (строка 146)
  - `.card-title-icon` (строка 186)
  - `.logo` (строка 643)
  - `.home-hero-logo img` (строка 737)
  - `.waves-mod-icon img` (строка 961)
  - ... и еще 12
- Свойство `overscroll-behavior-y` (2 раз):
  - `body` (строка 86)
  - `main.container` (строка 104)

## 4. Частичные дубликаты (общие свойства)

Найдены пары правил с общими свойствами:

### Топ-30 пар с наибольшим количеством общих свойств

**Пара:**
- `.recent-event-avatar` (строки 802-820)
- `.recent-comment-avatar` (строки 876-892)

**Общих свойств:** 12

**Общие свойства:**
- `align-items: center`
- `background: var(--elem-bg)`
- `border-radius: 50%`
- `color: var(--fg)`
- `display: flex`
- `flex-shrink: 0`
- `font-weight: 600`
- `height: 48px`
- `justify-content: center`
- `overflow: hidden`
- `text-transform: uppercase`
- `width: 48px`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `.thumbs-row .preview-item` (строки 1476-1491)
- `.thumbs-row .preview-more` (строки 1476-1491)

**Общих свойств:** 12

**Общие свойства:**
- `align-items: center`
- `background: var(--elem-bg)`
- `border: 1px solid var(--color-border)`
- `border-radius: var(--radius-sm)`
- `display: flex`
- `flex: 0 0 auto`
- `font-size: 18px`
- `height: var(--size-thumb-sm)`
- `justify-content: center`
- `overflow: hidden`
- `position: relative`
- `width: var(--size-thumb-sm)`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `.avatar-upload-btn` (строки 2407-2426)
- `.avatar-display` (строки 2443-2460)

**Общих свойств:** 12

**Общие свойства:**
- `align-items: center`
- `background: var(--elem-bg)`
- `border-radius: 50%`
- `display: flex`
- `height: 80px`
- `justify-content: center`
- `overflow: hidden`
- `position: absolute`
- `right: 12px`
- `top: 12px`
- `width: 80px`
- `z-index: 10`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `.input input` (строки 260-273)
- `.input textarea` (строки 260-273)

**Общих свойств:** 10

**Общие свойства:**
- `background: transparent`
- `border: 1px solid var(--color-border)`
- `border-radius: var(--radius-md)`
- `color: var(--tg-tx)`
- `font-size: var(--fs-16)`
- `line-height: var(--lh-normal)`
- `outline: none`
- `padding: var(--space-3) var(--space-3)`
- `transition: border-color .2s, box-shadow .2s`
- `width: 100%`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#sendFeedbackBtn` (строки 389-407)
- `#profileEditBtn` (строки 389-407)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#sendFeedbackBtn` (строки 389-407)
- `#createBuildBtn` (строки 389-407)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#sendFeedbackBtn` (строки 389-407)
- `#joinTelegramBtn` (строки 389-407)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#sendFeedbackBtn` (строки 389-407)
- `#publishBuildBtn:not(.btn--red):not(.danger)` (строки 420-434)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#sendFeedbackBtn` (строки 389-407)
- `button.btn[data-bg-image="blue"]` (строки 554-567)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#profileEditBtn` (строки 389-407)
- `#createBuildBtn` (строки 389-407)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#profileEditBtn` (строки 389-407)
- `#joinTelegramBtn` (строки 389-407)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#profileEditBtn` (строки 389-407)
- `#publishBuildBtn:not(.btn--red):not(.danger)` (строки 420-434)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#profileEditBtn` (строки 389-407)
- `button.btn[data-bg-image="blue"]` (строки 554-567)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#createBuildBtn` (строки 389-407)
- `#joinTelegramBtn` (строки 389-407)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#createBuildBtn` (строки 389-407)
- `#publishBuildBtn:not(.btn--red):not(.danger)` (строки 420-434)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#createBuildBtn` (строки 389-407)
- `button.btn[data-bg-image="blue"]` (строки 554-567)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#joinTelegramBtn` (строки 389-407)
- `#publishBuildBtn:not(.btn--red):not(.danger)` (строки 420-434)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#joinTelegramBtn` (строки 389-407)
- `button.btn[data-bg-image="blue"]` (строки 554-567)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#publishBuildBtn:not(.btn--red):not(.danger)` (строки 420-434)
- `button.btn[data-bg-image="blue"]` (строки 554-567)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/blue.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#feedbackSubmitBtn` (строки 444-461)
- `#profileSaveBtn` (строки 444-461)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/green.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#feedbackSubmitBtn` (строки 444-461)
- `#buildSubmitBtn` (строки 444-461)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/green.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#feedbackSubmitBtn` (строки 444-461)
- `#buildEditSubmitBtn` (строки 444-461)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/green.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#feedbackSubmitBtn` (строки 444-461)
- `button.btn.primary[type="submit"]` (строки 524-541)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/green.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#feedbackSubmitBtn` (строки 444-461)
- `button.btn.primary[data-bg-image="green"]` (строки 524-541)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/green.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#feedbackSubmitBtn` (строки 444-461)
- `button.btn[data-bg-image="green"]` (строки 524-541)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/green.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#feedbackSubmitBtn` (строки 444-461)
- `#masteryApplicationSubmitBtn` (строки 524-541)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/green.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#profileSaveBtn` (строки 444-461)
- `#buildSubmitBtn` (строки 444-461)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/green.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#profileSaveBtn` (строки 444-461)
- `#buildEditSubmitBtn` (строки 444-461)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/green.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#profileSaveBtn` (строки 444-461)
- `button.btn.primary[type="submit"]` (строки 524-541)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/green.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

**Пара:**
- `#profileSaveBtn` (строки 444-461)
- `button.btn.primary[data-bg-image="green"]` (строки 524-541)

**Общих свойств:** 10

**Общие свойства:**
- `background: none !important`
- `background-image: url('../assets/system/green.png') !important`
- `background-position: center !important`
- `background-repeat: no-repeat !important`
- `background-size: cover !important`
- `border-color: transparent !important`
- `color: #fff !important`
- `position: relative`
- `text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.5)`
- `z-index: 1`

**Рекомендация:** Рассмотреть возможность создания общего класса или миксина.

## Рекомендации по оптимизации

1. **Объединить дубликаты селекторов** - если один селектор определен несколько раз, объедините все свойства в одно правило.
2. **Использовать общие классы** - если разные селекторы имеют одинаковые свойства, создайте общий класс.
3. **Использовать CSS переменные** - для часто повторяющихся значений создайте CSS переменные в `:root`.
4. **Рассмотреть миксины** - для частичных дубликатов можно использовать общие классы-утилиты.

