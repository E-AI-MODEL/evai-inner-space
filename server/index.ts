import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.post('/api/google-gemini', async (req, res) => {
  const apiKey = req.headers['x-api-key'] as string;
  const payload = req.body;

  const googleRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  const data = await googleRes.json();
  res.status(googleRes.status).json(data);
});

app.listen(3001, () => console.log('Proxy listening on :3001'));
