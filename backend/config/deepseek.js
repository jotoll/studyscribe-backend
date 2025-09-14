const { OpenAI } = require('openai');

const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
  dangerouslyAllowBrowser: true, // Evita validación estricta
});

const DEEPSEEK_MODELS = {
  CHAT: 'deepseek-chat',
  REASONER: 'deepseek-reasoner'
};

module.exports = {
  deepseek,
  DEEPSEEK_MODELS
};