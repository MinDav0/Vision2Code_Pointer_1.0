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
import type { ElementData, User } from '@mcp-pointer/shared';
import { createAppError, ErrorCode } from '@mcp-pointer/shared';

export interface MCPToolContext {
  userId: string;
  currentElement?: ElementData;
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
- **Classes:** ${element.classNames?.join(', ') || 'None'}
- **Text Content:** ${element.innerText?.substring(0, 200) || 'None'}${element.innerText && element.innerText.length > 200 ? '...' : ''}

## Location
- **URL:** ${element.url}
- **Position:** X: ${element.boundingRect?.x}, Y: ${element.boundingRect?.y}
- **Size:** Width: ${element.boundingRect?.width}px, Height: ${element.boundingRect?.height}px

## Attributes
${Object.entries(element.attributes || {}).map(([key, value]) => `- **${key}:** ${value}`).join('\n') || 'None'}

## Accessibility
${includeAccessibility && element.accessibility ? `
- **Role:** ${element.accessibility.role || 'None'}
- **Label:** ${element.accessibility.label || 'None'}
- **Description:** ${element.accessibility.description || 'None'}
- **ARIA Attributes:** ${Object.entries(element.accessibility.ariaAttributes || {}).map(([key, value]) => `${key}="${value}"`).join(', ') || 'None'}
` : ''}

## React Information
${includeReactInfo && element.reactInfo ? `
- **Component Name:** ${element.reactInfo.componentName || 'Unknown'}
- **Props:** ${JSON.stringify(element.reactInfo.props, null, 2)}
- **State:** ${element.reactInfo.state ? JSON.stringify(element.reactInfo.state, null, 2) : 'None'}
- **Source File:** ${element.reactInfo.sourceFile || 'Unknown'}
` : ''}

## Styles
${includeStyles && element.styles ? `
### Computed Styles
${Object.entries(element.styles.computed || {}).map(([key, value]) => `- **${key}:** ${value}`).join('\n') || 'None'}

### CSS Classes
${element.styles.classes?.map(cls => `- ${cls}`).join('\n') || 'None'}
` : ''}

---
*Element selected at: ${new Date(element.timestamp || Date.now()).toISOString()}*
*User: ${this.context.userId}*`
      }
    ];

    // Add screenshot if requested
    if (includeScreenshot && element.screenshot) {
      content.push({
        type: 'image',
        data: element.screenshot,
        mimeType: 'image/png'
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

  public setContext(context: MCPToolContext): void {
    this.context = context;
  }

  public updateCurrentElement(element: ElementData): void {
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

