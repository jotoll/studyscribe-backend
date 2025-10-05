#!/bin/bash

# Script para hacer commit de los cambios de configuración de idiomas

echo "🔄 Preparando commit para configuración de idiomas..."

# Añadir archivos modificados y nuevos
echo "📝 Añadiendo archivos al staging area..."
git add scripts/add-translation-language-column.sql
git add IMPLEMENT_LANGUAGE_CONFIG.md
git add README-language-config.md
git add test-language-config-backend.js
git add src/routes/transcription.js
git add src/services/transcriptionService.js
git add mobile/DicttrMobile/App.tsx
git add mobile/DicttrMobile/components/ConfigMenu.tsx
git add mobile/DicttrMobile/components/ConfigButton.tsx
git add mobile/DicttrMobile/hooks/useConfig.ts
git add mobile/DicttrMobile/services/api.ts
git add mobile/DicttrMobile/components/RecordingProcessor.tsx

# Crear commit
echo "💾 Creando commit..."
git commit -m "feat: implement configuration of transcription and translation languages

- Add language selection UI components in mobile app
- Add ConfigMenu and ConfigButton components with flag indicators
- Add useConfig hook for managing language preferences
- Update backend to accept language and translation_language parameters
- Update transcription service to use specified languages in Groq and DeepSeek
- Add translation_language column to transcriptions table in Supabase
- Add comprehensive documentation and test scripts"

echo "✅ Commit creado exitosamente!"

# Opcional: hacer push
read -p "¿Quieres hacer push al repositorio remoto? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Haciendo push al repositorio remoto..."
    git push
    echo "✅ Push completado!"
fi

echo "🎯 Configuración de idiomas guardada en Git!"