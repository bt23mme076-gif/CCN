const express = require('express');
const { execFile } = require('child_process');
const db = require('./db');

const app = express();

// parameterised query — no SQL injection
app.get('/user', (req, res) => {
  const id = req.query.id;
  db.query('SELECT * FROM users WHERE id = ?', [id]);
  res.send('ok');
});

// execFile with args array + strict filename validation — no command injection
app.post('/convert', (req, res) => {
  const filename = req.body.filename;
  if (!/^[\w\-. ]+$/.test(filename)) return res.status(400).send('invalid filename');
  execFile('convert', [filename, 'out.png']);
  res.send('ok');
});

// safe — unchanged
app.get('/safe', (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM users WHERE id = ?', [id]);
  res.send('ok');
});

// safe — unchanged
app.get('/static', (req, res) => {
  const query = 'SELECT * FROM users WHERE id = 1';
  db.query(query);
  res.send('ok');
});

module.exports = app;
