import { Alert } from 'react-native';
import { transcriptionAPI } from '../services/api';

export interface PDFExportManagerProps {
  setLoading: (loading: boolean) => void;
}

export const usePDFExportManager = ({ setLoading }: PDFExportManagerProps) => {
  const handleExportToPDF = async (enhancedText: any) => {
    if (!enhancedText) {
      Alert.alert('Error', 'No hay contenido para exportar');
      return;
    }

    console.log('📄 EnhancedText content for PDF export:', JSON.stringify(enhancedText, null, 2));

    try {
      setLoading(true);

      let pdfContent = '';
      let parsedData = enhancedText;

      if (typeof enhancedText === 'object' && enhancedText.raw_content) {
        try {
          const jsonMatch = enhancedText.raw_content.match(/```json\n([\s\S]*?)\n```/) || enhancedText.raw_content.match(/{[\s\S]*}/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            console.log('✅ JSON parsed successfully from raw_content');
          } else {
            parsedData = JSON.parse(enhancedText.raw_content);
          }
        } catch (error) {
          console.error('Error parsing JSON from raw_content:', error);
          parsedData = enhancedText;
        }
      }

      if (typeof parsedData === 'object') {
        if (parsedData.title) {
          pdfContent += `TÍTULO: ${parsedData.title}\n\n`;
        }

        if (parsedData.summary) {
          pdfContent += `RESUMEN: ${parsedData.summary}\n\n`;
        }

        if (parsedData.sections) {
          parsedData.sections.forEach((section: any, index: number) => {
            pdfContent += `\n--- SECCIÓN ${index + 1} ---\n`;

            switch (section.type) {
              case 'heading':
                pdfContent += `TÍTULO (Nivel ${section.level || 2}): ${section.content || ''}\n\n`;
                break;
              case 'paragraph':
                pdfContent += `${section.content || ''}\n\n`;
                break;
              case 'list':
                if (section.items) {
                  section.items.forEach((item: string) => {
                    pdfContent += `• ${item}\n`;
                  });
                  pdfContent += '\n';
                }
                break;
              case 'concept_block':
                pdfContent += `CONCEPTO: ${section.term || ''}\n`;
                if (section.definition) {
                  pdfContent += `DEFINICIÓN: ${section.definition}\n`;
                }
                if (section.examples && section.examples.length > 0) {
                  pdfContent += 'EJEMPLOS:\n';
                  section.examples.forEach((example: string) => {
                    pdfContent += `- ${example}\n`;
                  });
                }
                pdfContent += '\n';
                break;
              case 'summary_block':
                pdfContent += `📋 RESUMEN:\n${section.content || ''}\n\n`;
                break;
              case 'key_concepts_block':
                if (section.concepts && section.concepts.length > 0) {
                  pdfContent += '🔑 CONCEPTOS CLAVE:\n';
                  section.concepts.forEach((concept: string) => {
                    pdfContent += `• ${concept}\n`;
                  });
                  pdfContent += '\n';
                }
                break;
              default:
                pdfContent += `${section.content || JSON.stringify(section, null, 2)}\n\n`;
            }
          });
        }

        if (parsedData.key_concepts) {
          pdfContent += '🔑 CONCEPTOS CLAVE:\n';
          parsedData.key_concepts.forEach((concept: string) => {
            pdfContent += `• ${concept}\n`;
          });
          pdfContent += '\n';
        }
      } else {
        pdfContent = parsedData;
      }

      console.log('📄 PDF content to send:', pdfContent);

      const response = await transcriptionAPI.exportToPDF(pdfContent);

      if (response.success && response.data?.download_url) {
        Alert.alert('✅ Éxito', 'PDF generado correctamente');

        const downloadUrl = response.data.download_url;
        console.log('📥 Download URL:', downloadUrl);

        try {
          const { Linking } = require('react-native');
          const canOpen = await Linking.canOpenURL(downloadUrl);

          if (canOpen) {
            await Linking.openURL(downloadUrl);
            Alert.alert('✅ Descarga Iniciada', 'La descarga del PDF ha comenzado. El archivo se guardará en tu dispositivo.');
          } else {
            Alert.alert('⚠️ Atención',
              'PDF generado correctamente. Puedes descargarlo desde:\n\n' +
              downloadUrl +
              '\n\nCopia esta URL y ábrela en tu navegador.'
            );
          }
        } catch (downloadError) {
          console.error('Error downloading PDF:', downloadError);
          Alert.alert('⚠️ PDF Generado',
            'PDF creado exitosamente. URL de descarga: ' + downloadUrl +
            '\n\nPuedes copiar esta URL y abrirla en tu navegador para descargar el archivo.'
          );
        }
      } else if (response.success && response.data?.pdf_url) {
        Alert.alert('✅ Éxito', 'PDF generado correctamente');
        const pdfUrl = response.data.pdf_url;
        console.log('📄 PDF URL (fallback):', pdfUrl);

        try {
          const { Linking } = require('react-native');
          const canOpen = await Linking.canOpenURL(pdfUrl);

          if (canOpen) {
            await Linking.openURL(pdfUrl);
            Alert.alert('✅ PDF Listo', 'El PDF se ha abierto en tu navegador. Puedes descargarlo desde allí.');
          } else {
            Alert.alert('⚠️ Atención',
              'PDF generado correctamente. Puedes acceder a él en:\n\n' +
              pdfUrl +
              '\n\nDesde un navegador web.'
            );
          }
        } catch (openError) {
          console.error('Error opening PDF:', openError);
          Alert.alert('⚠️ PDF Generado',
            'PDF creado exitosamente. URL: ' + pdfUrl +
            '\n\nPuedes copiar esta URL y abrirla en tu navegador para descargar el archivo.'
          );
        }
      } else {
        Alert.alert('Error', 'No se pudo generar el PDF o no se recibió la URL de descarga');
      }

    } catch (error) {
      console.error('Error exporting to PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return { handleExportToPDF };
};