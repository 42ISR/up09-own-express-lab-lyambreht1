const express = require('express');
const db = require('../db/database');
const { auth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.post('/', auth, (req, res) => {
  const { id: postId } = req.params;
  const { text } = req.body;

  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
  if (!post) {
    return res.status(404).json({ message: 'Пост не найден' });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Текст комментария обязателен' });
  }

  const result = db
    .prepare('INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)')
    .run(postId, req.user.id, text.trim());

  const comment = db
    .prepare(
      `
      SELECT 
        comments.id,
        comments.post_id,
        comments.user_id,
        comments.text,
        comments.createdAt,
        users.username AS author
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.id = ?
    `
    )
    .get(result.lastInsertRowid);

  res.status(201).json({ message: 'Комментарий добавлен', comment });
});

router.get('/', (req, res) => {
  const { id: postId } = req.params;

  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
  if (!post) {
    return res.status(404).json({ message: 'Пост не найден' });
  }

  const comments = db
    .prepare(
      `
      SELECT 
        comments.id,
        comments.text,
        comments.createdAt,
        users.username AS author
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = ?
      ORDER BY comments.id DESC
    `
    )
    .all(postId);

  res.json({ count: comments.length, comments });
});

router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);

  if (!comment) {
    return res.status(404).json({ message: 'Комментарий не найден' });
  }

  const isOwner = comment.user_id === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Нет прав на удаление этого комментария' });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(id);

  res.json({ message: 'Комментарий удалён' });
});

module.exports = router;