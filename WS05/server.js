const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const pagesRouter = require('./routes/pages');
const postsRouter = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

async function connectToDatabase() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is missing. Set it in your .env file.');
    }
    await mongoose.connect(uri, { dbName: 'blog' });
    console.log('Connected to MongoDB.');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}
app.locals.publicDir = publicDir;
app.use(express.json());
app.use(express.static(publicDir));

// TODO: Complete the page routes in routes/pages.js.
app.use('/', pagesRouter);
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, '404.html'));
});
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  const isApiRequest = req.path === '/api' || req.path.startsWith('/api/');
  if (isApiRequest) {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    console.error(error.stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
  console.error(error.stack);
  return res.status(500).sendFile(path.join(publicDir, '500.html'));
});
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Mounted routers:');
    console.log('  / -> routes/pages.js');
    console.log('  /api/posts -> routes/posts.js');
  });
});