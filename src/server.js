const app = require('./app');
const { runDiagnostic } = require('./diagnostic');

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

// Run diagnostic on startup
console.log('🔍 Running startup diagnostic...');

// Global error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  console.log('🔄 Server will continue running despite error');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  console.log('🔄 Server will continue running despite rejection');
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

try {
  runDiagnostic().then(() => {
    console.log('✅ Diagnostic completed, starting server...');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Dicttr API running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Network access: http://192.168.1.140:${PORT}/health`);
      console.log('✅ Server started successfully');
      
      // Handle server errors
      server.on('error', (error) => {
        console.error('💥 SERVER ERROR:', error);
        if (error.code === 'EADDRINUSE') {
          console.log(`❌ Port ${PORT} is already in use`);
        }
      });
    });
  }).catch(error => {
    console.error('❌ Diagnostic failed:', error);
    console.log('🚀 Starting server anyway...');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Dicttr API running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Network access: http://192.168.1.140:${PORT}/health`);
      console.log('✅ Server started successfully');
      
      // Handle server errors
      server.on('error', (error) => {
        console.error('💥 SERVER ERROR:', error);
        if (error.code === 'EADDRINUSE') {
          console.log(`❌ Port ${PORT} is already in use`);
        }
      });
    });
  });
} catch (error) {
  console.error('💥 FATAL ERROR during server startup:', error);
  process.exit(1);
}
