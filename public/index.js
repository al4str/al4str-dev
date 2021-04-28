/*
* What are you trying to find here?
*
* There is nothing to see.
* It's bloody html page.
* That's it. Go back to your job.
* */
(function(global) {
  const root = global.document.documentElement;
  const map = global.document.querySelector('.map');
  const options = { passive: true, capture: false };
  const mapURL = getCSSProperty(root, '--map-image')
    .replace(/url\("(.+)"\)/, '$1');
  const mapPerspective = parseInt(getCSSProperty(root, '--map-perspective'));
  const mapAngle = parseInt(getCSSProperty(root, '--map-angle'));
  let mapHeight = 0;
  let pointerX = global.innerWidth / 2;
  let pointerY = global.innerHeight / 2;
  let viewportScroll = global.pageYOffset;
  let viewportWidth = global.innerWidth;
  let viewportHeight = global.innerHeight;
  let documentHeight = global.document.documentElement.offsetHeight;
  let mapProjectedHeight = global.innerHeight;

  function bindEncryptedLinkHandlers() {
    const links = Array.from(global.document.querySelectorAll('.link_encrypted'));
    links.forEach((link) => {
      link.onclick = handleLinkClick;
    });
  }
  function bindBackgroundMapHandlers() {
    global.addEventListener('scroll', handleScroll, options);
  }
  function getCSSProperty(el, name) {
    return getComputedStyle(el).getPropertyValue(name);
  }
  function setCSSProperty(el, name, value) {
    el.style.setProperty(name, value);
  }
  function getDecodedString(string) {
    const decoded = atob(string);
    return decoded.split('')
      .map((char) => char.charCodeAt(0))
      .map((code, index) => code ^ (decoded.length - index))
      .map((code) => String.fromCharCode(code))
      .join('');
  }
  function runDecryptAnimation(el, string) {
    const prevString = el.dataset.text;
    const tempDiv = global.document.createElement('div');
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
  function loadMapImage() {
    getLoadedImage(mapURL)
      .then(({ naturalWidth, naturalHeight }) => {
        if (!naturalWidth || !naturalHeight) {
          return;
        }
        setCSSProperty(root, '--map-left', `calc(50% - ${naturalWidth / 2}px)`);
        setCSSProperty(root, '--map-width', `${naturalWidth}px`);
        setCSSProperty(root, '--map-height', `${naturalHeight}px`);
        mapHeight = naturalHeight;
        map.classList.add('map_loaded');
        setMapProjectedHeight();
        setMapCoordinates();
      });
  }
  function getLoadedImage(url) {
    return new Promise((resolve) => {
      const img = global.document.createElement('img');
      img.onload = () => {
        resolve(img);
      };
      img.src = url;
      if (img.complete) {
        resolve(img);
      }
    });
  }
  function getProjectedCoordinate(coordinate, angle, perspective) {
    const x = Math.cos(angle) * coordinate;
    const z = Math.sin(angle) * coordinate;
    return (x * perspective) / (perspective + z);
  }
  function setMapProjectedHeight() {
    const height = mapHeight;
    const perspective = mapPerspective;
    const angle = mapAngle * Math.PI / 180;
    let top = getProjectedCoordinate(0 - height / 2, angle, perspective);
    let bottom = getProjectedCoordinate(height - height / 2, angle, perspective);
    mapProjectedHeight = (bottom + height / 2) - (top + height / 2);
  }
  function setMapCoordinates() {
    requestAnimationFrame(() => {
      const halfViewportWidth = viewportWidth / 2;
      const halfViewportHeight = viewportHeight / 2;
      const x = -3 * (pointerX - halfViewportWidth) / halfViewportWidth;
      const y = -3 * (pointerY - halfViewportHeight) / halfViewportHeight;
      const scrollY = -1 * ((viewportScroll * (mapProjectedHeight - viewportHeight)) / (documentHeight - viewportHeight));
      setCSSProperty(root, '--map-x', `${x}px`);
      setCSSProperty(root, '--map-y', `${scrollY - y}px`);
    });
  }

  function handleLoad() {
    handleResize();
    bindEncryptedLinkHandlers();
    bindBackgroundMapHandlers();
    loadMapImage();
  }
  function handleResize() {
    viewportScroll = global.pageYOffset;
    viewportWidth = global.innerWidth;
    viewportHeight = global.innerHeight;
    documentHeight = global.document.documentElement.scrollHeight;
    setMapCoordinates();
  }
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
    viewportScroll = global.pageYOffset;
    setMapCoordinates();
  }

  global.addEventListener('load', handleLoad);
  global.addEventListener('resize', handleResize, options);
}(window));
