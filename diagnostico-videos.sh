#!/bin/bash

echo "🔍 DIAGNÓSTICO DEL SISTEMA DE VIDEOS - UK Sabor Web"
echo "===================================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 Verificando archivos críticos..."
echo ""

# 1. Verificar que el archivo del hook existe
if [ -f "client/src/hooks/useLessonsManager.tsx" ]; then
    echo -e "${GREEN}✅ Hook useLessonsManager existe${NC}"
else
    echo -e "${RED}❌ Hook useLessonsManager NO EXISTE${NC}"
fi

# 2. Verificar que el componente LessonsManager existe
if [ -f "client/src/components/admin/LessonsManager.tsx" ]; then
    echo -e "${GREEN}✅ Componente LessonsManager existe${NC}"
else
    echo -e "${RED}❌ Componente LessonsManager NO EXISTE${NC}"
fi

# 3. Verificar que AdminDashboard importa LessonsManager
if grep -q "import LessonsManager" client/src/pages/AdminDashboard.tsx; then
    echo -e "${GREEN}✅ AdminDashboard importa LessonsManager${NC}"
else
    echo -e "${RED}❌ AdminDashboard NO importa LessonsManager${NC}"
fi

# 4. Verificar que existe la tab de Lecciones
if grep -q "value=\"lessons\"" client/src/pages/AdminDashboard.tsx; then
    echo -e "${GREEN}✅ Tab 'Lecciones' existe en AdminDashboard${NC}"
else
    echo -e "${RED}❌ Tab 'Lecciones' NO existe en AdminDashboard${NC}"
fi

# 5. Verificar que el límite del body-parser es 2GB
if grep -q "limit: \"2gb\"" server/_core/index.ts; then
    echo -e "${GREEN}✅ Límite del body-parser configurado a 2GB${NC}"
else
    echo -e "${RED}❌ Límite del body-parser NO es 2GB${NC}"
fi

echo ""
echo "🌐 Verificando variables de entorno..."
echo ""

# 6. Verificar variables de Bunny.net
if [ -f ".env" ]; then
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
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado${NC}"
fi

echo ""
echo "🔧 Verificando configuración de Render..."
echo ""

# 7. Verificar render.yaml
if [ -f "render.yaml" ]; then
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
    echo -e "${RED}❌ render.yaml no encontrado${NC}"
fi

echo ""
echo "📦 Verificando build..."
echo ""

# 8. Verificar que el build fue exitoso
if [ -f "dist/index.js" ]; then
    echo -e "${GREEN}✅ Build del backend exitoso (dist/index.js existe)${NC}"
else
    echo -e "${RED}❌ Build del backend FALLÓ (dist/index.js no existe)${NC}"
fi

if [ -d "dist/public" ]; then
    echo -e "${GREEN}✅ Build del frontend exitoso (dist/public existe)${NC}"

    # Verificar que AdminDashboard está en el build
    if ls dist/public/assets/AdminDashboard-*.js 1> /dev/null 2>&1; then
        ADMIN_FILE=$(ls dist/public/assets/AdminDashboard-*.js | head -1)
        ADMIN_SIZE=$(du -h "$ADMIN_FILE" | cut -f1)
        echo -e "${GREEN}   → AdminDashboard: $ADMIN_SIZE${NC}"
    else
        echo -e "${RED}❌ AdminDashboard NO está en el build${NC}"
    fi
else
    echo -e "${RED}❌ Build del frontend FALLÓ (dist/public no existe)${NC}"
fi

echo ""
echo "🔗 Verificando conexión al sitio..."
echo ""

# 9. Verificar que el sitio está accesible
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" https://uk-sabor-web.onrender.com)
if [ "$HTTP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Sitio accesible (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Sitio NO accesible (HTTP $HTTP_STATUS)${NC}"
fi

echo ""
echo "📊 Verificando endpoints de la API..."
echo ""

# 10. Verificar endpoint de uploads
UPLOAD_ENDPOINT_CHECK=$(curl -s -X POST https://uk-sabor-web.onrender.com/api/trpc/uploads.uploadVideoToBunny \
    -H "Content-Type: application/json" \
    -d '{}' 2>&1 | grep -o "UNAUTHORIZED\|uploadVideoToBunny\|error" | head -1)

if [ ! -z "$UPLOAD_ENDPOINT_CHECK" ]; then
    echo -e "${GREEN}✅ Endpoint uploads.uploadVideoToBunny responde${NC}"
else
    echo -e "${YELLOW}⚠️  No se pudo verificar el endpoint (puede requerir autenticación)${NC}"
fi

echo ""
echo "🎯 Verificando schema de la base de datos..."
echo ""

# 11. Verificar que existe el archivo de schema
if [ -f "drizzle/schema.ts" ]; then
    if grep -q "export const lessons" drizzle/schema.ts; then
        echo -e "${GREEN}✅ Tabla 'lessons' definida en schema${NC}"

        # Verificar columnas importantes
        if grep -q "bunnyVideoId" drizzle/schema.ts; then
            echo -e "${GREEN}   → Columna 'bunnyVideoId' existe${NC}"
        else
            echo -e "${RED}   ❌ Columna 'bunnyVideoId' NO existe${NC}"
        fi

        if grep -q "bunnyLibraryId" drizzle/schema.ts; then
            echo -e "${GREEN}   → Columna 'bunnyLibraryId' existe${NC}"
        else
            echo -e "${RED}   ❌ Columna 'bunnyLibraryId' NO existe${NC}"
        fi
    else
        echo -e "${RED}❌ Tabla 'lessons' NO definida en schema${NC}"
    fi
else
    echo -e "${RED}❌ Schema no encontrado${NC}"
fi

echo ""
echo "🔍 Verificando router de lecciones..."
echo ""

# 12. Verificar que existe el router de lecciones
if [ -f "server/features/lessons.ts" ]; then
    if grep -q "export const lessonsRouter" server/features/lessons.ts; then
        echo -e "${GREEN}✅ lessonsRouter existe${NC}"

        # Verificar endpoints importantes
        if grep -q "create:" server/features/lessons.ts; then
            echo -e "${GREEN}   → Endpoint 'create' existe${NC}"
        else
            echo -e "${RED}   ❌ Endpoint 'create' NO existe${NC}"
        fi

        if grep -q "getByCourseId:" server/features/lessons.ts; then
            echo -e "${GREEN}   → Endpoint 'getByCourseId' existe${NC}"
        else
            echo -e "${RED}   ❌ Endpoint 'getByCourseId' NO existe${NC}"
        fi
    else
        echo -e "${RED}❌ lessonsRouter NO exportado${NC}"
    fi
else
    echo -e "${RED}❌ lessons.ts no encontrado${NC}"
fi

echo ""
echo "===================================================="
echo "✅ DIAGNÓSTICO COMPLETADO"
echo "===================================================="
echo ""
echo "📝 Siguiente paso: Sigue las instrucciones en INSTRUCCIONES_PRUEBA.md"
echo ""
