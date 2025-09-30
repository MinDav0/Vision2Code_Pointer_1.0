/**
 * AI Manager for MCP Pointer v2.0
 * Coordinates between different AI services (Claude, local LLMs, etc.)
 */

import { ClaudeService, type ClaudeConfig, type ClaudeAnalysisRequest } from './claude.service.js';
import { CursorService, type CursorConfig, type CursorAnalysisRequest } from './cursor.service.js';
import type { TargetedElement } from '@mcp-pointer/shared';
import { createAppError, ErrorCode } from '@mcp-pointer/shared';

export interface AIConfig {
  claude?: ClaudeConfig;
  cursor?: CursorConfig;
  localLLM?: {
    enabled: boolean;
    modelPath?: string;
    apiUrl?: string;
  };
  fallbackToLocal: boolean;
  cacheEnabled: boolean;
  cacheTTL: number; // in milliseconds
}

export interface AIAnalysisRequest {
  element: TargetedElement;
  analysisType: 'accessibility' | 'performance' | 'semantics' | 'usability' | 'comprehensive';
  includeSuggestions: boolean;
  includeCodeExamples: boolean;
  context?: string;
  preferLocal?: boolean;
}

export interface AIAnalysisResponse {
  analysis: string;
  suggestions: string[];
  codeExamples: string[];
  confidence: number;
  source: 'claude' | 'cursor' | 'local' | 'fallback';
  metadata: {
    model: string;
    tokensUsed?: number;
    processingTime: number;
    cached: boolean;
  };
}

export class AIManager {
  private claudeService?: ClaudeService;
  private cursorService?: CursorService;
  private config: AIConfig;
  private cache: Map<string, { response: AIAnalysisResponse; timestamp: number }> = new Map();
  private isInitialized: boolean = false;

