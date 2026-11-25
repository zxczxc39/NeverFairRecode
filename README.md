# NeverFair Recode — сайт

Минималистичный одностраничный сайт для GitHub Pages. Кнопка **«Установить NFRLauncher Windows x64»** в самом низу страницы качает последний релиз из GitHub Releases и сама выбирает файл под Windows x64 (`.exe` → `.zip`).

## Состав проекта

| Файл | Зачем |
|---|---|
| `index.html` | Вся страница |
| `styles.css` | Стили (тёмная минималистичная тема) |
| `script.js` | Скачивание последнего релиза, версия/размер/changelog со страницы |
| `favicon.svg` | Иконка сайта |
| `.nojekyll` | Отключает Jekyll на GitHub Pages, чтобы файлы отдались как есть |

## ⚠️ Одно обязательное действие перед публикацией

Открой `script.js` и в самом верху замени репозиторий на свой:

```js
const NFR_REPO = "your-username/NFRLauncher";
```

Формат: `"владелец/репозиторий"`. Пока стоит заглушка, кнопка ведёт на страницу Releases, но версию/размер подтянуть не сможет.

## Как выложить на GitHub Pages

1. Создай репозиторий на GitHub (например, `neverfair-recode`).
2. Из папки проекта выполни:

   ```bash
   git init
   git add .
   git commit -m "NeverFair Recode site"
   git branch -M main
   git remote add origin https://github.com/ТВОЙ_НИК/neverfair-recode.git
   git push -u origin main
   ```

3. В репозитории открой **Settings → Pages**.
4. В разделе **Build and deployment → Source** выбери **Deploy from a branch**, ветка **main**, папка **/ (root)** → **Save**.
5. Через 1–2 минуты сайт будет на `https://ТВОЙ_НИК.github.io/neverfair-recode/`.

Если у тебя стоит GitHub CLI (`gh`), шаги 1–2 можно сделать так:

```bash
gh repo create neverfair-recode --public --source=. --push
```

## Как работает кнопка

1. При загрузке страницы сайт спрашивает у GitHub API (`/repos/…/releases/latest`) версию, размер и заметки последнего релиза — они показываются на странице.
2. По клику на кнопку берётся ассет с наивысшим приоритетом: в имени есть `win`/`x64` и расширение `.exe` (далее `.zip`).
3. Если API недоступен (лимит запросов, нет сети) — кнопка просто открывает страницу `…/releases/latest`, там кнопка скачивания есть всегда.

## Что менять под себя

- Тексты секций — прямо в `index.html`.
- Цвет акцента — переменная `--accent` в начале `styles.css`.
- Пункты «возможностей», FAQ и требований — это рекомендации: поправь под реальное поведение лаунчера.
