/**
 * Sidebar — Burger menu toggle + overlay
 */
export function initSidebar() {
  const burgerBtn = document.getElementById('burgerBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (!burgerBtn || !sidebar || !sidebarOverlay) return;

  function openSidebar() {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    burgerBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    burgerBtn.classList.remove('active');
    document.body.style.overflow = '';
  }

  burgerBtn.addEventListener('click', () => {
    if (sidebar.classList.contains('active')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  sidebarOverlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('active')) {
      closeSidebar();
    }
  });
}