  constructor(config: AIConfig) {
    this.config = config;
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize Cursor service if configured
      if (this.config.cursor?.enabled) {
        this.cursorService = new CursorService(this.config.cursor);
        await this.cursorService.initialize();
        console.log('✅ Cursor AI service initialized');
      }

      // Initialize Claude service if configured
      if (this.config.claude?.apiKey) {
        this.claudeService = new ClaudeService(this.config.claude);
        await this.claudeService.initialize();
        console.log('✅ Claude AI service initialized');
      }

      // Initialize local LLM if configured
      if (this.config.localLLM?.enabled) {
        await this.initializeLocalLLM();
        console.log('✅ Local LLM service initialized');
      }

      this.isInitialized = true;
      console.log('🤖 AI Manager initialized successfully');
    } catch (error) {
      this.isInitialized = false;
      throw createAppError(ErrorCode.INTERNAL_SERVER_ERROR, `Failed to initialize AI Manager: ${error}`);
    }
  }

  private async initializeLocalLLM(): Promise<void> {
    // Placeholder for local LLM initialization
    // In a real implementation, this would connect to a local LLM service
    // like Ollama, LM Studio, or a custom local API
    console.log('🔧 Local LLM initialization not yet implemented');
  }

  public async analyzeElement(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.isInitialized) {
      throw createAppError(ErrorCode.INTERNAL_SERVER_ERROR, 'AI Manager not initialized');
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.config.cacheTTL) {
        return {
          ...cached.response,
          metadata: {
            ...cached.response.metadata,
            cached: true
          }
        };
      }
    }

    const startTime = Date.now();
    let response: AIAnalysisResponse;

    try {
      // Try preferred service first - prioritize Cursor AI
      if (this.cursorService?.isAvailable()) {
        response = await this.analyzeWithCursor(request);
      } else if (request.preferLocal && this.config.localLLM?.enabled) {
        response = await this.analyzeWithLocalLLM(request);
      } else if (this.claudeService?.isReady()) {
        response = await this.analyzeWithClaude(request);
      } else if (this.config.fallbackToLocal && this.config.localLLM?.enabled) {
        response = await this.analyzeWithLocalLLM(request);
      } else {
        throw new Error('No AI service available');
      }

      // Cache the response
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, {
          response,
          timestamp: Date.now()
        });
      }

      return response;
    } catch (error) {
      // Fallback to basic analysis if all AI services fail
      console.warn('AI analysis failed, using fallback:', error);
      return this.generateFallbackAnalysis(request, Date.now() - startTime);
    }
  }

  private async analyzeWithCursor(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.cursorService) {
      throw new Error('Cursor service not available');
    }

    const cursorRequest: CursorAnalysisRequest = {
      element: request.element,
      analysisType: request.analysisType,
      includeSuggestions: request.includeSuggestions,
      includeCodeExamples: request.includeCodeExamples,
      context: request.context
    };

    const cursorResponse = await this.cursorService.analyzeElement(cursorRequest);

    return {
      analysis: cursorResponse.analysis,
      suggestions: cursorResponse.suggestions,
      codeExamples: cursorResponse.codeExamples,
      confidence: cursorResponse.confidence,
      source: 'cursor',
      metadata: {
        model: cursorResponse.metadata.model,
        processingTime: cursorResponse.metadata.processingTime,
        cached: false
      }
    };
  }

  private async analyzeWithClaude(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.claudeService) {
      throw new Error('Claude service not available');
    }

    const claudeRequest: ClaudeAnalysisRequest = {
      element: request.element,
      analysisType: request.analysisType,
      includeSuggestions: request.includeSuggestions,
      includeCodeExamples: request.includeCodeExamples,
      context: request.context
    };

    const claudeResponse = await this.claudeService.analyzeElement(claudeRequest);

    return {
      analysis: claudeResponse.analysis,
      suggestions: claudeResponse.suggestions,
      codeExamples: claudeResponse.codeExamples,
      confidence: claudeResponse.confidence,
      source: 'claude',
      metadata: {
        model: claudeResponse.metadata.model,
        tokensUsed: claudeResponse.metadata.tokensUsed,
        processingTime: claudeResponse.metadata.processingTime,
        cached: false
      }
    };
  }

  private async analyzeWithLocalLLM(_request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    // Placeholder for local LLM analysis
    // In a real implementation, this would call a local LLM service
    throw new Error('Local LLM analysis not yet implemented');
  }

  private generateFallbackAnalysis(request: AIAnalysisRequest, processingTime: number): AIAnalysisResponse {
    const { element } = request;
    
    let analysis = `# Fallback Analysis: ${element.tagName} Element\n\n`;
    analysis += `**Note:** This is a basic analysis as AI services are currently unavailable.\n\n`;
    
    // Basic accessibility checks
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!element.accessibility?.ariaLabel && !element.innerText) {
      issues.push('Missing accessible name');
      suggestions.push('Add aria-label or descriptive text content');
    }

    if (element.tagName === 'BUTTON' && !element.accessibility?.role) {
      issues.push('Button missing explicit role');
      suggestions.push('Ensure button has proper role attribute');
    }

    if (element.accessibility?.tabIndex === -1) {
      issues.push('Element not keyboard accessible');
      suggestions.push('Remove tabIndex: -1 or provide alternative access');
    }

    if (issues.length === 0) {
      analysis += `✅ **Basic checks passed**\n\n`;
    } else {
      analysis += `⚠️ **Issues found:**\n`;
      issues.forEach(issue => analysis += `- ${issue}\n`);
      analysis += `\n`;
    }

    if (suggestions.length > 0) {
      analysis += `## Suggestions\n`;
      suggestions.forEach(suggestion => analysis += `- ${suggestion}\n`);
      analysis += `\n`;
    }

    analysis += `## Element Details\n`;
    analysis += `- **Tag:** ${element.tagName}\n`;
    analysis += `- **ID:** ${element.id || 'None'}\n`;
    analysis += `- **Classes:** ${element.classes?.join(', ') || 'None'}\n`;
    analysis += `- **Text:** ${element.innerText?.substring(0, 100) || 'None'}\n`;

    return {
      analysis,
      suggestions,
      codeExamples: [],
      confidence: 0.3, // Lower confidence for fallback
      source: 'fallback',
      metadata: {
        model: 'fallback-analysis',
        processingTime,
        cached: false
      }
    };
  }

  private generateCacheKey(request: AIAnalysisRequest): string {
    const key = {
      element: {
        tagName: request.element.tagName,
        id: request.element.id,
        classes: request.element.classes,
        selector: request.element.selector
      },
      analysisType: request.analysisType,
      includeSuggestions: request.includeSuggestions,
      includeCodeExamples: request.includeCodeExamples,
      context: request.context
    };
    return JSON.stringify(key);
  }

  public async generateTestCode(element: TargetedElement, testType: string, framework: string): Promise<string> {
    if (!this.isInitialized) {
      throw createAppError(ErrorCode.INTERNAL_SERVER_ERROR, 'AI Manager not initialized');
    }

    try {
      if (this.claudeService?.isReady()) {
        return await this.claudeService.generateTestCode(element, testType, framework);
      } else {
        // Fallback to basic test code generation
        return this.generateBasicTestCode(element, testType, framework);
      }
    } catch (error) {
      console.warn('AI test code generation failed, using fallback:', error);
      return this.generateBasicTestCode(element, testType, framework);
    }
  }

  private generateBasicTestCode(element: TargetedElement, _testType: string, _framework: string): string {
    let testCode = `# Basic Test Code for ${element.tagName} Element\n\n`;
    testCode += `**Note:** This is basic test code as AI services are currently unavailable.\n\n`;
    
    testCode += `\`\`\`javascript\n`;
    testCode += `import { render, screen } from '@testing-library/react';\n\n`;
    testCode += `describe('${element.tagName} Element Tests', () => {\n`;
    testCode += `  it('should render ${element.tagName} element', () => {\n`;
    testCode += `    render(<Component />);\n`;
    testCode += `    const element = screen.getByRole('${element.accessibility?.role || 'generic'}');\n`;
    testCode += `    expect(element).toBeInTheDocument();\n`;
    testCode += `  });\n`;
    
    if (element.innerText) {
      testCode += `\n  it('should display correct text content', () => {\n`;
      testCode += `    render(<Component />);\n`;
      testCode += `    expect(screen.getByText('${element.innerText.substring(0, 50)}')).toBeInTheDocument();\n`;
      testCode += `  });\n`;
    }
    
    testCode += `});\n`;
    testCode += `\`\`\`\n`;

    return testCode;
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need to track hits/misses in a real implementation
    };
  }

  public isReady(): boolean {
    return this.isInitialized && (this.claudeService?.isReady() || this.config.localLLM?.enabled || false);
  }

  public getStatus(): {
    claude: boolean;
    localLLM: boolean;
    cache: boolean;
  } {
    return {
      claude: this.claudeService?.isReady() || false,
      localLLM: this.config.localLLM?.enabled || false,
      cache: this.config.cacheEnabled
    };
  }
}
