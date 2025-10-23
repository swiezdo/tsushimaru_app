# Чек-лист тестирования: CSS Рефакторинг Этап F

**Дата начала:** 2025-10-23  
**Версия:** 1.0  
**Цель:** Подтвердить 100% pixel-perfect совместимость после рефакторинга

---

## F1: Визуальное тестирование (все экраны, desktop/mobile)

### Home Screen
- [ ] Logo 128×128 по центру, не смещена
- [ ] Brand title "Tsushima.Ru" жирная, ниже logo
- [ ] Кнопки выровнены, gap между ними 10px (не 8px, не 12px)
- [ ] Padding sides 16px, топ 0, батт 12px + safe-area
- [ ] Группа кнопок имеет стандартный отступ
- [ ] Нет неожиданных переносов

**Высоты компонентов:**
- Logo: 128px ✓
- Brand gap: 8px ✓
- Buttons gap: 10px ✓

### Profile Screen
- [ ] "Ваш профиль" card видна
- [ ] Grid 2 столбца (на 375px) выглядит как раньше
- [ ] Labels: 12px, мuted цвет
- [ ] Values: 15px, основной цвет
- [ ] Form gap: 12px между элементами
- [ ] Chips wrap нормально, gap 8px
- [ ] Сохранить кнопка: full width, primary стиль

**Высоты компонентов:**
- Card padding: 16px ✓
- Label-value gap: 4px ✓
- Form items gap: 12px ✓

### Trophies Screen
- [ ] "Ваши трофеи" card видна с данными
- [ ] Список трофеев (.list-btn) элементов
- [ ] Trophy detail отступы читаемы
- [ ] Текст не ломается неожиданно
- [ ] Preview items размер 52px
- [ ] Gap между preview 6px (точно как раньше)

**Высоты компонентов:**
- List item: 48px min-height ✓
- Preview items: 52px ✓
- Gap: 6px ✓

### Builds Screen
- [ ] Кнопка "Создать билд" на месте (full width, primary)
- [ ] "Мои билды" section видна
- [ ] Build items выглядят правильно (icon 48px + text)
- [ ] "Нет билдов" hint скрыт (если пусто, то видно; если есть — скрыто)
- [ ] "Все билды" section видна
- [ ] Отступы от bottom 12px + safe-area

**Высоты компонентов:**
- Build item: 48px min-height ✓
- Icon: 48px ✓
- Gap between items: 8px ✓

### Build Detail Screen
- [ ] Кнопка "Опубликовать" на месте (primary/danger по состоянию)
- [ ] Скриншоты grid 2x1 или 1x1 (в портрете)
- [ ] Высота скриншота: 160px на desktop
- [ ] Кнопка "Удалить" красная (danger)
- [ ] Actions-bar gap: 8px между кнопками (если 2)
- [ ] Текст описания читается без глюков

**Высоты компонентов:**
- Screenshot: 160px ✓
- Actions gap: 8px ✓

### Build Public Detail
- [ ] Выглядит как Build Detail, но без кнопок действий
- [ ] Все скриншоты видны
- [ ] Автор и дата отображаются

---

## F2: Сравнение высот и отступов (Dev Tools)

### Инструкция проверки:
1. Открыть DevTools (F12)
2. Инспектировать элемент: `Elements > Right Panel > Computed`
3. Проверить `margin`, `padding`, `gap`, `height` ключевых элементов

### Ключевые элементы для проверки:

| Элемент | Свойство | Ожидаемое | Текущее | Статус |
|---------|----------|-----------|---------|--------|
| `.card` | padding | 16px | ? | [ ] |
| `.card` | margin-bottom | 16px | ? | [ ] |
| `.form` | gap | 12px | ? | [ ] |
| `.actions-bar` | gap | 8px | ? | [ ] |
| `.profile-grid` | gap | 12px | ? | [ ] |
| `.chips` | gap | 8px | ? | [ ] |
| `.build-item` | min-height | 48px | ? | [ ] |
| `.list-btn` | min-height | 48px | ? | [ ] |
| `.btn` | min-height | 44px | ? | [ ] |
| `.topbar` | margin | 16px 16px 0 | ? | [ ] |
| `.title` | font-size | 20px | ? | [ ] |
| `.field label` | font-size | 12px | ? | [ ] |

---

## F3: Responsive тестирование (3 брейкпоинта)

### Брейкпоинт 1: 360px (iPhone SE)
- [ ] Home: кнопки fit, no overflow
- [ ] Profile: grid 1 столбец (если нужен медиа-запрос) ИЛИ 2 столбца + сжатие
- [ ] Forms: inputs full width, readable
- [ ] Build detail: screenshot full width

**Специфичные проверки:**
- [ ] Нет горизонтального скролла
- [ ] Текст не выходит за края
- [ ] Кнопки имеют минимум 44px высоты (для тача)

