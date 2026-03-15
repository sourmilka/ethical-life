/**
 * Contact Page — Entry point for pages/contact.html
 */
import '../../styles/pages/contact.css';

import { initTopBar } from '../components/topbar.js';
import { initSidebar } from '../components/sidebar.js';

initTopBar();
initSidebar();

// ===== Contact form handling =====
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    // Basic client-side validation
    const isValid = Object.values(data).every((v) => v.trim() !== '');
    if (!isValid) return;

    // TODO: Replace with actual API submission
    contactForm.innerHTML =
      '<p style="text-align:center;padding:40px 0;font-size:18px;color:var(--color-black);">Thank you! We\u2019ll be in touch within 24 hours.</p>';
  });
}
