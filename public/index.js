/*
* What are you trying to find here?
*
* There is nothing to see.
* It's bloody html page.
* That's it. Go back to your job.
* */
(function() {
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** @type {HTMLDivElement} */
  const mapWrp = window.document.getElementById('mapWrp');
  /** @type {HTMLImageElement} */
  const map = window.document.getElementById('map');

  let mapHeight = 0;
  let viewportScroll = window.pageYOffset;
  let viewportHeight = window.innerHeight;
  let documentHeight = window.document.documentElement.offsetHeight;
  let mapProjectedHeight = window.innerHeight;

  function bindEncryptedLinkHandlers() {
    const links = Array.from(window.document.querySelectorAll('.link_encrypted'));
    links.forEach((link) => {
      link.onclick = handleLinkClick;
    });
  }
  function bindBackgroundMapHandlers() {
    window.addEventListener('scroll', handleScroll);
  }

  /**
   * @param {string} string
   * @return {string}
   * */
  function getDecodedString(string) {
    const decoded = atob(string);
    return decoded.split('')
      .map((char) => char.charCodeAt(0))
      .map((code, index) => {
        /** @type {number} */
        const charCode = code ^ (decoded.length - index);

        return charCode;
      })
      .map((code) => String.fromCharCode(code))
      .join('');
  }

  /**
   * @param {HTMLElement} el
   * @param {string} string
   * @return {void}
   * */
  function runDecryptAnimation(el, string) {
    if (REDUCED_MOTION) {
      const label = el.querySelector('.link__label');
      label.innerHTML = string;
      return;
    }
    const prevString = el.dataset.text;
    const tempDiv = window.document.createElement('div');
    tempDiv.innerHTML = string;
    const nextString = tempDiv.textContent;
    const asteriskIndexes = prevString
      .split('')
      .reduce((result, char, index) => char === '∗'
        ? result.concat(index)
        : result, []);
    asteriskIndexes.forEach((asteriskIndex, delayer) => {
      const nextChar = nextString[asteriskIndex];
      const label = el.querySelector('.link__label');
      setTimeout(() => {
        label.textContent = label.textContent
          .trim()
          .split('')
          .map((char, index) => index === asteriskIndex
            ? nextChar
            : char)
          .join('');
      }, delayer * 50);
    });
  }
  /**
   * @param {number} coordinate
   * @param {number} angle
   * @param {number} perspective
   * @return {number}
   * */
  function getProjectedCoordinate(coordinate, angle, perspective) {
    const x = Math.cos(angle) * coordinate;
    const z = Math.sin(angle) * coordinate;
    return (x * perspective) / (perspective + z);
  }
  function setMapProjectedHeight() {
    const height = mapHeight;
    const perspective = 2500;
    let top = getProjectedCoordinate(0 - height / 2, 0, perspective);
    let bottom = getProjectedCoordinate(height - height / 2, 0, perspective);
    mapProjectedHeight = (bottom + height / 2) - (top + height / 2);
  }
  function setMapCoordinates() {
    requestAnimationFrame(() => {
      const scrollY = -1 * ((viewportScroll * (mapProjectedHeight - viewportHeight)) / (documentHeight - viewportHeight));
      map.setAttribute('style', `transform: translate3d(-50%, ${scrollY.toFixed(1)}px, 0)`);
    });
  }

  function handleLoad() {
    bindEncryptedLinkHandlers();
    if (REDUCED_MOTION) {
      return;
    }
    bindBackgroundMapHandlers();
    map.onload = handleMapLoad;
    if (map.complete) {
      handleMapLoad();
    }
    handleResize();
  }
  function handleMapLoad() {
    const { naturalWidth, naturalHeight } = map;
    mapHeight = naturalHeight;
    map.width = naturalWidth;
    map.height = naturalHeight;
    setMapProjectedHeight();
    setMapCoordinates();
    mapWrp.ontransitionend = () => {
      mapWrp.classList.add('map_ready');
      mapWrp.ontransitionend = null;
    };
    mapWrp.classList.add('map_loaded');
  }
  function handleResize() {
    viewportScroll = window.pageYOffset;
    viewportHeight = window.innerHeight;
    documentHeight = window.document.documentElement.scrollHeight;
    setMapCoordinates();
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
  function handleScroll() {
    viewportScroll = Math.max(0, Math.min(window.pageYOffset, window.document.body.scrollHeight));
    setMapCoordinates();
  }

  window.addEventListener('load', handleLoad);
  window.addEventListener('resize', handleResize);
}());
