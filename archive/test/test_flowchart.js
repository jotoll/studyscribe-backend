const axios = require('axios');

async function testFlowchart() {
  try {
    const response = await axios.post('http://localhost:3001/api/transcription/flowchart', {
      enhanced_text: "La fotosíntesis es el proceso por el cual las plantas convierten la luz solar en energía química. Este proceso ocurre en los cloroplastos y tiene dos fases principales: la fase luminosa y la fase oscura.",
      subject: "ciencias"
    });

    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testFlowchart();
