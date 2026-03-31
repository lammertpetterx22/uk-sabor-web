#!/bin/bash

# Script to add STRIPE_WEBHOOK_SECRET to Koyeb environment variables
# Usage: ./scripts/add-stripe-webhook-secret.sh YOUR_KOYEB_API_TOKEN

KOYEB_API_TOKEN=$1
STRIPE_WEBHOOK_SECRET="whsec_R57Ew5NYfFHhsE0Yk0XE1ImeeURn6cch"

if [ -z "$KOYEB_API_TOKEN" ]; then
  echo "❌ Error: Please provide your Koyeb API token"
  echo ""
  echo "Usage: ./scripts/add-stripe-webhook-secret.sh YOUR_KOYEB_API_TOKEN"
  echo ""
  echo "To get your API token:"
  echo "1. Go to https://app.koyeb.com/account/api"
  echo "2. Create a new API token"
  echo "3. Run this script with the token"
  exit 1
fi

echo "🔧 Adding STRIPE_WEBHOOK_SECRET to Koyeb..."
echo ""

# Get the app ID
echo "📋 Fetching Koyeb app information..."
APP_RESPONSE=$(curl -s -X GET "https://api.koyeb.com/v1/apps" \
  -H "Authorization: Bearer $KOYEB_API_TOKEN")

APP_ID=$(echo $APP_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$APP_ID" ]; then
  echo "❌ Error: Could not find Koyeb app ID"
  echo "Response: $APP_RESPONSE"
  exit 1
fi

echo "✅ Found app ID: $APP_ID"
echo ""

# Get the service ID
echo "📋 Fetching service information..."
SERVICE_RESPONSE=$(curl -s -X GET "https://api.koyeb.com/v1/services?app_id=$APP_ID" \
  -H "Authorization: Bearer $KOYEB_API_TOKEN")

SERVICE_ID=$(echo $SERVICE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$SERVICE_ID" ]; then
  echo "❌ Error: Could not find Koyeb service ID"
  echo "Response: $SERVICE_RESPONSE"
  exit 1
fi

echo "✅ Found service ID: $SERVICE_ID"
echo ""

# Update the service with the new environment variable
echo "🔐 Adding STRIPE_WEBHOOK_SECRET environment variable..."

UPDATE_RESPONSE=$(curl -s -X PATCH "https://api.koyeb.com/v1/services/$SERVICE_ID" \
  -H "Authorization: Bearer $KOYEB_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "definition": {
      "env": [
        {
          "key": "STRIPE_WEBHOOK_SECRET",
          "value": "'"$STRIPE_WEBHOOK_SECRET"'"
        }
      ]
    }
  }')

if echo "$UPDATE_RESPONSE" | grep -q "error"; then
  echo "❌ Error updating service:"
  echo "$UPDATE_RESPONSE"
  exit 1
fi

echo "✅ STRIPE_WEBHOOK_SECRET added successfully!"
echo ""
echo "🚀 Koyeb will automatically redeploy your service with the new environment variable."
echo ""
echo "⏱️  Wait 2-3 minutes for deployment to complete, then test:"
echo "   1. Purchase a ticket on https://www.consabor.uk/events"
echo "   2. Check that ticket appears in user dashboard"
echo "   3. Check email for QR code and order confirmation"
echo ""
echo "✅ Done!"
