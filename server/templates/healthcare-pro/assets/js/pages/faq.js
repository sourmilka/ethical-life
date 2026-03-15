/**
 * FAQ Page — Entry point for pages/faq.html
 */

import { initTopBar } from '../components/topbar.js';
import { initSidebar } from '../components/sidebar.js';

initTopBar();
initSidebar();

// ===== FAQ accordion =====
const faqQuestions = document.querySelectorAll('.faq-page-section .faq-question');

faqQuestions.forEach((btn) => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const answer = btn.nextElementSibling;

    // Close all others
    faqQuestions.forEach((other) => {
      other.setAttribute('aria-expanded', 'false');
      other.nextElementSibling.style.maxHeight = null;
    });

    // Toggle current
    if (!expanded) {
      btn.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});
