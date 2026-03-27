#!/bin/bash

# Script para ejecutar migración de withdrawal bank details
# Uso: bash EJECUTAR_MIGRACION.sh YOUR_DATABASE_URL

if [ -z "$1" ]; then
  echo "❌ Error: Necesitas proporcionar DATABASE_URL"
  echo ""
  echo "Uso:"
  echo "  bash EJECUTAR_MIGRACION.sh 'postgresql://user:pass@host:port/db'"
  echo ""
  echo "Consigue el DATABASE_URL desde:"
  echo "  Koyeb Dashboard → Settings → Environment Variables → DATABASE_URL"
  exit 1
fi

DATABASE_URL="$1"

echo "🚀 Ejecutando migración de withdrawal bank details..."
echo ""

# Comando 1
echo "📝 Agregando columna accountHolderName..."
psql "$DATABASE_URL" -c 'ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "accountHolderName" VARCHAR(255);'
if [ $? -eq 0 ]; then
  echo "✅ accountHolderName agregada"
else
  echo "❌ Error agregando accountHolderName"
  exit 1
fi
echo ""

# Comando 2
echo "📝 Agregando columna sortCode..."
psql "$DATABASE_URL" -c 'ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "sortCode" VARCHAR(20);'
if [ $? -eq 0 ]; then
  echo "✅ sortCode agregada"
else
  echo "❌ Error agregando sortCode"
  exit 1
fi
echo ""

# Comando 3
echo "📝 Agregando columna accountNumber..."
psql "$DATABASE_URL" -c 'ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "accountNumber" VARCHAR(20);'
if [ $? -eq 0 ]; then
  echo "✅ accountNumber agregada"
else
  echo "❌ Error agregando accountNumber"
  exit 1
fi
echo ""

echo "🎉 ¡Migración completada exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "  1. Escribe 'migration done' en Claude Code"
echo "  2. Yo descomentaré los campos en el código"
echo "  3. Build + Push"
echo "  4. ✅ Sistema completo funcional"
