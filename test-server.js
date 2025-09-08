const http = require('http');

// Probar el health check primero
console.log('Probando health check...');
http.get('http://localhost:3001/health', (res) => {
  console.log('Health check status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Health check response:', data));
});

// Probar el endpoint enhance (que sabemos que funciona)
console.log('\nProbando endpoint enhance...');
const enhanceData = JSON.stringify({ text: 'test', subject: 'general' });
const enhanceOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/transcription/enhance',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(enhanceData)
  }
};

const enhanceReq = http.request(enhanceOptions, (res) => {
  console.log('Enhance status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Enhance response:', data));
});

enhanceReq.on('error', (e) => {
  console.error('Enhance error:', e.message);
});
enhanceReq.write(enhanceData);
enhanceReq.end();

// Probar el endpoint flowchart
console.log('\nProbando endpoint flowchart...');
const flowchartData = JSON.stringify({ enhanced_text: 'test', subject: 'general' });
const flowchartOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/transcription/flowchart',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(flowchartData)
  }
};

const flowchartReq = http.request(flowchartOptions, (res) => {
  console.log('Flowchart status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Flowchart response:', data));
});

flowchartReq.on('error', (e) => {
  console.error('Flowchart error:', e.message);
});
flowchartReq.write(flowchartData);
flowchartReq.end();
