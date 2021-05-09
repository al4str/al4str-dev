(function() {
  const PREFERS_QUERY = '(prefers-reduced-motion: reduce)';
  const REDUCED_MOTION = window.matchMedia(PREFERS_QUERY).matches;
  /** @type {HTMLImageElement} */
  const PARALLAX_IMAGE = window.document.getElementById('parallax-image');
  const PARALLAX_PARAMS = {
    scrollTop: window.scrollY,
    scrollHeight: window.document.body.scrollHeight,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    imageWidth: 0,
    imageHeight: 0,
  };

  /**
   * @param {string} string
   * @return {string}
   * */
  function getDecodedString(string) {
    return window.atob(string)
      .split('')
      .map((char, index, array) => {
        /** @type {number} */
        const charCode = char.charCodeAt(0) ^ (array.length - index);

        return String.fromCharCode(charCode);
      })
      .join('');
  }

  /**
   * @param {HTMLElement} el
   * @param {string} string
   * @return {void}
   * */
  function runDecryptAnimation(el, string) {
    const label = el.querySelector('.link__label');
    if (REDUCED_MOTION) {
      label.innerHTML = string;
      return;
    }
    const prevString = el.dataset.text;
    const tempEl = window.document.createElement('div');
    tempEl.innerHTML = string;
    const nextString = tempEl.textContent;
    prevString
      .split('')
      .reduce((result, char, index) => {
        if (char === '∗') {
          return result.concat(index);
        }
        return result;
      }, [])
      .forEach((asteriskIndex, delayBy) => {
        const nextChar = nextString[asteriskIndex];
        setTimeout(() => {
          label.textContent = label.textContent
            .trim()
            .split('')
            .map((char, index) => {
              return index === asteriskIndex
                ? nextChar
                : char;
            })
            .join('');
        }, delayBy * 50);
      });
  }

  function updateParallaxParams() {
    PARALLAX_PARAMS.scrollHeight = window.document.body.scrollHeight;
    PARALLAX_PARAMS.viewportWidth = window.innerWidth;
    PARALLAX_PARAMS.viewportHeight = window.innerHeight;
  }

  function updateParallaxPosition() {
    const {
      scrollTop,
      scrollHeight,
      viewportWidth,
      viewportHeight,
      imageWidth,
      imageHeight,
    } = PARALLAX_PARAMS;
    const x = viewportWidth / 2 - imageWidth / 2;
    const y = -1 * (imageHeight - viewportHeight) * (scrollTop / scrollHeight);
    PARALLAX_IMAGE.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function handleResize() {
    updateParallaxParams();
    updateParallaxPosition();
  }

  function handleScroll() {
    PARALLAX_PARAMS.scrollTop = window.scrollY;
    window.requestAnimationFrame(updateParallaxPosition);
  }

  function handleParallaxImageLoad() {
    const { naturalWidth, naturalHeight } = PARALLAX_IMAGE;
    PARALLAX_PARAMS.imageWidth = naturalWidth;
    PARALLAX_PARAMS.imageHeight = naturalHeight;
    PARALLAX_IMAGE.width = naturalWidth;
    PARALLAX_IMAGE.height = naturalHeight;
    updateParallaxPosition();
    PARALLAX_IMAGE.parentElement.classList.add('parallax__wrapper_loaded');
  }

  /** @param {MouseEvent} e */
  function handleLinkClick(e) {
    if (!e.isTrusted) {
      return;
    }
    e.preventDefault();
    const link = e.target;
    const url = getDecodedString(link.dataset.href);
    const label = getDecodedString(link.dataset.label);
    link.href = url;
    link.onclick = null;
    link.classList.remove('link_encrypted');
    runDecryptAnimation(link, label);
  }

  window.document
    .querySelectorAll('.link_encrypted')
    .forEach((link) => link.onclick = handleLinkClick);
  window.addEventListener('resize', handleResize, {
    passive: true,
    capture: true,
  });
  if (!REDUCED_MOTION) {
    window.addEventListener('scroll', handleScroll, {
      passive: true,
      capture: true,
    });
    PARALLAX_IMAGE.onload = handleParallaxImageLoad;
    if (PARALLAX_IMAGE.complete) {
      handleParallaxImageLoad();
    }
    updateParallaxPosition();
  }
}());
