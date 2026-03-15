/**
 * Top Bar — Hide on scroll down, show on scroll up
 */
export function initTopBar() {
  const topBar = document.getElementById('topBar');
  const topBarSpacer = document.querySelector('.top-bar-spacer');
  if (!topBar || !topBarSpacer) return;

  function setTopBarSpacer() {
    topBarSpacer.style.height = topBar.offsetHeight + 'px';
  }

  setTopBarSpacer();
  window.addEventListener('resize', setTopBarSpacer);

  let lastScrollY = window.scrollY;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > topBar.offsetHeight) {
          topBar.classList.add('hidden');
        } else {
          topBar.classList.remove('hidden');
        }
        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
  });
}
