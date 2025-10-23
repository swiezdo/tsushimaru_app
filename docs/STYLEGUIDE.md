# Стайлгайд: Tsushima Mini App

**Версия:** 1.0  
**Дата:** 2025-10-23  
**Статус:** Действующий

---

## Быстрый старт

### Что использовать?

- **Отступы:** Переменные `--space-*` и утилиты `.m-*`, `.p-*`, `.gap-*`
- **Цвета:** Переменные из `:root` (не хардкод)
- **Радиусы:** `--radius-sm`, `--radius-md`, `--radius-lg`
- **Типография:** `--fs-*` и `--lh-*`

### Что НЕ делать?

- ❌ Никаких `!important` (кроме крайних случаев)
- ❌ Не дублировать margin/padding, если есть утилита
- ❌ Не вкладывать селекторы глубже 2 уровней без причины
- ❌ Не использовать magic numbers (хардкод вместо переменных)
- ❌ Не создавать ID-селекторы для стилей (только для логики)

---

## 1. Дизайн-токены

### 1.1 Spacing (8px модуль)

| Переменная | Значение | Когда использовать |
|----------|----------|-------------------|
| `--space-0` | 0 | Не нужен отступ (редко) |
| `--space-1` | 4px | Микро-отступ между элементами (редко) |
| `--space-2` | 8px | Базовый gap между элементами |
| `--space-3` | 12px | Padding в карточках, gap в формах |
| `--space-4` | 16px | Padding body, margin между секциями |
| `--space-5` | 20px | Большие отступы (редко) |
| `--space-6` | 24px | Ещё больше (редко) |
| `--space-8` | 32px | Безопасность от bottom (safe-area) |
| `--space-10` | 40px | Максимальные отступы |

**Примеры:**
```css
.card { padding: var(--space-4); margin-bottom: var(--space-4); }
.form { gap: var(--space-3); }
.topbar { margin: var(--space-4) var(--space-4) 0 var(--space-4); }
```

### 1.2 Типография

| Переменная | Значение | Когда использовать |
|----------|----------|-------------------|
| `--fs-12` | 12px | Мелкий текст (labels, hints) |
| `--fs-13` | 13px | Подписи к полям |
| `--fs-14` | 14px | Вспомогательный текст |
| `--fs-15` | 15px | Значения в полях, в том числе |
| `--fs-16` | 16px | Основной текст body, кнопки |
| `--fs-20` | 20px | Заголовок topbar |
| `--fs-22` | 22px | Название бренда (Home) |

| Переменная | Значение | Когда использовать |
|----------|----------|-------------------|
| `--lh-tight` | 1.15 | Плотный текст (детали, числа) |
| `--lh-normal` | 1.35 | Поля ввода, списки |
| `--lh-base` | 1.45 | Основной текст body |

**Примеры:**
```css
.field label { font-size: var(--fs-12); }
.value { font-size: var(--fs-15); }
.title { font-size: var(--fs-20); font-weight: 600; }
body { line-height: var(--lh-base); }
```

### 1.3 Border Radius

| Переменная | Значение | Когда использовать |
|----------|----------|-------------------|
| `--radius-sm` | 10px | Миниатюры, preview items |
| `--radius-md` | 12px | Кнопки, поля, большинство элементов |
| `--radius-lg` | 16px | Карточки, основной контент |

**Примеры:**
```css
.card { border-radius: var(--radius-lg); }
.btn { border-radius: var(--radius-md); }
.preview-item { border-radius: var(--radius-sm); }
```

### 1.4 Цвета

**Основная палитра:**
```css
--bg: #0e1621           (фон)
--fg: #fff              (текст)
--muted: #aeb7c2        (приглушённый текст)
--accent: #2ea6ff       (синий, ссылки, активные)
--stroke: rgba(255,255,255,0.08)  (граница)
--card: rgba(255,255,255,0.04)    (карточка)
```

**Семантические:**
```css
--color-error: #ff4444
--color-success: #4caf50
--color-warning: #ff9800
--color-border: var(--stroke)
--color-text-secondary: var(--muted)
```

