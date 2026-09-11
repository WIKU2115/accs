const express = require('express');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/submit', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    if (!DISCORD_WEBHOOK_URL) {
      console.error('DISCORD_WEBHOOK_URL is not configured');
      return res.status(500).json({ success: false, error: 'Server is not configured correctly' });
    }

    const discordPayload = {
      embeds: [
        {
          title: 'New Form Submission',
          color: 5814783,
          fields: [
            { name: 'Name', value: name.trim(), inline: true },
            { name: 'Email', value: email.trim(), inline: true },
            { name: 'Message', value: message.trim() }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (!discordResponse.ok) {
      const text = await discordResponse.text();
      console.error('Discord webhook error:', discordResponse.status, text);
      return res.status(500).json({ success: false, error: 'Failed to send message to Discord' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling /api/submit:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
