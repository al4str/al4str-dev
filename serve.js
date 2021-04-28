const fs = require('fs');
const path = require('path');
const spdy = require('spdy');
const express = require('express');
const compression = require('compression');
const serveStatic = require('serve-static');
const consola = require('consola');

const console = consola.withTag('serve');

/**
 * @param {Object} params
 * @param {string} params.host
 * @param {number} params.port
 * @param {string} params.staticDir
 * @param {string} params.sslCert
 * @param {string} params.sslKey
 * @param {Array<Function>} [params.middlewares]
 * @return {function(): Promise<void>}
 * */
function createServer(params) {
  const {
    host,
    port,
    staticDir,
    sslCert,
    sslKey,
    middlewares,
  } = params;

  const app = express();

  app.use(compression());

  app.use(serveStatic(staticDir, {
    setHeaders(res) {
      res.setHeader('Cache-Control', 'public');
      res.setHeader('Expires', '1y');
    },
  }));

  if (middlewares) {
    middlewares.forEach((applyMiddleware) => {
      applyMiddleware(app);
    });
  }

  return async () => {
    const [
      certificate,
      privateKey,
    ] = await Promise.all([
      fs.promises.readFile(sslCert),
      fs.promises.readFile(sslKey),
    ]);
    const serverOptions = {
      key: privateKey,
      cert: certificate,
    };
    spdy
      .createServer(serverOptions, app)
      .listen(port, host, (err) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        else {
          console.info(`https://${host}:${port}`);
        }
      });
  };
}

(async function() {
  const rootDir = process.cwd();
  const staticDir = path.join(rootDir, 'public');
  const sslCert = path.join(rootDir, 'ssl', 'local.al4str.dev.pem');
  const sslKey = path.join(rootDir, 'ssl', 'local.al4str.dev-key.pem');

  const indexMiddleware = (app) => {
    app.get('/', (_, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(staticDir, 'en.html'));
    });
    app.get('/en', (_, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(staticDir, 'en.html'));
    });
    app.get('/ru', (_, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(staticDir, 'ru.html'));
    });
  };

  const server = createServer({
    host: 'local.al4str.dev',
    port: 5433,
    staticDir,
    sslCert,
    sslKey,
    middlewares: [
      indexMiddleware,
    ],
  });

  await server();
}());
