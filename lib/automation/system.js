/**
 * ClawBee System Commands
 * Execute system commands safely with sandboxing
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Dangerous commands that should always be blocked
const BLOCKED_COMMANDS = [
  'rm -rf /',
  'rm -rf /*',
  'rm -rf ~',
  'mkfs',
  'dd if=',
  'format c:',
  ':(){:|:&};:',
  '> /dev/sda',
  'chmod -R 777 /',
  'chown -R',
  'wget | sh',
  'curl | sh',
  'sudo rm',
  'sudo dd',
  'sudo mkfs'
];

class SystemCommands {
  constructor(config = {}) {
    this.sandbox = config.sandbox !== false;
    this.allowedCommands = config.allowedCommands || [];
    this.blockedCommands = [...BLOCKED_COMMANDS, ...(config.blockedCommands || [])];
    this.workingDir = config.workingDir || os.homedir();
    this.timeout = config.timeout || 30000;
  }

  isCommandSafe(command) {
    const lowerCmd = command.toLowerCase();
    
    // Check blocked commands
    for (const blocked of this.blockedCommands) {
      if (lowerCmd.includes(blocked.toLowerCase())) {
        return { safe: false, reason: `Blocked command pattern: ${blocked}` };
      }
    }

    // In sandbox mode, only allow specific commands
    if (this.sandbox && this.allowedCommands.length > 0) {
      const cmdBase = command.split(' ')[0];
      if (!this.allowedCommands.includes(cmdBase)) {
        return { safe: false, reason: `Command not in allowed list: ${cmdBase}` };
      }
    }

    return { safe: true };
  }

  async execute(command, options = {}) {
    const safetyCheck = this.isCommandSafe(command);
    if (!safetyCheck.safe) {
      throw new Error(`Security: ${safetyCheck.reason}`);
    }

    return new Promise((resolve, reject) => {
      const execOptions = {
        cwd: options.cwd || this.workingDir,
        timeout: options.timeout || this.timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        env: { ...process.env, ...options.env }
      };

      exec(command, execOptions, (error, stdout, stderr) => {
        if (error) {
          if (error.killed) {
            reject(new Error(`Command timed out after ${this.timeout}ms`));
          } else {
            reject(new Error(stderr || error.message));
          }
          return;
        }
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      });
    });
  }

  async spawnProcess(command, args = [], options = {}) {
    const fullCommand = `${command} ${args.join(' ')}`;
    const safetyCheck = this.isCommandSafe(fullCommand);
    if (!safetyCheck.safe) {
      throw new Error(`Security: ${safetyCheck.reason}`);
    }

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd || this.workingDir,
        env: { ...process.env, ...options.env },
        stdio: options.stdio || 'pipe'
      });

      let stdout = '';
      let stderr = '';

      if (child.stdout) {
        child.stdout.on('data', data => { stdout += data; });
      }
      if (child.stderr) {
        child.stderr.on('data', data => { stderr += data; });
      }

      child.on('close', code => {
        if (code === 0) {
          resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code });
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });

      child.on('error', reject);

      // Timeout
      if (options.timeout) {
        setTimeout(() => {
          child.kill('SIGTERM');
          reject(new Error(`Process timed out after ${options.timeout}ms`));
        }, options.timeout);
      }
    });
  }

  // File operations
  async readFile(filePath) {
    const fullPath = path.resolve(this.workingDir, filePath);
    return fs.promises.readFile(fullPath, 'utf8');
  }

  async writeFile(filePath, content) {
    const fullPath = path.resolve(this.workingDir, filePath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    return fs.promises.writeFile(fullPath, content, 'utf8');
  }

  async listDirectory(dirPath = '.') {
    const fullPath = path.resolve(this.workingDir, dirPath);
    const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });
    return entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: path.join(dirPath, entry.name)
    }));
  }

  async fileExists(filePath) {
    const fullPath = path.resolve(this.workingDir, filePath);
    try {
      await fs.promises.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileInfo(filePath) {
    const fullPath = path.resolve(this.workingDir, filePath);
    const stats = await fs.promises.stat(fullPath);
    return {
      path: fullPath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile()
    };
  }

  // System info
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      homeDir: os.homedir(),
      tmpDir: os.tmpdir()
    };
  }
}

module.exports = { SystemCommands };
