/**
 * WebRTC Client for Chrome Extension
 * Handles real-time communication with the MCP server
 */

import { EventEmitter } from 'events';
import type { WebRTCMessage, TargetedElement } from '@mcp-pointer/shared';

export interface WebRTCClientConfig {
  serverUrl: string;
  userId: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebRTCClient extends EventEmitter {
  private config: WebRTCClientConfig;
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(config: WebRTCClientConfig) {
    super();
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...config
    };
  }

  public async connect(): Promise<void> {
    try {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('WebRTC client already connected');
        return;
      }

      const url = `${this.config.serverUrl}?userId=${encodeURIComponent(this.config.userId)}`;
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('🔗 WebRTC connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebRTCMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebRTC message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('🔌 WebRTC connection closed:', event.code, event.reason);
        this.isConnected = false;
        this.stopHeartbeat();
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        // Attempt to reconnect if not a manual disconnect
        if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebRTC connection error:', error);
        this.emit('error', error);
      };

    } catch (error) {
      console.error('Failed to connect WebRTC client:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    this.stopHeartbeat();
    this.stopReconnect();
    
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }
    
    this.isConnected = false;
    this.emit('disconnected', { code: 1000, reason: 'Manual disconnect' });
  }

  public async sendMessage(message: WebRTCMessage): Promise<void> {
    if (!this.isConnected || !this.socket) {
      throw new Error('WebRTC client not connected');
    }

    try {
      this.socket.send(JSON.stringify(message));
      console.log('📤 WebRTC message sent:', message.type);
    } catch (error) {
      console.error('Failed to send WebRTC message:', error);
      throw error;
    }
  }

  public async sendElementData(element: TargetedElement): Promise<void> {
    await this.sendMessage({
      type: 'element-data',
      payload: element,
      timestamp: Date.now(),
      messageId: crypto.randomUUID()
    });
  }

  public async sendElementHover(element: Partial<TargetedElement>): Promise<void> {
    await this.sendMessage({
      type: 'element-data',
      payload: { type: 'hover', element },
      timestamp: Date.now(),
      messageId: crypto.randomUUID()
    });
  }

  public async ping(): Promise<void> {
    await this.sendMessage({
      type: 'heartbeat',
      payload: { timestamp: Date.now() },
      timestamp: Date.now(),
      messageId: crypto.randomUUID()
    });
  }

  public getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' | 'error' {
    if (this.isConnected) return 'connected';
    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) return 'connecting';
    if (this.reconnectAttempts > 0) return 'error';
    return 'disconnected';
  }

  private handleMessage(message: WebRTCMessage): void {
    console.log('📨 WebRTC message received:', message.type);
    
    switch (message.type) {
      case 'element-data':
        this.handleElementData(message.payload);
        break;
      
      case 'heartbeat':
        this.handleHeartbeat(message.payload);
        break;
      
      case 'error':
        this.handleError(message.payload);
        break;
      
      default:
        console.warn('Unknown WebRTC message type:', message.type);
    }
    
    this.emit('message', message);
  }

  private handleElementData(payload: unknown): void {
    console.log('📊 Element data received:', payload);
    this.emit('element-data', payload);
  }

  private handleHeartbeat(payload: unknown): void {
    console.log('💓 Heartbeat received:', payload);
    this.emit('heartbeat', payload);
  }

  private handleError(payload: unknown): void {
    console.error('❌ WebRTC error:', payload);
    this.emit('error', payload);
  }


  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.ping();
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.stopReconnect();
    
    const delay = Math.min(
      this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );
    
    console.log(`🔄 Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnect failed:', error);
      }
    }, delay);
  }

  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

