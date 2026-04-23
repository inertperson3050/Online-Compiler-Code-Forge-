const express = require('express');
const router = express.Router();
const { getAIAssistance } = require('../services/aiService');

/**
 * POST /api/ai/assist
 * Body: { code, language, question?, output?, mode }
 * mode: 'explain' | 'debug' | 'predict' | 'custom'
 */
router.post('/assist', async (req, res) => {
  const { code, language, question = '', output = '', mode = 'explain' } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'code and language are required.' });
  }

  if (code.length > 10000) {
    return res.status(400).json({ error: 'Code too long for AI analysis.' });
  }

  const VALID_MODES = ['explain', 'debug', 'predict', 'custom'];
  if (!VALID_MODES.includes(mode)) {
    return res.status(400).json({ error: `Invalid mode. Use: ${VALID_MODES.join(', ')}` });
  }

  try {
    const result = await getAIAssistance({ code, language, question, output, mode });
    res.json({ response: result });
  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({ error: 'AI service unavailable. Check your GEMINI_API_KEY.' });
  }
});

module.exports = router;
