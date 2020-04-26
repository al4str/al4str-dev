const express = require('express');

const app = express();

app.use(express.static('public', {
  /*etag: false,
  setHeaders: (res) => {
    res.setHeader('Last-Modified', new Date().toISOString());
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  },*/
  index: ['index.html'],
}));

app.listen(3030, () => console.info('Server is running on `http://localhost:3030`'));
