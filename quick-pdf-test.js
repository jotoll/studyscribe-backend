#!/usr/bin/env node

// Test rápido para verificar la generación de PDFs
const htmlPdf = require('html-pdf-node');
const fs = require('fs');

console.log('🚀 Iniciando test rápido de PDF...');

// Configurar variables de entorno para Chromium (si es necesario)
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.PUPPETEER_EXECUTABLE_PATH = '/usr/bin/chromium-browser';

const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Rápido PDF</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #2c3e50; }
        .success { color: #27ae60; font-weight: bold; }
        .info { color: #3498db; }
    </style>
</head>
<body>
    <h1>✅ Test de Generación de PDF</h1>
    <p class="info">Este es un test rápido para verificar que la generación de PDF funciona en el entorno del servidor.</p>
    <p class="success">Si puedes ver este PDF, significa que Chromium está correctamente instalado y configurado.</p>
    <p>Timestamp: ${new Date().toISOString()}</p>
</body>
</html>
`;

const options = {
    format: 'A4',
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    printBackground: true
};

async function runTest() {
    try {
        console.log('🔄 Generando PDF de prueba...');
        
        const pdfBuffer = await htmlPdf.generatePdf({ content: testHtml }, options);
        
        console.log('✅ PDF generado exitosamente!');
        console.log(`📊 Tamaño del buffer: ${pdfBuffer.length} bytes`);
        
        // Guardar para inspección
        fs.writeFileSync('/tmp/test_output.pdf', pdfBuffer);
        console.log('💾 PDF guardado en /tmp/test_output.pdf');
        
        console.log('🎉 ¡Test completado con éxito! La generación de PDFs debería funcionar en el servidor.');
        
    } catch (error) {
        console.error('❌ Error generando PDF:');
        console.error(error.message);
        console.error('\n📋 Stack trace:');
        console.error(error.stack);
        
        // Información adicional para debugging
        console.log('\n🔍 Información del sistema:');
        console.log('Node.js version:', process.version);
        console.log('Platform:', process.platform);
        console.log('Arch:', process.arch);
        
        process.exit(1);
    }
}

runTest();
