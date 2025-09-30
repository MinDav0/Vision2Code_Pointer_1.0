/**
 * WebRTC Manager for MCP Pointer v2.0
 * Manages WebRTC connections and integrates with the main server
 */

import { EventEmitter } from 'events';
import { WebRTCService, type WebRTCConnection, type WebRTCEventData } from './webrtc.service.js';
import type { AppConfig, TargetedElement } from '@mcp-pointer/shared';
import { createAppError, ErrorCode } from '@mcp-pointer/shared';

export class WebRTCManager extends EventEmitter {
  private webrtcService: WebRTCService;
  private config: AppConfig;
  private isStarted: boolean = false;

  constructor(config: AppConfig) {
    super();
    this.config = config;
    this.webrtcService = new WebRTCService(
      config.webrtc,
      config.server.webrtcPort || 7008
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle element selection events
    this.webrtcService.on('element_selected', (eventData: WebRTCEventData) => {
      this.handleElementSelected(eventData);
    });

    // Handle element hover events
    this.webrtcService.on('element_hover', (eventData: WebRTCEventData) => {
      this.handleElementHover(eventData);
    });

    // Handle connection events
    this.webrtcService.on('connection_closed', (eventData: WebRTCEventData) => {
      this.handleConnectionClosed(eventData);
    });

    // Handle errors
    this.webrtcService.on('error', (error: Error) => {
      console.error('WebRTC service error:', error);
    });
  }

  private async handleElementSelected(eventData: WebRTCEventData): Promise<void> {
    try {
      const { connectionId: _connectionId, userId, data: elementData } = eventData;
      
      console.log(`🎯 Element selected by user ${userId}:`, {
        selector: elementData.selector,
        tagName: elementData.tagName,
        url: elementData.url
      });

      // Here you would typically:
      // 1. Store element data in database
      // 2. Process element for AI analysis
      // 3. Notify other services
      // 4. Update user's current element state

      // For now, we'll just log the selection
      await this.logElementSelection(userId, elementData);

      // Emit event for other services to handle
      this.emit('element_selected', eventData);

    } catch (error) {
      console.error('Error handling element selection:', error);
    }
  }

  private async handleElementHover(eventData: WebRTCEventData): Promise<void> {
    try {
      const { connectionId: _connectionId, userId, data: elementData } = eventData;
      
      // Handle element hover (less critical than selection)
      // Could be used for preview functionality
      console.log(`👆 Element hovered by user ${userId}:`, elementData.selector);

    } catch (error) {
      console.error('Error handling element hover:', error);
    }
  }

  private async handleConnectionClosed(eventData: WebRTCEventData): Promise<void> {
    try {
      const { connectionId: _connectionId, userId } = eventData;
      
      console.log(`🔌 Connection closed for user ${userId}: ${_connectionId}`);
      
      // Clean up any user-specific state
      await this.cleanupUserState(userId);

      // Emit event for other services to handle
      this.emit('connection_closed', eventData);

    } catch (error) {
      console.error('Error handling connection close:', error);
    }
  }

  private async logElementSelection(userId: string, elementData: TargetedElement): Promise<void> {
    // This would typically log to the database
    // For now, we'll just log to console
    console.log(`📊 Element selection logged for user ${userId}:`, {
      timestamp: new Date().toISOString(),
      element: {
        selector: elementData.selector,
        tagName: elementData.tagName,
        url: elementData.url
      }
    });
  }

  private async cleanupUserState(userId: string): Promise<void> {
    // Clean up any user-specific state when connection closes
    console.log(`🧹 Cleaning up state for user ${userId}`);
  }

  public async start(): Promise<void> {
    if (this.isStarted) {
      throw createAppError(ErrorCode.INTERNAL_SERVER_ERROR, 'WebRTC manager already started');
    }

    try {
      console.log(`🚀 Starting WebRTC service on port ${this.config.server.webrtcPort || 7008}`);
      this.isStarted = true;
      console.log('✅ WebRTC service started successfully');
    } catch (error) {
      this.isStarted = false;
      throw createAppError(ErrorCode.INTERNAL_SERVER_ERROR, `Failed to start WebRTC service: ${error}`);
    }
  }

  public async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    try {
      this.webrtcService.close();
      this.isStarted = false;
      console.log('🛑 WebRTC service stopped');
    } catch (error) {
      console.error('Error stopping WebRTC service:', error);
    }
  }

  public getConnectionCount(): number {
    return this.webrtcService.getConnectionCount();
  }

  public getConnectionsForUser(userId: string): WebRTCConnection[] {
    return this.webrtcService.getConnectionsForUser(userId);
  }

  public getCurrentElement(userId: string): TargetedElement | null {
    return this.webrtcService.getCurrentElement(userId);
  }

  public sendMessageToUser(userId: string, message: any): void {
    this.webrtcService.broadcastToUser(userId, message);
  }

  public isRunning(): boolean {
    return this.isStarted;
  }

  public getStatus(): {
    isRunning: boolean;
    connectionCount: number;
    port: number;
  } {
    return {
      isRunning: this.isStarted,
      connectionCount: this.getConnectionCount(),
      port: this.config.server.webrtcPort || 7008
    };
  }
}