**Telegram theme:**
```css
--tg-bg: var(--bg)
--tg-tx: var(--fg)
--tg-hint: var(--muted)
```

**Как использовать:**
```css
.btn { color: var(--tg-tx); border: 1px solid var(--color-border); }
.error-text { color: var(--color-error); }
.muted { color: var(--tg-hint); }
```

---

## 2. Утилитарные классы

### 2.1 Spacing Utilities

**Margin:**
```css
.m-0, .m-1, .m-2, .m-3, .m-4  /* all sides */
.mt-*, .mb-*, .ml-*, .mr-*      /* top, bottom, left, right */
.mx-*, .my-*                    /* horizontal, vertical */
```

**Padding:**
```css
.p-0, .p-1, .p-2, .p-3, .p-4  /* all sides */
.pt-*, .pb-*, .pl-*, .pr-*      /* top, bottom, left, right */
.px-*, .py-*                    /* horizontal, vertical */
```

**Gap (для flex/grid):**
```css
.gap-0, .gap-1, .gap-2, .gap-3, .gap-4
```

**Примеры в HTML:**
```html
<div class="card">
  <h2 class="card-title mt-0 mb-3">Название</h2>
  <div class="form gap-3">
    <div class="input mb-2">...</div>
  </div>
</div>
```

### 2.2 Display & Visibility

```css
.hidden        /* display: none */
.block         /* display: block */
.flex          /* display: flex */
.grid          /* display: grid */
.inline-block  /* display: inline-block */
```

### 2.3 Text Utilities

```css
.text-muted      /* color: var(--tg-hint) */
.text-secondary  /* color: var(--tg-hint), font-size: 14px */
.text-center     /* text-align: center */
.text-left       /* text-align: left */
.truncate        /* white-space: nowrap; overflow: hidden; text-overflow: ellipsis */
.line-clamp-1    /* -webkit-line-clamp: 1 */
.line-clamp-2    /* -webkit-line-clamp: 2 */
```

### 2.4 Layout Helpers

```css
.flex-center     /* display: flex; align-items: center; justify-content: center */
.flex-between    /* display: flex; justify-content: space-between; align-items: center */
.flex-col        /* display: flex; flex-direction: column */
.grid-2          /* grid-template-columns: repeat(2, 1fr) */
.grid-1          /* grid-template-columns: 1fr */
```

### 2.5 State Classes

```css
.active          /* для active chip-btn, etc. */
.is-active       /* альтернатива .active */
.is-error        /* border-color: var(--color-error) */
.is-disabled     /* opacity: 0.5; pointer-events: none */
.hidden          /* display: none */
```

---

## 3. Компоненты и соглашения

### 3.1 Как добавить отступ?

**Вариант 1: Использовать утилиты (предпочтительно)**
```html
<div class="mt-4 mb-3">
  <p>Текст с отступами</p>
</div>
```

**Вариант 2: Использовать переменные в компонентном CSS**
```css
.my-component { margin-top: var(--space-4); }
```

**Вариант 3: Только если нужно комбинировать разные стороны**
```css
.my-component {
  margin-top: var(--space-4);
  margin-bottom: var(--space-2);
}
```

**❌ НИКОГДА:**
```css
.my-component { margin-top: 17px; }  /* magic number! */
```

### 3.2 Как добавить новый компонент?

1. **Проверить:** Есть ли похожий компонент? Если да → переиспользуй с модификаторами.
   ```css
   .btn { ... }
   .btn.primary { ... }  /* модификатор */
   ```

2. **Назвать:** Используй понятное имя (не `btn1`, `btn-special` и т.д.)
   ```css
   .btn-save { ... }  /* хорошо */
   .action-button { ... }  /* еще лучше */
   ```

3. **Стилизовать:** Использовать переменные и утилиты
   ```css
   .card {
     background: var(--card);
     border: 1px solid var(--color-border);
     border-radius: var(--radius-lg);
     padding: var(--space-4);
     margin-bottom: var(--space-4);
   }
   ```

4. **Минимальная специфичность:**
   ```css
   /* ХОРОШО */
   .card { padding: var(--space-4); }

   /* ПЛОХО */
   main .container .card { padding: var(--space-4); }

   /* ОЧЕНЬ ПЛОХО */
   #content .card { padding: var(--space-4) !important; }
   ```

