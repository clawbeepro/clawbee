/**
 * ClawBee Type Definitions
 */

export interface ClawBeeConfig {
  user: {
    name: string;
  };
  ai: {
    provider: 'openai' | 'anthropic' | 'google' | 'local';
    apiKey?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  integrations: Record<string, IntegrationConfig>;
  memory: {
    enabled: boolean;
    maxContext: number;
  };
  security: {
    sandbox: boolean;
    allowedCommands?: string[];
    blockedCommands?: string[];
  };
  version: string;
  createdAt: string;
}

export interface IntegrationConfig {
  enabled: boolean;
  token?: string;
  webhook?: string;
  [key: string]: any;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Skill {
  name: string;
  version: string;
  description: string;
  author: string;
  commands: SkillCommand[];
  triggers?: SkillTrigger[];
}

export interface SkillCommand {
  name: string;
  description: string;
  handler: (args: any) => Promise<any>;
}

export interface SkillTrigger {
  type: 'keyword' | 'regex' | 'schedule';
  pattern: string;
  handler: (context: any) => Promise<any>;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
