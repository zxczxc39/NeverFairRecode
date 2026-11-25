/* NeverFair Recode — логика сайта
 *
 * Кнопка внизу страницы качает ПОСЛЕДНИЙ релиз NFRLauncher из GitHub Releases.
 * Заодно со страницы подтягиваются версия, размер файла и заметки релиза.
 */

// ── НАСТРОЙКА ────────────────────────────────────────────────────────────
// Репозиторий в формате "владелец/репозиторий" — отсюда качается релиз.
// Пример: "neverfair-dev/NFRLauncher"
const NFR_REPO = "your-username/NFRLauncher";
// ─────────────────────────────────────────────────────────────────────────

const API_URL = `https://api.github.com/repos/${NFR_REPO}/releases/latest`;
const RELEASES_PAGE = `https://github.com/${NFR_REPO}/releases/latest`;

// Выбираем подходящий ассет под Windows x64 из списка файлов релиза.
// Приоритет: win+x64+exe → exe → win+x64+zip → zip → что угодно.
function pickWindowsX64Asset(assets) {
  if (!Array.isArray(assets) || assets.length === 0) return null;

  const score = (a) => {
    let s = 0;
    const name = a.name.toLowerCase();
    if (/x64|amd64|x86_64/.test(name)) s += 4;
    if (/win|windows/.test(name)) s += 4;
    if (/\.exe$|\.msi$/.test(name)) s += 3;
    else if (/\.zip$|\.7z$/.test(name)) s += 2;
    return s;
  };

  return (
    assets
      .filter(
        (a) =>
          !a.name.endsWith(".sha256") &&
          !a.name.endsWith(".sig") &&
          !a.name.endsWith(".txt")
      )
      .sort((a, b) => score(b) - score(a))[0] || null
  );
}

function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 100 ? `${Math.round(mb)} МБ` : `${mb.toFixed(1)} МБ`;
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function setAll(selector, text) {
  document.querySelectorAll(selector).forEach((el) => {
    el.textContent = text;
  });
}

function setRepoLinks() {
  document.querySelectorAll("[data-repo-link]").forEach((a) => {
    a.href = `https://github.com/${NFR_REPO}`;
  });
  document.querySelectorAll("[data-releases-link]").forEach((a) => {
    a.href = `https://github.com/${NFR_REPO}/releases`;
  });
}

// Заметки релиза вставляем как текст, построчно — без innerHTML,
// чтобы чужой markdown никогда не превратился в HTML на нашей странице.
function renderReleaseNotes(body) {
  const list = document.querySelector("[data-release-notes]");
  if (!list) return;

  list.textContent = "";
  if (!body) return;

  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^#+\s/.test(l)) // заголовки markdown пропускаем
    .map((l) => l.replace(/^[-*+]\s*/, "").replace(/^>\s*/, ""));

  lines.slice(0, 8).forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    list.appendChild(li);
  });
}

function applyRelease(release) {
  const asset = pickWindowsX64Asset(release.assets);

  setAll("[data-release-tag]", release.tag_name || "—");
  const dateEl = document.querySelector("[data-release-date]");
  if (dateEl) dateEl.textContent = formatDate(release.published_at);

  const size = asset
    ? formatSize(asset.size)
    : formatSize(release.assets?.[0]?.size);
  setAll("[data-release-size]", size);

  renderReleaseNotes(release.body);
  setRepoLinks();

  return asset;
}

function triggerDownload(asset) {
  const a = document.createElement("a");
  a.href = asset.browser_download_url;
  a.download = asset.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ── Кнопка установки ─────────────────────────────────────────────────────

let cachedRelease = null; // данные последнего релиза, подтянутые при загрузке

const btn = document.getElementById("download-btn");

async function fetchLatestRelease() {
  const res = await fetch(API_URL, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  return res.json();
}

btn?.addEventListener("click", async () => {
  try {
    const release = cachedRelease || (await fetchLatestRelease());
    cachedRelease = release;

    const asset = pickWindowsX64Asset(release.assets);
    if (asset) {
      triggerDownload(asset);
      return;
    }
    // Релиз есть, но файлов в нём нет — ведём на страницу релизов.
    window.open(RELEASES_PAGE, "_blank", "noopener");
    return;
  } catch {
    // API недоступен (лимит, офлайн) — не блокируем пользователя:
    // открываем страницу Releases, там кнопка скачивания есть всегда.
    window.open(RELEASES_PAGE, "_blank", "noopener");
  }
});

// ── Фоновое обновление данных страницы ──────────────────────────────────

(async () => {
  setRepoLinks(); // ссылки должны работать, даже если API недоступен
  try {
    const release = await fetchLatestRelease();
    cachedRelease = release;
    applyRelease(release);
  } catch {
    // Не удалось получить данные (например, константа NFR_REPO ещё не
    // настроена или сработал лимит API) — показываем нейтральный текст
    // вместо версии, а кнопка в этом случае ведёт на страницу Releases.
    setAll("[data-release-tag]", "последний релиз");
    setAll("[data-release-size]", "—");
    const notes = document.querySelector("[data-release-notes]");
    if (notes) {
      const p = document.createElement("p");
      p.className = "release-empty";
      p.textContent = "Свежие версии и заметки к ним — на странице Releases.";
      notes.replaceWith(p);
    }
  }
})();

// Текущий год в футере
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
