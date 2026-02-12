/**
 * ClawBee AI Provider - Unified AI interface
 * Supports OpenAI, Anthropic, Google, and Local models
 */

const axios = require('axios');

class AIProvider {
  constructor(config) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 2048;
    this.localHost = config.localHost || 'localhost';
    this.localPort = config.localPort || 11434;
  }

  async chat(messages, systemPrompt = null) {
    const fullMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    switch (this.provider) {
      case 'openai':
        return this.callOpenAI(fullMessages);
      case 'anthropic':
        return this.callAnthropic(fullMessages);
      case 'google':
        return this.callGoogle(fullMessages);
      case 'local':
        return this.callLocal(fullMessages);
      default:
        throw new Error(`Unknown provider: ${this.provider}`);
    }
  }

  async callOpenAI(messages) {
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
        timeout: 60000
      }
    );

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model
    };
  }

  async callAnthropic(messages) {
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
        timeout: 60000
      }
    );

    return {
      content: response.data.content[0].text,
      usage: {
        input_tokens: response.data.usage.input_tokens,
        output_tokens: response.data.usage.output_tokens
      },
      model: response.data.model
    };
  }

  async callGoogle(messages) {
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

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens
        }
      },
      {
        params: { key: this.apiKey },
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      }
    );

    return {
      content: response.data.candidates[0].content.parts[0].text,
      usage: response.data.usageMetadata,
      model: this.model
    };
  }

  async callLocal(messages) {
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
      { timeout: 120000 }
    );

    return {
      content: response.data.message.content,
      usage: {
        prompt_tokens: response.data.prompt_eval_count,
        completion_tokens: response.data.eval_count
      },
      model: response.data.model
    };
  }

  // Stream response for real-time output
  async *streamChat(messages, systemPrompt = null) {
    if (this.provider !== 'openai') {
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
        timeout: 60000
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
          } catch (e) {}
        }
      }
    }
  }
}

module.exports = { AIProvider };
