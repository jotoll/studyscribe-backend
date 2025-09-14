const http = require('http');

// Datos para la solicitud
const postData = JSON.stringify({
  enhanced_text: "La fotosíntesis convierte luz solar en energía",
  subject: "ciencias"
});

// Opciones de la solicitud
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/transcription/flowchart',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

// Realizar la solicitud
const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers));

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('Parsed JSON:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Could not parse JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

// Escribir datos y finalizar la solicitud
req.write(postData);
req.end();
