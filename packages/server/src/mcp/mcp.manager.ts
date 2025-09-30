/**
 * MCP Manager for MCP Pointer v2.0
 * Manages MCP server instances and integrates with the main server
 */

import { MCPServer, type MCPToolContext } from './mcp.server.js';
import type { AppConfig, TargetedElement } from '@mcp-pointer/shared';
import { createAppError, ErrorCode } from '@mcp-pointer/shared';
import type { AIConfig } from '../ai/ai.manager.js';

export class MCPManager {
  private mcpServer: MCPServer;
  // private config: AppConfig;
  private isStarted: boolean = false;
  private activeContexts: Map<string, MCPToolContext> = new Map();

  constructor(_config: AppConfig, aiConfig?: AIConfig) {
    // this.config = config;
    this.mcpServer = new MCPServer(aiConfig);
  }

  public async start(): Promise<void> {
    if (this.isStarted) {
      throw createAppError(ErrorCode.INTERNAL_SERVER_ERROR, 'MCP manager already started');
    }

    try {
      await this.mcpServer.start();
      this.isStarted = true;
      console.log('✅ MCP Manager started successfully');
    } catch (error) {
      this.isStarted = false;
      throw createAppError(ErrorCode.INTERNAL_SERVER_ERROR, `Failed to start MCP manager: ${error}`);
    }
  }

  public async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    try {
      await this.mcpServer.stop();
      this.isStarted = false;
      this.activeContexts.clear();
      console.log('🛑 MCP Manager stopped');
    } catch (error) {
      console.error('Error stopping MCP manager:', error);
    }
  }

  public createContext(userId: string, sessionId: string): MCPToolContext {
    const context: MCPToolContext = {
      userId,
      sessionId,
      currentElement: undefined
    };

    this.activeContexts.set(sessionId, context);
    this.mcpServer.setContext(context);

    console.log(`🔧 MCP context created for user ${userId} (session: ${sessionId})`);
    return context;
  }

  public updateElementForUser(userId: string, element: TargetedElement): void {
    // Find the context for this user
    const context = Array.from(this.activeContexts.values())
      .find(ctx => ctx.userId === userId);

    if (context) {
      context.currentElement = element;
      this.mcpServer.updateCurrentElement(element);
      console.log(`🎯 Updated element for user ${userId}: ${element.selector}`);
    } else {
      console.warn(`No active MCP context found for user ${userId}`);
    }
  }

  public removeContext(sessionId: string): void {
    const context = this.activeContexts.get(sessionId);
    if (context) {
      this.activeContexts.delete(sessionId);
      console.log(`🗑️ MCP context removed for session ${sessionId} (user: ${context.userId})`);
    }
  }

  public getActiveContexts(): MCPToolContext[] {
    return Array.from(this.activeContexts.values());
  }

  public getContextForUser(userId: string): MCPToolContext | undefined {
    return Array.from(this.activeContexts.values())
      .find(ctx => ctx.userId === userId);
  }

  public isRunning(): boolean {
    return this.isStarted;
  }

  public getStatus(): {
    isRunning: boolean;
    activeContexts: number;
    tools: string[];
  } {
    return {
      isRunning: this.isStarted,
      activeContexts: this.activeContexts.size,
      tools: [
        'get-pointed-element',
        'get-page-elements',
        'highlight-element',
        'get-page-info',
        'execute-javascript'
      ]
    };
  }

  public getAvailableTools(): string[] {
    return [
      'get-pointed-element',
      'get-page-elements', 
      'highlight-element',
      'get-page-info',
      'execute-javascript'
    ];
  }

  public getToolDescription(toolName: string): string {
    const descriptions: Record<string, string> = {
      'get-pointed-element': 'Get detailed information about the currently pointed DOM element',
      'get-page-elements': 'Get information about multiple elements on the current page',
      'highlight-element': 'Highlight a specific element on the page',
      'get-page-info': 'Get general information about the current page',
      'execute-javascript': 'Execute JavaScript code in the browser context'
    };

    return descriptions[toolName] || 'Unknown tool';
  }
}

