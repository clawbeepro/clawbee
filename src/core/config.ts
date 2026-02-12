/**
 * ClawBee Configuration Manager
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ClawBeeConfig } from '../types';

export class Config {
  private configPath: string;
  private config: ClawBeeConfig | null = null;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(
      os.homedir(),
      '.config',
      'clawbee',
      'config.json'
    );
  }

  /**
   * Load configuration from file
   */
  async load(): Promise<ClawBeeConfig | null> {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(data);
        return this.config;
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    return null;
  }

  /**
   * Save configuration to file
   */
  async save(): Promise<void> {
    if (!this.config) return;

    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      this.configPath,
      JSON.stringify(this.config, null, 2)
    );
  }

  /**
   * Get configuration
   */
  get(): ClawBeeConfig | null {
    return this.config;
  }

  /**
   * Set configuration
   */
  set(config: ClawBeeConfig): void {
    this.config = config;
  }

  /**
   * Update configuration value
   */
  update(key: string, value: any): void {
    if (!this.config) return;

    const keys = key.split('.');
    let obj: any = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
  }
}
