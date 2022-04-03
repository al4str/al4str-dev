import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { encode } from 'html-entities';
import { transformAsync } from '@babel/core';
import { minify as jsMinify } from 'terser';
import { minify as cssMinify } from 'csso';
import { minify as htmlMinify } from 'html-minifier-terser';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = join(ROOT_DIR, 'public');
const SOURCE_DIR = join(ROOT_DIR, 'src');
const INDEX_HTML_PATH = join(SOURCE_DIR, 'index.html');
const INDEX_CSS_PATH = join(SOURCE_DIR, 'index.css');
const INDEX_JS_PATH = join(SOURCE_DIR, 'index.js');

/**
 * @param {'en'} lang
 * @return {Promise<void>}
 * */
async function writeHTML(lang) {
  const rawHTML = await readFile(INDEX_HTML_PATH, { encoding: 'utf8' });
  const rawCSS = await readFile(INDEX_CSS_PATH, { encoding: 'utf8' });
  const minifiedCss = cssMinify(rawCSS).css;
  const langPath = join(SOURCE_DIR, `${lang}.json`);
  const translationString = await readFile(langPath, { encoding: 'utf8' });
  /** @type {Record<string, string>} */
  const translation = JSON.parse(translationString);
  /** @type {string} */
  const replacedHTML = Object
    .entries(translation)
    .concat([['lang', lang]])
    .reduce((html, [key, value]) => {
      const keyRegExp = new RegExp(`{{${key}}}`, 'g');
      const escapedValue = encode(value);

      return html.replace(keyRegExp, escapedValue);
    }, rawHTML)
    .replace(/\*\*([-.,\w\d\s]+)\*\*/gi, '<b class="bold accent">$1</b>')
    .replace(/\*([-.,\w\d\s]+)\*/gi, '<i>$1</i>')
    .replace('{{css}}', `<style>@media screen{${minifiedCss}</style>`);
  const [, templatesLeft] = replacedHTML.match(/{{([-.\w\d]+)}}/g) || [];
  if (templatesLeft) {
    console.error('You forgot something, mate');
    console.debug(JSON.stringify(templatesLeft, null, 2));
  }
  const htmlPath = join(PUBLIC_DIR, `${lang}.html`);
  const minifiedHTML = await htmlMinify(replacedHTML, {
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true,
    conservativeCollapse: true,
  });
  await writeFile(htmlPath, minifiedHTML);
}

async function minifyJS() {
  const outputPath = join(PUBLIC_DIR, 'index.js');
  const raw = await readFile(INDEX_JS_PATH, { encoding: 'utf8' });
  const transpiled = await transformAsync(raw);
  const minified = await jsMinify(transpiled.code);
  await writeFile(outputPath, minified.code);
}

(async function() {
  await Promise.all([
    writeHTML('en'),
    [
      'favicon.ico',
      'favicon-16x16.png',
      'favicon-32x32.png',
      'jetbrains-mono-bold.woff2',
      'jetbrains-mono-regular.woff2',
      'map-320w.jpg',
      'map-400w.jpg',
      'map-480w.jpg',
      'map-800w.jpg',
      'map-1200w.jpg',
      'map-1600w.jpg',
      'map-2000w.jpg',
      'noise.png',
      'person.jpg',
      'print.css',
    ].map((fileName) => {
      const pathFrom = join(SOURCE_DIR, fileName);
      const pathTo = join(PUBLIC_DIR, fileName);
      return copyFile(pathFrom, pathTo);
    }),
    minifyJS(),
  ]);
}());