5. **Использовать переменные везде:**
   ```css
   /* ХОРОШО */
   .btn { color: var(--tg-tx); border: 1px solid var(--color-border); }

   /* ПЛОХО */
   .btn { color: #fff; border: 1px solid rgba(255,255,255,0.08); }
   ```

---

## 4. Запреты и красные флаги

### ❌ НИКОГДА

| Что | Почему | Как правильно |
|-----|--------|---------------|
| `!important` | Ломает каскад | Использовать правильную специфичность |
| `margin: 17px` | Magic number | Использовать `--space-*` |
| `#myId .card { ... }` | Слишком высокая специфичность | Использовать `.card.variant` |
| `display: none` (в JS) | Лучше использовать классы | `el.classList.add('hidden')` |
| `border-radius: 12px` везде | Дубли | Использовать `var(--radius-md)` |
| Inline `style="color: red"` | Нарушает стилизацию | Использовать класс `.error` |

### ✅ ВСЕГДА

| Что | Пример |
|-----|--------|
| Использовать переменные | `color: var(--tg-tx)` |
| Проверять утилиты первым | Есть `.gap-3`? Используй её! |
| Комментировать сложное | `/* Специфичное правило для X */ .special-case { ... }` |
| Использовать классы, не ID | `.card`, не `#card` |
| Минимизировать вложенность | 2 уровня максимум |
| Гру пировать связанные правила | `.card` и `.card-title` рядом |

---

## 5. Примеры часто используемых комбинаций

### Карточка с заголовком и текстом
```html
<div class="card">
  <h2 class="card-title">Заголовок</h2>
  <p class="text-muted">Описание</p>
</div>
```

### Сетка 2 столбца
```html
<div class="profile-grid gap-3">
  <div class="field">
    <label>Поле 1</label>
    <div class="value">Значение</div>
  </div>
  <div class="field">
    <label>Поле 2</label>
    <div class="value">Значение</div>
  </div>
</div>
```

### Форма
```html
<form class="form gap-3">
  <div class="input">
    <label>Название</label>
    <input type="text" />
  </div>
</form>
```

### Кнопка в actions-bar
```html
<div class="actions-bar gap-2">
  <button class="btn primary wide">Сохранить</button>
</div>
```

### Скрытый элемент
```html
<div id="noBuildsHint" class="hidden muted">
  Пока пусто.
</div>

<!-- JS -->
noBuildsHint.classList.add('hidden');        /* скрыть */
noBuildsHint.classList.remove('hidden');    /* показать */
```

---

## 6. Как обновиться?

### Регулярные обновления

Когда видишь, что **одно и то же правило** встречается в разных местах → пришло время **добавить утилиту**.

**Пример:**
```css
/* Сейчас в CSS везде */
.component1 { gap: 8px; }
.component2 { gap: 8px; }
.component3 { gap: 8px; }

/* Решение: добавить утилиту */
.gap-2 { gap: var(--space-2); }

/* Потом использовать */
<div class="gap-2">...</div>
```

### Когда изменять стили?

- ✅ **Добавить утилиту**, если нужна в 2+ местах
- ✅ **Добавить вариант компонента**, если нужна модификация
- ✅ **Исправить каскад**, если конфликт
- ❌ **Не добавлять `!important`**
- ❌ **Не создавать узкоспециализированные классы** (типа `.special-button-for-home`)

---

## 7. Контакты и вопросы

**Вопрос:** Можно ли использовать новое значение padding?  
**Ответ:** Если его нет в шкале → добавь переменную, а потом используй везде.

**Вопрос:** Что если нужен `!important`?  
**Ответ:** Очень редко. Обычно — ошибка в специфичности. Проверь каскад.

**Вопрос:** Как понять, компонент это или утилита?  
**Ответ:**
- **Компонент:** `.card`, `.btn`, `.chip-btn` (имеет сложный стиль)
- **Утилита:** `.m-2`, `.gap-3`, `.text-muted` (простое свойство)
