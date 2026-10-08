const express = require('express');
const db = require('../db/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { category, author } = req.query;

  let sql = `
    SELECT 
      posts.id,
      posts.title,
      posts.description,
      posts.category,
      posts.imageUrl,
      posts.user_id,
      users.username AS createdBy,
      posts.createdAt
    FROM posts
    JOIN users ON posts.user_id = users.id
  `;

  const conditions = [];
  const params = [];

  if (category) {
    conditions.push('posts.category = ?');
    params.push(category);
  }

  if (author) {
    conditions.push('users.username LIKE ?');
    params.push(`%${author}%`);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY posts.id DESC';

  const posts = db.prepare(sql).all(...params);

  res.json({ count: posts.length, posts });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  const post = db
    .prepare(
      `
      SELECT 
        posts.id,
        posts.title,
        posts.description,
        posts.category,
        posts.imageUrl,
        posts.user_id,
        users.username AS createdBy,
        posts.createdAt
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.id = ?
    `
    )
    .get(id);

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
    .all(id);

  res.json({ ...post, comments });
});

router.post('/', auth, (req, res) => {
  const { title, description, category, imageUrl } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Поля title и description обязательны' });
  }

  const result = db
    .prepare(
      'INSERT INTO posts (title, description, category, imageUrl, user_id) VALUES (?, ?, ?, ?, ?)'
    )
    .run(title, description, category || null, imageUrl || null, req.user.id);

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ message: 'Пост создан', post });
});

router.put('/:id', auth, (req, res) => {
  const { id } = req.params;

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

  if (!post) {
    return res.status(404).json({ message: 'Пост не найден' });
  }

  const isOwner = post.user_id === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Нет прав на редактирование этого поста' });
  }

  const { title, description, category, imageUrl } = req.body;

  db.prepare(
    'UPDATE posts SET title = ?, description = ?, category = ?, imageUrl = ? WHERE id = ?'
  ).run(
    title ?? post.title,
    description ?? post.description,
    category ?? post.category,
    imageUrl ?? post.imageUrl,
    id
  );

  const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

  res.json({ message: 'Пост обновлён', post: updated });
});

router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

  if (!post) {
    return res.status(404).json({ message: 'Пост не найден' });
  }

  const isOwner = post.user_id === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Нет прав на удаление этого поста' });
  }

  db.prepare('DELETE FROM posts WHERE id = ?').run(id);

  res.json({ message: 'Пост удалён' });
});

module.exports = router;