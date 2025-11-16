# Контракт ответа /api/users.list (расширение для сортировки участников)

Эти поля дополняют существующий ответ, чтобы фронтенд мог корректно приоритизировать участников.

## Новые поля

- `has_any_trophy: boolean` — у пользователя есть любые трофеи (не только активные и не мастерство).
- `has_mastery_progress: boolean` — у пользователя есть хотя бы 1 уровень в любой категории мастерства (> 0).
- `has_public_builds: boolean` — у пользователя есть хотя бы один публичный билд.
- Опционально:
  - `trophies_count: number` — общее число трофеев.
  - `active_trophies_count: number` — число активных трофеев.
  - `builds_count: number` — число публичных билдов.

## Пример ответа

```json
{
  "users": [
    {
      "user_id": 123,
      "psn_id": "PlayerOne",
      "avatar_url": "/media/avatars/123.jpg",
      "active_trophies": ["golden_mask", "event_2024"],
      "has_any_trophy": true,
      "has_mastery_progress": true,
      "has_public_builds": false,
      "trophies_count": 7,
      "active_trophies_count": 2,
      "builds_count": 0
    }
  ]
}
```

## Логика фронтенда (уже реализована)

Приоритет сортировки:
1. Пользователи с любыми трофеями или с прогрессом мастерства (`has_any_trophy || has_mastery_progress` или по факту наличия `active_trophies`/`trophies`).
2. Пользователи с аватаркой (`avatar_url`).
3. Пользователи с прогрессом мастерства (если поле отделено и не попало в п.1).
4. Пользователи с публичными билдами (`has_public_builds` или `builds_count > 0`).
5. По имени `psn_id` (A→Я) внутри каждой группы.

Фронтенд корректно работает и без новых полей, используя доступные: `active_trophies`, `avatar_url`. При появлении новых флагов сортировка автоматически станет точнее.


