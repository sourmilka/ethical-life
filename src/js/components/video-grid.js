/**
 * Video Grid — Horizontal scrolling video section with play/pause
 */
export function initVideoGrid() {
  const videoTrack = document.getElementById('videoTrack');
  const videoBoxes = document.querySelectorAll('.video-box');
  const videoArrowLeft = document.getElementById('videoArrowLeft');
  const videoArrowRight = document.getElementById('videoArrowRight');
  if (!videoTrack || !videoArrowLeft || !videoArrowRight) return;

  let currentVideoIndex = 0;
  let currentlyPlaying = null;

  function getVideosPerView() {
    if (window.innerWidth <= 480) return 1;
    if (window.innerWidth <= 768) return 2;
    return 4;
  }

  function updateVideoTrack() {
    const perView = getVideosPerView();
    const totalVideos = videoBoxes.length;
    const maxIndex = totalVideos - perView;

    if (currentVideoIndex > maxIndex)
      currentVideoIndex = Math.max(0, maxIndex);

    const gap = 20;
    const containerWidth = videoTrack.parentElement.offsetWidth;
    const boxWidth = (containerWidth - gap * (perView - 1)) / perView;
    const offset = currentVideoIndex * (boxWidth + gap);

    videoTrack.style.transform = `translateX(-${offset}px)`;

    videoBoxes.forEach((box) => {
      box.style.width = `${boxWidth}px`;
    });
  }

  videoArrowRight.addEventListener('click', () => {
    const perView = getVideosPerView();
    const maxIndex = videoBoxes.length - perView;
    if (currentVideoIndex < maxIndex) {
      currentVideoIndex++;
      updateVideoTrack();
    }
  });

  videoArrowLeft.addEventListener('click', () => {
    if (currentVideoIndex > 0) {
      currentVideoIndex--;
      updateVideoTrack();
    }
  });

  updateVideoTrack();
  window.addEventListener('resize', updateVideoTrack);

  // Click video to play/pause — only one plays at a time
  document.querySelectorAll('.short-video').forEach((video) => {
    video.muted = true;

    video.addEventListener('click', () => {
      if (currentlyPlaying && currentlyPlaying !== video) {
        currentlyPlaying.pause();
      }

      if (video.paused) {
        video.play();
        currentlyPlaying = video;
      } else {
        video.pause();
        currentlyPlaying = null;
      }
    });
  });

  // Mute/unmute toggle
  document.querySelectorAll('.mute-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wrapper = btn.closest('.video-wrapper');
      const video = wrapper.querySelector('.short-video');

      video.muted = !video.muted;
      btn.textContent = video.muted ? '\u{1F507}' : '\u{1F50A}';
    });
  });

  // Pause videos when scrolled out of view
  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (!entry.isIntersecting && !video.paused) {
            video.pause();
            if (currentlyPlaying === video) currentlyPlaying = null;
          }
        });
      },
      { threshold: 0.25 },
    );

    document.querySelectorAll('.short-video').forEach((video) => {
      videoObserver.observe(video);
    });
  }
}
