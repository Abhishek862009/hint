document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  navToggle.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}));

function showToast(msg, isErr) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isErr ? ' err' : '');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ---------- Showcase gallery ---------- */
async function loadShowcase() {
  const grid = document.getElementById('galleryGrid');
  const empty = document.getElementById('galleryEmpty');

  if (typeof FIREBASE_NOT_CONFIGURED !== 'undefined' && FIREBASE_NOT_CONFIGURED) {
    empty.style.display = 'block';
    empty.querySelector('strong').textContent = 'Setup in progress';
    empty.lastChild.textContent = ' The database hasn\'t been connected yet — see README.md.';
    return;
  }

  try {
    const snap = await db.collection('photos')
      .where('showcase', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(9)
      .get();

    if (snap.empty) {
      empty.style.display = 'block';
      return;
    }
    grid.innerHTML = '';
    snap.forEach(doc => {
      const p = doc.data();
      const fig = document.createElement('figure');
      fig.innerHTML = `<img src="${p.url}" alt="${p.categoryName || 'Studio'} photo" loading="lazy">
        <figcaption>${p.categoryName || ''}</figcaption>`;
      grid.appendChild(fig);
    });
  } catch (e) {
    console.error(e);
    empty.style.display = 'block';
    empty.querySelector('strong').textContent = 'Gallery unavailable right now';
    empty.lastChild.textContent = ' Please refresh the page in a moment.';
  }
}
loadShowcase();

/* ---------- Contact form ---------- */
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const note = document.getElementById('cf-note');
  const btn = document.getElementById('cf-submit');
  note.textContent = '';
  note.className = 'form-note';

  if (typeof FIREBASE_NOT_CONFIGURED !== 'undefined' && FIREBASE_NOT_CONFIGURED) {
    note.textContent = 'The database isn\'t connected yet, so this message can\'t be saved.';
    note.classList.add('err');
    return;
  }

  const data = {
    name: document.getElementById('cf-name').value.trim(),
    phone: document.getElementById('cf-phone').value.trim(),
    message: document.getElementById('cf-message').value.trim(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    status: 'new'
  };

  btn.disabled = true;
  btn.textContent = 'Sending...';
  try {
    await db.collection('queries').add(data);
    note.textContent = 'Thank you — we\'ll be in touch shortly.';
    note.classList.add('ok');
    e.target.reset();
  } catch (err) {
    console.error(err);
    note.textContent = 'Something went wrong, please try again.';
    note.classList.add('err');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send message';
  }
});
