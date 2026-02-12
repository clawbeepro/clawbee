/**
 * ClawBee AI Provider - Unified AI interface
 * Supports OpenAI, Anthropic, Google, Local models, and Emergent Universal Key
 * 
 * The Emergent LLM Key (Universal Key) allows using a single API key
 * across all major AI providers (OpenAI, Anthropic, Gemini)
 */

const axios = require('axios');

// Available models for each provider with Emergent Universal Key
const AVAILABLE_MODELS = {
  openai: [
    'gpt-5.2',
    'gpt-5.1',
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-4',
    'gpt-4o',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'o3',
    'o3-pro',
    'o4-mini',
    'o1'
  ],
  anthropic: [
    'claude-opus-4-6',
    'claude-sonnet-4-5-20250929',
    'claude-haiku-4-5-20251001',
    'claude-opus-4-5-20251101',
    'claude-4-sonnet-20250514',
    'claude-4-opus-20250514',
    'claude-3-5-haiku-20241022'
  ],
  gemini: [
    'gemini-3-flash-preview',
    'gemini-3-pro-preview',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
  ]
};

// Default models per provider
const DEFAULT_MODELS = {
  openai: 'gpt-5.2',
  anthropic: 'claude-4-sonnet-20250514',
  gemini: 'gemini-2.5-pro',
  emergent: 'gpt-5.2', // Default for universal key
  local: 'llama2'
};

class AIProvider {
  constructor(config) {
    this.provider = config.provider || 'emergent';
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODELS[this.provider] || 'gpt-5.2';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 2048;
    this.localHost = config.localHost || 'localhost';
    this.localPort = config.localPort || 11434;
    
    // For Emergent Universal Key, determine the actual provider from model name
    if (this.provider === 'emergent') {
      this.actualProvider = this._detectProviderFromModel(this.model);
    } else {
      this.actualProvider = this.provider;
    }
  }

  /**
   * Detect the actual provider from the model name
   */
  _detectProviderFromModel(model) {
    const modelLower = model.toLowerCase();
    
    if (modelLower.startsWith('gpt') || modelLower.startsWith('o1') || modelLower.startsWith('o3') || modelLower.startsWith('o4')) {
      return 'openai';
    }
    if (modelLower.startsWith('claude')) {
      return 'anthropic';
    }
    if (modelLower.startsWith('gemini')) {
      return 'gemini';
    }
    
    // Default to OpenAI
    return 'openai';
  }

  /**
   * Get available models for display
   */
  static getAvailableModels() {
    return AVAILABLE_MODELS;
  }

  /**
   * Main chat method - routes to appropriate provider
   */
  async chat(messages, systemPrompt = null) {
    const fullMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const provider = this.provider === 'emergent' ? this.actualProvider : this.provider;

    switch (provider) {
      case 'openai':
        return this.callOpenAI(fullMessages);
      case 'anthropic':
        return this.callAnthropic(fullMessages);
      case 'gemini':
      case 'google':
        return this.callGemini(fullMessages);
      case 'local':
        return this.callLocal(fullMessages);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * OpenAI API call (works with Emergent Universal Key)
   */
  async callOpenAI(messages) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages,
          temperature: this.temperature,
          max_tokens: this.maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model,
        provider: 'openai'
      };
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      throw new Error(`OpenAI Error: ${errMsg}`);
    }
  }

  /**
   * Anthropic API call (works with Emergent Universal Key)
   */
  async callAnthropic(messages) {
    try {
      const systemMsg = messages.find(m => m.role === 'system');
      const otherMsgs = messages.filter(m => m.role !== 'system');

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.model,
          max_tokens: this.maxTokens,
          system: systemMsg?.content || '',
          messages: otherMsgs.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      return {
        content: response.data.content[0].text,
        usage: {
          input_tokens: response.data.usage.input_tokens,
          output_tokens: response.data.usage.output_tokens
        },
        model: response.data.model,
        provider: 'anthropic'
      };
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      throw new Error(`Anthropic Error: ${errMsg}`);
    }
  }

  /**
   * Google Gemini API call (works with Emergent Universal Key)
   */
  async callGemini(messages) {
    try {
      const contents = [];
      let systemInstruction = '';

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemInstruction = msg.content;
        } else {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      }

      const requestBody = {
        contents,
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens
        }
      };

      if (systemInstruction) {
        requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
        requestBody,
        {
          params: { key: this.apiKey },
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000
        }
      );

      return {
        content: response.data.candidates[0].content.parts[0].text,
        usage: response.data.usageMetadata || {},
        model: this.model,
        provider: 'gemini'
      };
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      throw new Error(`Gemini Error: ${errMsg}`);
    }
  }

  /**
   * Local model call (Ollama)
   */
  async callLocal(messages) {
    try {
      const response = await axios.post(
        `http://${this.localHost}:${this.localPort}/api/chat`,
        {
          model: this.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: false,
          options: {
            temperature: this.temperature,
            num_predict: this.maxTokens
          }
        },
        { timeout: 180000 }
      );

      return {
        content: response.data.message.content,
        usage: {
          prompt_tokens: response.data.prompt_eval_count || 0,
          completion_tokens: response.data.eval_count || 0
        },
        model: response.data.model,
        provider: 'local'
      };
    } catch (error) {
      throw new Error(`Local Model Error: ${error.message}. Make sure Ollama is running on ${this.localHost}:${this.localPort}`);
    }
  }

  /**
   * Stream response for real-time output (OpenAI only for now)
   */
  async *streamChat(messages, systemPrompt = null) {
    const provider = this.provider === 'emergent' ? this.actualProvider : this.provider;
    
    if (provider !== 'openai') {
      // Fallback to non-streaming for other providers
      const result = await this.chat(messages, systemPrompt);
      yield result.content;
      return;
    }

    const fullMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.model,
        messages: fullMessages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: true
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 120000
      }
    );

    for await (const chunk of response.data) {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) yield content;
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  }

  /**
   * Change model on the fly
   */
  withModel(provider, model) {
    if (this.provider === 'emergent') {
      this.model = model;
      this.actualProvider = provider;
    } else {
      this.model = model;
      this.provider = provider;
    }
    return this;
  }

  /**
   * Validate if the current configuration is valid
   */
  async validate() {
    try {
      const testMessages = [{ role: 'user', content: 'Say "OK" and nothing else.' }];
      const response = await this.chat(testMessages);
      return { valid: true, response: response.content };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = { AIProvider, AVAILABLE_MODELS, DEFAULT_MODELS };
