const fs = require('fs/promises');
const path = require('path');
const consola = require('consola');

const console = consola.withTag('build');

const rootDir = process.cwd();

const publicDir = path.join(rootDir, 'public');
const sourceDir = path.join(rootDir, 'src');
const indexHtml = path.join(sourceDir, 'index.html');

/**
 * @param {'en'|'ru'} lang
 * @return {Promise<void>}
 * */
async function writeHTML(lang) {
    const rawHTML = await fs.readFile(indexHtml, { encoding: 'utf8' });
    const langPath = path.join(sourceDir, `${lang}.json`);
    const translationString = await fs.readFile(langPath, { encoding: 'utf8' });
    /** @type {Record<string, string>} */
    const translation = JSON.parse(translationString);
    /** @type {string} */
    const replacedHTML = Object
      .entries(translation)
      .concat([['lang', lang]])
      .reduce((html, [key, value]) => {
        const keyRegExp = new RegExp(`{{${key}}}`, 'g');

        return html.replace(keyRegExp, value);
      }, rawHTML)
      .replace(/\*\*([-.\w\d\sа-яё]+)\*\*/gi, '<b class="bold accent">$1</b>')
      .replace(/\*([-.\w\d\sа-яё]+)\*/gi, '<i class="italic">$1</i>');
    const [, templatesLeft] = replacedHTML.match(/{{([-.\w\d]+)}}/g) || [];
    if (templatesLeft) {
      console.error('You forgot something, mate');
      console.debug(JSON.stringify(templatesLeft, null, 2));
    }
  const htmlPath = path.join(publicDir, `${lang}.html`);
  await fs.writeFile(htmlPath, replacedHTML);
  }

(async function() {
  await Promise.all([
    writeHTML('en'),
    writeHTML('ru'),
  ]);
}());
