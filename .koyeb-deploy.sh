#!/bin/bash
# Koyeb Deployment Script - UK Sabor Web
# Este script automatiza el deployment a Koyeb

set -e  # Exit on error

echo "🚀 Starting Koyeb deployment..."

# Check if KOYEB_TOKEN is set
if [ -z "$KOYEB_TOKEN" ]; then
  echo "❌ Error: KOYEB_TOKEN environment variable is not set"
  echo ""
  echo "Para obtener tu token:"
  echo "1. Ve a https://app.koyeb.com/account/api"
  echo "2. Crea un nuevo token"
  echo "3. Exporta el token: export KOYEB_TOKEN='tu-token-aqui'"
  echo ""
  echo "O guárdalo permanentemente en ~/.zshrc o ~/.bashrc:"
  echo "echo 'export KOYEB_TOKEN=\"tu-token-aqui\"' >> ~/.zshrc"
  exit 1
fi

# Set the token for koyeb CLI
export KOYEB_TOKEN="$KOYEB_TOKEN"

# App configuration
APP_NAME="uk-sabor-web"
GIT_REPO="github.com/lammertpetterx22/uk-sabor-web"
GIT_BRANCH="main"
BUILD_COMMAND="pnpm install && npm run build"
RUN_COMMAND="npm run start"
PORT="8000"
INSTANCE_TYPE="nano"  # nano, micro, small, medium, large

echo "📦 App: $APP_NAME"
echo "📂 Repo: $GIT_REPO"
echo "🌿 Branch: $GIT_BRANCH"
echo ""

# Check if app already exists
if koyeb app get "$APP_NAME" &>/dev/null; then
  echo "♻️  App already exists. Redeploying..."

  # Trigger a new deployment by updating the service
  koyeb service redeploy "$APP_NAME/$APP_NAME" --skip-build=false

else
  echo "🆕 Creating new app..."

  koyeb app init "$APP_NAME" \
    --git "$GIT_REPO" \
    --git-branch "$GIT_BRANCH" \
    --git-build-command "$BUILD_COMMAND" \
    --git-run-command "$RUN_COMMAND" \
    --ports "$PORT:http" \
    --routes "/:$PORT" \
    --instance-type "$INSTANCE_TYPE" \
    --env "NODE_ENV=production" \
    --env "NODE_VERSION=20" \
    --health-check-http-path "/health" \
    --health-check-http-port "$PORT" \
    --health-check-grace-period 120

  echo ""
  echo "⚠️  IMPORTANTE: Configura las variables de entorno sensibles en Koyeb dashboard:"
  echo "   - DATABASE_URL"
  echo "   - JWT_SECRET"
  echo "   - STRIPE_SECRET_KEY"
  echo "   - STRIPE_WEBHOOK_SECRET"
  echo "   - RESEND_API_KEY"
  echo ""
  echo "   Las variables de Bunny.net ya están en el código, pero verifica que sean correctas."
fi

echo ""
echo "✅ Deployment iniciado!"
echo ""
echo "📊 Monitorear el deployment:"
echo "   koyeb service logs $APP_NAME/$APP_NAME -f"
echo ""
echo "🌐 Dashboard: https://app.koyeb.com/apps/$APP_NAME"
