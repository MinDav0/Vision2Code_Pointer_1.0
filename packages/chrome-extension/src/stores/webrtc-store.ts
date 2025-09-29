/**
 * WebRTC Store - Zustand store for WebRTC connection state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { WebRTCMessage } from '@mcp-pointer/shared';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface WebRTCState {
  connectionStatus: ConnectionStatus;
  lastMessage: WebRTCMessage | null;
  messageHistory: WebRTCMessage[];
  connectionAttempts: number;
  lastConnectedAt: number | null;
  lastDisconnectedAt: number | null;
  serverUrl: string | null;
  userId: string | null;
}

interface WebRTCActions {
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastMessage: (message: WebRTCMessage | null) => void;
  addMessage: (message: WebRTCMessage) => void;
  clearMessageHistory: () => void;
  incrementConnectionAttempts: () => void;
  resetConnectionAttempts: () => void;
  setConnectionTime: (connected: boolean) => void;
  setServerConfig: (serverUrl: string, userId: string) => void;
  getConnectionDuration: () => number | null;
  getMessageCount: () => number;
}

type WebRTCStore = WebRTCState & WebRTCActions;

export const useWebRTCStore = create<WebRTCStore>()(
  devtools(
    (set, get) => ({
      // State
      connectionStatus: 'disconnected',
      lastMessage: null,
      messageHistory: [],
      connectionAttempts: 0,
      lastConnectedAt: null,
      lastDisconnectedAt: null,
      serverUrl: null,
      userId: null,

      // Actions
      setConnectionStatus: (status) => {
        set((state) => {
          const newState: Partial<WebRTCState> = { connectionStatus: status };
          
          // Update connection timestamps
          if (status === 'connected' && state.connectionStatus !== 'connected') {
            newState.lastConnectedAt = Date.now();
            newState.connectionAttempts = 0;
          } else if (status === 'disconnected' && state.connectionStatus === 'connected') {
            newState.lastDisconnectedAt = Date.now();
          }
          
          return { ...state, ...newState };
        });
      },

      setLastMessage: (message) => {
        set({ lastMessage: message });
      },

      addMessage: (message) => {
        set((state) => {
          const history = [...state.messageHistory];
          
          // Add to beginning and limit to 100 messages
          history.unshift(message);
          if (history.length > 100) {
            history.splice(100);
          }
          
          return {
            lastMessage: message,
            messageHistory: history
          };
        });
      },

      clearMessageHistory: () => {
        set({
          messageHistory: [],
          lastMessage: null
        });
      },

      incrementConnectionAttempts: () => {
        set((state) => ({
          connectionAttempts: state.connectionAttempts + 1
        }));
      },

      resetConnectionAttempts: () => {
        set({ connectionAttempts: 0 });
      },

      setConnectionTime: (connected) => {
        const timestamp = Date.now();
        set({
          [connected ? 'lastConnectedAt' : 'lastDisconnectedAt']: timestamp
        });
      },

      setServerConfig: (serverUrl, userId) => {
        set({ serverUrl, userId });
      },

      getConnectionDuration: () => {
        const state = get();
        if (state.lastConnectedAt && state.connectionStatus === 'connected') {
          return Date.now() - state.lastConnectedAt;
        }
        return null;
      },

      getMessageCount: () => {
        const state = get();
        return state.messageHistory.length;
      }
    }),
    {
      name: 'webrtc-store',
      partialize: (state: WebRTCState) => ({
        serverUrl: state.serverUrl,
        userId: state.userId,
        lastConnectedAt: state.lastConnectedAt,
        lastDisconnectedAt: state.lastDisconnectedAt
      })
    }
  )
);