### Брейкпоинт 2: 640px (iPad mini)
- [ ] Profile: grid 2 столбца OK
- [ ] Build detail: grid 2 столбца для скриншотов
- [ ] Все компоненты на месте
- [ ] Читаемость хорошая

**Специфичные проверки:**
- [ ] Gap и margin пропорциональны
- [ ] Font-size читаемый (не слишком малый)

### Брейкпоинт 3: 920px (desktop, max-width контейнера)
- [ ] Все как на разработку
- [ ] Контейнер центрирован (max-width: 920px)
- [ ] Padding sides: 16px

**Специфичные проверки:**
- [ ] Не слишком широко
- [ ] Читаемо

---

## F4: Мобильные браузеры + iOS

### iOS Safari (если доступно)
- [ ] Safe-area insets применяются правильно
- [ ] Bottom padding работает: 36px + safe-area ✓
- [ ] Topbar не перекрывает контент
- [ ] Чипсы wrap нормально (не обрезаются)
- [ ] Buttons тачатся без глюков

### Chrome Mobile (Android)
- [ ] Стандартное поведение
- [ ] Safe-area не нужна (Android), но calc() не ломает
- [ ] Все как на desktop

### Samsung Internet (если есть)
- [ ] Аналогично Chrome Mobile

---

## Отклонения от pixel-perfect

**Если обнаружены отклонения, заполнить таблицу:**

| Экран | Элемент | Ожидаемо | Фактически | Причина | Приемлемо? |
|-------|---------|----------|-----------|---------|-----------|
| Home | logo | 128px | ? | ? | [ ] |
| (пример) | title gap | 8px | ? | ? | [ ] |

**Правило:** Отклонение ≤ 2px считается приемлемым (различие в рендеринге браузерами).

---

## Критерии PASS/FAIL

### ✅ PASS критерии:
1. **Все экраны видны и читаемы** без горизонтального скролла
2. **Высоты компонентов** совпадают в пределах ±2px
3. **Gap и отступы** соответствуют переменным (8px, 12px, 16px и т.д.)
4. **Responsive** работает на 360px, 640px, 920px
5. **Никаких `!important`** конфликтов
6. **Safe-area** работает на iOS

### ❌ FAIL критерии:
1. Горизонтальный скролл на мобильных
2. Элементы перекрываются
3. Высоты отличаются более чем на 5px
4. Текст обрезается неожиданно
5. Safe-area не работает на iOS
6. Кнопки < 44px высоты на мобильных

---

## Процесс тестирования

### Шаг 1: Desktop (920px)
1. Открыть `docs/index.html` в браузере
2. DevTools → Responsive Design Mode → 920px
3. Пройти через все экраны (Home, Profile, Trophies, Builds и т.д.)
4. Заполнить таблицу выше ✓

### Шаг 2: Мобильные (360px, 640px)
1. DevTools → 360px → проверить все экраны
2. DevTools → 640px → проверить все экраны
3. Отметить отклонения

### Шаг 3: iOS (если есть device)
1. Открыть `docs/index.html` на iPhone/iPad
2. Проверить safe-area-inset применяются
3. Проверить чипсы, кнопки, текст

### Шаг 4: Android (если есть device)
1. Проверить в Chrome Mobile
2. Сравнить с iOS

---

## Что проверять в каждом экране

### Общее для всех:
- [ ] Topbar видна (или скрыта правильно)
- [ ] Контент не выходит за края
- [ ] Нет горизонтального скролла
- [ ] Padding/margin пропорциональны
- [ ] Font-size читаемый

### Специфичное:
- **Home:** logo, brand, buttons выравнены
- **Profile:** grid, form, chips
- **Trophies:** list, detail, preview items
- **Builds:** list, items, detail, screenshots
- **Build Detail:** actions-bar, buttons состояния

---

## Дополнительные проверки (QA)

### CSS специфичность
- [ ] Нет новых `!important` (кроме 2 обоснованных)
- [ ] Селекторы не более 2 уровней вложенности
- [ ] Переменные используются везде (не хардкод)

### Производительность
- [ ] DevTools → Lighthouse → Performance > 90
- [ ] Нет неожиданных repaints/reflows
- [ ] CSS file size: ~20-25KB (минимум)

### Browser compatibility
- [ ] Chrome (latest) ✓
- [ ] Firefox (latest) ✓
- [ ] Safari (latest) ✓
- [ ] Edge (latest) ✓

---

## Результат

**После прохождения всех проверок:**

- [ ] F1: Все экраны pixel-perfect OK
- [ ] F2: Высоты совпадают (±2px)
- [ ] F3: Responsive работает на 3 брейкпоинтах
- [ ] F4: Мобильные браузеры OK

**Статус:** ⬜ PENDING → 🟢 PASS или 🔴 FAIL

---

**Документ готов для тестирования:** 2025-10-23  
**Следующий этап:** G (финализация и push)
