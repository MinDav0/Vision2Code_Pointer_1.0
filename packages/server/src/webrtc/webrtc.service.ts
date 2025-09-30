/**
 * WebRTC Service for MCP Pointer v2.0
 * Handles real-time communication between browser extension and server
 */

import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import type { 
  WebRTCConfig, 
  WebRTCMessage, 
  TargetedElement
} from '@mcp-pointer/shared';
import { generateUUID } from '@mcp-pointer/shared';

export interface WebRTCConnection {
  id: string;
  userId: string;
  socket: WebSocket;
  isAlive: boolean;
  lastPing: number;
  currentElement?: TargetedElement;
}

export interface WebRTCEventData {
  connectionId: string;
  userId: string;
  data: any;
  timestamp: number;
}

export class WebRTCService extends EventEmitter {
  private wss: WebSocketServer;
  private connections: Map<string, WebRTCConnection> = new Map();
  private config: WebRTCConfig;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(config: WebRTCConfig, port: number) {
    super();
    this.config = config;
    
    // Create WebSocket server for WebRTC signaling
    this.wss = new WebSocketServer({ 
      port,
      perMessageDeflate: false // Disable compression for better performance
    });

    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (socket: WebSocket, request) => {
      const connectionId = this.generateConnectionId();
      const userId = this.extractUserIdFromRequest(request);
      
      if (!userId) {
        socket.close(1008, 'Authentication required');
        return;
      }

      const connection: WebRTCConnection = {
        id: connectionId,
        userId,
        socket,
        isAlive: true,
        lastPing: Date.now()
      };

      this.connections.set(connectionId, connection);
      
      console.log(`🔗 WebRTC connection established: ${connectionId} (user: ${userId})`);
      
      // Send connection confirmation
      this.sendMessage(connectionId, {
        type: 'element-data',
        payload: { type: 'connection_established', connectionId, iceServers: this.config.iceServers },
        timestamp: Date.now(),
        messageId: generateUUID()
      });

      // Handle incoming messages
      socket.on('message', (data: Buffer) => {
        try {
          const message: WebRTCMessage = JSON.parse(data.toString());
          this.handleMessage(connectionId, message);
        } catch (error) {
          console.error('Invalid WebRTC message:', error);
          this.sendError(connectionId, 'Invalid message format');
        }
      });

      // Handle connection close
      socket.on('close', () => {
        this.handleDisconnection(connectionId);
      });

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`WebRTC connection error (${connectionId}):`, error);
        this.handleDisconnection(connectionId);
      });

      // Handle pong responses
      socket.on('pong', () => {
        const connection = this.connections.get(connectionId);
        if (connection) {
          connection.isAlive = true;
          connection.lastPing = Date.now();
        }
      });
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
      this.emit('error', error);
    });
  }

  private extractUserIdFromRequest(request: any): string | null {
    // Extract user ID from query parameters or headers
    const url = new URL(request.url, `http://${request.headers.host}`);
    return url.searchParams.get('userId') || null;
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleMessage(connectionId: string, message: WebRTCMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      console.error(`Connection not found: ${connectionId}`);
      return;
    }

    console.log(`📨 WebRTC message from ${connectionId}:`, message.type);

    switch (message.type) {
      case 'heartbeat':
        this.handleHeartbeat(connectionId, message.payload);
        break;
      
      case 'element-data':
        this.handleElementData(connectionId, message.payload);
        break;
      
      case 'error':
        this.handleError(connectionId, message.payload);
        break;
      
      default:
        console.warn(`Unknown WebRTC message type: ${message.type}`);
        this.sendError(connectionId, `Unknown message type: ${message.type}`);
    }
  }

  private handleHeartbeat(connectionId: string, _payload: unknown): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isAlive = true;
      connection.lastPing = Date.now();
    }
    this.sendMessage(connectionId, { 
      type: 'heartbeat', 
      payload: { timestamp: Date.now() },
      timestamp: Date.now(),
      messageId: generateUUID()
    });
  }

  private handleElementData(connectionId: string, payload: unknown): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Handle different types of element data
    if (payload && typeof payload === 'object' && 'type' in payload) {
      const data = payload as any;
      
      if (data.type === 'element_selected' && data.element) {
        // Update current element for this connection
        connection.currentElement = data.element;

        // Emit event for other services to handle
        this.emit('element_selected', {
          connectionId,
          userId: connection.userId,
          data: data.element,
          timestamp: Date.now()
        });

        // Send confirmation
        this.sendMessage(connectionId, {
          type: 'element-data',
          payload: { 
            type: 'element_selected_confirmed',
            elementId: data.element.id,
            timestamp: Date.now()
          },
          timestamp: Date.now(),
          messageId: generateUUID()
        });
      } else if (data.type === 'element_hover' && data.element) {
        this.handleElementHover(connectionId, data.element);
      }
    }
  }

  private handleError(connectionId: string, payload: unknown): void {
    console.error(`WebRTC error from ${connectionId}:`, payload);
    // Handle error appropriately
  }

  private handleElementHover(connectionId: string, elementData: Partial<TargetedElement>): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Emit hover event
    this.emit('element_hover', {
      connectionId,
      userId: connection.userId,
      data: elementData,
      timestamp: Date.now()
    });
  }

  private handleDisconnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      console.log(`🔌 WebRTC connection closed: ${connectionId} (user: ${connection.userId})`);
      
      // Emit disconnection event
      this.emit('connection_closed', {
        connectionId,
        userId: connection.userId,
        timestamp: Date.now()
      });
      
      this.connections.delete(connectionId);
    }
  }

  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      this.connections.forEach((connection, connectionId) => {
        if (!connection.isAlive) {
          console.log(`💔 Terminating dead connection: ${connectionId}`);
          connection.socket.terminate();
          this.handleDisconnection(connectionId);
          return;
        }

        connection.isAlive = false;
        connection.socket.ping();
      });
    }, 30000); // Ping every 30 seconds
  }

  public sendMessage(connectionId: string, message: WebRTCMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      console.warn(`Cannot send message to closed connection: ${connectionId}`);
      return;
    }

    try {
      connection.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Failed to send message to ${connectionId}:`, error);
      this.handleDisconnection(connectionId);
    }
  }

  public sendError(connectionId: string, error: string): void {
    this.sendMessage(connectionId, {
      type: 'error',
      payload: { error, timestamp: Date.now() },
      timestamp: Date.now(),
      messageId: generateUUID()
    });
  }

  public broadcastToUser(userId: string, message: WebRTCMessage): void {
    this.connections.forEach((connection) => {
      if (connection.userId === userId) {
        this.sendMessage(connection.id, message);
      }
    });
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public getConnectionsForUser(userId: string): WebRTCConnection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.userId === userId
    );
  }

  public getCurrentElement(userId: string): TargetedElement | null {
    const connections = this.getConnectionsForUser(userId);
    return connections[0]?.currentElement || null;
  }

  public close(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.connections.forEach((connection) => {
      connection.socket.close(1000, 'Server shutting down');
    });

    this.wss.close();
    console.log('🔌 WebRTC service closed');
  }
}

