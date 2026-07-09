const RECENTS_KEY = 'hub_recent_apps';
const RECENTS_MAX = 5;
let allApps = [];

async function loadStatusStrip() {
  const [appsRes, imagesRes] = await Promise.all([
    fetch('/api/apps').then(r => r.json()),
    fetch('/api/images').then(r => r.json()),
  ]);
  const appsCount = appsRes.apps?.length || 0;
  const imagesCount = imagesRes.images?.length || 0;

  const appsEl = document.querySelector('[data-stat="apps"]');
  const imagesEl = document.querySelector('[data-stat="images"]');
  if (appsEl) appsEl.textContent = appsCount;
  if (imagesEl) imagesEl.textContent = imagesCount;

  document.querySelectorAll('.status-bar span').forEach((bar, i) => {
    const targets = [appsCount, imagesCount, 1];
    const max = Math.max(targets[i] || 1, 4);
    requestAnimationFrame(() => {
      bar.style.width = Math.min(100, ((targets[i] || 0) / max) * 100) + '%';
    });
  });
}

function getRecents() {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY)) || [];
  } catch {
    return [];
  }
}

function addRecent(app) {
  let recents = getRecents().filter(r => r.id !== app.id);
  recents.unshift({ id: app.id, name: app.name, url: app.url });
  recents = recents.slice(0, RECENTS_MAX);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
  renderRecents();
}

function renderRecents() {
  const row = document.querySelector('[data-recents-row]');
  if (!row) return;
  const recents = getRecents();
  if (!recents.length) {
    row.style.display = 'none';
    return;
  }
  row.style.display = 'flex';
  row.innerHTML = '<span class="recents-label">Recently opened</span>' +
    recents.map(r => `<button class="recent-chip" data-recent-id="${r.id}">${r.name}</button>`).join('');

  row.querySelectorAll('.recent-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const app = allApps.find(a => String(a.id) === chip.dataset.recentId);
      if (app) openApp(app);
    });
  });
}

function openApp(app) {
  const viewer = document.querySelector('[data-app-viewer]');
  const appsSection = document.querySelector('[data-apps-section]');
  const frame = document.querySelector('[data-viewer-frame]');
  const title = document.querySelector('[data-viewer-title]');
  const openLink = document.querySelector('[data-viewer-open]');
  if (!viewer || !appsSection || !frame) return;

  frame.src = app.url;
  title.textContent = app.name;
  openLink.href = app.url;

  appsSection.style.display = 'none';
  viewer.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  addRecent(app);
}

function closeApp() {
  const viewer = document.querySelector('[data-app-viewer]');
  const appsSection = document.querySelector('[data-apps-section]');
  const frame = document.querySelector('[data-viewer-frame]');
  if (!viewer || !appsSection || !frame) return;

  frame.src = 'about:blank';
  viewer.classList.remove('active');
  appsSection.style.display = '';
}

function renderAppsGrid(apps) {
  const grid = document.querySelector('[data-apps-grid]');
  if (!grid) return;

  if (!apps.length) {
    grid.innerHTML = `<div class="empty-state">No apps match your search.</div>`;
    return;
  }

  grid.innerHTML = apps.map(app => `
    <div class="card" data-app-id="${app.id}">
      <div class="app-icon">${(app.icon || app.name[0]).slice(0, 2).toUpperCase()}</div>
      <h3>${app.name}</h3>
      <p>${app.description || 'No description yet.'}</p>
    </div>
  `).join('');

  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const app = allApps.find(a => String(a.id) === card.dataset.appId);
      if (app) openApp(app);
    });
  });
}

async function loadApps() {
  const grid = document.querySelector('[data-apps-grid]');
  if (!grid) return;

  const { apps } = await fetch('/api/apps').then(r => r.json());
  allApps = apps || [];

  if (!allApps.length) {
    grid.innerHTML = `<div class="empty-state">No apps have been added yet. Check back soon.</div>`;
    return;
  }

  renderAppsGrid(allApps);
  renderRecents();

  const backBtn = document.querySelector('[data-back-btn]');
  if (backBtn) backBtn.addEventListener('click', closeApp);

  const searchInput = document.getElementById('appSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      const filtered = !q ? allApps : allApps.filter(a =>
        a.name.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
      );
      renderAppsGrid(filtered);
    });
  }
}

async function loadTeamPhotos() {
  const grid = document.querySelector('[data-photo-grid]');
  if (!grid) return;
  const { images } = await fetch('/api/images').then(r => r.json());
  if (!images.length) {
    grid.innerHTML = `<div class="empty-state">No photos uploaded yet.</div>`;
    return;
  }
  grid.innerHTML = images.map(img => `
    <div class="photo-card">
      <img src="/api/file/${img.id}" alt="${img.employee_name || 'Employee photo'}" loading="lazy" />
      <div class="photo-caption">${img.employee_name || 'Unnamed'}</div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadStatusStrip();
  loadApps();
  loadTeamPhotos();
});
