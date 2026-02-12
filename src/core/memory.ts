/**
 * ClawBee Memory Manager
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Message } from '../types';

export class Memory {
  private memoryPath: string;
  private messages: Message[] = [];
  private maxMessages: number = 100;

  constructor(memoryPath?: string) {
    this.memoryPath = memoryPath || path.join(
      os.homedir(),
      '.local',
      'share',
      'clawbee',
      'memory',
      'conversation.json'
    );
  }

  /**
   * Load memory from file
   */
  async load(): Promise<void> {
    try {
      if (fs.existsSync(this.memoryPath)) {
        const data = fs.readFileSync(this.memoryPath, 'utf8');
        this.messages = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading memory:', error);
      this.messages = [];
    }
  }

  /**
   * Save memory to file
   */
  async save(): Promise<void> {
    const dir = path.dirname(this.memoryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      this.memoryPath,
      JSON.stringify(this.messages, null, 2)
    );
  }

  /**
   * Add a message to memory
   */
  addMessage(message: Message): void {
    this.messages.push(message);

    // Trim if exceeds max
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  /**
   * Get all messages
   */
  getMessages(): Message[] {
    return this.messages;
  }

  /**
   * Get recent messages for context
   */
  getContext(count: number = 10): Message[] {
    return this.messages.slice(-count);
  }

  /**
   * Clear memory
   */
  clear(): void {
    this.messages = [];
  }

  /**
   * Search messages
   */
  search(query: string): Message[] {
    const lowerQuery = query.toLowerCase();
    return this.messages.filter(msg =>
      msg.content.toLowerCase().includes(lowerQuery)
    );
  }
}
