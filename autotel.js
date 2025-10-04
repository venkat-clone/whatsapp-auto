const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');

const BOT_TOKEN = '8018461515:AAEE7x4iCSvrpBrrsoSoAlw35qHb4-RcjUY';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const app = express();
app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  const message = req.body.message;
  if (!message) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text;

//   if (text === '/start') {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: 'Welcome! Thanks for starting the bot.',
    });
    // Save chatId to your DB here for future messages
//   }

  res.sendStatus(200);
});

app.listen(3000, () => console.log('Bot server is running'));
