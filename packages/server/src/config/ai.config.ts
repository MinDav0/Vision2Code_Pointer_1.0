/**
 * AI Configuration for MCP Pointer v2.0
 * Manages AI service configurations and environment variables
 */

import type { AIConfig } from '../ai/ai.manager.js';

export function getAIConfig(): AIConfig {
  const config: AIConfig = {
    fallbackToLocal: true,
    cacheEnabled: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
  };

  // Claude configuration
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  if (claudeApiKey) {
    config.claude = {
      apiKey: claudeApiKey,
      model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
      maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.1'),
      baseUrl: process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com/v1'
    };
    console.log('✅ Claude AI configuration loaded');
  } else {
    console.log('⚠️ Claude API key not found, Claude AI features will be disabled');
  }

  // Cursor AI configuration
  const cursorEnabled = process.env.CURSOR_AI_ENABLED === 'true';
  if (cursorEnabled) {
    config.cursor = {
      enabled: true,
      mode: (process.env.CURSOR_AI_MODE as 'integrated' | 'api' | 'mcp') || 'integrated',
      workspacePath: process.env.CURSOR_WORKSPACE_PATH || process.cwd(),
      extensionId: process.env.CURSOR_EXTENSION_ID || 'mcp-pointer'
    };
    console.log('✅ Cursor AI configuration loaded');
  } else {
    console.log('ℹ️ Cursor AI disabled (set CURSOR_AI_ENABLED=true to enable)');
  }

  // Local LLM configuration
  const localLLMEnabled = process.env.LOCAL_LLM_ENABLED === 'true';
  if (localLLMEnabled) {
    config.localLLM = {
      enabled: true,
      modelPath: process.env.LOCAL_LLM_MODEL_PATH,
      apiUrl: process.env.LOCAL_LLM_API_URL || 'http://localhost:11434' // Default Ollama URL
    };
    console.log('✅ Local LLM configuration loaded');
  } else {
    console.log('ℹ️ Local LLM disabled (set LOCAL_LLM_ENABLED=true to enable)');
  }

  // Cache configuration
  config.cacheEnabled = process.env.AI_CACHE_ENABLED !== 'false';
  config.cacheTTL = parseInt(process.env.AI_CACHE_TTL || '300000'); // 5 minutes default

  return config;
}

export function validateAIConfig(config: AIConfig): string[] {
  const warnings: string[] = [];

  if (!config.claude?.apiKey && !config.localLLM?.enabled) {
    warnings.push('No AI services configured. AI features will use fallback analysis only.');
  }

  if (config.claude?.apiKey) {
    if (!config.claude.model) {
      warnings.push('Claude model not specified, using default');
    }
    if (config.claude.maxTokens > 8000) {
      warnings.push('Claude max tokens is high, this may increase costs');
    }
    if (config.claude.temperature > 0.5) {
      warnings.push('Claude temperature is high, responses may be less consistent');
    }
  }

  if (config.localLLM?.enabled) {
    if (!config.localLLM.modelPath && !config.localLLM.apiUrl) {
      warnings.push('Local LLM enabled but no model path or API URL specified');
    }
  }

  if (!config.cacheEnabled) {
    warnings.push('AI cache is disabled, this may increase API costs and response times');
  }

  return warnings;
}

export function getAIConfigSummary(config: AIConfig): string {
  const summary = {
    claude: config.claude?.apiKey ? '✅ Configured' : '❌ Not configured',
    localLLM: config.localLLM?.enabled ? '✅ Enabled' : '❌ Disabled',
    cache: config.cacheEnabled ? '✅ Enabled' : '❌ Disabled',
    fallback: config.fallbackToLocal ? '✅ Enabled' : '❌ Disabled'
  };

  return `AI Configuration Summary:
- Claude AI: ${summary.claude}
- Local LLM: ${summary.localLLM}
- Cache: ${summary.cache}
- Fallback: ${summary.fallback}`;
}
