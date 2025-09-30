/**
 * Claude AI Service for MCP Pointer v2.0
 * Handles Claude API integration for enhanced element analysis
 */

import type { TargetedElement } from '@mcp-pointer/shared';
import { createAppError, ErrorCode } from '@mcp-pointer/shared';

export interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  baseUrl?: string;
}

export interface ClaudeAnalysisRequest {
  element: TargetedElement;
  analysisType: 'accessibility' | 'performance' | 'semantics' | 'usability' | 'comprehensive';
  includeSuggestions: boolean;
  includeCodeExamples: boolean;
  context?: string;
}

export interface ClaudeAnalysisResponse {
  analysis: string;
  suggestions: string[];
  codeExamples: string[];
  confidence: number;
  metadata: {
    model: string;
    tokensUsed: number;
    processingTime: number;
  };
}

export class ClaudeService {
  private config: ClaudeConfig;
  private isInitialized: boolean = false;

  constructor(config: ClaudeConfig) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw createAppError(ErrorCode.INVALID_INPUT, 'Claude API key is required');
    }
    if (!this.config.model) {
      this.config.model = 'claude-3-sonnet-20240229';
    }
    if (!this.config.maxTokens) {
      this.config.maxTokens = 4000;
    }
    if (this.config.temperature === undefined) {
      this.config.temperature = 0.1;
    }
    if (!this.config.baseUrl) {
      this.config.baseUrl = 'https://api.anthropic.com/v1';
    }
  }

  public async initialize(): Promise<void> {
    try {
      // Test the API connection
      await this.testConnection();
      this.isInitialized = true;
      console.log('✅ Claude AI Service initialized successfully');
    } catch (error) {
      this.isInitialized = false;
      throw createAppError(ErrorCode.INTERNAL_SERVER_ERROR, `Failed to initialize Claude service: ${error}`);
    }
  }

  private async testConnection(): Promise<void> {
    const testMessage = {
      model: this.config.model,
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a connection test.'
        }
      ]
    };

    const response = await this.makeRequest('/messages', testMessage);
    
    if (!response.ok) {
      throw new Error(`Claude API test failed: ${response.status} ${response.statusText}`);
    }
  }

  public async analyzeElement(request: ClaudeAnalysisRequest): Promise<ClaudeAnalysisResponse> {
    if (!this.isInitialized) {
      throw createAppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Claude service not initialized');
    }

    const startTime = Date.now();
    
    try {
      const prompt = this.buildAnalysisPrompt(request);
      
      const claudeRequest = {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      };

      const response = await this.makeRequest('/messages', claudeRequest);
      
      if (!response.ok) {
        throw new Error(`Claude API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return this.parseClaudeResponse(data, processingTime);
    } catch (error) {
      throw createAppError(ErrorCode.INTERNAL_SERVER_ERROR, `Claude analysis failed: ${error}`);
    }
  }

  private buildAnalysisPrompt(request: ClaudeAnalysisRequest): string {
    const { element, analysisType, includeSuggestions, includeCodeExamples, context } = request;
    
    let prompt = `# Element Analysis Request

## Element Information
- **Tag:** ${element.tagName}
- **ID:** ${element.id || 'None'}
- **Classes:** ${element.classes?.join(', ') || 'None'}
- **Text Content:** ${element.innerText?.substring(0, 200) || 'None'}
- **Selector:** ${element.selector}
- **URL:** ${element.url}

## Accessibility Information
- **Role:** ${element.accessibility?.role || 'None'}
- **Aria Label:** ${element.accessibility?.ariaLabel || 'None'}
- **Tab Index:** ${element.accessibility?.tabIndex || 'None'}
- **Focusable:** ${element.accessibility?.isFocusable ? 'Yes' : 'No'}
- **Visible:** ${element.accessibility?.isVisible ? 'Yes' : 'No'}

## CSS Properties
${Object.entries(element.cssProperties || {}).map(([key, value]) => `- **${key}:** ${value}`).join('\n') || 'None'}

## Component Information
- **Component Name:** ${element.componentInfo?.name || 'Unknown'}
- **Source File:** ${element.componentInfo?.sourceFile || 'Unknown'}

${context ? `## Additional Context\n${context}\n` : ''}

## Analysis Request
Please provide a ${analysisType} analysis of this element.`;

    switch (analysisType) {
      case 'accessibility':
        prompt += `

Focus on:
- WCAG compliance issues
- Screen reader compatibility
- Keyboard navigation
- ARIA attributes usage
- Color contrast and visual accessibility`;
        break;
        
      case 'performance':
        prompt += `

Focus on:
- Rendering performance
- CSS optimization opportunities
- DOM complexity
- Memory usage considerations
- Bundle size impact`;
        break;
        
      case 'semantics':
        prompt += `

Focus on:
- HTML semantic correctness
- Proper element usage
- Document structure
- SEO implications
- Content hierarchy`;
        break;
        
      case 'usability':
        prompt += `

Focus on:
- User experience
- Interaction patterns
- Visual design
- Content clarity
- User flow integration`;
        break;
        
      case 'comprehensive':
      default:
        prompt += `

Provide a comprehensive analysis covering:
- Accessibility compliance
- Performance considerations
- Semantic HTML usage
- Usability best practices
- Code quality and maintainability`;
        break;
    }

    if (includeSuggestions) {
      prompt += `

Please include specific, actionable suggestions for improvement.`;
    }

    if (includeCodeExamples) {
      prompt += `

Please provide code examples showing:
- Current implementation issues
- Improved implementation
- Best practices demonstration`;
    }

    prompt += `

Please format your response as structured markdown with clear sections and actionable insights.`;

    return prompt;
  }

  private async makeRequest(endpoint: string, data: any): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(data)
    });
  }

  private parseClaudeResponse(data: any, processingTime: number): ClaudeAnalysisResponse {
    const content = data.content?.[0]?.text || '';
    
    // Extract structured information from the response
    const suggestions = this.extractSuggestions(content);
    const codeExamples = this.extractCodeExamples(content);
    
    // Calculate confidence based on response quality indicators
    const confidence = this.calculateConfidence(content, suggestions, codeExamples);
    
    return {
      analysis: content,
      suggestions,
      codeExamples,
      confidence,
      metadata: {
        model: this.config.model,
        tokensUsed: data.usage?.output_tokens || 0,
        processingTime
      }
    };
  }

  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.match(/^[-*]\s+(.+)/) || line.match(/^\d+\.\s+(.+)/)) {
        const suggestion = line.replace(/^[-*\d\.\s]+/, '').trim();
        if (suggestion && suggestion.length > 10) {
          suggestions.push(suggestion);
        }
      }
    }
    
    return suggestions;
  }

  private extractCodeExamples(content: string): string[] {
    const codeExamples: string[] = [];
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    
    for (const block of codeBlocks) {
      const code = block.replace(/```\w*\n?/, '').replace(/```$/, '').trim();
      if (code && code.length > 20) {
        codeExamples.push(code);
      }
    }
    
    return codeExamples;
  }

  private calculateConfidence(content: string, suggestions: string[], codeExamples: string[]): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on response quality
    if (content.length > 500) confidence += 0.1;
    if (suggestions.length > 0) confidence += 0.1;
    if (codeExamples.length > 0) confidence += 0.1;
    if (content.includes('✅') || content.includes('⚠️')) confidence += 0.1;
    if (content.includes('##') && content.split('##').length > 3) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  public async generateTestCode(element: TargetedElement, testType: string, framework: string): Promise<string> {
    if (!this.isInitialized) {
      throw createAppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Claude service not initialized');
    }

    const prompt = this.buildTestCodePrompt(element, testType, framework);
    
    const claudeRequest = {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: 0.2, // Lower temperature for more consistent code generation
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    try {
      const response = await this.makeRequest('/messages', claudeRequest);
      
      if (!response.ok) {
        throw new Error(`Claude API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.content?.[0]?.text || 'Failed to generate test code';
    } catch (error) {
      throw createAppError(ErrorCode.INTERNAL_SERVER_ERROR, `Test code generation failed: ${error}`);
    }
  }

  private buildTestCodePrompt(element: TargetedElement, testType: string, framework: string): string {
    return `# Test Code Generation Request

## Element Information
- **Tag:** ${element.tagName}
- **ID:** ${element.id || 'None'}
- **Classes:** ${element.classes?.join(', ') || 'None'}
- **Text Content:** ${element.innerText || 'None'}
- **Selector:** ${element.selector}
- **Accessibility Role:** ${element.accessibility?.role || 'generic'}

## Test Requirements
- **Test Type:** ${testType}
- **Framework:** ${framework}
- **Element:** ${element.tagName} with selector "${element.selector}"

Please generate comprehensive test code that:
1. Tests the element's basic functionality
2. Verifies accessibility compliance
3. Tests user interactions
4. Includes proper setup and teardown
5. Follows best practices for ${framework}

Format the response as clean, executable test code with proper imports and setup.`;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public getConfig(): Readonly<ClaudeConfig> {
    return { ...this.config };
  }
}
