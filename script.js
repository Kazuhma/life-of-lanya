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
  const albumGrid = document.getElementById('albumGrid');
  const conceptGrid = document.getElementById('conceptGrid');

  // Reader dialog
  const readerDialog = document.querySelector('[data-reader-dialog]');
  const readerCover = document.querySelector('[data-reader-cover]');
  const readerContent = document.querySelector('[data-reader-content]');
  const coverBg = document.querySelector('[data-cover-bg]');
  const coverLabel = document.querySelector('[data-cover-label]');
  const coverTitle = document.querySelector('[data-cover-title]');
  const coverSubtitle = document.querySelector('[data-cover-subtitle]');
  const coverStart = document.querySelector('[data-cover-start]');
  const coverBack = document.querySelector('[data-cover-back]');
  const readerImg = document.querySelector('[data-reader-img]');
  const readerCounter = document.querySelector('[data-reader-counter]');
  const readerClose = document.querySelector('[data-reader-close]');
  const readerPrev = document.querySelector('[data-reader-prev]');
  const readerNext = document.querySelector('[data-reader-next]');
  const readerZoom = document.querySelector('[data-reader-zoom]');
  const readerViewport = document.querySelector('.reader-viewport');

  // Concept art dialog
  const conceptDialog = document.querySelector('[data-concept-dialog]');
  const conceptImg = document.querySelector('[data-concept-img]');
  const conceptCounter = document.querySelector('[data-concept-counter]');
  const conceptClose = document.querySelector('[data-concept-close]');
  const conceptPrev = document.querySelector('[data-concept-prev]');
  const conceptNext = document.querySelector('[data-concept-next]');
  const conceptTitle = document.querySelector('[data-concept-title]');
  const conceptNote = document.querySelector('[data-concept-note]');
  const conceptZoom = document.querySelector('[data-concept-zoom]');
  const conceptViewport = document.querySelector('.concept-viewport');

  // ============================================
  // URL HELPERS
  // ============================================
  function setHashSilently(nextHash) {
    history.replaceState(null, '', nextHash);
  }

  // ============================================
  // ROUTING
  // ============================================
  function route() {
    const raw = (location.hash || '#/').replace(/^#\//, '').trim();
    const parts = raw ? raw.split('/').filter(Boolean) : [];
    const [root, a, b] = parts;

    // Home / Landing
    if (!root) {
      renderLanding();
      return;
    }

    // Reading deep link: #/read/:vol/:page
    if (root === 'read') {
      renderLanding();
      const vol = a ? parseInt(a, 10) : null;
      const page = b ? parseInt(b, 10) : 0; // 0 = cover
      if (vol) openReader(vol, page, { syncUrl: false });
      return;
    }

    // Concept art deep link: #/art/:index
    if (root === 'art') {
      renderLanding();
      const index = a ? parseInt(a, 10) : 0;
      openConceptArt(index, { syncUrl: false });
      return;
    }

    renderLanding();
  }

  // ============================================
  // LANDING PAGE
  // ============================================
  function renderLanding() {
    renderAlbumGrid();
    renderConceptGrid();
  }

  function renderAlbumGrid() {
    if (!siteData || !albumGrid) return;

    const volumes = siteData.volumes || [];

    if (volumes.length === 0) {
      albumGrid.innerHTML = '<p class="empty-state">No albums yet.</p>';
      return;
    }

    albumGrid.innerHTML = volumes.map(vol => {
      const volNum = String(vol.number).padStart(2, '0');
      const coverSrc = `assets/pages/vol-${volNum}/000-cover.webp`;
      return `
        <a class="album-card" href="#/read/${vol.number}/0">
          <img src="${coverSrc}" alt="Volume ${vol.number} cover" loading="lazy" />
          <div class="album-info">
            <span class="album-label">Volume ${toRoman(vol.number)}</span>
            <span class="album-title">${vol.title}</span>
            <span class="album-pages">${vol.pages} pages</span>
          </div>
        </a>
      `;
    }).join('');
  }

  function renderConceptGrid() {
    if (!siteData || !conceptGrid) return;

    const artworks = siteData.conceptArt || [];

    if (artworks.length === 0) {
      conceptGrid.innerHTML = '<p class="empty-state">Coming soon.</p>';
      return;
    }

    conceptGrid.innerHTML = artworks.map((art, i) => `
      <a class="concept-thumb" href="#/art/${i}">
        <img src="${art.src}" alt="${art.title || 'Concept art'}" loading="lazy" />
      </a>
    `).join('');
  }

  // ============================================
  // COMIC READER
  // ============================================
  let currentVolume = null;
  let currentPage = 0; // 0 = cover
  let totalPages = 0;

  function openReader(volumeNum, page = 0, opts = { syncUrl: true }) {
    if (!siteData) return;

    const volume = siteData.volumes.find(v => v.number === volumeNum);
    if (!volume) return;

    currentVolume = volume;
    totalPages = volume.pages;
    currentPage = Math.min(Math.max(0, page), totalPages);

    if (currentPage === 0) {
      showCoverMode();
    } else {
      showReadingMode();
    }

    if (!readerDialog.open) {
      readerDialog.showModal();
    }

    if (opts.syncUrl) {
      setHashSilently(`#/read/${currentVolume.number}/${currentPage}`);
    }
  }

  function showCoverMode() {
    if (!currentVolume) return;

    const volNum = String(currentVolume.number).padStart(2, '0');
    const coverSrc = `assets/pages/vol-${volNum}/000-cover.webp`;

    coverBg.style.backgroundImage = `url(${coverSrc})`;
    coverLabel.textContent = `VOLUME ${toRoman(currentVolume.number)}`;
    coverTitle.textContent = currentVolume.title.toUpperCase();
    coverSubtitle.textContent = currentVolume.subtitle || '';

    readerCover.classList.add('is-active');
    readerContent.classList.remove('is-active');
  }

  function showReadingMode() {
    if (!currentVolume) return;

    readerCover.classList.remove('is-active');
    readerContent.classList.add('is-active');

    updateReaderPage(true);
  }

  function updateReaderPage(syncUrl = true) {
    if (!currentVolume || currentPage < 1) return;

    resetZoom();

    const volNum = String(currentVolume.number).padStart(2, '0');
    const pageNum = String(currentPage).padStart(3, '0');
    const src = `assets/pages/vol-${volNum}/${pageNum}.webp`;

    readerImg.classList.remove('is-loaded');
    readerImg.onload = () => readerImg.classList.add('is-loaded');
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

    // Preload next page
    if (currentPage < totalPages) {
      const nextPageNum = String(currentPage + 1).padStart(3, '0');
      const nextSrc = `assets/pages/vol-${volNum}/${nextPageNum}.webp`;
      const preload = new Image();
      preload.src = nextSrc;
    }
  }

  function goToPrevPage() {
    if (currentPage > 1) {
      currentPage--;
      updateReaderPage();
    } else if (currentPage === 1) {
      // Go back to cover
      currentPage = 0;
      showCoverMode();
      setHashSilently(`#/read/${currentVolume.number}/0`);
    }
  }

  function goToNextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      if (currentPage === 1 && readerCover.classList.contains('is-active')) {
        showReadingMode();
      } else {
        updateReaderPage();
      }
    }
  }

  function startReading() {
    currentPage = 1;
    showReadingMode();
    setHashSilently(`#/read/${currentVolume.number}/1`);
  }

  function closeReader() {
    readerDialog.close();
    readerCover.classList.remove('is-active');
    readerContent.classList.remove('is-active');
    resetZoom();
    currentVolume = null;
    currentPage = 0;
    totalPages = 0;
    setHashSilently('#/');
  }

  // Zoom
  let isZoomed = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let scrollStartX = 0;
  let scrollStartY = 0;

  function toggleZoom() {
    isZoomed = !isZoomed;
    readerViewport.classList.toggle('is-zoomed', isZoomed);
    readerZoom.classList.toggle('is-zoomed', isZoomed);
    readerZoom.textContent = isZoomed ? '⊖' : '⊕';

    if (isZoomed) {
      // Double rAF to ensure layout is complete before centering
      requestAnimationFrame(() => requestAnimationFrame(() => {
        readerViewport.scrollLeft = (readerViewport.scrollWidth - readerViewport.clientWidth) / 2;
        readerViewport.scrollTop = (readerViewport.scrollHeight - readerViewport.clientHeight) / 2;
      }));
    }
  }

  function resetZoom() {
    isZoomed = false;
    readerViewport?.classList.remove('is-zoomed');
    readerZoom?.classList.remove('is-zoomed');
    if (readerZoom) readerZoom.textContent = '⊕';
  }

  // Drag to pan when zoomed
  readerViewport?.addEventListener('mousedown', (e) => {
    if (!isZoomed) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    scrollStartX = readerViewport.scrollLeft;
    scrollStartY = readerViewport.scrollTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    readerViewport.scrollLeft = scrollStartX - (e.clientX - dragStartX);
    readerViewport.scrollTop = scrollStartY - (e.clientY - dragStartY);
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Reader event listeners
  coverStart?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    startReading();
  });

  coverBack?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeReader();
  });

  // Click on cover background to start reading
  readerCover?.addEventListener('click', (e) => {
    if (e.target === readerCover || e.target.classList.contains('cover-bg') || e.target.classList.contains('cover-overlay')) {
      startReading();
    }
  });

  readerClose?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeReader();
  });

  readerZoom?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleZoom();
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

  // Click on image to advance (disabled when zoomed)
  readerImg?.addEventListener('click', (e) => {
    if (isZoomed) return;
    const rect = readerImg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 3) {
      goToPrevPage();
    } else {
      goToNextPage();
    }
  });

  // Close on backdrop click (reading mode only)
  readerDialog?.addEventListener('click', (e) => {
    if (e.target === readerDialog && readerContent.classList.contains('is-active')) {
      closeReader();
    }
  });

  // ============================================
  // CONCEPT ART MODAL
  // ============================================
  let conceptArtworks = [];
  let currentArtIndex = 0;

  function openConceptArt(index = 0, opts = { syncUrl: true }) {
    if (!siteData) return;

    conceptArtworks = siteData.conceptArt || [];
    if (conceptArtworks.length === 0) return;

    currentArtIndex = Math.min(Math.max(0, index), conceptArtworks.length - 1);

    updateConceptArt();

    if (!conceptDialog.open) {
      conceptDialog.showModal();
    }

    if (opts.syncUrl) {
      setHashSilently(`#/art/${currentArtIndex}`);
    }
  }

  // Concept art zoom
  let isConceptZoomed = false;
  let isConceptDragging = false;
  let conceptDragStartX = 0;
  let conceptDragStartY = 0;
  let conceptScrollStartX = 0;
  let conceptScrollStartY = 0;

  function toggleConceptZoom() {
    isConceptZoomed = !isConceptZoomed;
    conceptViewport.classList.toggle('is-zoomed', isConceptZoomed);
    conceptZoom.classList.toggle('is-zoomed', isConceptZoomed);
    conceptZoom.textContent = isConceptZoomed ? '⊖' : '⊕';

    if (isConceptZoomed) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        conceptViewport.scrollLeft = (conceptViewport.scrollWidth - conceptViewport.clientWidth) / 2;
        conceptViewport.scrollTop = (conceptViewport.scrollHeight - conceptViewport.clientHeight) / 2;
      }));
    }
  }

  function resetConceptZoom() {
    isConceptZoomed = false;
    conceptViewport?.classList.remove('is-zoomed');
    conceptZoom?.classList.remove('is-zoomed');
    if (conceptZoom) conceptZoom.textContent = '⊕';
  }

  // Drag to pan concept art when zoomed
  conceptViewport?.addEventListener('mousedown', (e) => {
    if (!isConceptZoomed) return;
    isConceptDragging = true;
    conceptDragStartX = e.clientX;
    conceptDragStartY = e.clientY;
    conceptScrollStartX = conceptViewport.scrollLeft;
    conceptScrollStartY = conceptViewport.scrollTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isConceptDragging) return;
    conceptViewport.scrollLeft = conceptScrollStartX - (e.clientX - conceptDragStartX);
    conceptViewport.scrollTop = conceptScrollStartY - (e.clientY - conceptDragStartY);
  });

  document.addEventListener('mouseup', () => {
    isConceptDragging = false;
  });

  function updateConceptArt() {
    const art = conceptArtworks[currentArtIndex];
    if (!art) return;

    resetConceptZoom();

    conceptImg.classList.remove('is-loaded');
    conceptImg.onload = () => conceptImg.classList.add('is-loaded');
    conceptImg.src = art.src;
    conceptImg.alt = art.title || 'Concept art';

    conceptCounter.textContent = `${currentArtIndex + 1} / ${conceptArtworks.length}`;
    conceptTitle.textContent = art.title || '';
    conceptNote.textContent = art.note || '';

    // Update nav states
    conceptPrev.disabled = currentArtIndex <= 0;
    conceptNext.disabled = currentArtIndex >= conceptArtworks.length - 1;

    setHashSilently(`#/art/${currentArtIndex}`);

    // Preload next
    if (currentArtIndex < conceptArtworks.length - 1) {
      const preload = new Image();
      preload.src = conceptArtworks[currentArtIndex + 1].src;
    }
  }

  function prevConceptArt() {
    if (currentArtIndex > 0) {
      currentArtIndex--;
      updateConceptArt();
    }
  }

  function nextConceptArt() {
    if (currentArtIndex < conceptArtworks.length - 1) {
      currentArtIndex++;
      updateConceptArt();
    }
  }

  function closeConceptArt() {
    conceptDialog.close();
    resetConceptZoom();
    conceptArtworks = [];
    currentArtIndex = 0;
    setHashSilently('#/');
  }

  // Concept art event listeners
  conceptClose?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeConceptArt();
  });

  conceptPrev?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    prevConceptArt();
  });

  conceptNext?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    nextConceptArt();
  });

  conceptZoom?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleConceptZoom();
  });

  // Click on image to advance (disabled when zoomed)
  conceptImg?.addEventListener('click', (e) => {
    if (isConceptZoomed) return;
    const rect = conceptImg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 3) {
      prevConceptArt();
    } else {
      nextConceptArt();
    }
  });

  // Close on backdrop click
  conceptDialog?.addEventListener('click', (e) => {
    if (e.target === conceptDialog) {
      closeConceptArt();
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
      } else if (readerContent.classList.contains('is-active')) {
        if (e.key === ' ') {
          e.preventDefault();
          toggleZoom();
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          goToPrevPage();
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          goToNextPage();
        }
      } else if (readerCover.classList.contains('is-active')) {
        // On cover, any nav key starts reading
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          startReading();
        }
      }
      return;
    }

    // Concept art navigation
    if (conceptDialog?.open) {
      if (e.key === 'Escape') {
        closeConceptArt();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleConceptZoom();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        prevConceptArt();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        nextConceptArt();
      }
    }
  });

  // ============================================
  // UTILITIES
  // ============================================
  function toRoman(num) {
    const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return roman[num] || num.toString();
  }

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
