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
  calm: "Generate one short supportive affirmation for someone feeling calm and wanting to maintain inner balance. Maximum 1-2 sentences. No markdown, no lists, no extra text.",
  tired: "Generate one short supportive affirmation for someone feeling tired and needing gentle support. Maximum 1-2 sentences. No markdown, no lists, no extra text.",
  energy: "Generate one short supportive affirmation for someone needing energy and confidence. Maximum 1-2 sentences. No markdown, no lists, no extra text."
};

// Fallback responses
const fallbackResponses = {
  calm: "Stay grounded. Your calm is enough for today.",
  tired: "Take this moment gently. Small steps still count.",
  energy: "You already have momentum. Start with one confident step.",
  default: "Take a breath. You are doing better than you think."
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
    if (!process.env.XAI_API_KEY) {
      console.warn('XAI_API_KEY not found, using fallback response');
      return res.json({ text: fallbackResponses[mood] });
    }

    // Call xAI API
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-beta',
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
      console.error('xAI API error:', response.status, response.statusText);
      return res.json({ text: fallbackResponses[mood] });
    }

    const data = await response.json();
    const affirmation = data.choices?.[0]?.message?.content?.trim();

    if (!affirmation) {
      console.error('No affirmation in xAI response');
      return res.json({ text: fallbackResponses[mood] });
    }

    res.json({ text: affirmation });

  } catch (error) {
    console.error('Error in /api/affirmation:', error);
    const mood = req.body.mood || 'default';
    res.json({ text: fallbackResponses[mood] });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
