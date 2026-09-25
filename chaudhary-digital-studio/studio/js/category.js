document.getElementById('year').textContent = new Date().getFullYear();

const params = new URLSearchParams(window.location.search);
const categoryId = params.get('id');

const spinner = document.getElementById('spinner');
const grid = document.getElementById('photoGrid');
const empty = document.getElementById('catEmpty');
const catNameEl = document.getElementById('catName');
const catCountEl = document.getElementById('catCount');

function showEmpty(title, body) {
  spinner.style.display = 'none';
  empty.style.display = 'block';
  document.getElementById('emptyTitle').textContent = title;
  document.getElementById('emptyBody').textContent = body;
  catNameEl.textContent = 'Chaudhary Digital Studio';
}

async function loadCategory() {
  if (typeof FIREBASE_NOT_CONFIGURED !== 'undefined' && FIREBASE_NOT_CONFIGURED) {
    showEmpty('Setup in progress', 'The database has not been connected yet.');
    return;
  }
  if (!categoryId) {
    showEmpty('Incomplete link', 'This QR code is not linked to a valid gallery.');
    return;
  }

  try {
    const catDoc = await db.collection('categories').doc(categoryId).get();
    if (!catDoc.exists) {
      showEmpty('We couldn\'t find this gallery', 'These photos may have been removed.');
      return;
    }
    const cat = catDoc.data();
    catNameEl.textContent = cat.name || 'Photos';
    document.title = (cat.name || 'Photos') + ' | Chaudhary Digital Studio';

    const photosSnap = await db.collection('photos')
      .where('categoryId', '==', categoryId)
      .orderBy('createdAt', 'desc')
      .get();

    spinner.style.display = 'none';

    if (photosSnap.empty) {
      catCountEl.textContent = '0 photos';
      showEmpty('Photos coming soon', 'Please check back again shortly.');
      return;
    }

    catCountEl.textContent = photosSnap.size + ' photo' + (photosSnap.size === 1 ? '' : 's');
    photosSnap.forEach(doc => {
      const p = doc.data();
      const fig = document.createElement('figure');
      fig.innerHTML = `<img src="${p.url}" alt="${cat.name}" loading="lazy">`;
      fig.querySelector('img').addEventListener('click', () => openLightbox(p.url));
      grid.appendChild(fig);
    });
  } catch (e) {
    console.error(e);
    showEmpty('Something went wrong', 'Please check your connection and refresh the page.');
  }
}
loadCategory();

function openLightbox(src) {
  document.getElementById('lbImg').src = src;
  document.getElementById('lightbox').classList.add('open');
}
document.getElementById('lbClose').addEventListener('click', () => {
  document.getElementById('lightbox').classList.remove('open');
});
document.getElementById('lightbox').addEventListener('click', (e) => {
  if (e.target.id === 'lightbox') e.target.classList.remove('open');
});
