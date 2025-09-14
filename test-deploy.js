const express = require('express');
const app = express();
const port = 3002;

app.use(express.json());

// Ruta simple de prueba
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

// Ruta de prueba POST
app.post('/test/login', (req, res) => {
  res.json({ 
    received: req.body,
    message: 'POST endpoint working',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🔄 Test server running on port ${port}`);
  console.log(`📊 Test endpoint: http://localhost:${port}/test`);
});
