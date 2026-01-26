(function() {
  'use strict';

  // ============================================
  // DATA
  // ============================================
  let chaptersData = null;

  async function loadChapters() {
    try {
      const response = await fetch('chapters.json');
      chaptersData = await response.json();
      return chaptersData;
    } catch (err) {
      console.error('Failed to load chapters.json:', err);
      return null;
    }
  }

  // ============================================
  // DOM ELEMENTS
  // ============================================
  const views = Array.from(document.querySelectorAll('[data-view]'));
  const topbar = document.querySelector('[data-topbar]');
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
  const chapterNav = document.getElementById('chapterNav');
  const reader = document.getElementById('reader');
  const gallery = document.getElementById('gallery');

  // Lightbox
  const dialog = document.querySelector('[data-lightbox-dialog]');
  const dialogImg = document.querySelector('[data-lightbox-img]');
  const dialogCap = document.querySelector('[data-lightbox-cap]');
  const closeBtn = document.querySelector('[data-lightbox-close]');

  // ============================================
  // VIEW ROUTING
  // ============================================
  let currentChapter = 1;

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
      renderChapterNav();
      renderReader(currentChapter);
    } else if (viewName === 'art') {
      renderGallery();
    }
  }

  function route() {
    const hash = (location.hash || '#/').replace('#/', '').trim();

    if (!hash) {
      setActive('home');
      return;
    }

    // Check for chapter-specific route: #/read/2
    const readMatch = hash.match(/^read(?:\/(\d+))?$/);
    if (readMatch) {
      currentChapter = readMatch[1] ? parseInt(readMatch[1], 10) : 1;
      setActive('read');
      return;
    }

    if (hash.startsWith('art')) {
      setActive('art');
    } else if (hash.startsWith('updates')) {
      setActive('updates');
    } else {
      setActive('home');
    }
  }

  // ============================================
  // CHAPTER NAVIGATION
  // ============================================
  function renderChapterNav() {
    if (!chaptersData || !chapterNav) return;

    chapterNav.innerHTML = chaptersData.chapters.map(ch => `
      <button class="chapter-btn ${ch.number === currentChapter ? 'is-active' : ''}"
              data-chapter="${ch.number}">
        Chapter ${ch.number}: ${ch.title}
      </button>
    `).join('');

    // Add click handlers
    chapterNav.querySelectorAll('.chapter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.chapter, 10);
        currentChapter = num;
        location.hash = `#/read/${num}`;
      });
    });
  }

  // ============================================
  // READER
  // ============================================
  function renderReader(chapterNum) {
    if (!chaptersData || !reader) return;

    const chapter = chaptersData.chapters.find(c => c.number === chapterNum);
    if (!chapter) {
      reader.innerHTML = '<p class="reader-empty">Chapter not found.</p>';
      return;
    }

    // Generate page images
    const pages = [];
    for (let i = 1; i <= chapter.pages; i++) {
      const pageNum = String(i).padStart(3, '0');
      const chapterNum = String(chapter.number).padStart(2, '0');
      pages.push(`
        <img src="assets/pages/chapter-${chapterNum}/${pageNum}.jpg"
             alt="${chapter.title} — Page ${i}"
             loading="lazy" />
      `);
    }

    reader.innerHTML = pages.join('');

    // Update chapter nav active state
    chapterNav.querySelectorAll('.chapter-btn').forEach(btn => {
      btn.classList.toggle('is-active', parseInt(btn.dataset.chapter, 10) === chapterNum);
    });
  }

  // ============================================
  // GALLERY
  // ============================================
  function renderGallery() {
    if (!chaptersData || !gallery) return;

    const artworks = chaptersData.artwork || [];

    if (artworks.length === 0) {
      gallery.innerHTML = '<p class="reader-empty">No artwork yet.</p>';
      return;
    }

    gallery.innerHTML = artworks.map((art, i) => `
      <a class="tile ${art.featured ? 'tile--wide' : ''}"
         href="${art.src}"
         data-lightbox>
        <img src="${art.src}" alt="${art.title}" loading="lazy" />
        <span class="cap">${art.title}</span>
      </a>
    `).join('');
  }

  // ============================================
  // LIGHTBOX
  // ============================================
  function openLightbox(href, capText) {
    if (!dialog) return;
    dialogImg.src = href;
    dialogImg.alt = capText || 'Artwork';
    dialogCap.textContent = capText || '';
    dialog.showModal();
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-lightbox]');
    if (!a) return;
    e.preventDefault();
    const cap = a.querySelector('.cap')?.textContent?.trim() || '';
    openLightbox(a.getAttribute('href'), cap);
  });

  closeBtn?.addEventListener('click', () => dialog.close());

  dialog?.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const inDialog = rect.top <= e.clientY && e.clientY <= rect.bottom &&
                     rect.left <= e.clientX && e.clientX <= rect.right;
    if (!inDialog) dialog.close();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dialog?.open) {
      dialog.close();
    }
  });

  // ============================================
  // KEYBOARD NAVIGATION FOR READER
  // ============================================
  document.addEventListener('keydown', (e) => {
    // Only in read view
    const readView = document.querySelector('[data-view="read"]');
    if (!readView?.classList.contains('is-active')) return;
    if (!chaptersData) return;

    const maxChapter = chaptersData.chapters.length;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      // Previous chapter
      if (currentChapter > 1) {
        currentChapter--;
        location.hash = `#/read/${currentChapter}`;
      }
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      // Next chapter
      if (currentChapter < maxChapter) {
        currentChapter++;
        location.hash = `#/read/${currentChapter}`;
      }
    }
  });

  // ============================================
  // INIT
  // ============================================
  async function init() {
    await loadChapters();
    window.addEventListener('hashchange', route);
    route();
  }

  init();
})();
