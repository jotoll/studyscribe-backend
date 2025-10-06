#!/bin/bash

# Script para limpiar archivos con secretos del historial de git

echo "Limpiando archivos con secretos del historial de git..."

# Lista de archivos problemáticos que contienen secretos
PROBLEMATIC_FILES=(
  "check-oauth-propagation.js"
  "test-new-oauth-credentials.js" 
  "wait-for-oauth-propagation.js"
  "CONFIGURE_SUPABASE_OAUTH.md"
  "OAUTH_ANDROID_WEB_GUIDE.md"
  "OAUTH_FINAL_SUMMARY.md"
  "SUPABASE_OAUTH_STEP_BY_STEP.md"
  "direct-supabase-oauth-test.js"
  "test-oauth-after-config.js"
  "test-oauth-final.js"
  "check-supabase-credentials.js"
  "mobile/DicttrMobile/.env"
)

# Crear comando para eliminar archivos del historial
FILTER_CMD="git filter-branch --force --index-filter \\"
for file in "${PROBLEMATIC_FILES[@]}"; do
  FILTER_CMD+=" 'git rm --cached --ignore-unmatch \"$file\"' \\"
done
FILTER_CMD+=" --prune-empty --tag-name-filter cat -- --all"

echo "Ejecutando: $FILTER_CMD"
eval $FILTER_CMD

# Limpiar el repositorio
echo "Limpiando repositorio..."
git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "¡Limpieza completada! Ahora puedes hacer push forzado:"
echo "git push origin --force --all"
