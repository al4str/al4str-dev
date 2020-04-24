(function() {
  function handleLoad() {
    Array.from(window.document.querySelectorAll('a[data-href]')).forEach((link) => {
      link.onclick = handleLinkClick;
    });
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
    const tempDiv = window.document.createElement('div');
    tempDiv.innerHTML = string;
    const nextString = tempDiv.textContent;
    const asteriskIndexes = prevString
      .split('')
      .reduce((result, char, index) => char === '∗'
        ? result.concat(index)
        : result, []);
    asteriskIndexes.forEach((asteriskIndex, delayer) => {
      const char = nextString[asteriskIndex];
      const label = el.querySelector('.link__label');
      animateCharAtIndex(label, asteriskIndex, char, delayer);
    });
  }
  function animateCharAtIndex(el, replaceIndex, nextChar, delayer) {
    setTimeout(() => {
      el.textContent = el.textContent
        .trim()
        .split('')
        .map((char, index) => index === replaceIndex
          ? nextChar
          : char)
        .join('');
    }, delayer * 50);
  }
  window.onload = handleLoad;
  /**/
  function mousemove(e) {
    lightCone.position.x = 5 * ((e.clientX / window.innerWidth) * 2 - 1)
    backLight.position.x = lightCone.position.x
  }
  window.addEventListener('mousemove', mousemove)
}());
