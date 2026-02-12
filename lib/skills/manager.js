/**
 * ClawBee Skill System
 * Extensible skill framework
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

const SKILLS_DIR = path.join(os.homedir(), '.local', 'share', 'clawbee', 'skills');
const MARKETPLACE_URL = 'https://clawbee.pro/api/skills';

class SkillManager {
  constructor() {
    this.skills = new Map();
    this.handlers = new Map();
  }

  async loadSkills() {
    if (!fs.existsSync(SKILLS_DIR)) {
      fs.mkdirSync(SKILLS_DIR, { recursive: true });
      return;
    }

    const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const skillName of dirs) {
      try {
        await this.loadSkill(skillName);
      } catch (error) {
        console.error(`Failed to load skill ${skillName}:`, error.message);
      }
    }
  }

  async loadSkill(skillName) {
    const skillPath = path.join(SKILLS_DIR, skillName);
    const manifestPath = path.join(skillPath, 'manifest.json');
    const indexPath = path.join(skillPath, 'index.js');

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Manifest not found for skill: ${skillName}`);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    let handler = null;
    if (fs.existsSync(indexPath)) {
      // Clear require cache for hot reload
      delete require.cache[require.resolve(indexPath)];
      handler = require(indexPath);
    }

    this.skills.set(skillName, {
      manifest,
      handler,
      path: skillPath,
      enabled: true
    });

    // Register command handlers
    if (manifest.commands && handler) {
      for (const cmd of manifest.commands) {
        if (handler[cmd.handler]) {
          this.handlers.set(cmd.name, {
            skill: skillName,
            handler: handler[cmd.handler],
            description: cmd.description
          });
        }
      }
    }

    return manifest;
  }

  async installSkill(skillName, source = 'marketplace') {
    const skillPath = path.join(SKILLS_DIR, skillName);

    if (fs.existsSync(skillPath)) {
      throw new Error(`Skill ${skillName} is already installed`);
    }

    fs.mkdirSync(skillPath, { recursive: true });

    if (source === 'marketplace') {
      // Download from marketplace
      try {
        const response = await axios.get(`${MARKETPLACE_URL}/${skillName}`);
        const skillData = response.data;

        fs.writeFileSync(
          path.join(skillPath, 'manifest.json'),
          JSON.stringify(skillData.manifest, null, 2)
        );

        if (skillData.code) {
          fs.writeFileSync(
            path.join(skillPath, 'index.js'),
            skillData.code
          );
        }
      } catch (error) {
        // Fallback to creating placeholder
        const manifest = {
          name: skillName,
          version: '1.0.0',
          description: `${skillName} skill for ClawBee`,
          author: 'ClawBee Marketplace',
          commands: [],
          installedAt: new Date().toISOString()
        };

        fs.writeFileSync(
          path.join(skillPath, 'manifest.json'),
          JSON.stringify(manifest, null, 2)
        );

        fs.writeFileSync(
          path.join(skillPath, 'index.js'),
          `// ${skillName} skill\nmodule.exports = {};\n`
        );
      }
    } else if (source.startsWith('http')) {
      // Download from URL
      const response = await axios.get(source);
      
      if (typeof response.data === 'object') {
        fs.writeFileSync(
          path.join(skillPath, 'manifest.json'),
          JSON.stringify(response.data.manifest || response.data, null, 2)
        );
        if (response.data.code) {
          fs.writeFileSync(path.join(skillPath, 'index.js'), response.data.code);
        }
      }
    } else if (fs.existsSync(source)) {
      // Copy from local path
      const files = fs.readdirSync(source);
      for (const file of files) {
        fs.copyFileSync(
          path.join(source, file),
          path.join(skillPath, file)
        );
      }
    }

    return this.loadSkill(skillName);
  }

  async uninstallSkill(skillName) {
    const skillPath = path.join(SKILLS_DIR, skillName);

    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill ${skillName} is not installed`);
    }

    // Remove handlers
    const skill = this.skills.get(skillName);
    if (skill?.manifest?.commands) {
      for (const cmd of skill.manifest.commands) {
        this.handlers.delete(cmd.name);
      }
    }

    // Remove from memory
    this.skills.delete(skillName);

    // Delete files
    fs.rmSync(skillPath, { recursive: true });

    return true;
  }

  getSkill(skillName) {
    return this.skills.get(skillName);
  }

  getAllSkills() {
    return Array.from(this.skills.values()).map(s => s.manifest);
  }

  getHandler(commandName) {
    return this.handlers.get(commandName);
  }

  async executeCommand(commandName, args, context) {
    const handler = this.handlers.get(commandName);
    if (!handler) {
      throw new Error(`Unknown command: ${commandName}`);
    }
    return handler.handler(args, context);
  }

  // Check if message triggers any skill
  async processMessage(message, context) {
    for (const [skillName, skill] of this.skills) {
      if (!skill.enabled || !skill.manifest.triggers) continue;

      for (const trigger of skill.manifest.triggers) {
        let match = false;

        if (trigger.type === 'keyword') {
          match = message.toLowerCase().includes(trigger.pattern.toLowerCase());
        } else if (trigger.type === 'regex') {
          const regex = new RegExp(trigger.pattern, 'i');
          match = regex.test(message);
        } else if (trigger.type === 'startsWith') {
          match = message.toLowerCase().startsWith(trigger.pattern.toLowerCase());
        }

        if (match && skill.handler && skill.handler[trigger.handler]) {
          return {
            triggered: true,
            skill: skillName,
            result: await skill.handler[trigger.handler](message, context)
          };
        }
      }
    }

    return { triggered: false };
  }
}

// Built-in skills
const builtInSkills = {
  // Calculator skill
  calculator: {
    manifest: {
      name: 'calculator',
      version: '1.0.0',
      description: 'Basic calculator operations',
      triggers: [
        { type: 'regex', pattern: '^calculate\\s+', handler: 'calculate' },
        { type: 'regex', pattern: '^\\d+[\\s]*[+\\-*/][\\s]*\\d+', handler: 'calculate' }
      ]
    },
    handler: {
      calculate: (message) => {
        const expr = message.replace(/^calculate\s+/i, '').trim();
        try {
          // Safe evaluation using Function
          const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, '');
          const result = Function(`"use strict"; return (${sanitized})`)();
          return `${expr} = ${result}`;
        } catch (error) {
          return `Error calculating: ${error.message}`;
        }
      }
    }
  },

  // Date/Time skill
  datetime: {
    manifest: {
      name: 'datetime',
      version: '1.0.0',
      description: 'Date and time information',
      triggers: [
        { type: 'keyword', pattern: 'what time', handler: 'getTime' },
        { type: 'keyword', pattern: 'what date', handler: 'getDate' },
        { type: 'keyword', pattern: 'what day', handler: 'getDay' }
      ]
    },
    handler: {
      getTime: () => `Current time: ${new Date().toLocaleTimeString()}`,
      getDate: () => `Today's date: ${new Date().toLocaleDateString()}`,
      getDay: () => `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`
    }
  },

  // System info skill  
  system: {
    manifest: {
      name: 'system',
      version: '1.0.0',
      description: 'System information',
      triggers: [
        { type: 'keyword', pattern: 'system info', handler: 'getInfo' },
        { type: 'keyword', pattern: 'memory usage', handler: 'getMemory' }
      ]
    },
    handler: {
      getInfo: () => {
        return `System: ${os.platform()} ${os.arch()}\nHostname: ${os.hostname()}\nCPUs: ${os.cpus().length}\nUptime: ${Math.floor(os.uptime() / 3600)} hours`;
      },
      getMemory: () => {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        return `Memory: ${Math.round(used / 1024 / 1024 / 1024 * 100) / 100}GB used / ${Math.round(total / 1024 / 1024 / 1024 * 100) / 100}GB total (${Math.round(used / total * 100)}% used)`;
      }
    }
  }
};

module.exports = { SkillManager, builtInSkills };
