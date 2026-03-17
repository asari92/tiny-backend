require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ ok: true });
});

// Affirmation endpoint
app.post('/api/affirmation', async (req, res) => {
  try {
    const { mood } = req.body;

    if (!mood || !['calm', 'tired', 'energy'].includes(mood)) {
      console.log('Invalid mood received:', mood);
      return res.status(400).json({ error: 'Invalid mood. Use calm, tired, or energy.' });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not configured');
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
    }

    const moodPrompts = {
      calm: "The user feels calm and wants to stay balanced.",
      tired: "The user feels tired and needs gentle support.",
      energy: "The user needs energy and confidence."
    };

    console.log('Received mood:', mood);
    console.log('Using prompt:', moodPrompts[mood]);
    console.log('Sending request to Groq...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-32b',
        messages: [
          {
            role: 'system',
            content: 'You generate one short supportive affirmation for a wellness mobile app. Return only plain text, maximum two short sentences, no markdown, no explanations.'
          },
          {
            role: 'user',
            content: moodPrompts[mood]
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 80,
        reasoning_effort: 'none',
        reasoning_format: 'hidden'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, response.statusText, errorText);
      return res.status(500).json({
        error: 'AI request failed',
        status: response.status,
        details: errorText
      });
    }

    const data = await response.json();

    const rawText = data?.choices?.[0]?.message?.content?.trim() || '';
    const cleanedText = rawText
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .trim();

    console.log('AI raw text:', rawText);
    console.log('AI cleaned text:', cleanedText);
    console.log('Sending affirmation response:', cleanedText);

    if (!cleanedText) {
      console.error('Empty AI response after cleaning');
      return res.status(500).json({ error: 'Empty AI response' });
    }

    return res.json({ text: cleanedText });

  } catch (error) {
    console.error('Affirmation endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
