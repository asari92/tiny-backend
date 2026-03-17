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

// Mood to prompt mapping
const moodPrompts = {
  calm: "Generate only one short supportive affirmation for someone feeling calm. Maximum 1-2 sentences. Return ONLY the affirmation text, no explanations or extra words.",
  tired: "Generate only one short supportive affirmation for someone feeling tired. Maximum 1-2 sentences. Return ONLY the affirmation text, no explanations or extra words.",
  energy: "Generate only one short supportive affirmation for someone needing energy. Maximum 1-2 sentences. Return ONLY the affirmation text, no explanations or extra words."
};

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Affirmation endpoint
app.post('/api/affirmation', async (req, res) => {
  try {
    const { mood } = req.body;

    // Validate mood
    if (!mood || !['calm', 'tired', 'energy'].includes(mood)) {
      return res.status(400).json({
        error: 'Invalid mood. Must be one of: calm, tired, energy'
      });
    }

    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not found');
      return res.status(500).json({
        error: 'API key not configured'
      });
    }

    // Call xAI API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-32b',
        messages: [
          {
            role: 'user',
            content: moodPrompts[mood]
          }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, response.statusText, errorText);
      return res.status(500).json({
        error: 'AI request failed'
      });
    }

    const data = await response.json();
    let affirmation = data.choices?.[0]?.message?.content?.trim();

    if (!affirmation) {
      console.error('No affirmation in Groq response');
      return res.status(500).json({
        error: 'AI response invalid'
      });
    }

    // Remove common prefixes and clean up the response
    affirmation = affirmation
      .replace(/^(Here's your affirmation:|Affirmation:|Your affirmation:)/i, '')
      .replace(/^["']|["']$/g, '') // Remove quotes
      .trim();

    if (!affirmation) {
      console.error('Empty affirmation after cleanup');
      return res.status(500).json({
        error: 'AI response invalid'
      });
    }

    res.json({ text: affirmation });

  } catch (error) {
    console.error('Error in /api/affirmation:', error);
    res.status(500).json({
      error: 'Server error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
