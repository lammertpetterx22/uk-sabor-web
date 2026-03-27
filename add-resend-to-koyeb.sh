#!/bin/bash
# Script para agregar las variables de entorno de Resend a Koyeb

set -e  # Exit on error

echo "📧 Adding Resend environment variables to Koyeb..."

# Check if KOYEB_TOKEN is set
if [ -z "$KOYEB_TOKEN" ]; then
  echo "❌ Error: KOYEB_TOKEN environment variable is not set"
  echo ""
  echo "Para obtener tu token:"
  echo "1. Ve a https://app.koyeb.com/account/api"
  echo "2. Crea un nuevo token"
  echo "3. Exporta el token: export KOYEB_TOKEN='tu-token-aqui'"
  echo ""
  echo "O usa el token directamente:"
  echo "./add-resend-to-koyeb.sh <tu-token>"
  exit 1
fi

APP_NAME="uk-sabor-web"
SERVICE_NAME="uk-sabor-web"

echo "🔧 Updating service with Resend environment variables..."

# Update service with new environment variables
koyeb service update "$APP_NAME/$SERVICE_NAME" \
  --env RESEND_API_KEY=re_bDESrsMD_9aWK4SeRXjzraHaiDWKdgbzA \
  --env RESEND_FROM_EMAIL="UK Sabor <noreply@consabor.uk>"

echo ""
echo "✅ Resend environment variables added successfully!"
echo ""
echo "Variables agregadas:"
echo "  - RESEND_API_KEY=re_bDESrsMD_9aWK4SeRXjzraHaiDWKdgbzA"
echo "  - RESEND_FROM_EMAIL=UK Sabor <noreply@consabor.uk>"
echo ""
echo "🚀 El servicio se redesplegará automáticamente con las nuevas variables."
echo ""
echo "📊 Puedes verificar el estado con:"
echo "   koyeb service logs $APP_NAME/$SERVICE_NAME -f"
echo ""
