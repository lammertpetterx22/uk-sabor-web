/**
 * Debug Helper - Advanced debugging utilities
 * Helps identify and fix common frontend and backend issues
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface DebugReport {
  timestamp: string;
  issues: Issue[];
  suggestions: string[];
  systemInfo: SystemInfo;
}

interface Issue {
  type: 'error' | 'warning' | 'info';
  category: 'frontend' | 'backend' | 'database' | 'build' | 'dependencies';
  message: string;
  file?: string;
  line?: number;
  fix?: string;
}

interface SystemInfo {
  nodeVersion: string;
  pnpmVersion: string;
  platform: string;
  workingDirectory: string;
}

class DebugHelper {
  private workingDir: string;

  constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
  }

  getSystemInfo(): SystemInfo {
    return {
      nodeVersion: process.version,
      pnpmVersion: this.runCommand('pnpm --version') || 'Not installed',
      platform: process.platform,
      workingDirectory: this.workingDir,
    };
  }

  runCommand(cmd: string): string {
    try {
      return execSync(cmd, { encoding: 'utf-8', cwd: this.workingDir }).trim();
    } catch (error) {
      return '';
    }
  }

  checkTypeScriptErrors(): Issue[] {
    const issues: Issue[] = [];

    console.log('🔍 Checking TypeScript errors...');
    try {
      const output = this.runCommand('pnpm tsc --noEmit');
      if (output) {
        issues.push({
          type: 'info',
          category: 'frontend',
          message: 'TypeScript check passed',
        });
      }
    } catch (error: any) {
      const errorOutput = error.stdout?.toString() || error.message;
      const lines = errorOutput.split('\n');

      lines.forEach((line: string) => {
        const match = line.match(/(.+)\((\d+),\d+\): error TS\d+: (.+)/);
        if (match) {
          issues.push({
            type: 'error',
            category: 'frontend',
            message: match[3],
            file: match[1],
            line: parseInt(match[2]),
            fix: this.suggestTypescriptFix(match[3]),
          });
        }
      });
    }

    return issues;
  }

  suggestTypescriptFix(errorMessage: string): string {
    if (errorMessage.includes('Cannot find module')) {
      return 'Run: pnpm install';
    }
    if (errorMessage.includes('Type \'undefined\' is not assignable')) {
      return 'Add optional chaining (?.) or null check';
    }
    if (errorMessage.includes('Property') && errorMessage.includes('does not exist')) {
      return 'Check the object type definition or add the property';
    }
    return 'Review the TypeScript error and fix the type mismatch';
  }

  checkDependencies(): Issue[] {
    const issues: Issue[] = [];

    console.log('📦 Checking dependencies...');
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.workingDir, 'package.json'), 'utf-8')
      );

      // Check if node_modules exists
      if (!fs.existsSync(path.join(this.workingDir, 'node_modules'))) {
        issues.push({
          type: 'error',
          category: 'dependencies',
          message: 'node_modules not found',
          fix: 'Run: pnpm install',
        });
      }

      // Check for outdated packages (simplified)
      const outdated = this.runCommand('pnpm outdated --format json');
      if (outdated) {
        issues.push({
          type: 'warning',
          category: 'dependencies',
          message: 'Some packages are outdated',
          fix: 'Run: pnpm update',
        });
      }
    } catch (error) {
      issues.push({
        type: 'error',
        category: 'dependencies',
        message: 'Failed to check dependencies',
      });
    }

    return issues;
  }

  checkEnvironment(): Issue[] {
    const issues: Issue[] = [];

    console.log('🔐 Checking environment variables...');
    const envExample = path.join(this.workingDir, '.env.example');
    const envFile = path.join(this.workingDir, '.env');

    if (!fs.existsSync(envFile)) {
      issues.push({
        type: 'error',
        category: 'backend',
        message: '.env file not found',
        fix: fs.existsSync(envExample)
          ? 'Copy .env.example to .env and fill in the values'
          : 'Create a .env file with required environment variables',
      });
    }

    return issues;
  }

  checkBuildFiles(): Issue[] {
    const issues: Issue[] = [];

    console.log('🏗️  Checking build configuration...');

    const requiredFiles = [
      'vite.config.ts',
      'tsconfig.json',
      'package.json',
    ];

    requiredFiles.forEach((file) => {
      if (!fs.existsSync(path.join(this.workingDir, file))) {
        issues.push({
          type: 'error',
          category: 'build',
          message: `Missing required file: ${file}`,
        });
      }
    });

    return issues;
  }

  async checkServerHealth(): Promise<Issue[]> {
    const issues: Issue[] = [];

    console.log('🖥️  Checking server health...');

    try {
      const response = await fetch('http://localhost:3000/');
      if (!response.ok) {
        issues.push({
          type: 'warning',
          category: 'backend',
          message: `Server responded with status ${response.status}`,
        });
      }
    } catch (error) {
      issues.push({
        type: 'error',
        category: 'backend',
        message: 'Server is not running',
        fix: 'Run: pnpm dev',
      });
    }

    return issues;
  }

  generateSuggestions(issues: Issue[]): string[] {
    const suggestions: string[] = [];

    const errorCount = issues.filter((i) => i.type === 'error').length;
    const warningCount = issues.filter((i) => i.type === 'warning').length;

    if (errorCount === 0 && warningCount === 0) {
      suggestions.push('✅ All checks passed! Your development environment looks healthy.');
    } else {
      if (errorCount > 0) {
        suggestions.push(`🔴 Found ${errorCount} error(s) that need immediate attention`);
      }
      if (warningCount > 0) {
        suggestions.push(`⚠️  Found ${warningCount} warning(s) that should be reviewed`);
      }

      // Collect unique fixes
      const fixes = Array.from(
        new Set(issues.filter((i) => i.fix).map((i) => i.fix))
      );
      if (fixes.length > 0) {
        suggestions.push('\n📋 Suggested fixes:');
        fixes.forEach((fix) => suggestions.push(`   • ${fix}`));
      }
    }

    return suggestions;
  }

  async runFullDiagnostics(): Promise<DebugReport> {
    console.log('\n🔧 Running Full Diagnostics...\n');

    const issues: Issue[] = [
      ...this.checkEnvironment(),
      ...this.checkBuildFiles(),
      ...this.checkDependencies(),
      ...this.checkTypeScriptErrors(),
      ...(await this.checkServerHealth()),
    ];

    const report: DebugReport = {
      timestamp: new Date().toISOString(),
      issues,
      suggestions: this.generateSuggestions(issues),
      systemInfo: this.getSystemInfo(),
    };

    return report;
  }

  printReport(report: DebugReport): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIAGNOSTIC REPORT');
    console.log(`🕐 ${new Date(report.timestamp).toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💻 System Info:');
    console.log(`   Node: ${report.systemInfo.nodeVersion}`);
    console.log(`   pnpm: ${report.systemInfo.pnpmVersion}`);
    console.log(`   Platform: ${report.systemInfo.platform}`);
    console.log(`   Directory: ${report.systemInfo.workingDirectory}\n`);

    if (report.issues.length > 0) {
      console.log('🔍 Issues Found:\n');

      const byCategory = report.issues.reduce((acc, issue) => {
        if (!acc[issue.category]) acc[issue.category] = [];
        acc[issue.category].push(issue);
        return acc;
      }, {} as Record<string, Issue[]>);

      Object.entries(byCategory).forEach(([category, issues]) => {
        console.log(`   📁 ${category.toUpperCase()}:`);
        issues.forEach((issue) => {
          const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`      ${icon} ${issue.message}`);
          if (issue.file) {
            console.log(`         📄 ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
          }
          if (issue.fix) {
            console.log(`         💡 ${issue.fix}`);
          }
        });
        console.log('');
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    report.suggestions.forEach((suggestion) => console.log(suggestion));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

// Run diagnostics if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const helper = new DebugHelper();
  helper.runFullDiagnostics().then((report) => {
    helper.printReport(report);

    // Exit with error code if there are errors
    const hasErrors = report.issues.some((i) => i.type === 'error');
    process.exit(hasErrors ? 1 : 0);
  });
}

export { DebugHelper };
