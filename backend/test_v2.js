const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testV2Format() {
  try {
    const formData = new FormData();
    formData.append('audio', fs.createReadStream('test_audio.wav'));
    formData.append('format', 'v2');

    const response = await axios.post('http://localhost:3001/api/transcription/upload', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });

    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testV2Format();