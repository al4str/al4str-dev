/*
 * What are you trying to find here?
 * Nothing to see here
 * Get back to your job
 * */
(function() {
  const prefersQuery = '(prefers-reduced-motion: reduce)';
  const REDUCED_MOTION = window.matchMedia(prefersQuery).matches;

  /** @type {HTMLImageElement} */
  const map = window.document.getElementById('map');
  let mapHeight = 0;

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

  function setMapCoordinates() {
    window.requestAnimationFrame(() => {
      const scrollPercentage = window.scrollY
        / (window.document.body.scrollHeight + window.innerHeight);
      const y = window.scrollY - scrollPercentage * mapHeight;
      map.setAttribute('style', `transform: translate3d(-50%, ${y}px, 0)`);
    });
  }

  function handleLoad() {
    window.document
      .querySelectorAll('.link_encrypted')
      .forEach((link) => link.onclick = handleLinkClick);
    if (REDUCED_MOTION) {
      return;
    }
    window.addEventListener('scroll', setMapCoordinates, {
      passive: true,
      capture: true,
    });
    map.onload = handleMapLoad;
    if (map.complete) {
      handleMapLoad();
    }
    setMapCoordinates();
  }
  function handleMapLoad() {
    const {
      naturalWidth,
      naturalHeight,
    } = map;
    mapHeight = naturalHeight;
    map.width = naturalWidth;
    map.height = naturalHeight;
    setMapCoordinates();
    map.ontransitionend = () => {
      map.classList.add('map_ready');
      map.ontransitionend = null;
    };
    map.classList.add('map_loaded');
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

  window.addEventListener('load', handleLoad);
  window.addEventListener('resize', setMapCoordinates);
}());
