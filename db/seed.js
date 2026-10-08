const bcrypt = require('bcrypt');
const db = require('./database');

db.exec('DELETE FROM comments');
db.exec('DELETE FROM posts');
db.exec('DELETE FROM users');
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('comments', 'posts', 'users')");

const passwordHash = bcrypt.hashSync('qwerty123', 10);

const insertUser = db.prepare(
  'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
);

const adminResult = insertUser.run('admin', 'admin@blog.com', passwordHash, 'admin');
const adminId = adminResult.lastInsertRowid;

const userResult = insertUser.run('user', 'user@blog.com', passwordHash, 'user');
const userId = userResult.lastInsertRowid;

const insertPost = db.prepare(
  'INSERT INTO posts (title, description, category, imageUrl, user_id) VALUES (?, ?, ?, ?, ?)'
);

const posts = [
  {
    title: 'Введение в JavaScript',
    description: 'Основы языка, переменные, типы данных и первые шаги.',
    category: 'Программирование',
    imageUrl: 'https://placehold.co/600x400?text=JS',
  },
  {
    title: 'Как работает React',
    description: 'Компоненты, пропсы, состояние и виртуальный DOM.',
    category: 'Программирование',
    imageUrl: 'https://placehold.co/600x400?text=React',
  },
  {
    title: '10 советов по SEO',
    description: 'Как улучшить видимость сайта в поисковых системах.',
    category: 'Маркетинг',
    imageUrl: 'https://placehold.co/600x400?text=SEO',
  },
  {
    title: 'Основы дизайна интерфейсов',
    description: 'Цвет, типографика, сетки и композиция.',
    category: 'Дизайн',
    imageUrl: 'https://placehold.co/600x400?text=Design',
  },
  {
    title: 'Введение в базы данных',
    description: 'SQL, таблицы, связи и нормализация.',
    category: 'Программирование',
    imageUrl: 'https://placehold.co/600x400?text=DB',
  },
];

const postIds = posts.map((p) => {
  const result = insertPost.run(p.title, p.description, p.category, p.imageUrl, adminId);
  return result.lastInsertRowid;
});

const insertComment = db.prepare(
  'INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)'
);

const comments = [
  { postIndex: 0, userId: userId, text: 'Отличная статья, всё понятно!' },
  { postIndex: 0, userId: adminId, text: 'Спасибо, буду писать продолжение.' },
  { postIndex: 1, userId: userId, text: 'React — это мощно, спасибо!' },
  { postIndex: 2, userId: userId, text: 'SEO советы реально работают.' },
  { postIndex: 3, userId: adminId, text: 'Дизайн — важная часть проекта.' },
];

comments.forEach((c) => {
  insertComment.run(postIds[c.postIndex], c.userId, c.text);
});

console.log('✅ База данных заполнена:');
console.log('   Пользователей: 2 (admin, user)');
console.log(`   Постов: ${posts.length}`);
console.log(`   Комментариев: ${comments.length}`);
console.log('');
console.log('🔑 Креды:');
console.log('   admin:qwerty123');
console.log('   user:qwerty123');