# AI Mood Proxy Backend

Minimal backend proxy for AI affirmation generation using xAI/Grok API.

## What it does

- Provides a simple proxy endpoint for generating mood-based affirmations
- Keeps API keys secure on the backend
- Returns short, supportive text responses based on user mood
- Includes fallback responses when AI service is unavailable

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
# Edit .env and add your XAI_API_KEY
```

3. Start server:
```bash
npm start
```

Server will run on `http://localhost:3000`

## Environment Variables

- `XAI_API_KEY` (required): Your xAI API key
- `PORT` (optional): Server port, defaults to 3000
- `ALLOWED_ORIGIN` (optional): CORS allowed origin, defaults to *

## API Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{ "ok": true }
```

### POST /api/affirmation
Generate affirmation based on mood.

**Request body:**
```json
{ "mood": "calm" | "tired" | "energy" }
```

**Success response:**
```json
{ "text": "Stay grounded. Your calm is enough for today." }
```

**Example curl:**
```bash
curl -X POST http://localhost:3000/api/affirmation \
  -H "Content-Type: application/json" \
  -d '{"mood": "calm"}'
```

## Render Deployment

1. Create new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     - `XAI_API_KEY`: Your xAI API key
     - `ALLOWED_ORIGIN` (optional): Your mobile app's URL

4. Deploy and get your service URL

## Mood Mappings

### AI Prompts
- **calm**: User feels calm and wants to maintain inner balance
- **tired**: User feels tired and needs gentle support  
- **energy**: User needs energy and confidence

### Fallback Responses
- **calm**: "Stay grounded. Your calm is enough for today."
- **tired**: "Take this moment gently. Small steps still count."
- **energy**: "You already have momentum. Start with one confident step."
- **default**: "Take a breath. You are doing better than you think."
