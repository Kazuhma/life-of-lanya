(function() {
  'use strict';

  // ============================================
  // DATA
  // ============================================
  let siteData = null;
  const PROGRESS_KEY = 'lanya_progress_v1';

  async function loadData() {
    try {
      const response = await fetch('data.json');
      siteData = await response.json();
      return siteData;
    } catch (err) {
      console.error('Failed to load data.json:', err);
      return null;
    }
  }

  // ============================================
  // PROGRESS PERSISTENCE
  // ============================================
  function saveProgress() {
    if (!currentVolume) return;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      volume: currentVolume.number,
      page: currentPage
    }));
  }

  // ============================================
  // DOM ELEMENTS
  // ============================================
  const views = Array.from(document.querySelectorAll('[data-view]'));
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
  const volumeGrid = document.getElementById('volumeGrid');
  const conceptGallery = document.getElementById('conceptGallery');

  // Reader (lightbox-style)
  const readerDialog = document.querySelector('[data-reader-dialog]');
  const readerImg = document.querySelector('[data-reader-img]');
  const readerTitle = document.querySelector('[data-reader-title]');
  const readerCounter = document.querySelector('[data-reader-counter]');
  const readerClose = document.querySelector('[data-reader-close]');
  const readerPrev = document.querySelector('[data-reader-prev]');
  const readerNext = document.querySelector('[data-reader-next]');

  // Concept art lightbox
  const lightboxDialog = document.querySelector('[data-lightbox-dialog]');
  const lightboxImg = document.querySelector('[data-lightbox-img]');
  const lightboxCap = document.querySelector('[data-lightbox-cap]');
  const lightboxClose = document.querySelector('[data-lightbox-close]');

  // ============================================
  // URL HELPERS
  // ============================================
  function setHashSilently(nextHash) {
    history.replaceState(null, '', nextHash);
  }

  // ============================================
  // ROUTING
  // ============================================
  function setActive(viewName) {
    views.forEach(v => v.classList.toggle('is-active', v.dataset.view === viewName));
    navLinks.forEach(a => a.classList.toggle('is-active', a.dataset.nav === viewName));

    if (viewName === 'home') {
      renderVolumeGrid();
    } else if (viewName === 'concept-art') {
      renderConceptGallery();
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  function route() {
    const raw = (location.hash || '#/').replace(/^#\//, '').trim();
    const parts = raw ? raw.split('/').filter(Boolean) : [];
    const [root, a, b] = parts;

    // Home
    if (!root) {
      setActive('home');
      return;
    }

    // Concept art mode
    if (root === 'concept-art') {
      setActive('concept-art');
      return;
    }

    // Reading deep link: #/read/:vol/:page
    if (root === 'read') {
      setActive('home'); // Reader is a modal over home
      const vol = a ? parseInt(a, 10) : null;
      const page = b ? parseInt(b, 10) : 1;
      if (vol) openReader(vol, page, { syncUrl: false });
      return;
    }

    setActive('home');
  }

  // ============================================
  // VOLUME GRID (Album rail on home)
  // ============================================
  function renderVolumeGrid() {
    if (!siteData || !volumeGrid) return;

    const volumes = siteData.volumes || [];

    if (volumes.length === 0) {
      volumeGrid.innerHTML = '<p class="empty-state">No albums yet.</p>';
      return;
    }

    volumeGrid.innerHTML = volumes.map(vol => {
      const volNum = String(vol.number).padStart(2, '0');
      const coverSrc = `assets/pages/vol-${volNum}/001.jpg`;
      return `
        <a class="volume-card" href="#/read/${vol.number}/1">
          <img src="${coverSrc}" alt="Volume ${vol.number} cover" loading="lazy" />
          <div class="volume-info">
            <span class="volume-label">Volume ${vol.number}</span>
            <span class="volume-title">${vol.title}</span>
            <span class="volume-pages">${vol.pages} pages</span>
          </div>
        </a>
      `;
    }).join('');
  }

  // ============================================
  // COMIC READER (Lightbox-style)
  // ============================================
  let currentVolume = null;
  let currentPage = 1;
  let totalPages = 0;

  function openReader(volumeNum, page = 1, opts = { syncUrl: true }) {
    if (!siteData) return;

    const volume = siteData.volumes.find(v => v.number === volumeNum);
    if (!volume) return;

    currentVolume = volume;
    totalPages = volume.pages;
    currentPage = Math.min(Math.max(1, page), totalPages);

    readerTitle.textContent = `Volume ${volume.number}: ${volume.title}`;
    updateReaderPage(opts.syncUrl);

    if (!readerDialog.open) {
      readerDialog.showModal();
    }
  }

  function updateReaderPage(syncUrl = true) {
    if (!currentVolume) return;

    const volNum = String(currentVolume.number).padStart(2, '0');
    const pageNum = String(currentPage).padStart(3, '0');
    const src = `assets/pages/vol-${volNum}/${pageNum}.jpg`;

    readerImg.src = src;
    readerImg.alt = `${currentVolume.title} — Page ${currentPage}`;
    readerCounter.textContent = `${currentPage} / ${totalPages}`;

    // Update nav button states
    readerPrev.disabled = currentPage <= 1;
    readerNext.disabled = currentPage >= totalPages;

    // Sync URL and save progress
    if (syncUrl) {
      setHashSilently(`#/read/${currentVolume.number}/${currentPage}`);
    }
    saveProgress();
  }

  function goToPrevPage() {
    if (currentPage > 1) {
      currentPage--;
      updateReaderPage();
    }
  }

  function goToNextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      updateReaderPage();
    }
  }

  function closeReader() {
    readerDialog.close();
    currentVolume = null;
    currentPage = 1;
    totalPages = 0;
    setHashSilently('#/');
  }

  // Reader event listeners
  readerClose?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeReader();
  });

  readerPrev?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    goToPrevPage();
  });

  readerNext?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    goToNextPage();
  });

  // Click on image to advance
  readerImg?.addEventListener('click', (e) => {
    const rect = readerImg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 3) {
      goToPrevPage();
    } else {
      goToNextPage();
    }
  });

  // Close on backdrop click
  readerDialog?.addEventListener('click', (e) => {
    if (e.target === readerDialog) {
      closeReader();
    }
  });

  // ============================================
  // CONCEPT ART GALLERY
  // ============================================
  function renderConceptGallery() {
    if (!siteData || !conceptGallery) return;

    const artworks = siteData.conceptArt || [];

    if (artworks.length === 0) {
      conceptGallery.innerHTML = '<p class="empty-state">Concept art coming soon.</p>';
      return;
    }

    conceptGallery.innerHTML = artworks.map(art => `
      <a class="tile" href="${art.src}" data-lightbox>
        <img src="${art.src}" alt="${art.title}" loading="lazy" />
        <span class="cap">${art.title}</span>
      </a>
    `).join('');
  }

  // ============================================
  // CONCEPT ART LIGHTBOX
  // ============================================
  function openLightbox(href, capText) {
    if (!lightboxDialog) return;
    lightboxImg.src = href;
    lightboxImg.alt = capText || 'Concept Art';
    lightboxCap.textContent = capText || '';
    lightboxDialog.showModal();
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-lightbox]');
    if (!a) return;
    e.preventDefault();
    const cap = a.querySelector('.cap')?.textContent?.trim() || '';
    openLightbox(a.getAttribute('href'), cap);
  });

  lightboxClose?.addEventListener('click', () => lightboxDialog.close());

  lightboxDialog?.addEventListener('click', (e) => {
    if (e.target === lightboxDialog) {
      lightboxDialog.close();
    }
  });

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  document.addEventListener('keydown', (e) => {
    // Reader navigation
    if (readerDialog?.open) {
      if (e.key === 'Escape') {
        closeReader();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        goToPrevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === ' ') {
        e.preventDefault();
        goToNextPage();
      }
      return;
    }

    // Lightbox close
    if (lightboxDialog?.open && e.key === 'Escape') {
      lightboxDialog.close();
    }
  });

  // ============================================
  // INIT
  // ============================================
  async function init() {
    await loadData();
    window.addEventListener('hashchange', route);
    route();
  }

  init();
})();
