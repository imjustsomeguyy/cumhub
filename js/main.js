const RECENTS_KEY = 'hub_recent_items';
const RECENTS_MAX = 6;
let allApps = [];
let allPhotos = [];

/* ---------- Mobile nav ---------- */
function initNavToggle() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const links = document.querySelector('[data-nav-links]');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

/* ---------- Homepage status strip ---------- */
async function loadStatusStrip() {
  const appsEl = document.querySelector('[data-stat="apps"]');
  const imagesEl = document.querySelector('[data-stat="images"]');
  if (!appsEl && !imagesEl) return;

  const [appsRes, imagesRes] = await Promise.all([
    fetch('/api/apps').then(r => r.json()),
    fetch('/api/images').then(r => r.json()),
  ]);
  const appsCount = appsRes.apps?.length || 0;
  const imagesCount = imagesRes.images?.length || 0;

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

/* ---------- Recents (shared between apps + photos) ---------- */
function getRecents() {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY)) || []; }
  catch { return []; }
}

function addRecent(item) {
  let recents = getRecents().filter(r => !(r.id === item.id && r.type === item.type));
  recents.unshift(item);
  recents = recents.slice(0, RECENTS_MAX);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
  renderRecents();
}

function renderRecents() {
  const row = document.querySelector('[data-recents-row]');
  if (!row) return;
  const recents = getRecents();
  if (!recents.length) { row.style.display = 'none'; return; }

  row.style.display = 'flex';
  row.innerHTML = '<span class="recents-label">recently opened</span>' +
    recents.map(r => `<button class="recent-chip" data-recent-id="${r.id}" data-recent-type="${r.type}">${r.type === 'photo' ? '📷 ' : ''}${r.name}</button>`).join('');

  row.querySelectorAll('.recent-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.recentType;
      const id = chip.dataset.recentId;
      if (type === 'app') {
        const app = allApps.find(a => String(a.id) === id);
        if (app) openApp(app);
      } else {
        const photo = allPhotos.find(p => String(p.id) === id);
        if (photo) openPhoto(photo);
      }
    });
  });
}

/* ---------- Unified viewer ---------- */
function openViewer() {
  const viewer = document.querySelector('[data-app-viewer]');
  const contentSection = document.querySelector('[data-content-section]');
  if (!viewer || !contentSection) return;
  contentSection.style.display = 'none';
  viewer.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeViewer() {
  const viewer = document.querySelector('[data-app-viewer]');
  const contentSection = document.querySelector('[data-content-section]');
  const frame = document.querySelector('[data-viewer-frame]');
  const img = document.querySelector('[data-viewer-image]');
  if (!viewer || !contentSection) return;
  if (frame) frame.src = 'about:blank';
  if (img) img.src = '';
  viewer.classList.remove('active');
  contentSection.style.display = '';
}

function openApp(app) {
  const frameWrap = document.querySelector('[data-viewer-frame-wrap]');
  const imageWrap = document.querySelector('[data-viewer-image-wrap]');
  const frame = document.querySelector('[data-viewer-frame]');
  const title = document.querySelector('[data-viewer-title]');
  const openLink = document.querySelector('[data-viewer-open]');
  if (!frame) return;

  frame.src = app.url;
  title.textContent = app.name;
  openLink.href = app.url;
  frameWrap.style.display = '';
  imageWrap.style.display = 'none';

  openViewer();
  addRecent({ id: app.id, type: 'app', name: app.name });
}

function openPhoto(photo) {
  const frameWrap = document.querySelector('[data-viewer-frame-wrap]');
  const imageWrap = document.querySelector('[data-viewer-image-wrap]');
  const img = document.querySelector('[data-viewer-image]');
  const title = document.querySelector('[data-viewer-title]');
  const openLink = document.querySelector('[data-viewer-open]');
  if (!img) return;

  const src = `/api/file/${photo.id}`;
  img.src = src;
  img.alt = photo.employee_name || 'Team photo';
  title.textContent = photo.employee_name || 'Untitled';
  openLink.href = src;
  frameWrap.style.display = 'none';
  imageWrap.style.display = 'flex';

  openViewer();
  addRecent({ id: photo.id, type: 'photo', name: photo.employee_name || 'Untitled' });
}

/* ---------- Rendering ---------- */
function renderAppsGrid(apps) {
  const grid = document.querySelector('[data-apps-grid]');
  const count = document.querySelector('[data-apps-count]');
  if (!grid) return;
  if (count) count.textContent = apps.length ? `${apps.length}` : '';

  if (!apps.length) {
    grid.innerHTML = `<div class="empty-state">No apps match.</div>`;
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

function renderPhotoGrid(photos) {
  const grid = document.querySelector('[data-photo-grid]');
  const count = document.querySelector('[data-photos-count]');
  if (!grid) return;
  if (count) count.textContent = photos.length ? `${photos.length}` : '';

  if (!photos.length) {
    grid.innerHTML = `<div class="empty-state">No photos match.</div>`;
    return;
  }

  grid.innerHTML = photos.map(p => `
    <div class="photo-card" data-photo-id="${p.id}">
      <img src="/api/file/${p.id}" alt="${p.employee_name || 'Team photo'}" loading="lazy" />
      <div class="photo-caption">${p.employee_name || 'Unnamed'}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.photo-card').forEach(card => {
    card.addEventListener('click', () => {
      const photo = allPhotos.find(p => String(p.id) === card.dataset.photoId);
      if (photo) openPhoto(photo);
    });
  });
}

/* ---------- Shared search across apps + photos ---------- */
function initSharedSearch() {
  const input = document.getElementById('siteSearch');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const apps = !q ? allApps : allApps.filter(a =>
      a.name.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q));
    const photos = !q ? allPhotos : allPhotos.filter(p =>
      (p.employee_name || '').toLowerCase().includes(q));
    renderAppsGrid(apps);
    renderPhotoGrid(photos);
  });
}

/* ---------- Load data ---------- */
async function loadAppsAndPhotos() {
  const appsGrid = document.querySelector('[data-apps-grid]');
  const photoGrid = document.querySelector('[data-photo-grid]');
  if (!appsGrid && !photoGrid) return;

  const [appsRes, imagesRes] = await Promise.all([
    fetch('/api/apps').then(r => r.json()).catch(() => ({ apps: [] })),
    fetch('/api/images').then(r => r.json()).catch(() => ({ images: [] })),
  ]);

  allApps = appsRes.apps || [];
  allPhotos = imagesRes.images || [];

  if (appsGrid) renderAppsGrid(allApps);
  if (photoGrid) renderPhotoGrid(allPhotos);
  renderRecents();

  const backBtn = document.querySelector('[data-back-btn]');
  if (backBtn) backBtn.addEventListener('click', closeViewer);

  initSharedSearch();

  if (window.location.hash === '#photos') {
    const photosCol = document.getElementById('photos');
    if (photosCol) setTimeout(() => photosCol.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  loadStatusStrip();
  loadAppsAndPhotos();
});
