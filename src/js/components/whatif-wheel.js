/**
 * What If Wheel — Rotating animated wheel section
 */
export function initWhatifWheel() {
  const whatifWheel = document.getElementById('whatifWheel');
  const whatifDots = document.querySelectorAll('.whatif-dot');
  const whatifTitle = document.getElementById('whatifInnerTitle');
  const whatifSub = document.getElementById('whatifInnerSub');
  if (!whatifWheel || !whatifDots.length || !whatifTitle || !whatifSub)
    return null;

  const whatifSlides = [
    {
      title: 'Fresh life',
      sub: 'Get actionable insights in minutes — no needles, <br> no labs, no delays.',
    },
    {
      title: 'Smart care',
      sub: 'AI-powered diagnostics tailored to your <br> unique health profile.',
    },
    {
      title: 'Clear results',
      sub: 'Visual reports you actually understand — <br> no medical jargon required.',
    },
    {
      title: 'Full control',
      sub: 'Track every marker, set goals, and own <br> your health journey completely.',
    },
    {
      title: 'Always ready',
      sub: 'Round-the-clock monitoring so you never <br> miss a critical change.',
    },
  ];

  const DOT_COUNT = 5;
  const ANGLE_STEP = 360 / DOT_COUNT;
  let whatifRotation = 0;
  let whatifIndex = 0;

  function positionDots() {
    const radius = whatifWheel.offsetWidth / 2;
    whatifDots.forEach((dot, i) => {
      const angle = (-90 + i * ANGLE_STEP) * (Math.PI / 180);
      const x = radius + radius * Math.cos(angle);
      const y = radius + radius * Math.sin(angle);
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
      const stick = dot.querySelector('.whatif-stick');
      if (stick) {
        stick.style.transform = `rotate(${i * ANGLE_STEP}deg)`;
      }
    });
  }

  function updateDotCounterRotation() {
    whatifDots.forEach((dot) => {
      const span = dot.querySelector('span');
      if (span) {
        span.style.transform = `rotate(${-whatifRotation}deg)`;
      }
    });
  }

  function updateActiveDot() {
    whatifDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === whatifIndex);
    });
  }

  function rotateWhatif() {
    const nextIndex = (whatifIndex + 1) % DOT_COUNT;

    whatifTitle.style.opacity = '0';
    whatifSub.style.opacity = '0';

    whatifDots[nextIndex].classList.add('active');

    whatifRotation -= ANGLE_STEP;
    whatifWheel.style.transform = `rotate(${whatifRotation}deg)`;
    updateDotCounterRotation();

    setTimeout(() => {
      whatifDots[whatifIndex].classList.remove('active');
      whatifIndex = nextIndex;

      const slide = whatifSlides[whatifIndex];
      whatifTitle.textContent = slide.title;
      whatifSub.innerHTML = slide.sub;

      whatifTitle.style.opacity = '1';
      whatifSub.style.opacity = '1';
    }, 800);
  }

  positionDots();
  updateDotCounterRotation();
  updateActiveDot();
  window.addEventListener('resize', positionDots);

  const interval = setInterval(rotateWhatif, 5000);
  return interval;
}
