import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE,
  timeout: 60000,
});

export async function runCode(language, code, stdin = '') {
  const { data } = await api.post('/execute', { language, code, stdin });
  return data;
}

export async function askAI({ code, language, question = '', output = '', mode = 'explain' }) {
  const { data } = await api.post('/ai/assist', { code, language, question, output, mode });
  return data;
}

export async function fetchSnippets() {
  const { data } = await api.get('/snippets');
  return data;
}

export async function saveSnippet(title, language, code) {
  const { data } = await api.post('/snippets', { title, language, code });
  return data;
}

export async function deleteSnippet(id) {
  await api.delete(`/snippets/${id}`);
}

export async function loadSnippet(id) {
  const { data } = await api.get(`/snippets/${id}`);
  return data;
}
