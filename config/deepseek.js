const axios = require('axios');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1';

const DEEPSEEK_MODELS = {
  CHAT: 'deepseek-chat',
  CODER: 'deepseek-coder'
};

const deepseek = {
  async chat(messages, model = DEEPSEEK_MODELS.CHAT) {
    try {
      if (!DEEPSEEK_API_KEY) {
        throw new Error('DeepSeek API key not configured');
      }

      const response = await axios.post(
        `${DEEPSEEK_API_URL}/chat/completions`,
        {
          model,
          messages,
          temperature: 0.7,
          max_tokens: 4000
        },
        {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('DeepSeek API error:', error.response?.data || error.message);
      throw new Error('Error calling DeepSeek API');
    }
  }
};

module.exports = { deepseek, DEEPSEEK_MODELS };