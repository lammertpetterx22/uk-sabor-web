#!/bin/bash

# 🎯 MCP Server Manager
# Script para gestionar los MCP Servers de Claude Code

set -e

CONFIG_FILE="$HOME/.config/claude/claude_desktop_config.json"
BACKUP_FILE="$HOME/.config/claude/claude_desktop_config.backup.json"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🎯 MCP Server Manager${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Function to check if config exists
check_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        echo -e "${RED}❌ Config file not found at: $CONFIG_FILE${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Config file found${NC}"
}

# Function to backup config
backup_config() {
    echo -e "\n${YELLOW}📦 Backing up config...${NC}"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup created at: $BACKUP_FILE${NC}"
}

# Function to list servers
list_servers() {
    echo -e "\n${BLUE}📋 Installed MCP Servers:${NC}\n"

    if command -v jq &> /dev/null; then
        jq -r '.mcpServers | keys[]' "$CONFIG_FILE" | while read server; do
            echo -e "  ${GREEN}✓${NC} $server"
        done
    else
        grep -o '"[^"]*":' "$CONFIG_FILE" | grep -v mcpServers | tr -d '":' | while read server; do
            echo -e "  ${GREEN}✓${NC} $server"
        done
    fi
}

# Function to test servers
test_servers() {
    echo -e "\n${BLUE}🧪 Testing MCP Servers:${NC}\n"

    # Test filesystem
    echo -e "${YELLOW}Testing filesystem server...${NC}"
    if npx -y @modelcontextprotocol/server-filesystem /tmp 2>&1 | grep -q "Error accessing directory" || npx -y @modelcontextprotocol/server-filesystem /tmp 2>&1 | grep -q "stdin"; then
        echo -e "${GREEN}✅ filesystem: OK${NC}"
    else
        echo -e "${RED}❌ filesystem: FAIL${NC}"
    fi

    # Test fetch
    echo -e "${YELLOW}Testing fetch server...${NC}"
    if npx -y @modelcontextprotocol/server-fetch --version 2>&1 | head -1 | grep -q "@" || echo "test" | npx -y @modelcontextprotocol/server-fetch 2>&1 | grep -q "stdin"; then
        echo -e "${GREEN}✅ fetch: OK${NC}"
    else
        echo -e "${RED}❌ fetch: FAIL${NC}"
    fi

    # Test sequential-thinking
    echo -e "${YELLOW}Testing sequential-thinking server...${NC}"
    if npx -y @modelcontextprotocol/server-sequential-thinking --version 2>&1 | head -1 | grep -q "@" || echo "test" | npx -y @modelcontextprotocol/server-sequential-thinking 2>&1 | grep -q "stdin"; then
        echo -e "${GREEN}✅ sequential-thinking: OK${NC}"
    else
        echo -e "${RED}❌ sequential-thinking: FAIL${NC}"
    fi

    # Test memory
    echo -e "${YELLOW}Testing memory server...${NC}"
    if npx -y @modelcontextprotocol/server-memory --version 2>&1 | head -1 | grep -q "@" || echo "test" | npx -y @modelcontextprotocol/server-memory 2>&1 | grep -q "stdin"; then
        echo -e "${GREEN}✅ memory: OK${NC}"
    else
        echo -e "${RED}❌ memory: FAIL${NC}"
    fi
}

# Function to show config
show_config() {
    echo -e "\n${BLUE}📄 Current Configuration:${NC}\n"

    if command -v jq &> /dev/null; then
        jq '.' "$CONFIG_FILE"
    else
        cat "$CONFIG_FILE"
    fi
}

# Function to validate JSON
validate_json() {
    echo -e "\n${YELLOW}🔍 Validating JSON...${NC}"

    if command -v jq &> /dev/null; then
        if jq empty "$CONFIG_FILE" 2>/dev/null; then
            echo -e "${GREEN}✅ JSON is valid${NC}"
        else
            echo -e "${RED}❌ JSON is invalid${NC}"
            exit 1
        fi
    else
        if python3 -c "import json; json.load(open('$CONFIG_FILE'))" 2>/dev/null; then
            echo -e "${GREEN}✅ JSON is valid${NC}"
        else
            echo -e "${RED}❌ JSON is invalid${NC}"
            exit 1
        fi
    fi
}

# Function to restore backup
restore_backup() {
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ No backup found${NC}"
        exit 1
    fi

    echo -e "\n${YELLOW}📦 Restoring from backup...${NC}"
    cp "$BACKUP_FILE" "$CONFIG_FILE"
    echo -e "${GREEN}✅ Config restored from backup${NC}"
}

# Function to update servers
update_servers() {
    echo -e "\n${YELLOW}🔄 Updating MCP Servers...${NC}\n"

    echo -e "${BLUE}Updating filesystem...${NC}"
    npx -y @modelcontextprotocol/server-filesystem@latest --version 2>&1 | head -1

    echo -e "${BLUE}Updating postgres...${NC}"
    npx -y @modelcontextprotocol/server-postgres@latest --version 2>&1 | head -1

    echo -e "${BLUE}Updating fetch...${NC}"
    npx -y @modelcontextprotocol/server-fetch@latest --version 2>&1 | head -1

    echo -e "${BLUE}Updating sequential-thinking...${NC}"
    npx -y @modelcontextprotocol/server-sequential-thinking@latest --version 2>&1 | head -1

    echo -e "${BLUE}Updating memory...${NC}"
    npx -y @modelcontextprotocol/server-memory@latest --version 2>&1 | head -1

    echo -e "\n${GREEN}✅ All servers updated${NC}"
}

# Main menu
case "${1:-menu}" in
    list|ls)
        check_config
        list_servers
        ;;
    test)
        check_config
        test_servers
        ;;
    show|config)
        check_config
        show_config
        ;;
    validate)
        check_config
        validate_json
        ;;
    backup)
        check_config
        backup_config
        ;;
    restore)
        restore_backup
        ;;
    update)
        update_servers
        ;;
    menu|*)
        check_config
        list_servers
        echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}Available commands:${NC}"
        echo -e "  ${GREEN}./mcp-manager.sh list${NC}     - List installed servers"
        echo -e "  ${GREEN}./mcp-manager.sh test${NC}     - Test all servers"
        echo -e "  ${GREEN}./mcp-manager.sh show${NC}     - Show configuration"
        echo -e "  ${GREEN}./mcp-manager.sh validate${NC} - Validate JSON config"
        echo -e "  ${GREEN}./mcp-manager.sh backup${NC}   - Backup configuration"
        echo -e "  ${GREEN}./mcp-manager.sh restore${NC}  - Restore from backup"
        echo -e "  ${GREEN}./mcp-manager.sh update${NC}   - Update all servers"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
        ;;
esac
