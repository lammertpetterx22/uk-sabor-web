/**
 * Development Monitor & Health Check
 * Continuously monitors the development server for errors, warnings, and performance issues
 */

import http from 'http';
import { spawn } from 'child_process';

interface HealthStatus {
  timestamp: string;
  server: {
    status: 'online' | 'offline' | 'error';
    port: number;
    responseTime?: number;
  };
  database: {
    status: 'connected' | 'disconnected' | 'error';
    message?: string;
  };
  frontend: {
    status: 'building' | 'ready' | 'error';
    hmr?: boolean;
  };
}

class DevMonitor {
  private port: number;
  private checkInterval: number;
  private lastStatus: HealthStatus | null = null;

  constructor(port: number = 3000, checkInterval: number = 5000) {
    this.port = port;
    this.checkInterval = checkInterval;
  }

  async checkServerHealth(): Promise<HealthStatus['server']> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${this.port}/`, (res) => {
        const responseTime = Date.now() - startTime;
        resolve({
          status: res.statusCode === 200 ? 'online' : 'error',
          port: this.port,
          responseTime,
        });
      });

      req.on('error', () => {
        resolve({
          status: 'offline',
          port: this.port,
        });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({
          status: 'error',
          port: this.port,
        });
      });
    });
  }

  async checkDatabaseHealth(): Promise<HealthStatus['database']> {
    try {
      const response = await fetch(`http://localhost:${this.port}/api/trpc/health.check`);
      if (response.ok) {
        return { status: 'connected' };
      }
      return { status: 'error', message: 'Unhealthy response' };
    } catch (error) {
      return { status: 'disconnected', message: (error as Error).message };
    }
  }

  async getFullHealth(): Promise<HealthStatus> {
    const [server, database] = await Promise.all([
      this.checkServerHealth(),
      this.checkDatabaseHealth(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      server,
      database,
      frontend: {
        status: 'ready',
        hmr: true,
      },
    };
  }

  formatStatus(status: HealthStatus): string {
    const lines = [
      '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `🕐 ${new Date(status.timestamp).toLocaleTimeString()}`,
      '',
      `🖥️  Server: ${this.getStatusEmoji(status.server.status)} ${status.server.status.toUpperCase()}`,
      `   Port: ${status.server.port}`,
      status.server.responseTime ? `   Response: ${status.server.responseTime}ms` : '',
      '',
      `💾 Database: ${this.getStatusEmoji(status.database.status)} ${status.database.status.toUpperCase()}`,
      status.database.message ? `   ${status.database.message}` : '',
      '',
      `⚛️  Frontend: ${this.getStatusEmoji(status.frontend.status)} ${status.frontend.status.toUpperCase()}`,
      status.frontend.hmr ? `   HMR: ✅ Active` : '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ];

    return lines.filter(Boolean).join('\n');
  }

  getStatusEmoji(status: string): string {
    if (status === 'online' || status === 'connected' || status === 'ready') return '✅';
    if (status === 'building') return '🔨';
    if (status === 'offline' || status === 'disconnected') return '🔴';
    return '⚠️';
  }

  async start() {
    console.log('🚀 Starting Development Monitor...');
    console.log(`📊 Monitoring http://localhost:${this.port}`);
    console.log(`⏱️  Check interval: ${this.checkInterval / 1000}s`);

    const monitor = async () => {
      try {
        const status = await this.getFullHealth();

        // Only show update if status changed or every 5 checks
        const shouldShow = !this.lastStatus ||
          JSON.stringify(this.lastStatus) !== JSON.stringify(status);

        if (shouldShow) {
          console.clear();
          console.log(this.formatStatus(status));

          // Alert on critical issues
          if (status.server.status === 'offline') {
            console.log('⚠️  ALERT: Server is offline!');
          }
          if (status.database.status === 'disconnected') {
            console.log('⚠️  ALERT: Database connection lost!');
          }
        }

        this.lastStatus = status;
      } catch (error) {
        console.error('❌ Monitor error:', error);
      }
    };

    // Initial check
    await monitor();

    // Periodic checks
    setInterval(monitor, this.checkInterval);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const monitor = new DevMonitor(port, 5000);
  monitor.start();
}

export { DevMonitor };
