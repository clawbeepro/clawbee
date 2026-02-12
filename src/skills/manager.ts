/**
 * ClawBee Skill Manager
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Skill } from '../types';

export class SkillManager {
  private skillsPath: string;
  private skills: Map<string, Skill> = new Map();

  constructor(skillsPath?: string) {
    this.skillsPath = skillsPath || path.join(
      os.homedir(),
      '.local',
      'share',
      'clawbee',
      'skills'
    );
  }

  /**
   * Load all installed skills
   */
  async loadSkills(): Promise<void> {
    if (!fs.existsSync(this.skillsPath)) {
      fs.mkdirSync(this.skillsPath, { recursive: true });
      return;
    }

    const dirs = fs.readdirSync(this.skillsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const dir of dirs) {
      try {
        const manifestPath = path.join(this.skillsPath, dir, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          this.skills.set(manifest.name, manifest);
        }
      } catch (error) {
        console.error(`Error loading skill ${dir}:`, error);
      }
    }
  }

  /**
   * Get all installed skills
   */
  getSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get a specific skill
   */
  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /**
   * Install a skill
   */
  async install(name: string, source: string): Promise<void> {
    // Placeholder - implement actual skill installation
    console.log(`Installing skill ${name} from ${source}`);
  }

  /**
   * Uninstall a skill
   */
  async uninstall(name: string): Promise<void> {
    const skillPath = path.join(this.skillsPath, name);
    if (fs.existsSync(skillPath)) {
      fs.rmSync(skillPath, { recursive: true });
      this.skills.delete(name);
    }
  }

  /**
   * Check if a skill is installed
   */
  isInstalled(name: string): boolean {
    return this.skills.has(name);
  }
}
