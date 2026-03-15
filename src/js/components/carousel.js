/**
 * Carousel — Auto-rotating card carousel
 */
export function initCarousel() {
  const carouselTrack = document.querySelector('.carousel-track');
  if (!carouselTrack) return null;

  const cards = Array.from(carouselTrack.querySelectorAll('.carousel-card'));
  if (!cards.length) return null;

  function isMobile() {
    return window.innerWidth <= 480;
  }

  function getActiveIndex() {
    return Math.floor(cards.length / 2);
  }

  function centerCarousel(animate) {
    const centerIdx = getActiveIndex();
    cards.forEach((c) => c.classList.remove('active'));
    cards[centerIdx].classList.add('active');

    if (isMobile()) {
      carouselTrack.style.transform = 'none';
      return;
    }

    const cardWidth = cards[0].offsetWidth;
    const gap = 20;
    const trackWidth = carouselTrack.parentElement.offsetWidth;
    const offset =
      trackWidth / 2 - cardWidth / 2 - centerIdx * (cardWidth + gap);

    carouselTrack.style.transition = animate ? 'transform 0.5s ease' : 'none';
    carouselTrack.style.transform = `translateX(${offset}px)`;
  }

  function rotateNext() {
    if (isMobile()) {
      const first = cards.shift();
      carouselTrack.appendChild(first);
      cards.push(first);
      centerCarousel(false);
      return;
    }

    const cardWidth = cards[0].offsetWidth;
    const gap = 20;
    const trackWidth = carouselTrack.parentElement.offsetWidth;
    const centerIdx = getActiveIndex();
    const nextIdx = centerIdx + 1;

    const offset =
      trackWidth / 2 - cardWidth / 2 - nextIdx * (cardWidth + gap);
    carouselTrack.style.transition = 'transform 0.5s ease';

    cards.forEach((c) => c.classList.remove('active'));
    if (cards[nextIdx]) cards[nextIdx].classList.add('active');

    carouselTrack.style.transform = `translateX(${offset}px)`;

    function onTransitionEnd() {
      carouselTrack.removeEventListener('transitionend', onTransitionEnd);
      const first = cards.shift();
      carouselTrack.appendChild(first);
      cards.push(first);
      centerCarousel(false);
    }
    carouselTrack.addEventListener('transitionend', onTransitionEnd);
  }

  centerCarousel(false);
  window.addEventListener('resize', () => centerCarousel(false));

  const interval = setInterval(rotateNext, 5000);
  return interval;
}
