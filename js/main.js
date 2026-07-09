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

async function loadApps() {
  const grid = document.querySelector('[data-apps-grid]');
  if (!grid) return;

  const { apps } = await fetch('/api/apps').then(r => r.json());

  if (!apps.length) {
    grid.innerHTML = `<div class="empty-state">No apps have been added yet. Check back soon.</div>`;
    return;
  }

  grid.innerHTML = apps.map(app => `
    <a class="card" href="${app.url}" target="_blank" rel="noopener">
      <div class="app-icon">${(app.icon || app.name[0]).slice(0, 2).toUpperCase()}</div>
      <h3>${app.name}</h3>
      <p>${app.description || 'No description yet.'}</p>
    </a>
  `).join('');
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
