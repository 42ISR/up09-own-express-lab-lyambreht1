require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Blog API is running' });
});

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/posts/:id/comments', commentsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});