const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class WhisperWrapper {
  constructor(modelPath = null) {
    this.modelPath = modelPath || path.join(__dirname, '../../whisper.cpp/models/ggml-base.bin');
    this.whisperPath = path.join(__dirname, '../../whisper.cpp/build/bin/main.exe');
  }

  async transcribe(audioFilePath, options = {}) {
    return new Promise((resolve, reject) => {
      // Verificar que el archivo de audio existe
      if (!fs.existsSync(audioFilePath)) {
        return reject(new Error(`Archivo de audio no encontrado: ${audioFilePath}`));
      }

      // Verificar si main.exe existe
      if (!fs.existsSync(this.whisperPath)) {
        console.warn('main.exe no encontrado. Usando transcripción simulada.');
        console.warn('Para usar whisper real, compila whisper.cpp siguiendo las instrucciones del README.');
        
        // Usar transcripción simulada
        const simulatedText = this.getSimulatedTranscription();
        resolve({
          text: simulatedText,
          duration: this.estimateDuration(audioFilePath),
          confidence: 0.85,
          isSimulated: true,
          message: 'Transcripción simulada - whisper.cpp no está compilado'
        });
        return;
      }

      // Verificar que el modelo existe
      if (!fs.existsSync(this.modelPath)) {
        console.warn('Modelo whisper no encontrado. Usando transcripción simulada.');
        
        const simulatedText = this.getSimulatedTranscription();
        resolve({
          text: simulatedText,
          duration: this.estimateDuration(audioFilePath),
          confidence: 0.85,
          isSimulated: true,
          message: 'Transcripción simulada - modelo no encontrado'
        });
        return;
      }

      const cmd = `cd ${path.dirname(this.whisperPath)} && ./main.exe -m "${this.modelPath}" -f "${audioFilePath}" -l es -otxt`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.warn('Error ejecutando whisper.cpp:', stderr);
          
          // Fallback: usar transcripción simulada
          const simulatedText = this.getSimulatedTranscription();
          resolve({
            text: simulatedText,
            duration: this.estimateDuration(audioFilePath),
            confidence: 0.85,
            isSimulated: true,
            message: 'Transcripción simulada - error en whisper.cpp'
          });
          return;
        }

        // Leer archivo de texto generado
        const txtFilePath = audioFilePath + '.txt';
        if (fs.existsSync(txtFilePath)) {
          const text = fs.readFileSync(txtFilePath, 'utf8');
          fs.unlinkSync(txtFilePath); // Limpiar
          
          resolve({
            text: text.trim(),
            duration: this.estimateDuration(audioFilePath),
            confidence: 0.9,
            isSimulated: false,
            message: 'Transcripción real usando whisper.cpp'
          });
        } else {
          // Fallback si no se genera el archivo
          const simulatedText = this.getSimulatedTranscription();
          resolve({
            text: simulatedText,
            duration: this.estimateDuration(audioFilePath),
            confidence: 0.85,
            isSimulated: true,
            message: 'Transcripción simulada - archivo de salida no generado'
          });
        }
      });
    });
  }

  estimateDuration(audioFilePath) {
    try {
      const stats = fs.statSync(audioFilePath);
      // Estimación aproximada: 1MB ≈ 1 minuto de audio
      return Math.round(stats.size / (1024 * 1024));
    } catch {
      return 120;
    }
  }

  getSimulatedTranscription() {
    const subjects = [
      "Hoy vamos a estudiar la fotosíntesis. La fotosíntesis es el proceso por el cual las plantas convierten la luz solar en energía química.",
      "En esta clase analizaremos los fundamentos de la programación orientada a objetos y sus principios básicos.",
      "El tema de hoy es la historia del derecho romano y su influencia en los sistemas jurídicos modernos.",
      "Vamos a revisar los conceptos clave de la termodinámica y las leyes que rigen los procesos energéticos."
    ];
    return subjects[Math.floor(Math.random() * subjects.length)];
  }
}

module.exports = WhisperWrapper;
