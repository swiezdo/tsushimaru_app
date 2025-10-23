# Токены и утилиты: Справка

**Версия:** 1.0  
**Дата:** 2025-10-23  
**Файл:** `docs/css/style.css` (`:root` и утилиты)

---

## Содержание
1. [Spacing](#spacing)
2. [Typography](#typography)
3. [Border Radius](#border-radius)
4. [Colors](#colors)
5. [Utilities](#utilities)
6. [Examples](#examples)

---

## Spacing

### Scale (8px module)

```css
--space-0:  0       /* Нет отступа */
--space-1:  4px     /* Микро (редко) */
--space-2:  8px     /* Базовый gap */
--space-3:  12px    /* Padding, форма gap */
--space-4:  16px    /* Основной padding, margin */
--space-5:  20px    /* Большой отступ */
--space-6:  24px    /* Ещё больше */
--space-8:  32px    /* Safe-area bottom */
--space-10: 40px    /* Максимум */
```

### Usage in CSS

```css
/* Margin всех сторон */
.card { margin: var(--space-4); }

/* Margin отдельных сторон */
.card { margin-bottom: var(--space-4); margin-top: var(--space-2); }

/* Padding */
.card { padding: var(--space-4); }

/* Gap в flex/grid */
.form { gap: var(--space-3); }
```

### Margin Utilities

```css
.m-0 { margin: var(--space-0); }
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }

.mt-1 { margin-top: var(--space-1); }
.mt-2 { margin-top: var(--space-2); }
.mt-3 { margin-top: var(--space-3); }
.mt-4 { margin-top: var(--space-4); }

.mb-1 { margin-bottom: var(--space-1); }
.mb-2 { margin-bottom: var(--space-2); }
.mb-3 { margin-bottom: var(--space-3); }
.mb-4 { margin-bottom: var(--space-4); }

.ml-1 { margin-left: var(--space-1); }
.ml-2 { margin-left: var(--space-2); }
.ml-3 { margin-left: var(--space-3); }
.ml-4 { margin-left: var(--space-4); }

.mr-1 { margin-right: var(--space-1); }
.mr-2 { margin-right: var(--space-2); }
.mr-3 { margin-right: var(--space-3); }
.mr-4 { margin-right: var(--space-4); }

.mx-1 { margin-left: var(--space-1); margin-right: var(--space-1); }
.mx-2 { margin-left: var(--space-2); margin-right: var(--space-2); }
.mx-3 { margin-left: var(--space-3); margin-right: var(--space-3); }
.mx-4 { margin-left: var(--space-4); margin-right: var(--space-4); }

.my-1 { margin-top: var(--space-1); margin-bottom: var(--space-1); }
.my-2 { margin-top: var(--space-2); margin-bottom: var(--space-2); }
.my-3 { margin-top: var(--space-3); margin-bottom: var(--space-3); }
.my-4 { margin-top: var(--space-4); margin-bottom: var(--space-4); }
```

### Padding Utilities

```css
.p-0 { padding: var(--space-0); }
.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }

.pt-1 { padding-top: var(--space-1); }
.pt-2 { padding-top: var(--space-2); }
.pt-3 { padding-top: var(--space-3); }
.pt-4 { padding-top: var(--space-4); }

.pb-1 { padding-bottom: var(--space-1); }
.pb-2 { padding-bottom: var(--space-2); }
.pb-3 { padding-bottom: var(--space-3); }
.pb-4 { padding-bottom: var(--space-4); }

.pl-1 { padding-left: var(--space-1); }
.pl-2 { padding-left: var(--space-2); }
.pl-3 { padding-left: var(--space-3); }
.pl-4 { padding-left: var(--space-4); }

.pr-1 { padding-right: var(--space-1); }
.pr-2 { padding-right: var(--space-2); }
.pr-3 { padding-right: var(--space-3); }
.pr-4 { padding-right: var(--space-4); }

.px-1 { padding-left: var(--space-1); padding-right: var(--space-1); }
.px-2 { padding-left: var(--space-2); padding-right: var(--space-2); }
.px-3 { padding-left: var(--space-3); padding-right: var(--space-3); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }

.py-1 { padding-top: var(--space-1); padding-bottom: var(--space-1); }
.py-2 { padding-top: var(--space-2); padding-bottom: var(--space-2); }
.py-3 { padding-top: var(--space-3); padding-bottom: var(--space-3); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }
```

### Gap Utilities

```css
.gap-0 { gap: var(--space-0); }
.gap-1 { gap: var(--space-1); }
.gap-2 { gap: var(--space-2); }
.gap-3 { gap: var(--space-3); }
.gap-4 { gap: var(--space-4); }
```

---

## Typography

### Font Size Scale

```css
--fs-12: 12px  (labels, hints)
--fs-13: 13px  (field labels)
--fs-14: 14px  (secondary text)
--fs-15: 15px  (field values)
--fs-16: 16px  (body text, buttons)
--fs-20: 20px  (topbar title)
--fs-22: 22px  (brand title)
```

### Line Height Scale

```css
--lh-tight:  1.15  (dense text, details)
--lh-normal: 1.35  (inputs, lists)
--lh-base:   1.45  (body text)
```

### Usage Examples

```css
body { font: var(--fs-16) / var(--lh-base) system-ui, sans-serif; }
.field label { font-size: var(--fs-12); line-height: var(--lh-tight); }
.value { font-size: var(--fs-15); line-height: var(--lh-normal); }
.title { font-size: var(--fs-20); }
```

---

## Border Radius

### Scale

```css
--radius-sm: 10px  (small elements: previews, thumbnails)
--radius-md: 12px  (buttons, inputs, most components)
--radius-lg: 16px  (cards, main containers)
```

### Usage Examples

```css
.card { border-radius: var(--radius-lg); }
.btn { border-radius: var(--radius-md); }
.preview-item { border-radius: var(--radius-sm); }
.upload-box { border-radius: var(--radius-md); }
.chip-btn { border-radius: 999px; }  /* circle */
```

---

## Colors

### Primary Palette

```css
--bg:       #0e1621                    (background)
--fg:       #fff                       (foreground/text)
--muted:    #aeb7c2                    (muted text)
--accent:   #2ea6ff                    (primary blue)
--stroke:   rgba(255,255,255,0.08)    (borders)
--card:     rgba(255,255,255,0.04)    (card background)
```

### Semantic Colors

```css
--color-error:   #ff4444    (errors, danger)
--color-success: #4caf50    (success messages)
--color-warning: #ff9800    (warnings)
--color-border:  var(--stroke)
--color-text-secondary: var(--muted)
```

### Telegram Theme

```css
--tg-bg:    var(--bg)       (Telegram theme background)
--tg-tx:    var(--fg)       (Telegram theme text)
--tg-hint:  var(--muted)    (Telegram theme hint)
```

### Usage Examples

```css
.btn { 
  color: var(--tg-tx); 
  border: 1px solid var(--color-border); 
  background: transparent;
}

.error-text { color: var(--color-error); }
.muted { color: var(--tg-hint); }
.card { background: var(--card); }
```

---

## Utilities

### Display & Visibility

```css
.hidden        { display: none; }
.block         { display: block; }
.flex          { display: flex; }
.grid          { display: grid; }
.inline-block  { display: inline-block; }
```

### Text Utilities

```css
.text-muted       { color: var(--tg-hint); }
.text-secondary   { color: var(--tg-hint); font-size: var(--fs-14); }
.text-center      { text-align: center; }
.text-left        { text-align: left; }
.truncate         { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.line-clamp-1     { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
.line-clamp-2     { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
```

### Layout Helpers

```css
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.grid-1 { grid-template-columns: 1fr; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
```

### State Classes

```css
.active      { /* highlight state */ }
.is-active   { /* highlight state (alternative) */ }
.is-error    { border-color: var(--color-error); }
.is-disabled { opacity: 0.5; pointer-events: none; }
```

---

## Examples

### Card with Title

```html
<div class="card">
  <h2 class="card-title">Заголовок</h2>
  <p class="text-muted">Описание</p>
</div>

<style>
.card {
  background: var(--card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}
.card-title {
  font-weight: 600;
  margin-bottom: var(--space-3);
}
</style>
```

### Form with Inputs

```html
<form class="form gap-3">
  <div class="input">
    <label>Имя</label>
    <input type="text" />
  </div>
  <div class="input">
    <label>Комментарий</label>
    <textarea></textarea>
  </div>
</form>

<style>
.form { display: grid; gap: var(--space-3); }
.input label { 
  font-size: var(--fs-13); 
  color: var(--tg-hint); 
  margin-bottom: var(--space-1); 
}
.input input,
.input textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--fs-16);
  line-height: var(--lh-normal);
  color: var(--tg-tx);
  background: transparent;
}
</style>
```

### Grid 2 Columns

```html
<div class="profile-grid gap-3">
  <div class="field">
    <label>Платформа</label>
    <div class="value">PlayStation</div>
  </div>
  <div class="field">
    <label>Режим</label>
    <div class="value">Сюжет</div>
  </div>
</div>

<style>
.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}
.field label {
  font-size: var(--fs-12);
  color: var(--tg-hint);
  margin-bottom: var(--space-1);
  display: block;
}
.value {
  font-size: var(--fs-15);
}
</style>
```

### Button Styles

```html
<button class="btn primary">Основная</button>
<button class="btn danger">Опасная</button>
<button class="btn ghost">Прозрачная</button>

<style>
.btn {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  background: transparent;
  color: var(--tg-tx);
  font-size: var(--fs-16);
  cursor: pointer;
  min-height: 44px;
}
.btn.primary {
  background: var(--accent);
  border-color: transparent;
  color: #00131f;
  font-weight: 700;
}
.btn.danger {
  background: var(--color-error);
  border-color: transparent;
  color: #00131f;
  font-weight: 700;
}
.btn.ghost { opacity: 0.95; }
</style>
```

### Hidden Element (JS Toggle)

```html
<div id="emptyState" class="hidden muted">
  Нет данных
</div>

<script>
// Show
emptyState.classList.remove('hidden');

// Hide
emptyState.classList.add('hidden');

// Toggle
emptyState.classList.toggle('hidden');
</script>

<style>
.hidden { display: none; }
.muted { color: var(--tg-hint); font-size: var(--fs-14); }
</style>
```

### Common Combinations

```html
<!-- Spacing: top and bottom -->
<div class="mt-4 mb-3">Content</div>

<!-- Spacing: horizontal -->
<div class="mx-4">Content</div>

<!-- Flexbox centering -->
<div class="flex-center">
  <p>Centered text</p>
</div>

<!-- Text styles -->
<p class="text-muted">Secondary text</p>
<p class="text-center">Centered text</p>
<p class="truncate">Long text that truncates...</p>

<!-- Error state -->
<input class="is-error" type="text" />
<p class="error-text">Ошибка ввода</p>

<!-- Grid layout -->
<div class="grid-2 gap-3">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## Quick Reference

| Need | Use |
|------|-----|
| Space between elements | `.gap-2`, `.gap-3`, `.gap-4` |
| Padding in card | `var(--space-4)` |
| Label text | `var(--fs-12)` |
| Body text | `var(--fs-16)` |
| Border | `var(--color-border)` |
| Small radius | `var(--radius-sm)` |
| Medium radius | `var(--radius-md)` |
| Large radius (cards) | `var(--radius-lg)` |
| Muted text | `.text-muted` or `var(--tg-hint)` |
| Center flex | `.flex-center` |
| Hide element | `.hidden` |
| Error styling | `.is-error` class |
