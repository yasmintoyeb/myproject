const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/todoapp';

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

const Todo = mongoose.model(
  'Todo',
  new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true, maxlength: 200 },
      done: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

// Home page of backend.myproject.site
app.get('/', (req, res) => {
  const db = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState];
  res.send(`<h1>Todo backend is running</h1><p>Database: ${db}</p><p>API: <a href="/api/todos">/api/todos</a></p>`);
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/todos', async (req, res) => {
  res.json(await Todo.find().sort({ createdAt: -1 }));
});

app.post('/api/todos', async (req, res) => {
  const title = (req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Title is required' });
  res.status(201).json(await Todo.create({ title }));
});

app.patch('/api/todos/:id', async (req, res) => {
  const todo = await Todo.findByIdAndUpdate(req.params.id, { done: !!req.body.done }, { new: true });
  if (!todo) return res.status(404).json({ error: 'Not found' });
  res.json(todo);
});

app.delete('/api/todos/:id', async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
