/* ---------- setup / error guard ---------- */
if (typeof FIREBASE_NOT_CONFIGURED !== 'undefined' && FIREBASE_NOT_CONFIGURED) {
  document.getElementById('configWarning').style.display = 'block';
  document.getElementById('loginForm').querySelectorAll('input,button').forEach(el => el.disabled = true);
}

function showToast(msg, isErr) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isErr ? ' err' : '');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ---------- auth ---------- */
const loginView = document.getElementById('loginView');
const panelView = document.getElementById('panelView');

if (typeof auth !== 'undefined' && auth) {
  auth.onAuthStateChanged(user => {
    if (user) {
      loginView.style.display = 'none';
      panelView.style.display = 'block';
      document.getElementById('adminEmail').textContent = user.email;
      initAdminData();
    } else {
      loginView.style.display = 'flex';
      panelView.style.display = 'none';
    }
  });
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const note = document.getElementById('loginNote');
  const btn = document.getElementById('loginBtn');
  note.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Logging in...';
  try {
    await auth.signInWithEmailAndPassword(
      document.getElementById('loginEmail').value.trim(),
      document.getElementById('loginPass').value
    );
  } catch (err) {
    console.error(err);
    note.textContent = 'Incorrect email or password.';
    note.classList.add('err');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log in';
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());

/* ---------- nav switching ---------- */
document.querySelectorAll('.admin-nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel-view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
  });
});

/* ---------- state ---------- */
let categories = []; // {id, name}

function initAdminData() {
  loadCategories();
  loadQueries();
}

/* ---------- categories ---------- */
async function loadCategories() {
  const empty = document.getElementById('catEmptyAdmin');
  try {
    const snap = await db.collection('categories').orderBy('createdAt', 'desc').get();
    categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCategoryList();
    fillCategorySelects();
    empty.style.display = categories.length === 0 ? 'block' : 'none';
  } catch (e) {
    console.error(e);
    showToast('Could not load categories', true);
  }
}

