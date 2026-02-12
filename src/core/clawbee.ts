/**
 * ClawBee Core Class
 */

import { Config } from './config';
import { Memory } from './memory';
import { SkillManager } from '../skills/manager';
import { ClawBeeConfig, Message, AIResponse } from '../types';

export class ClawBee {
  private config: Config;
  private memory: Memory;
  private skillManager: SkillManager;
  private isRunning: boolean = false;

  constructor(configPath?: string) {
    this.config = new Config(configPath);
    this.memory = new Memory();
    this.skillManager = new SkillManager();
  }

  /**
   * Initialize ClawBee
   */
  async initialize(): Promise<void> {
    await this.config.load();
    await this.memory.load();
    await this.skillManager.loadSkills();
  }

  /**
   * Start the ClawBee daemon
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('ClawBee is already running');
    }

    await this.initialize();
    this.isRunning = true;

    console.log('🐝 ClawBee started');
  }

  /**
   * Stop the ClawBee daemon
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    await this.memory.save();
    this.isRunning = false;

    console.log('🐝 ClawBee stopped');
  }

  /**
   * Send a message and get a response
   */
  async chat(message: string): Promise<string> {
    // Add message to memory
    const userMessage: Message = {
      id: this.generateId(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    this.memory.addMessage(userMessage);

    // Get AI response (placeholder)
    const response = await this.getAIResponse(message);

    // Add response to memory
    const assistantMessage: Message = {
      id: this.generateId(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date()
    };
    this.memory.addMessage(assistantMessage);

    return response.content;
  }

  /**
   * Get AI response (placeholder - implement with actual AI provider)
   */
  private async getAIResponse(message: string): Promise<AIResponse> {
    const config = this.config.get();
    
    // This is a placeholder - implement actual AI provider integration
    return {
      content: `I received your message: "${message}". Configure your AI provider to get real responses.`,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get configuration
   */
  getConfig(): ClawBeeConfig | null {
    return this.config.get();
  }

  /**
   * Check if running
   */
  get running(): boolean {
    return this.isRunning;
  }
}
