// Test para verificar qué subject se está enviando desde la app móvil
console.log('🧪 Simulando petición de la app móvil...');

// Simular el body que podría estar enviando la app móvil
const possibleBodies = [
  { subject: 'Nueva grabación', format: 'v2' },
  { subject: null, format: 'v2' },
  { subject: undefined, format: 'v2' },
  { format: 'v2' } // Sin subject
];

possibleBodies.forEach((body, index) => {
  const { subject = null } = body;
  console.log(`📦 Caso ${index + 1}: subject = ${subject} (tipo: ${typeof subject})`);
  
  // Simular la lógica del servidor
  let finalSubject = subject;
  if (!finalSubject) {
    console.log('   → Subject no proporcionado, se generará automáticamente');
    // Aquí se llamaría a generateSubjectFromContent()
    // Si falla, debería usar "general"
    finalSubject = 'general';
  }
  
  console.log(`   → Subject final: ${finalSubject}`);
  console.log('   ---');
});

console.log('\n🔍 Análisis del problema:');
console.log('Si la app móvil envía subject: "Nueva grabación", nuestro fix no se ejecuta');
console.log('Porque el subject ya está definido y no es null/undefined');
console.log('\n💡 Solución:');
console.log('1. Verificar si la app móvil está enviando "Nueva grabación" como subject');
console.log('2. Si es así, cambiar el valor por defecto en la app móvil');
console.log('3. O modificar el servidor para ignorar "Nueva grabación" y usar "general"');
