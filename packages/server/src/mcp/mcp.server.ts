/**
 * MCP Server Implementation for MCP Pointer v2.0
 * Handles Model Context Protocol communication with AI tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
  TextContent,
  ImageContent,
  EmbeddedResource
} from '@modelcontextprotocol/sdk/types.js';
import type { TargetedElement, User } from '@mcp-pointer/shared';
import { createAppError, ErrorCode } from '@mcp-pointer/shared';

export interface MCPToolContext {
  userId: string;
  currentElement?: TargetedElement;
  sessionId: string;
}

export class MCPServer {
  private server: Server;
  private context: MCPToolContext | null = null;
  private tools: Tool[] = [];

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-pointer-server',
        version: '2.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupTools();
    this.setupHandlers();
  }

  private setupTools(): void {
    this.tools = [
      {
        name: 'get-pointed-element',
        description: 'Get detailed information about the currently pointed DOM element',
        inputSchema: {
          type: 'object',
          properties: {
            includeStyles: {
              type: 'boolean',
              description: 'Include CSS styles and computed styles',
              default: true
            },
            includeAccessibility: {
              type: 'boolean',
              description: 'Include accessibility information',
              default: true
            },
            includeReactInfo: {
              type: 'boolean',
              description: 'Include React component information if available',
              default: true
            },
            includeScreenshot: {
              type: 'boolean',
              description: 'Include a screenshot of the element',
              default: false
            }
          }
        }
      },
      {
        name: 'get-page-elements',
        description: 'Get information about multiple elements on the current page',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector to filter elements',
              default: '*'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of elements to return',
              default: 10,
              minimum: 1,
              maximum: 100
            },
            includeText: {
              type: 'boolean',
              description: 'Include text content of elements',
              default: true
            }
          }
        }
      },
      {
        name: 'highlight-element',
        description: 'Highlight a specific element on the page',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector of the element to highlight'
            },
            duration: {
              type: 'number',
              description: 'Duration of highlight in milliseconds',
              default: 3000,
              minimum: 500,
              maximum: 10000
            },
            color: {
              type: 'string',
              description: 'Highlight color (CSS color value)',
              default: '#ffeb3b'
            }
          },
          required: ['selector']
        }
      },
      {
        name: 'get-page-info',
        description: 'Get general information about the current page',
        inputSchema: {
          type: 'object',
          properties: {
            includeMeta: {
              type: 'boolean',
              description: 'Include page metadata',
              default: true
            },
            includePerformance: {
              type: 'boolean',
              description: 'Include performance metrics',
              default: false
            }
          }
        }
      },
      {
        name: 'execute-javascript',
        description: 'Execute JavaScript code in the browser context',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'JavaScript code to execute'
            },
            returnValue: {
              type: 'boolean',
              description: 'Whether to return the result of the code execution',
              default: true
            }
          },
          required: ['code']
        }
      },
      {
        name: 'analyze-element-with-ai',
        description: 'Analyze the current element using AI to provide insights and suggestions',
        inputSchema: {
          type: 'object',
          properties: {
            analysisType: {
              type: 'string',
              enum: ['accessibility', 'performance', 'semantics', 'usability', 'comprehensive'],
              description: 'Type of analysis to perform',
              default: 'comprehensive'
            },
            includeSuggestions: {
              type: 'boolean',
              description: 'Include improvement suggestions',
              default: true
            },
            includeCodeExamples: {
              type: 'boolean',
              description: 'Include code examples for improvements',
              default: true
            }
          }
        }
      },
      {
        name: 'generate-test-code',
        description: 'Generate test code for the current element',
        inputSchema: {
          type: 'object',
          properties: {
            testType: {
              type: 'string',
              enum: ['unit', 'integration', 'e2e', 'accessibility'],
              description: 'Type of test to generate',
              default: 'unit'
            },
            framework: {
              type: 'string',
              enum: ['jest', 'vitest', 'cypress', 'playwright', 'testing-library'],
              description: 'Testing framework to use',
              default: 'testing-library'
            },
            includeSetup: {
              type: 'boolean',
              description: 'Include test setup code',
              default: true
            }
          }
        }
      },
      {
        name: 'get-cursor-context',
        description: 'Get context information for Cursor AI integration',
        inputSchema: {
          type: 'object',
          properties: {
            includeCodeContext: {
              type: 'boolean',
              description: 'Include surrounding code context',
              default: true
            },
            includeFileStructure: {
              type: 'boolean',
              description: 'Include file structure information',
              default: false
            },
            maxContextLines: {
              type: 'number',
              description: 'Maximum number of context lines to include',
              default: 50,
              minimum: 10,
              maximum: 200
            }
          }
        }
      }
    ];
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get-pointed-element':
            return await this.handleGetPointedElement(args);
          
          case 'get-page-elements':
            return await this.handleGetPageElements(args);
          
          case 'highlight-element':
            return await this.handleHighlightElement(args);
          
          case 'get-page-info':
            return await this.handleGetPageInfo(args);
          
          case 'execute-javascript':
            return await this.handleExecuteJavaScript(args);
          
          case 'analyze-element-with-ai':
            return await this.handleAnalyzeElementWithAI(args);
          
          case 'generate-test-code':
            return await this.handleGenerateTestCode(args);
          
          case 'get-cursor-context':
            return await this.handleGetCursorContext(args);
          
          default:
            throw createAppError(ErrorCode.INVALID_INPUT, `Unknown tool: ${name}`, 400);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  private async handleGetPointedElement(args: any): Promise<CallToolResult> {
    if (!this.context?.currentElement) {
      return {
        content: [
          {
            type: 'text',
            text: 'No element is currently pointed/selected. Please select an element first.'
          }
        ]
      };
    }

    const element = this.context.currentElement;
    const includeStyles = args.includeStyles ?? true;
    const includeAccessibility = args.includeAccessibility ?? true;
    const includeReactInfo = args.includeReactInfo ?? true;
    const includeScreenshot = args.includeScreenshot ?? false;

    let content: (TextContent | ImageContent | EmbeddedResource)[] = [
      {
        type: 'text',
        text: `# Pointed Element Information

## Basic Information
- **Tag Name:** ${element.tagName}
- **Selector:** \`${element.selector}\`
- **ID:** ${element.id || 'None'}
- **Classes:** ${element.classes?.join(', ') || 'None'}
- **Text Content:** ${element.innerText?.substring(0, 200) || 'None'}${element.innerText && element.innerText.length > 200 ? '...' : ''}

## Location
- **URL:** ${element.url}
- **Position:** X: ${element.position?.x}, Y: ${element.position?.y}
- **Size:** Width: ${element.position?.width}px, Height: ${element.position?.height}px

## Attributes
${Object.entries(element.attributes || {}).map(([key, value]) => `- **${key}:** ${value}`).join('\n') || 'None'}

## Accessibility
${includeAccessibility && element.accessibility ? `
- **Role:** ${element.accessibility.role || 'None'}
- **Aria Label:** ${element.accessibility.ariaLabel || 'None'}
- **Aria Described By:** ${element.accessibility.ariaDescribedBy || 'None'}
- **Tab Index:** ${element.accessibility.tabIndex || 'None'}
- **Focusable:** ${element.accessibility.isFocusable ? 'Yes' : 'No'}
- **Visible:** ${element.accessibility.isVisible ? 'Yes' : 'No'}
` : ''}

## Component Information
${includeReactInfo && element.componentInfo ? `
- **Component Name:** ${element.componentInfo.name || 'Unknown'}
- **Source File:** ${element.componentInfo.sourceFile || 'Unknown'}
` : ''}

## Styles
${includeStyles && element.cssProperties ? `
### CSS Properties
${Object.entries(element.cssProperties).map(([key, value]) => `- **${key}:** ${value}`).join('\n') || 'None'}
` : ''}

---
*Element selected at: ${new Date(element.timestamp || Date.now()).toISOString()}*
*User: ${this.context.userId}*`
      }
    ];

    // Add screenshot if requested (screenshot functionality not implemented yet)
    if (includeScreenshot) {
      content.push({
        type: 'text',
        text: 'Screenshot functionality not yet implemented'
      });
    }

    return { content };
  }

  private async handleGetPageElements(args: any): Promise<CallToolResult> {
    const selector = args.selector || '*';
    const limit = Math.min(args.limit || 10, 100);
    const includeText = args.includeText ?? true;

    // This would typically query the browser for elements
    // For now, we'll return a mock response
    return {
      content: [
        {
          type: 'text',
          text: `# Page Elements (${selector})

Found elements matching selector \`${selector}\` (limited to ${limit} results):

${Array.from({ length: Math.min(limit, 5) }, (_, i) => `
## Element ${i + 1}
- **Tag:** div
- **Selector:** .element-${i + 1}
- **Text:** ${includeText ? `Sample text content ${i + 1}` : 'Not included'}
- **Classes:** element, item-${i + 1}
`).join('\n')}

*Note: This is a mock response. In a real implementation, this would query the actual DOM elements.*`
        }
      ]
    };
  }

  private async handleHighlightElement(args: any): Promise<CallToolResult> {
    const { selector, duration = 3000, color = '#ffeb3b' } = args;

    // This would typically send a message to the browser extension
    // to highlight the element
    return {
      content: [
        {
          type: 'text',
          text: `# Element Highlighted

Successfully highlighted element with selector: \`${selector}\`

**Highlight Details:**
- **Duration:** ${duration}ms
- **Color:** ${color}
- **Selector:** ${selector}

The element should now be highlighted in the browser.`
        }
      ]
    };
  }

  private async handleGetPageInfo(args: any): Promise<CallToolResult> {
    const includeMeta = args.includeMeta ?? true;
    const includePerformance = args.includePerformance ?? false;

    let content = `# Page Information

## Basic Details
- **URL:** ${this.context?.currentElement?.url || 'Unknown'}
- **Title:** ${document?.title || 'Unknown'}
- **User Agent:** ${navigator?.userAgent || 'Unknown'}

## Page Structure
- **Total Elements:** ${document?.querySelectorAll('*').length || 'Unknown'}
- **Images:** ${document?.querySelectorAll('img').length || 'Unknown'}
- **Links:** ${document?.querySelectorAll('a').length || 'Unknown'}
- **Forms:** ${document?.querySelectorAll('form').length || 'Unknown'}`;

    if (includeMeta) {
      content += `

## Meta Information
- **Viewport:** ${document?.querySelector('meta[name="viewport"]')?.getAttribute('content') || 'Not set'}
- **Description:** ${document?.querySelector('meta[name="description"]')?.getAttribute('content') || 'Not set'}
- **Keywords:** ${document?.querySelector('meta[name="keywords"]')?.getAttribute('content') || 'Not set'}`;
    }

    if (includePerformance) {
      content += `

## Performance Metrics
- **Load Time:** ${performance?.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : 'Unknown'}ms
- **DOM Ready:** ${performance?.timing ? performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : 'Unknown'}ms`;
    }

    return {
      content: [
        {
          type: 'text',
          text: content
        }
      ]
    };
  }

  private async handleExecuteJavaScript(args: any): Promise<CallToolResult> {
    const { code, returnValue = true } = args;

    // This would typically execute the code in the browser context
    // For security reasons, this should be sandboxed
    return {
      content: [
        {
          type: 'text',
          text: `# JavaScript Execution

**Code Executed:**
\`\`\`javascript
${code}
\`\`\`

**Result:** ${returnValue ? 'Code executed successfully (result would be returned in real implementation)' : 'Code executed successfully'}

*Note: This is a mock response. In a real implementation, the code would be executed in the browser context with proper sandboxing.*`
        }
      ]
    };
  }

  private async handleAnalyzeElementWithAI(args: any): Promise<CallToolResult> {
    if (!this.context?.currentElement) {
      return {
        content: [
          {
            type: 'text',
            text: 'No element is currently pointed/selected. Please select an element first.'
          }
        ]
      };
    }

    const element = this.context.currentElement;
    const analysisType = args.analysisType || 'comprehensive';
    const includeSuggestions = args.includeSuggestions ?? true;
    const includeCodeExamples = args.includeCodeExamples ?? true;

    // This is a placeholder implementation - in a real scenario, this would call an AI service
    let analysis = `# AI Analysis: ${element.tagName} Element\n\n`;
    
    switch (analysisType) {
      case 'accessibility':
        analysis += this.generateAccessibilityAnalysis(element, includeSuggestions, includeCodeExamples);
        break;
      case 'performance':
        analysis += this.generatePerformanceAnalysis(element, includeSuggestions, includeCodeExamples);
        break;
      case 'semantics':
        analysis += this.generateSemanticAnalysis(element, includeSuggestions, includeCodeExamples);
        break;
      case 'usability':
        analysis += this.generateUsabilityAnalysis(element, includeSuggestions, includeCodeExamples);
        break;
      case 'comprehensive':
      default:
        analysis += this.generateComprehensiveAnalysis(element, includeSuggestions, includeCodeExamples);
        break;
    }

    return {
      content: [
        {
          type: 'text',
          text: analysis
        }
      ]
    };
  }

  private async handleGenerateTestCode(args: any): Promise<CallToolResult> {
    if (!this.context?.currentElement) {
      return {
        content: [
          {
            type: 'text',
            text: 'No element is currently pointed/selected. Please select an element first.'
          }
        ]
      };
    }

    const element = this.context.currentElement;
    const testType = args.testType || 'unit';
    const framework = args.framework || 'testing-library';
    const includeSetup = args.includeSetup ?? true;

    const testCode = this.generateTestCode(element, testType, framework, includeSetup);

    return {
      content: [
        {
          type: 'text',
          text: testCode
        }
      ]
    };
  }

  private async handleGetCursorContext(args: any): Promise<CallToolResult> {
    if (!this.context?.currentElement) {
      return {
        content: [
          {
            type: 'text',
            text: 'No element is currently pointed/selected. Please select an element first.'
          }
        ]
      };
    }

    const element = this.context.currentElement;
    const includeCodeContext = args.includeCodeContext ?? true;
    const includeFileStructure = args.includeFileStructure ?? false;
    const maxContextLines = args.maxContextLines || 50;

    let context = `# Cursor AI Context for Element: ${element.selector}\n\n`;
    
    context += `## Element Information\n`;
    context += `- **Tag:** ${element.tagName}\n`;
    context += `- **ID:** ${element.id || 'None'}\n`;
    context += `- **Classes:** ${element.classes?.join(', ') || 'None'}\n`;
    context += `- **Text:** ${element.innerText?.substring(0, 100) || 'None'}\n\n`;

    if (includeCodeContext) {
      context += `## Code Context\n`;
      context += `\`\`\`html\n`;
      context += `<${element.tagName.toLowerCase()}${element.id ? ` id="${element.id}"` : ''}${element.classes?.length ? ` class="${element.classes.join(' ')}"` : ''}>\n`;
      context += `${element.innerText || ''}\n`;
      context += `</${element.tagName.toLowerCase()}>\n`;
      context += `\`\`\`\n\n`;
    }

    if (includeFileStructure) {
      context += `## File Structure Context\n`;
      context += `- **URL:** ${element.url}\n`;
      context += `- **Component:** ${element.componentInfo?.name || 'Unknown'}\n`;
      context += `- **Source File:** ${element.componentInfo?.sourceFile || 'Unknown'}\n\n`;
    }

    context += `## Development Notes\n`;
    context += `- Element selected at: ${new Date(element.timestamp || Date.now()).toISOString()}\n`;
    context += `- User: ${this.context.userId}\n`;
    context += `- Session: ${this.context.sessionId}\n`;

    return {
      content: [
        {
          type: 'text',
          text: context
        }
      ]
    };
  }

  // Helper methods for AI analysis
  private generateAccessibilityAnalysis(element: TargetedElement, includeSuggestions: boolean, includeCodeExamples: boolean): string {
    let analysis = `## Accessibility Analysis\n\n`;
    
    // Check for common accessibility issues
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!element.accessibility?.ariaLabel && !element.innerText) {
      issues.push('Missing accessible name (no aria-label or text content)');
      suggestions.push('Add aria-label or ensure element has descriptive text content');
    }

    if (element.tagName === 'BUTTON' && !element.accessibility?.role) {
      issues.push('Button missing explicit role');
      suggestions.push('Ensure button has proper role attribute');
    }

    if (element.accessibility?.tabIndex === -1) {
      issues.push('Element is not keyboard accessible (tabIndex: -1)');
      suggestions.push('Remove tabIndex: -1 or provide alternative keyboard access');
    }

    if (issues.length === 0) {
      analysis += `✅ **Good accessibility practices detected**\n\n`;
    } else {
      analysis += `⚠️ **Accessibility Issues Found:**\n`;
      issues.forEach(issue => analysis += `- ${issue}\n`);
      analysis += `\n`;
    }

    if (includeSuggestions && suggestions.length > 0) {
      analysis += `## Suggestions\n`;
      suggestions.forEach(suggestion => analysis += `- ${suggestion}\n`);
      analysis += `\n`;
    }

    if (includeCodeExamples && suggestions.length > 0) {
      analysis += `## Code Examples\n`;
      analysis += `\`\`\`html\n`;
      analysis += `<!-- Improved version -->\n`;
      analysis += `<${element.tagName.toLowerCase()}${element.id ? ` id="${element.id}"` : ''}${element.classes?.length ? ` class="${element.classes.join(' ')}"` : ''} aria-label="Descriptive label">\n`;
      analysis += `  Accessible content\n`;
      analysis += `</${element.tagName.toLowerCase()}>\n`;
      analysis += `\`\`\`\n\n`;
    }

    return analysis;
  }

  private generatePerformanceAnalysis(element: TargetedElement, includeSuggestions: boolean, includeCodeExamples: boolean): string {
    let analysis = `## Performance Analysis\n\n`;
    
    // Check for performance issues
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (element.cssProperties?.display === 'none' && element.innerText) {
      issues.push('Hidden element contains text content');
      suggestions.push('Consider using visibility: hidden or aria-hidden for screen readers');
    }

    if (element.classes?.length && element.classes.length > 10) {
      issues.push('Element has many CSS classes');
      suggestions.push('Consider consolidating CSS classes for better performance');
    }

    if (issues.length === 0) {
      analysis += `✅ **No major performance issues detected**\n\n`;
    } else {
      analysis += `⚠️ **Performance Considerations:**\n`;
      issues.forEach(issue => analysis += `- ${issue}\n`);
      analysis += `\n`;
    }

    if (includeSuggestions && suggestions.length > 0) {
      analysis += `## Suggestions\n`;
      suggestions.forEach(suggestion => analysis += `- ${suggestion}\n`);
      analysis += `\n`;
    }

    return analysis;
  }

  private generateSemanticAnalysis(element: TargetedElement, includeSuggestions: boolean, includeCodeExamples: boolean): string {
    let analysis = `## Semantic Analysis\n\n`;
    
    // Check semantic correctness
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (element.tagName === 'DIV' && element.innerText) {
      issues.push('Using div for text content');
      suggestions.push('Consider using semantic HTML elements like <p>, <span>, or <article>');
    }

    if (element.tagName === 'SPAN' && element.innerText && element.innerText.length > 100) {
      issues.push('Long text content in span element');
      suggestions.push('Consider using <p> or <div> for longer text content');
    }

    if (issues.length === 0) {
      analysis += `✅ **Good semantic structure**\n\n`;
    } else {
      analysis += `⚠️ **Semantic Issues:**\n`;
      issues.forEach(issue => analysis += `- ${issue}\n`);
      analysis += `\n`;
    }

    if (includeSuggestions && suggestions.length > 0) {
      analysis += `## Suggestions\n`;
      suggestions.forEach(suggestion => analysis += `- ${suggestion}\n`);
      analysis += `\n`;
    }

    return analysis;
  }

  private generateUsabilityAnalysis(element: TargetedElement, includeSuggestions: boolean, includeCodeExamples: boolean): string {
    let analysis = `## Usability Analysis\n\n`;
    
    // Check usability aspects
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (element.innerText && element.innerText.length < 3) {
      issues.push('Very short text content may be unclear');
      suggestions.push('Ensure text content is descriptive and clear');
    }

    if (element.accessibility?.isFocusable && !element.accessibility?.ariaLabel && !element.innerText) {
      issues.push('Focusable element lacks clear purpose');
      suggestions.push('Add aria-label or descriptive text content');
    }

    if (issues.length === 0) {
      analysis += `✅ **Good usability practices**\n\n`;
    } else {
      analysis += `⚠️ **Usability Considerations:**\n`;
      issues.forEach(issue => analysis += `- ${issue}\n`);
      analysis += `\n`;
    }

    if (includeSuggestions && suggestions.length > 0) {
      analysis += `## Suggestions\n`;
      suggestions.forEach(suggestion => analysis += `- ${suggestion}\n`);
      analysis += `\n`;
    }

    return analysis;
  }

  private generateComprehensiveAnalysis(element: TargetedElement, includeSuggestions: boolean, includeCodeExamples: boolean): string {
    let analysis = `# Comprehensive AI Analysis\n\n`;
    analysis += `**Element:** ${element.tagName} (${element.selector})\n`;
    analysis += `**Analysis Date:** ${new Date().toISOString()}\n\n`;
    
    analysis += this.generateAccessibilityAnalysis(element, includeSuggestions, includeCodeExamples);
    analysis += this.generatePerformanceAnalysis(element, includeSuggestions, includeCodeExamples);
    analysis += this.generateSemanticAnalysis(element, includeSuggestions, includeCodeExamples);
    analysis += this.generateUsabilityAnalysis(element, includeSuggestions, includeCodeExamples);
    
    return analysis;
  }

  private generateTestCode(element: TargetedElement, testType: string, framework: string, includeSetup: boolean): string {
    let testCode = `# Test Code for ${element.tagName} Element\n\n`;
    
    if (includeSetup) {
      testCode += `## Setup\n`;
      testCode += `\`\`\`javascript\n`;
      testCode += `import { render, screen } from '@testing-library/react';\n`;
      testCode += `import { Component } from './Component';\n\n`;
      testCode += `describe('${element.tagName} Element Tests', () => {\n`;
      testCode += `  beforeEach(() => {\n`;
      testCode += `    render(<Component />);\n`;
      testCode += `  });\n\n`;
    }

    testCode += `## ${testType.charAt(0).toUpperCase() + testType.slice(1)} Tests\n`;
    testCode += `\`\`\`javascript\n`;
    
    switch (testType) {
      case 'unit':
        testCode += `  it('should render ${element.tagName} element', () => {\n`;
        testCode += `    const element = screen.getByRole('${element.accessibility?.role || 'generic'}');\n`;
        testCode += `    expect(element).toBeInTheDocument();\n`;
        testCode += `  });\n\n`;
        
        if (element.innerText) {
          testCode += `  it('should display correct text content', () => {\n`;
          testCode += `    expect(screen.getByText('${element.innerText.substring(0, 50)}')).toBeInTheDocument();\n`;
          testCode += `  });\n\n`;
        }
        break;
        
      case 'accessibility':
        testCode += `  it('should be accessible', async () => {\n`;
        testCode += `    const { container } = render(<Component />);\n`;
        testCode += `    const results = await axe(container);\n`;
        testCode += `    expect(results).toHaveNoViolations();\n`;
        testCode += `  });\n\n`;
        break;
        
      case 'e2e':
        testCode += `  it('should interact with ${element.tagName} element', () => {\n`;
        testCode += `    cy.get('${element.selector}').should('be.visible');\n`;
        if (element.accessibility?.isFocusable) {
          testCode += `    cy.get('${element.selector}').focus().should('be.focused');\n`;
        }
        testCode += `  });\n\n`;
        break;
    }

    testCode += `\`\`\`\n\n`;
    
    if (includeSetup) {
      testCode += `});\n`;
    }

    return testCode;
  }

  public setContext(context: MCPToolContext): void {
    this.context = context;
  }

  public updateCurrentElement(element: TargetedElement): void {
    if (this.context) {
      this.context.currentElement = element;
    }
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('🤖 MCP Server started and ready for AI tool connections');
  }

  public async stop(): Promise<void> {
    // Cleanup if needed
    console.log('🛑 MCP Server stopped');
  }
}

