/**
 * Home Page — Entry point for index.html
 */

import { initTopBar } from '../components/topbar.js';
import { initSidebar } from '../components/sidebar.js';
import { initCarousel } from '../components/carousel.js';
import { initVideoGrid } from '../components/video-grid.js';
import { initWhatifWheel } from '../components/whatif-wheel.js';
import { initFaq } from '../components/faq.js';
import { initStories } from '../components/stories.js';

// Initialize all components
initTopBar();
initSidebar();
const carouselInterval = initCarousel();
initVideoGrid();
const whatifInterval = initWhatifWheel();
initFaq();
initStories();

// Pause intervals when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (carouselInterval) clearInterval(carouselInterval);
    if (whatifInterval) clearInterval(whatifInterval);
  }
  // Note: intervals are not restarted — the components handle their own state
});
