/**
 * Shop Page — Entry point for pages/shop.html
 */

import { initTopBar } from '../components/topbar.js';
import { initSidebar } from '../components/sidebar.js';

initTopBar();
initSidebar();

// ===== Product filter buttons =====
const filterBtns = document.querySelectorAll('.shop-filter-btn');
const productCards = document.querySelectorAll('.product-card');

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;

    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    productCards.forEach((card) => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
});
