require('dotenv').config();
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testV2Endpoint() {
  try {
    console.log('🔊 Probando endpoint v2 con audio real...\n');

    const formData = new FormData();
    formData.append('audio', fs.createReadStream('test_audio.wav'));
    formData.append('curso', 'Algoritmos y Estructuras de Datos');
    formData.append('asignatura', 'Informática');
    formData.append('idioma', 'es');

    console.log('📤 Enviando audio al servidor...');
    
    const response = await axios.post('http://localhost:3001/api/v2/process-audio', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000
    });

    console.log('✅ Respuesta del procesamiento:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verificar si es exitoso y obtener el documento completo
    if (response.data.success && response.data.data.doc_id) {
      console.log('\n🔍 Obteniendo documento completo...');
      
      const docResponse = await axios.get(`http://localhost:3001/api/v2/document/${response.data.data.doc_id}`);
      
      console.log('📄 Documento completo (DocBlocksV2):');
      console.log(JSON.stringify(docResponse.data, null, 2));
      
      // Validar formato DocBlocksV2
      const doc = docResponse.data.data;
      
      console.log('\n🔍 Validando formato DocBlocksV2...');
      const validations = [
        { check: 'success es true', value: docResponse.data.success },
        { check: 'doc_id existe', value: !!doc.doc_id },
        { check: 'meta existe', value: !!doc.meta },
        { check: 'meta tiene curso', value: !!doc.meta.curso },
        { check: 'meta tiene asignatura', value: !!doc.meta.asignatura },
        { check: 'meta tiene idioma', value: !!doc.meta.idioma },
        { check: 'blocks es array', value: Array.isArray(doc.blocks) },
        { check: 'tiene bloques', value: doc.blocks.length > 0 },
        { check: 'version es 2', value: doc.version === 2 }
      ];

      validations.forEach(v => {
        console.log(`${v.value ? '✅' : '❌'} ${v.check}`);
      });

      const allValid = validations.every(v => v.value);
      console.log(`\n${allValid ? '🎉' : '💥'} Formato DocBlocksV2: ${allValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
      
      if (allValid) {
        console.log('\n📊 Estadísticas del documento:');
        console.log(`- Total de bloques: ${doc.blocks.length}`);
        console.log(`- Bloques con timing: ${doc.blocks.filter(b => b.time).length}`);
        console.log(`- Tipos de bloques: ${[...new Set(doc.blocks.map(b => b.type))].join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Sugerencia: Asegúrate de que el servidor esté ejecutándose con "npm start"');
    }
  }
}

if (require.main === module) {
  testV2Endpoint();
}

module.exports = { testV2Endpoint };
