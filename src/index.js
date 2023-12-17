(function() {
  const PREFERS_QUERY = '(prefers-reduced-motion: reduce)';
  const REDUCED_MOTION = window.matchMedia(PREFERS_QUERY).matches;
  /** @type {HTMLDivElement} */
  const PARALLAX_IMAGE = window.document.querySelector('.parallax__image');
  const PARALLAX_PARAMS = {
    scrollTop: window.scrollY,
    scrollHeight: window.document.body.scrollHeight,
    viewportHeight: window.innerHeight,
    imageHeight: 2500,
  };
  const RAF = getThrottledRAF();

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

  /**
   * @return function (cb: Function) => void
   * */
  function getThrottledRAF() {
    let queuedCallback = null;

    return (nextCallback) => {
      if (typeof queuedCallback !== 'function') {
        window.requestAnimationFrame(() => {
          const lastCallback = queuedCallback;
          queuedCallback = null;
          lastCallback();
        });
      }
      queuedCallback = nextCallback;
    };
  }

  function updateParallaxParams() {
    PARALLAX_PARAMS.scrollHeight = window.document.body.scrollHeight;
    PARALLAX_PARAMS.viewportHeight = window.innerHeight;
  }

  function updateParallaxPosition() {
    RAF(() => {
      const {
        scrollTop,
        scrollHeight,
        viewportHeight,
        imageHeight,
      } = PARALLAX_PARAMS;
      const y = -1 * (imageHeight - viewportHeight) * (scrollTop / scrollHeight);
      PARALLAX_IMAGE.style.transform = `translate3d(0, ${y}px, 0)`;
    });
  }

  function handleResize() {
    updateParallaxParams();
    updateParallaxPosition();
  }

  function handleScroll() {
    PARALLAX_PARAMS.scrollTop = window.scrollY;
    window.requestAnimationFrame(updateParallaxPosition);
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
  if (!REDUCED_MOTION) {
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    updateParallaxPosition();
  }
}());
