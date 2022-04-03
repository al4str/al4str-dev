import { join } from 'node:path';
import express from 'express';
import compression from 'compression';
import serveStatic from 'serve-static';

const ROOT_DIR = process.cwd();
const STATIC_DIR = join(ROOT_DIR, 'public');

(function() {
  execServer({
    host: '0.0.0.0',
    port: 5433,
    staticDir: STATIC_DIR,
    middlewares: [
      (app) => {
        app.get('/', (_, res) => {
          res.sendFile(join(STATIC_DIR, 'en.html'));
        });
      },
    ],
  });
}());

/**
 * @param {Object} params
 * @param {string} params.host
 * @param {number} params.port
 * @param {string} params.staticDir
 * @param {Array<Function>} [params.middlewares]
 * @return {void}
 * */
function execServer(params) {
  const {
    host,
    port,
    staticDir,
    middlewares,
  } = params;
  const app = express();
  app.enable('etag');
  app.set('etag', 'strong');
  app.use(compression());
  app.use(serveStatic(staticDir));
  if (middlewares) {
    middlewares.forEach((applyMiddleware) => {
      applyMiddleware(app);
    });
  }
  app.listen(port, host, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    else {
      console.info(`http://${host}:${port}`);
    }
  });
}
