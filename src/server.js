const app = require('./app');

// Load .env file only if it exists
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('📁 Loading .env file from:', envPath);
  require('dotenv').config({ path: envPath });
} else {
  console.log('⚠️  No .env file found, using system environment variables');
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dicttr API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Network access: http://192.168.1.140:${PORT}/health`);
});
