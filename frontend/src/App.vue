<script setup>
import { ref, computed, onMounted } from 'vue';

// Set at build time (see compose.yaml). Falls back to local backend for development.
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const todos = ref([]);
const title = ref('');
const loading = ref(true);
const error = ref('');

const remaining = computed(() => todos.value.filter((t) => !t.done).length);

async function request(path, options = {}) {
  const res = await fetch(`${API}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.status === 204 ? null : res.json();
}

async function load() {
  try {
    todos.value = await request('/todos');
    error.value = '';
  } catch (e) {
    error.value = 'Cannot reach the API. Check that the backend is running.';
  } finally {
    loading.value = false;
  }
}

async function add() {
  const text = title.value.trim();
  if (!text) return;
  try {
    const todo = await request('/todos', { method: 'POST', body: JSON.stringify({ title: text }) });
    todos.value.unshift(todo);
    title.value = '';
  } catch (e) {
    error.value = 'Could not add the task.';
  }
}

async function toggle(todo) {
  try {
    const updated = await request(`/todos/${todo._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ done: !todo.done }),
    });
    todo.done = updated.done;
  } catch (e) {
    error.value = 'Could not update the task.';
  }
}

async function remove(todo) {
  try {
    await request(`/todos/${todo._id}`, { method: 'DELETE' });
    todos.value = todos.value.filter((t) => t._id !== todo._id);
  } catch (e) {
    error.value = 'Could not delete the task.';
  }
}

onMounted(load);
</script>

<template>
  <main class="page">
    <header>
      <h1>My tasks</h1>
      <p class="count" v-if="!loading">{{ remaining }} left to do</p>
    </header>

    <form class="add" @submit.prevent="add">
      <input v-model="title" placeholder="What needs doing?" maxlength="200" aria-label="New task" />
      <button type="submit">Add task</button>
    </form>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="muted">Loading tasks…</p>
    <p v-else-if="!todos.length" class="muted">No tasks yet. Add your first one above.</p>

    <ul v-if="todos.length">
      <li v-for="todo in todos" :key="todo._id" :class="{ done: todo.done }">
        <label>
          <input type="checkbox" :checked="todo.done" @change="toggle(todo)" />
          <span>{{ todo.title }}</span>
        </label>
        <button class="del" @click="remove(todo)" :aria-label="`Delete ${todo.title}`">Delete</button>
      </li>
    </ul>
  </main>
</template>
