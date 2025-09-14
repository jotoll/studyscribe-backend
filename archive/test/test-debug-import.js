// Test para verificar que el módulo debug-routes se puede importar correctamente
try {
  const debugRoutes = require('./src/routes/debug-routes');
  console.log('✅ Módulo debug-routes importado correctamente');
  console.log('Tipo:', typeof debugRoutes);
  
  // Verificar que es un router de Express
  if (debugRoutes && typeof debugRoutes === 'function') {
    console.log('✅ Es una función (probablemente un router de Express)');
  } else {
    console.log('❌ No es una función - tipo incorrecto');
  }
  
} catch (error) {
  console.error('❌ Error importando debug-routes:', error.message);
  console.error('Stack:', error.stack);
}
