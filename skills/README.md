# 🎯 Skills (MCP Servers) - Instalación Completa

## ✅ Estado de Instalación

**TODO INSTALADO Y CONFIGURADO** ✅

---

## 📦 Servidores MCP Instalados

### 1. **filesystem** ✅
- **Descripción:** Acceso mejorado al sistema de archivos
- **Ruta configurada:** `/Users/lammert/Desktop/uk-sabor-web`
- **Funcionalidad:** Lectura/escritura avanzada de archivos

### 2. **postgres** ✅
- **Descripción:** Conexión directa a PostgreSQL
- **Base de datos:** Supabase (UK Sabor)
- **Funcionalidad:** Queries SQL, inspección de esquemas

### 3. **brave-search** ✅
- **Descripción:** Búsqueda web en tiempo real
- **Estado:** Configurado (requiere API key opcional)
- **Funcionalidad:** Buscar documentación, ejemplos, soluciones

### 4. **fetch** ✅
- **Descripción:** Realizar peticiones HTTP
- **Funcionalidad:** Probar APIs, obtener datos externos

### 5. **sequential-thinking** ✅
- **Descripción:** Resolución de problemas complejos
- **Funcionalidad:** Debugging avanzado, análisis profundo

### 6. **memory** ✅
- **Descripción:** Memoria persistente entre sesiones
- **Funcionalidad:** Recordar contexto y preferencias

---

## 🚀 Cómo Usar

Los MCP servers se activan **automáticamente** cuando inicias Claude Code. No necesitas hacer nada especial.

### Verificar instalación:

```bash
cd /Users/lammert/Desktop/uk-sabor-web/skills
./mcp-manager.sh list
```

### Probar todos los servidores:

```bash
./mcp-manager.sh test
```

### Ver configuración completa:

```bash
./mcp-manager.sh show
```

---

## 📋 Comandos Disponibles

```bash
./mcp-manager.sh list      # Lista servidores instalados
./mcp-manager.sh test      # Prueba todos los servidores
./mcp-manager.sh show      # Muestra configuración
./mcp-manager.sh validate  # Valida JSON
./mcp-manager.sh backup    # Respalda configuración
./mcp-manager.sh restore   # Restaura desde backup
./mcp-manager.sh update    # Actualiza todos los servers
```

---

## 🔧 Archivo de Configuración

**Ubicación:** `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/lammert/Desktop/uk-sabor-web"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://..."]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

---

## 🎯 Nuevas Capacidades

Con estos MCP servers instalados, ahora puedo:

### 📁 Filesystem
- Buscar archivos más rápido
- Leer múltiples archivos en paralelo
- Operaciones de archivos más eficientes

### 💾 PostgreSQL
- Ejecutar queries SQL directamente
- Inspeccionar esquemas de base de datos
- Analizar datos en tiempo real

### 🌐 Brave Search
- Buscar documentación actualizada
- Encontrar soluciones a errores
- Obtener ejemplos de código recientes

### 🔄 Fetch
- Probar endpoints de tu API
- Verificar servicios externos
- Debugging de peticiones HTTP

### 🧠 Sequential Thinking
- Resolver problemas complejos paso a paso
- Análisis profundo de bugs
- Planificación de features grandes

### 💭 Memory
- Recordar tus preferencias de código
- Mantener contexto entre sesiones
- Aprender de interacciones anteriores

---

## 🔐 Configuración Opcional: API Keys

### Brave Search (Opcional pero recomendado)

1. **Obtén tu API key gratis:**
   - Ve a: https://brave.com/search/api/
   - Regístrate (2000 búsquedas gratis/mes)
   - Copia tu API key

2. **Agrégala a la configuración:**
   ```bash
   nano ~/.config/claude/claude_desktop_config.json
   ```

3. **Reemplaza la línea:**
   ```json
   "BRAVE_API_KEY": "TU_API_KEY_AQUI"
   ```

4. **Reinicia Claude Code**

---

## ✅ Próximos Pasos

1. **Reinicia Claude Code** para que cargue los MCP servers
2. **Prueba los servers:** `./skills/mcp-manager.sh test`
3. **Opcional:** Agrega Brave API key para búsquedas web
4. **¡Empieza a desarrollar!** Los skills ya están activos

---

## 🐛 Solución de Problemas

### Problema: "MCP server not found"
```bash
# Reinstala el servidor
npx -y @modelcontextprotocol/server-filesystem@latest
```

### Problema: "Invalid JSON"
```bash
# Valida la configuración
./skills/mcp-manager.sh validate

# Si falla, restaura desde backup
./skills/mcp-manager.sh restore
```

### Problema: "Connection refused" (Postgres)
- Verifica que la variable `DATABASE_URL` en `.env` sea correcta
- Comprueba que la base de datos esté accesible

---

## 📚 Más Información

- **Documentación oficial:** https://modelcontextprotocol.io/
- **Servidores disponibles:** https://github.com/modelcontextprotocol/servers
- **Guía completa:** Ver [claude.md](./claude.md)

---

## 🎉 ¡Todo Listo!

Los MCP servers están instalados y configurados. Ahora tengo capacidades mejoradas para:

- ✅ Desarrollo web más rápido y eficiente
- ✅ Debugging avanzado de frontend y backend
- ✅ Acceso directo a base de datos
- ✅ Búsqueda web en tiempo real
- ✅ Resolución de problemas complejos
- ✅ Memoria persistente entre sesiones

**¡Estoy listo para ayudarte con el desarrollo de UK Sabor con habilidades mejoradas!** 🚀
