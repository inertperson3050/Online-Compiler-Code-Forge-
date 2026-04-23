const express = require('express');
const router = express.Router();
const Snippet = require('../models/Snippet');

// GET /api/snippets - list recent snippets
router.get('/', async (req, res) => {
  try {
    const snippets = await Snippet.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('title language createdAt _id');
    res.json(snippets);
  } catch (err) {
    res.status(500).json({ error: 'Database unavailable.' });
  }
});

// GET /api/snippets/:id - get single snippet
router.get('/:id', async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ error: 'Snippet not found.' });
    res.json(snippet);
  } catch (err) {
    res.status(500).json({ error: 'Database unavailable.' });
  }
});

// POST /api/snippets - save snippet
router.post('/', async (req, res) => {
  const { title, language, code } = req.body;
  if (!language || !code) {
    return res.status(400).json({ error: 'language and code are required.' });
  }
  try {
    const snippet = new Snippet({
      title: title || `Untitled ${language} snippet`,
      language,
      code,
    });
    await snippet.save();
    res.status(201).json({ id: snippet._id, message: 'Snippet saved.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not save snippet.' });
  }
});

// DELETE /api/snippets/:id
router.delete('/:id', async (req, res) => {
  try {
    await Snippet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete snippet.' });
  }
});

module.exports = router;
