#!/bin/bash
# Quick installation script for DOMPurify

echo "🔒 Installing DOMPurify for production-grade HTML sanitization..."
echo ""

# Install packages
npm install dompurify
npm install --save-dev @types/dompurify

echo ""
echo "✅ DOMPurify installed successfully!"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Edit client/src/lib/sanitize.ts"
echo "2. Uncomment line 9: import DOMPurify from 'dompurify';"
echo "3. Uncomment lines 24-48 (DOMPurify implementation)"
echo "4. Remove lines 52-58 (temporary implementation)"
echo "5. Run: npm run build"
echo ""
echo "📚 See SECURITY_IMPROVEMENTS_IMPLEMENTATION.md for details"
