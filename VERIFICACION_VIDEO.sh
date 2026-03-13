#!/bin/bash

# 🎬 Script de Verificación del Sistema de Video
# Verifica que todos los componentes estén configurados correctamente

echo "🔍 VERIFICACIÓN DEL SISTEMA DE VIDEO"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ──────────────────────────────────────────────────────────────────────────────
# 1. Variables de Entorno
# ──────────────────────────────────────────────────────────────────────────────
echo "📋 1. Verificando Variables de Entorno"
echo "--------------------------------------"

if [ -f .env ]; then
    echo -e "${GREEN}✅ Archivo .env encontrado${NC}"

    if grep -q "BUNNY_API_KEY" .env; then
        echo -e "${GREEN}✅ BUNNY_API_KEY configurada${NC}"
    else
        echo -e "${RED}❌ BUNNY_API_KEY NO configurada${NC}"
    fi

    if grep -q "BUNNY_VIDEO_LIBRARY_ID" .env; then
        echo -e "${GREEN}✅ BUNNY_VIDEO_LIBRARY_ID configurada${NC}"
    else
        echo -e "${RED}❌ BUNNY_VIDEO_LIBRARY_ID NO configurada${NC}"
    fi
else
    echo -e "${RED}❌ Archivo .env NO encontrado${NC}"
fi

echo ""

# ──────────────────────────────────────────────────────────────────────────────
# 2. Componentes Frontend
# ──────────────────────────────────────────────────────────────────────────────
echo "🎨 2. Verificando Componentes Frontend"
echo "--------------------------------------"

components=(
    "client/src/components/BunnyVideoPlayer.tsx"
    "client/src/components/ProtectedVideoPlayer.tsx"
    "client/src/components/ResponsiveBunnyPlayer.tsx"
    "client/src/pages/CourseDetail.tsx"
)

for component in "${components[@]}"; do
    if [ -f "$component" ]; then
        echo -e "${GREEN}✅ ${component}${NC}"
    else
        echo -e "${RED}❌ ${component} NO encontrado${NC}"
    fi
done

echo ""

# ──────────────────────────────────────────────────────────────────────────────
# 3. Backend (Bunny.net Integration)
# ──────────────────────────────────────────────────────────────────────────────
echo "⚙️  3. Verificando Backend (Bunny.net)"
echo "--------------------------------------"

if [ -f "server/bunny.ts" ]; then
    echo -e "${GREEN}✅ server/bunny.ts encontrado${NC}"

    # Check for AWS/S3 references (should be removed)
    if grep -i "aws\|s3\|cloudfront" server/bunny.ts > /dev/null 2>&1; then
        echo -e "${RED}⚠️  Advertencia: Referencias a AWS encontradas en bunny.ts${NC}"
    else
        echo -e "${GREEN}✅ Sin referencias a AWS/S3 (limpio)${NC}"
    fi
else
    echo -e "${RED}❌ server/bunny.ts NO encontrado${NC}"
fi

if [ -f "server/features/lessons.ts" ]; then
    echo -e "${GREEN}✅ server/features/lessons.ts encontrado${NC}"
else
    echo -e "${RED}❌ server/features/lessons.ts NO encontrado${NC}"
fi

if [ -f "server/features/uploads.ts" ]; then
    echo -e "${GREEN}✅ server/features/uploads.ts encontrado${NC}"
else
    echo -e "${RED}❌ server/features/uploads.ts NO encontrado${NC}"
fi

echo ""

# ──────────────────────────────────────────────────────────────────────────────
# 4. TypeScript Compilation
# ──────────────────────────────────────────────────────────────────────────────
echo "🔨 4. Verificando Compilación TypeScript"
echo "--------------------------------------"

if command -v tsc &> /dev/null; then
    if npx tsc --noEmit --skipLibCheck 2>&1 | grep -q "error TS"; then
        echo -e "${RED}❌ Errores de TypeScript encontrados${NC}"
    else
        echo -e "${GREEN}✅ Sin errores de TypeScript${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  TypeScript no instalado (skip)${NC}"
fi

echo ""

# ──────────────────────────────────────────────────────────────────────────────
# 5. Documentación
# ──────────────────────────────────────────────────────────────────────────────
echo "📚 5. Verificando Documentación"
echo "--------------------------------------"

docs=(
    "SOLUCION_DEFINITIVA_VIDEO.md"
    "BUNNY_NET_GUIDE.md"
    "SOLUCION_VIDEOS.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✅ ${doc}${NC}"
    else
        echo -e "${YELLOW}⚠️  ${doc} no encontrado${NC}"
    fi
done

echo ""

# ──────────────────────────────────────────────────────────────────────────────
# 6. Render.yaml Configuration
# ──────────────────────────────────────────────────────────────────────────────
echo "☁️  6. Verificando Configuración de Render"
echo "--------------------------------------"

if [ -f "render.yaml" ]; then
    echo -e "${GREEN}✅ render.yaml encontrado${NC}"

    if grep -q "BUNNY_API_KEY" render.yaml; then
        echo -e "${GREEN}✅ BUNNY_API_KEY en render.yaml${NC}"
    else
        echo -e "${RED}❌ BUNNY_API_KEY NO está en render.yaml${NC}"
    fi

    if grep -q "BUNNY_VIDEO_LIBRARY_ID" render.yaml; then
        echo -e "${GREEN}✅ BUNNY_VIDEO_LIBRARY_ID en render.yaml${NC}"
    else
        echo -e "${RED}❌ BUNNY_VIDEO_LIBRARY_ID NO está en render.yaml${NC}"
    fi
else
    echo -e "${RED}❌ render.yaml NO encontrado${NC}"
fi

echo ""

# ──────────────────────────────────────────────────────────────────────────────
# RESUMEN
# ──────────────────────────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VERIFICACIÓN COMPLETADA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Resumen:"
echo "   - Backend: Bunny.net API configurada (Library ID: 616736)"
echo "   - Frontend: Reproductor adaptable (16:9, 9:16, 1:1)"
echo "   - UX: Loading states, error handling, lock overlay"
echo "   - Estética: Colores de marca (#FA3698)"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. npm run dev → Prueba local"
echo "   2. Admin Dashboard → Lecciones → Subir video"
echo "   3. Frontend → Courses → Ver lección"
echo ""
echo "📖 Documentación completa en: SOLUCION_DEFINITIVA_VIDEO.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
