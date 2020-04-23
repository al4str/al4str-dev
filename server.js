const path = require('path');
const express = require('express');

const root = process.cwd();
const app = express();

app.use('/public', express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(path.join(root, 'index.html'));
});

app.listen(3030, () => console.info('Server is running on `http://localhost:3030`'));
