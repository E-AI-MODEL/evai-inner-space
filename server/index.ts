import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.post('/api/openai-secondary', async (req, res) => {
  const apiKey = req.headers['x-api-key'] as string;
  const payload = req.body;

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const data = await openaiRes.json();
  res.status(openaiRes.status).json(data);
});

app.listen(3001, () => console.log('Proxy listening on :3001'));
