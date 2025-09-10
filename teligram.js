const axios = require('axios');
// https://api.telegram.org/bot8018461515:AAEE7x4iCSvrpBrrsoSoAlw35qHb4-RcjUY/getUpdates
const BOT_TOKEN = '8018461515:AAEE7x4iCSvrpBrrsoSoAlw35qHb4-RcjUY';
const CHAT_ID = '1088428959';
const MESSAGE = 'Hello from my bot!';

axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text: MESSAGE
})
    .then(response => {
        console.log('✅ Message sent:', response.data);
    })
    .catch(error => {
        console.error('❌ Error sending message:', error.response?.data || error.message);
    });
