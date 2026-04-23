const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const PROMPTS = {
  explain: (lang, code) => `You are an expert ${lang} programmer and educator.

Analyze this ${lang} code and provide a clear, structured explanation:

\`\`\`${lang}
${code}
\`\`\`

Provide:
1. **Overview**: What does this code do in 1-2 sentences?
2. **Step-by-step Breakdown**: Explain each major section
3. **Key Concepts**: Highlight important programming concepts used
4. **Potential Issues**: Any bugs, edge cases, or improvements?

Be concise but thorough. Use markdown formatting.`,

  predict: (lang, code) => `You are an expert ${lang} programmer.

Predict the exact output of this ${lang} code:

\`\`\`${lang}
${code}
\`\`\`

Provide:
1. **Predicted Output**: Show exactly what would print to stdout (use a code block)
2. **Execution Flow**: Brief trace of execution
3. **Edge Cases**: Will it throw errors? Any runtime issues?
4. **Confidence**: How certain are you? Any assumptions made?`,

  debug: (lang, code, output) => `You are an expert ${lang} debugger.

Debug this ${lang} code:

\`\`\`${lang}
${code}
\`\`\`

${output ? `Current output/error:\n\`\`\`\n${output}\n\`\`\`` : ''}

Provide:
1. **Issues Found**: List all bugs, errors, or problems
2. **Root Cause**: Explain WHY each issue occurs
3. **Fixed Code**: Provide the corrected code
4. **Prevention**: How to avoid similar issues in future`,

  custom: (lang, code, question) => `You are an expert ${lang} programmer and coding assistant.

Here is the ${lang} code:
\`\`\`${lang}
${code}
\`\`\`

User's question: ${question}

Answer clearly and helpfully. Use markdown formatting. Include code examples where relevant.`,
};

async function getAIAssistance({ code, language, question, output, mode }) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured. Add it to your .env file.');
  }

  let prompt;
  switch (mode) {
    case 'explain':
      prompt = PROMPTS.explain(language, code);
      break;
    case 'predict':
      prompt = PROMPTS.predict(language, code);
      break;
    case 'debug':
      prompt = PROMPTS.debug(language, code, output);
      break;
    case 'custom':
      if (!question) throw new Error('A question is required for custom mode.');
      prompt = PROMPTS.custom(language, code, question);
      break;
    default:
      throw new Error(`Unknown mode: ${mode}`);
  }

  try {
    const response = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const candidate = response.data?.candidates?.[0];
    if (!candidate) throw new Error('No response from Gemini API');

    if (candidate.finishReason === 'SAFETY') {
      throw new Error('Content was blocked by safety filters.');
    }

    return candidate.content?.parts?.[0]?.text || 'No response generated.';

  } catch (error) {
    // Surface the actual Gemini API error message if available
    const geminiError = error.response?.data?.error?.message;
    if (geminiError) throw new Error(`Gemini API error: ${geminiError}`);
    throw error;
  }
}

module.exports = { getAIAssistance };