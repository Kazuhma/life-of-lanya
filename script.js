(function() {
  'use strict';

  // ============================================
  // DATA
  // ============================================
  let siteData = null;

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
  // DOM ELEMENTS
  // ============================================
  const views = Array.from(document.querySelectorAll('[data-view]'));
  const topbar = document.querySelector('[data-topbar]');
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
  // VIEW ROUTING
  // ============================================
  function setActive(viewName) {
    views.forEach(v => v.classList.toggle('is-active', v.dataset.view === viewName));
    navLinks.forEach(a => a.classList.toggle('is-active', a.dataset.nav === viewName));

    // Topbar shows on subpages
    if (viewName === 'home') {
      topbar.classList.remove('is-visible');
    } else {
      topbar.classList.add('is-visible');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Load content for view
    if (viewName === 'read') {
      renderVolumeGrid();
    } else if (viewName === 'concept-art') {
      renderConceptGallery();
    }
  }

  function route() {
    const hash = (location.hash || '#/').replace('#/', '').trim();

    if (!hash) {
      setActive('home');
      return;
    }

    if (hash.startsWith('read')) {
      setActive('read');
    } else if (hash.startsWith('concept-art')) {
      setActive('concept-art');
    } else if (hash.startsWith('updates')) {
      setActive('updates');
    } else {
      setActive('home');
    }
  }

  // ============================================
  // VOLUME GRID (Read page entry points)
  // ============================================
  function renderVolumeGrid() {
    if (!siteData || !volumeGrid) return;

    const volumes = siteData.volumes || [];

    if (volumes.length === 0) {
      volumeGrid.innerHTML = '<p class="empty-state">No volumes available yet.</p>';
      return;
    }

    volumeGrid.innerHTML = volumes.map(vol => {
      const volNum = String(vol.number).padStart(2, '0');
      const coverSrc = `assets/pages/vol-${volNum}/001.jpg`;
      return `
        <a class="volume-card" href="#" data-open-reader="${vol.number}">
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

  function openReader(volumeNum) {
    if (!siteData) return;

    const volume = siteData.volumes.find(v => v.number === volumeNum);
    if (!volume) return;

    currentVolume = volume;
    currentPage = 1;
    totalPages = volume.pages;

    readerTitle.textContent = `Volume ${volume.number}: ${volume.title}`;
    updateReaderPage();
    readerDialog.showModal();
  }

  function updateReaderPage() {
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
  }

  // Reader event listeners
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-reader]');
    if (opener) {
      e.preventDefault();
      const volNum = parseInt(opener.dataset.openReader, 10);
      openReader(volNum);
    }
  });

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
