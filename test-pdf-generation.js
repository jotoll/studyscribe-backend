const htmlPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');

async function testPdfGeneration() {
  console.log('🧪 Probando generación de PDF...');
  
  try {
    // Contenido HTML simple para probar
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test PDF</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <h1>Test de Generación de PDF</h1>
        <p>Este es un test para verificar que la generación de PDF funciona correctamente en el servidor.</p>
        <p>Fecha: ${new Date().toLocaleString()}</p>
      </body>
      </html>
    `;

    // Opciones para el PDF
    const options = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    };

    console.log('🔄 Generando PDF...');
    
    // Generar PDF
    const pdfBuffer = await htmlPdf.generatePdf({ content: htmlContent }, options);
    
    console.log('✅ PDF generado exitosamente');
    
    // Guardar archivo para verificación
    const filename = `test_pdf_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, 'exports', filename);
    
    // Asegurar que existe el directorio exports
    const exportsDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // Guardar archivo
    fs.writeFileSync(filePath, pdfBuffer);
    
    console.log(`📄 PDF guardado en: ${filePath}`);
    console.log(`📊 Tamaño del PDF: ${pdfBuffer.length} bytes`);
    
    return {
      success: true,
      filePath,
      size: pdfBuffer.length,
      message: 'PDF generado correctamente'
    };
    
  } catch (error) {
    console.error('❌ Error generando PDF:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// Ejecutar test si se llama directamente
if (require.main === module) {
  testPdfGeneration()
    .then(result => {
      if (result.success) {
        console.log('🎉 Test completado exitosamente!');
        process.exit(0);
      } else {
        console.error('💥 Test falló');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = { testPdfGeneration };
