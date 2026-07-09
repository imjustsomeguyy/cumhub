function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function showDashboard() {
  document.getElementById('login-shell').style.display = 'none';
  document.getElementById('admin-shell').style.display = 'flex';
  loadAppsList();
  loadPhotosList();
}

function showLogin() {
  document.getElementById('login-shell').style.display = 'flex';
  document.getElementById('admin-shell').style.display = 'none';
}

async function checkSession() {
  const { authed } = await fetch('/api/me').then(r => r.json());
  authed ? showDashboard() : showLogin();
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const password = document.getElementById('password').value;
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (res.ok) {
    showDashboard();
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  showLogin();
});

// Sidebar panel switching
document.querySelectorAll('.sidebar-link[data-panel]').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-link[data-panel]').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${link.dataset.panel}`).classList.add('active');
  });
});

// ---------- Apps ----------
async function loadAppsList() {
  const el = document.getElementById('apps-list');
  const { apps } = await fetch('/api/apps').then(r => r.json());

  if (!apps.length) {
    el.innerHTML = `<div class="empty-state">No apps added yet.</div>`;
    return;
  }

  el.innerHTML = apps.map(app => `
    <div class="list-row">
      <div class="list-row-main">
        <span>${app.name}</span>
        <span>${app.url}</span>
      </div>
      <button class="btn btn-danger" data-delete-app="${app.id}">Remove</button>
    </div>
  `).join('');

  el.querySelectorAll('[data-delete-app]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await fetch(`/api/apps/${btn.dataset.deleteApp}`, { method: 'DELETE' });
      showToast('App removed');
      loadAppsList();
    });
  });
}

document.getElementById('add-app-btn').addEventListener('click', async () => {
  const name = document.getElementById('app-name').value.trim();
  const url = document.getElementById('app-url').value.trim();
  const description = document.getElementById('app-desc').value.trim();
  const icon = document.getElementById('app-icon').value.trim();

  if (!name || !url) return showToast('Name and link are required');

  const res = await fetch('/api/apps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, url, description, icon }),
  });

  if (res.ok) {
    ['app-name', 'app-url', 'app-desc', 'app-icon'].forEach(id => document.getElementById(id).value = '');
    showToast('App added');
    loadAppsList();
  } else {
    showToast('Could not add app');
  }
});

// ---------- Photos ----------
async function loadPhotosList() {
  const el = document.getElementById('photos-list');
  const { images } = await fetch('/api/images').then(r => r.json());

  if (!images.length) {
    el.innerHTML = `<div class="empty-state">No photos uploaded yet.</div>`;
    return;
  }

  el.innerHTML = images.map(img => `
    <div class="list-row">
      <div class="list-row-main">
        <span>${img.employee_name || 'Unnamed'}</span>
        <span>${img.filename}</span>
      </div>
      <button class="btn btn-danger" data-delete-photo="${img.id}">Remove</button>
    </div>
  `).join('');

  el.querySelectorAll('[data-delete-photo]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await fetch(`/api/images/${btn.dataset.deletePhoto}`, { method: 'DELETE' });
      showToast('Photo removed');
      loadPhotosList();
    });
  });
}

document.getElementById('add-photo-btn').addEventListener('click', async () => {
  const nameInput = document.getElementById('photo-name');
  const fileInput = document.getElementById('photo-file');

  if (!fileInput.files[0]) return showToast('Choose a file first');

  const form = new FormData();
  form.append('employee_name', nameInput.value.trim());
  form.append('file', fileInput.files[0]);

  const res = await fetch('/api/images', { method: 'POST', body: form });

  if (res.ok) {
    nameInput.value = '';
    fileInput.value = '';
    showToast('Photo uploaded');
    loadPhotosList();
  } else {
    showToast('Could not upload photo');
  }
});

checkSession();
