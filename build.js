const fs = require('fs/promises');
const path = require('path');
const consola = require('consola');
const entities = require('html-entities');
const babel = require('@babel/core');
const jsMinifier = require('terser');
const cssMinifier = require('csso');
const htmlMinifier = require('html-minifier-terser');
const info = require('./package.json');

const version = info.version;

const console = consola.withTag('build');

const rootDir = process.cwd();

const publicDir = path.join(rootDir, 'public');
const sourceDir = path.join(rootDir, 'src');
const indexHtml = path.join(sourceDir, 'index.html');
const indexCSS = path.join(sourceDir, 'index.css');
const indexJS = path.join(sourceDir, 'index.js');

/**
 * @param {'en'|'ru'} lang
 * @return {Promise<void>}
 * */
async function writeHTML(lang) {
  const rawHTML = await fs.readFile(indexHtml, { encoding: 'utf8' });
  const rawCSS = await fs.readFile(indexCSS, { encoding: 'utf8' });
  const minifiedCss = cssMinifier.minify(rawCSS).css;
  const langPath = path.join(sourceDir, `${lang}.json`);
  const translationString = await fs.readFile(langPath, { encoding: 'utf8' });
  /** @type {Record<string, string>} */
  const translation = JSON.parse(translationString);
  /** @type {string} */
  const replacedHTML = Object
    .entries(translation)
    .concat([['version', version]])
    .concat([['lang', lang]])
    .reduce((html, [key, value]) => {
      const keyRegExp = new RegExp(`{{${key}}}`, 'g');
      const escapedValue = entities.encode(value);

      return html.replace(keyRegExp, escapedValue);
    }, rawHTML)
    .replace(/\*\*([-.\w\d\sа-яё]+)\*\*/gi, '<b class="bold accent">$1</b>')
    .replace(/\*([-.\w\d\sа-яё]+)\*/gi, '<span>$1</span>')
    .replace('{{css}}', `<style>@media screen{${minifiedCss}</style>`);
  const [, templatesLeft] = replacedHTML.match(/{{([-.\w\d]+)}}/g) || [];
  if (templatesLeft) {
    console.error('You forgot something, mate');
    console.debug(JSON.stringify(templatesLeft, null, 2));
  }
  const htmlPath = path.join(publicDir, `${lang}.html`);
  const minifiedHTML = htmlMinifier.minify(replacedHTML, {
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true,
    conservativeCollapse: true,
  });
  await fs.writeFile(htmlPath, minifiedHTML);
}

async function minifyJS() {
  const outputPath = path.join(publicDir, 'index.js');
  const raw = await fs.readFile(indexJS, { encoding: 'utf8' });
  const transpiled = await babel.transformAsync(raw);
  const minified = await jsMinifier.minify(transpiled.code);
  await fs.writeFile(outputPath, minified.code);
}

(async function() {
  await Promise.all([
    writeHTML('en'),
    writeHTML('ru'),
    [
      'favicon.ico',
      'favicon-16x16.png',
      'favicon-32x32.png',
      'jetbrains-mono-bold.woff2',
      'jetbrains-mono-regular.woff2',
      'map.jpg',
      'noise.png',
      'person.jpg',
      'print.css',
    ].map((fileName) => {
      const pathFrom = path.join(sourceDir, fileName);
      const pathTo = path.join(publicDir, fileName);
      return fs.copyFile(pathFrom, pathTo);
    }),
    minifyJS(),
  ]);
}());
