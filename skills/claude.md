# 🎯 Claude Code Skills (MCP Servers) - Guía Completa

## ¿Qué son los MCP Servers?

Los **MCP Servers** (Model Context Protocol) son como "skills" o "plugins" que extienden las capacidades de Claude Code. No hay un "marketplace" tradicional como en VSCode, pero hay un registro oficial de servidores MCP.

---

## 📦 Instalación de MCP Servers

### 1. Crear directorio de configuración

```bash
mkdir -p ~/.config/claude
```

### 2. Crear archivo de configuración

```bash
touch ~/.config/claude/claude_desktop_config.json
```

### 3. Editar el archivo de configuración

```bash
nano ~/.config/claude/claude_desktop_config.json
```

O abrirlo con tu editor preferido:
```bash
code ~/.config/claude/claude_desktop_config.json
```

---

## 🔧 MCP Servers Más Útiles para Desarrollo Web

### Configuración Completa Recomendada:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/lammert/Desktop/uk-sabor-web"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "TU_TOKEN_AQUI"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:password@localhost:5432/database"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "TU_API_KEY_AQUI"
      }
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/Users/lammert/Desktop/uk-sabor-web"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

---

## 🌟 Descripción de Cada MCP Server

### 1. **filesystem** (Sistema de Archivos)
- ✅ Lectura y escritura de archivos mejorada
- ✅ Navegación de directorios
- ✅ Búsqueda de archivos
- **Recomendado para:** Desarrollo general

### 2. **github** (GitHub)
- ✅ Crear y gestionar issues
- ✅ Crear y gestionar pull requests
- ✅ Búsqueda de código en repos
- ✅ Gestión de branches
- **Requiere:** Token de GitHub (https://github.com/settings/tokens)

### 3. **postgres** (PostgreSQL)
- ✅ Ejecutar queries SQL
- ✅ Inspeccionar esquemas
- ✅ Gestión de base de datos
- **Recomendado para:** Proyectos con PostgreSQL (como el tuyo!)

### 4. **brave-search** (Búsqueda Web)
- ✅ Búsqueda en internet
- ✅ Información actualizada
- ✅ Documentación y ejemplos
- **Requiere:** API key de Brave (https://brave.com/search/api/)

### 5. **fetch** (HTTP Requests)
- ✅ Hacer peticiones HTTP
- ✅ Probar APIs
- ✅ Obtener datos externos
- **Recomendado para:** Testing de APIs

### 6. **git** (Git)
- ✅ Operaciones Git avanzadas
- ✅ Ver historial
- ✅ Gestión de commits
- **Recomendado para:** Control de versiones

### 7. **sequential-thinking** (Pensamiento Secuencial)
- ✅ Resolución de problemas complejos
- ✅ Debugging avanzado
- ✅ Planificación de features
- **Recomendado para:** Problemas difíciles

---

## 🚀 Instalación Rápida (Configuración Básica)

Para tu proyecto **UK Sabor**, recomiendo empezar con esta configuración mínima:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/lammert/Desktop/uk-sabor-web"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost:5432/tu_base_datos"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/Users/lammert/Desktop/uk-sabor-web"]
    }
  }
}
```

---

## 📋 Cómo Obtener API Keys

### GitHub Token:
1. Ve a: https://github.com/settings/tokens
2. Click en "Generate new token (classic)"
3. Dale permisos: `repo`, `read:org`, `read:user`
4. Copia el token y pégalo en la configuración

### Brave Search API:
1. Ve a: https://brave.com/search/api/
2. Regístrate gratis (2000 búsquedas/mes)
3. Obtén tu API key
4. Pégala en la configuración

---

## 🔍 Dónde Encontrar Más MCP Servers

### Registro Oficial:
https://github.com/modelcontextprotocol/servers

### Servidores Populares:
- **@modelcontextprotocol/server-memory** - Memoria persistente
- **@modelcontextprotocol/server-puppeteer** - Automatización de navegador
- **@modelcontextprotocol/server-slack** - Integración con Slack
- **@modelcontextprotocol/server-youtube-transcript** - Transcripciones de YouTube
- **@modelcontextprotocol/server-sqlite** - Base de datos SQLite
- **@modelcontextprotocol/server-aws-kb-retrieval** - AWS Knowledge Base

---

## ✅ Verificar Instalación

Después de configurar, reinicia Claude Code y ejecuta:

```bash
claude --version
```

Los MCP servers se cargarán automáticamente. Puedes verificar que están activos cuando Claude Code los menciona en sus respuestas.

---

## 🐛 Troubleshooting

### Problema: "MCP server not found"
**Solución:**
```bash
# Verificar que npx funciona
npx --version

# Instalar el servidor manualmente
npm install -g @modelcontextprotocol/server-filesystem
```

### Problema: "Permission denied"
**Solución:**
```bash
chmod 644 ~/.config/claude/claude_desktop_config.json
```

### Problema: "Invalid JSON"
**Solución:**
- Verifica que el JSON esté bien formado
- Usa un validador JSON: https://jsonlint.com/

---

## 💡 Tips de Uso

1. **Empieza con pocos servers** - No instales todos al principio
2. **Configura las API keys después** - Muchos servers funcionan sin keys
3. **Reinicia Claude Code** - Después de cambiar la configuración
4. **Lee los logs** - Si algo falla, revisa los mensajes de error
5. **Actualiza regularmente** - Los servers se actualizan frecuentemente

---

## 🎯 Para Tu Proyecto UK Sabor

Configuración recomendada específica:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/lammert/Desktop/uk-sabor-web"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "PGHOST": "localhost",
        "PGPORT": "5432",
        "PGUSER": "tu_usuario",
        "PGPASSWORD": "tu_password",
        "PGDATABASE": "uk_sabor"
      }
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/Users/lammert/Desktop/uk-sabor-web"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

---

## 📚 Recursos Adicionales

- **Documentación oficial:** https://modelcontextprotocol.io/
- **GitHub:** https://github.com/modelcontextprotocol
- **Lista de servers:** https://github.com/modelcontextprotocol/servers
- **Crear tu propio MCP server:** https://modelcontextprotocol.io/docs/building

---

## ❓ Preguntas Frecuentes

**P: ¿Los MCP servers ralentizan Claude Code?**
R: No significativamente. Solo se cargan cuando se necesitan.

**P: ¿Son gratis?**
R: Sí, los servers son gratis. Algunas APIs (Brave, GitHub) tienen límites gratuitos.

**P: ¿Puedo crear mi propio server?**
R: ¡Sí! Puedes crear servers personalizados siguiendo la documentación oficial.

**P: ¿Funcionan en todos los sistemas operativos?**
R: Sí, son multiplataforma (macOS, Linux, Windows).

---

**Nota:** No hay comando `/plugin` en Claude Code. Los MCP servers se configuran mediante el archivo JSON y se activan automáticamente.
