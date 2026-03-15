/**
 * Stories Slider — Horizontal scrolling testimonials
 */
export function initStories() {
  const storiesTrack = document.getElementById('storiesTrack');
  const storiesLeftBtn = document.getElementById('storiesArrowLeft');
  const storiesRightBtn = document.getElementById('storiesArrowRight');
  if (!storiesTrack || !storiesLeftBtn || !storiesRightBtn) return;

  let storiesPage = 0;

  function getStoriesPerView() {
    if (window.innerWidth <= 480) return 1;
    if (window.innerWidth <= 768) return 2;
    return 4;
  }

  function updateStoriesSlider() {
    const perView = getStoriesPerView();
    const cards = storiesTrack.querySelectorAll('.stories-card');
    const total = cards.length;
    if (!total) return;
    const gap = parseInt(getComputedStyle(storiesTrack).gap) || 20;
    const card = cards[0];
    const cardWidth = card.offsetWidth + gap;
    const maxIndex = Math.max(0, total - perView);
    if (storiesPage > maxIndex) storiesPage = maxIndex;
    const offset = storiesPage * cardWidth;
    storiesTrack.style.transform = `translateX(-${offset}px)`;
  }

  storiesRightBtn.addEventListener('click', () => {
    const cards = storiesTrack.querySelectorAll('.stories-card');
    const perView = getStoriesPerView();
    const maxIndex = Math.max(0, cards.length - perView);
    if (storiesPage < maxIndex) {
      storiesPage++;
    } else {
      storiesPage = 0;
    }
    updateStoriesSlider();
  });

  storiesLeftBtn.addEventListener('click', () => {
    const cards = storiesTrack.querySelectorAll('.stories-card');
    const perView = getStoriesPerView();
    const maxIndex = Math.max(0, cards.length - perView);
    if (storiesPage > 0) {
      storiesPage--;
    } else {
      storiesPage = maxIndex;
    }
    updateStoriesSlider();
  });

  window.addEventListener('resize', () => {
    const cards = storiesTrack.querySelectorAll('.stories-card');
    const perView = getStoriesPerView();
    const maxIndex = Math.max(0, cards.length - perView);
    if (storiesPage > maxIndex) storiesPage = maxIndex;
    updateStoriesSlider();
  });

  updateStoriesSlider();
}
