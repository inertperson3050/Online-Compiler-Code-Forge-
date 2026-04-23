const express = require('express');
const router = express.Router();
const { executeCode } = require('../services/executionService');

/**
 * POST /api/execute
 * Body: { language, code, stdin? }
 * Returns: { output, stderr, exitCode, executionTime }
 */
router.post('/', async (req, res) => {
  const { language, code, stdin = '' } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: 'language and code are required.' });
  }

  const SUPPORTED = ['c', 'cpp', 'python', 'java'];
  if (!SUPPORTED.includes(language.toLowerCase())) {
    return res.status(400).json({ error: `Unsupported language. Supported: ${SUPPORTED.join(', ')}` });
  }

  if (code.length > 10000) {
    return res.status(400).json({ error: 'Code too long (max 10,000 characters).' });
  }

  try {
    const result = await executeCode(language.toLowerCase(), code, stdin);
    res.json(result);
  } catch (err) {
    console.error('Execution error:', err.message);
    res.status(500).json({ error: 'Execution service unavailable. Please try again.' });
  }
});

module.exports = router;
