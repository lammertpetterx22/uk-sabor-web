import fs from 'fs';

let content = fs.readFileSync('drizzle/schema.ts', 'utf-8');

// 1. Imports
content = content.replace(/drizzle-orm\/mysql-core/g, 'drizzle-orm/pg-core');
content = content.replace(/mysqlTable/g, 'pgTable');
// We replace 'int' with 'integer' in imports and usage
content = content.replace(/\bint\b/g, 'integer'); // Careful with 'parseInt' or other things, but schema.ts only has 'int' from import and columns. Let's be safer.
content = content.replace(/import \{([^}]+)\} from "drizzle-orm\/pg-core";/, (match, p1) => {
    return match.replace(/\bint\b/, 'integer').replace(/\bmysqlEnum\b/, 'varchar').replace(/\bmysqlTable\b/, 'pgTable').replace(/\bserial\b/g, ''); // cleanup if re-run
});
content = content.replace(/import \{([^}]+)\} from "drizzle-orm\/pg-core";/, (match, p1) => {
    if (!p1.includes('serial')) {
        return match.replace('{', '{ serial,');
    }
    return match;
});

// 2. Table definitions
content = content.replace(/mysqlTable/g, 'pgTable');

// 3. Types
// int("id").autoincrement().primaryKey() -> serial("id").primaryKey()
content = content.replace(/integer\("id"\)\.autoincrement\(\)\.primaryKey\(\)/g, 'serial("id").primaryKey()');
content = content.replace(/int\("id"\)\.autoincrement\(\)\.primaryKey\(\)/g, 'serial("id").primaryKey()');

// int(...) -> integer(...)
content = content.replace(/int\(/g, 'integer(');

// mysqlEnum("something", [...]).default("x") -> varchar("something", { length: 255 }).default("x")
// Actually, let's just replace mysqlEnum("col", ["a","b"]) with varchar("col", { length: 255 })
content = content.replace(/mysqlEnum\("([^"]+)",\s*\[[^\]]+\]\)/g, 'varchar("$1", { length: 255 })');

// 4. remove .onUpdateNow() which is mysql only
content = content.replace(/\.onUpdateNow\(\)/g, '');

fs.writeFileSync('drizzle/schema.ts', content);
console.log("Schema converted!");