function renderCategoryList() {
  const list = document.getElementById('catList');
  list.innerHTML = '';
  categories.forEach(cat => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${escapeHtml(cat.name)}</strong>
        <div class="cat-meta">${cat.id}</div>
      </div>
      <div class="cat-actions">
        <button class="btn btn-ghost btn-sm" data-qr="${cat.id}">QR code</button>
        <button class="btn btn-danger btn-sm" data-del="${cat.id}">Delete</button>
      </div>`;
    list.appendChild(li);
  });

  list.querySelectorAll('[data-qr]').forEach(b => b.addEventListener('click', () => openQr(b.dataset.qr)));
  list.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteCategory(b.dataset.del)));
}

function fillCategorySelects() {
  const uploadSel = document.getElementById('uploadCatSelect');
  const showcaseSel = document.getElementById('showcaseCatSelect');
  [uploadSel, showcaseSel].forEach(sel => {
    const current = sel.value;
    sel.innerHTML = categories.length
      ? categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')
      : '<option value="">Create a category first</option>';
    if (current) sel.value = current;
  });
  if (categories.length) {
    loadPhotosForUpload(uploadSel.value);
    loadPhotosForShowcase(showcaseSel.value);
  }
}

document.getElementById('addCatBtn').addEventListener('click', async () => {
  const input = document.getElementById('newCatName');
  const name = input.value.trim();
  if (!name) { showToast('Please enter a category name', true); return; }
  try {
    await db.collection('categories').add({
      name,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = '';
    showToast('Category created');
    loadCategories();
  } catch (e) {
    console.error(e);
    showToast('Could not create category', true);
  }
});

async function deleteCategory(id) {
  if (!confirm('Delete this category and all of its photos?')) return;
  try {
    const photosSnap = await db.collection('photos').where('categoryId', '==', id).get();
    const batchDeletes = photosSnap.docs.map(async d => {
      const p = d.data();
      if (p.storagePath) {
        try { await storage.ref(p.storagePath).delete(); } catch (e) { /* file may already be gone */ }
      }
      return d.ref.delete();
    });
    await Promise.all(batchDeletes);
    await db.collection('categories').doc(id).delete();
    showToast('Category deleted');
    loadCategories();
  } catch (e) {
    console.error(e);
    showToast('Could not delete category', true);
  }
}

/* ---------- QR ---------- */
function openQr(categoryId) {
  const cat = categories.find(c => c.id === categoryId);
  const url = window.location.origin + window.location.pathname.replace('admin.html', '') + 'category.html?id=' + categoryId;
  document.getElementById('qrCatName').textContent = cat ? cat.name : 'Category';
  const canvas = document.getElementById('qrCanvas');
  QRCode.toCanvas(canvas, url, { width: 220, margin: 1, color: { dark: '#131110', light: '#f2eae0' } }, (err) => {
    if (err) console.error(err);
  });
  document.getElementById('qrDownload').onclick = () => {
    const link = document.createElement('a');
    link.download = (cat ? cat.name.replace(/\s+/g, '_') : 'category') + '_QR.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  document.getElementById('qrModal').classList.add('open');
}
document.getElementById('qrClose').addEventListener('click', () => document.getElementById('qrModal').classList.remove('open'));

/* ---------- upload ---------- */
document.getElementById('uploadCatSelect').addEventListener('change', (e) => loadPhotosForUpload(e.target.value));

document.getElementById('fileInput').addEventListener('change', async (e) => {
  const catId = document.getElementById('uploadCatSelect').value;
  const cat = categories.find(c => c.id === catId);
  if (!catId) { showToast('Please choose a category first', true); return; }
  const files = Array.from(e.target.files);
  const progressEl = document.getElementById('uploadProgress');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    progressEl.textContent = `Uploading ${i + 1} of ${files.length}...`;
    try {
      const path = `photos/${catId}/${Date.now()}_${file.name}`;
      const ref = storage.ref(path);
      await ref.put(file);
      const url = await ref.getDownloadURL();
      await db.collection('photos').add({
        categoryId: catId,
        categoryName: cat ? cat.name : '',
        url,
        storagePath: path,
        showcase: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      showToast(`"${file.name}" could not be uploaded`, true);
    }
  }
  progressEl.textContent = 'Upload complete.';
  e.target.value = '';
  loadPhotosForUpload(catId);
});

async function loadPhotosForUpload(catId) {
  const grid = document.getElementById('uploadPhotoGrid');
  const label = document.getElementById('uploadCatPhotosLabel');
  grid.innerHTML = '';
  if (!catId) { label.textContent = ''; return; }
  const cat = categories.find(c => c.id === catId);
  label.textContent = 'Photos in ' + (cat ? cat.name : 'this category') + ':';
  try {
    const snap = await db.collection('photos').where('categoryId', '==', catId).orderBy('createdAt', 'desc').get();
    if (snap.empty) {
      grid.innerHTML = '<div class="empty-state">No photos in this category yet.</div>';
      return;
    }
    snap.forEach(doc => {
      const p = doc.data();
      const tile = document.createElement('div');
      tile.className = 'photo-tile';
      tile.innerHTML = `<img src="${p.url}" loading="lazy">
        <div class="tile-bar">
          <span>${p.showcase ? '★ showcase' : ''}</span>
          <button class="tile-del" data-id="${doc.id}" data-path="${p.storagePath}">Delete</button>
        </div>`;
      tile.querySelector('.tile-del').addEventListener('click', () => deletePhoto(doc.id, p.storagePath, catId));
      grid.appendChild(tile);
    });
  } catch (e) {
    console.error(e);
    grid.innerHTML = '<div class="empty-state">Could not load photos.</div>';
  }
}

async function deletePhoto(photoId, storagePath, catId) {
  if (!confirm('Delete this photo?')) return;
  try {
    if (storagePath) {
      try { await storage.ref(storagePath).delete(); } catch (e) {}
    }
    await db.collection('photos').doc(photoId).delete();
    showToast('Photo deleted');
    loadPhotosForUpload(catId);
  } catch (e) {
    console.error(e);
    showToast('Could not delete photo', true);
  }
}

/* ---------- showcase ---------- */
document.getElementById('showcaseCatSelect').addEventListener('change', (e) => loadPhotosForShowcase(e.target.value));

async function loadPhotosForShowcase(catId) {
  const grid = document.getElementById('showcasePhotoGrid');
  grid.innerHTML = '';
  if (!catId) return;
  try {
    const snap = await db.collection('photos').where('categoryId', '==', catId).orderBy('createdAt', 'desc').get();
    if (snap.empty) {
      grid.innerHTML = '<div class="empty-state">No photos in this category yet.</div>';
      return;
    }
    snap.forEach(doc => {
      const p = doc.data();
      const tile = document.createElement('div');
      tile.className = 'photo-tile';
      tile.innerHTML = `<img src="${p.url}" loading="lazy">
        <div class="tile-bar">
          <label><input type="checkbox" ${p.showcase ? 'checked' : ''} data-id="${doc.id}"> Showcase</label>
        </div>`;
      tile.querySelector('input').addEventListener('change', async (e) => {
        try {
          await db.collection('photos').doc(doc.id).update({ showcase: e.target.checked });
          showToast(e.target.checked ? 'Added to homepage' : 'Removed from homepage');
        } catch (err) {
          console.error(err);
          showToast('Could not update', true);
          e.target.checked = !e.target.checked;
        }
      });
      grid.appendChild(tile);
    });
  } catch (e) {
    console.error(e);
    grid.innerHTML = '<div class="empty-state">Could not load photos.</div>';
  }
}

/* ---------- queries ---------- */
async function loadQueries() {
  const wrap = document.getElementById('queriesList');
  const empty = document.getElementById('queriesEmpty');
  try {
    const snap = await db.collection('queries').orderBy('createdAt', 'desc').limit(100).get();
    if (snap.empty) { empty.style.display = 'block'; wrap.innerHTML = ''; return; }
    empty.style.display = 'none';
    wrap.innerHTML = '';
    const list = document.createElement('ul');
    list.className = 'cat-list';
    snap.forEach(doc => {
      const q = doc.data();
      const when = q.createdAt ? q.createdAt.toDate().toLocaleString('en-IN') : '';
      const li = document.createElement('li');
      li.innerHTML = `<div>
          <strong>${escapeHtml(q.name || '')}</strong> — ${escapeHtml(q.phone || '')}
          <div class="cat-meta">${escapeHtml(q.message || '')}</div>
          <div class="cat-meta">${when}</div>
        </div>`;
      list.appendChild(li);
    });
    wrap.appendChild(list);
  } catch (e) {
    console.error(e);
    wrap.innerHTML = '<div class="empty-state">Could not load queries.</div>';
  }
}

/* ---------- utils ---------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}
