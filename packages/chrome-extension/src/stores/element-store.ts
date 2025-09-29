/**
 * Element Store - Zustand store for element state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TargetedElement } from '@mcp-pointer/shared';

interface ElementState {
  currentElement: TargetedElement | null;
  elementHistory: TargetedElement[];
  isTargeting: boolean;
  lastSelectedAt: number | null;
}

interface ElementActions {
  setCurrentElement: (element: TargetedElement | null) => void;
  addToHistory: (element: TargetedElement) => void;
  clearElement: () => void;
  clearHistory: () => void;
  setTargeting: (isTargeting: boolean) => void;
  getElementById: (id: string) => TargetedElement | null;
  getElementsBySelector: (selector: string) => TargetedElement[];
}

type ElementStore = ElementState & ElementActions;

export const useElementStore = create<ElementStore>()(
  devtools(
    (set, get) => ({
      // State
      currentElement: null,
      elementHistory: [],
      isTargeting: false,
      lastSelectedAt: null,

      // Actions
      setCurrentElement: (element) => {
        set((state) => {
          const newState: Partial<ElementState> = {
            currentElement: element,
            lastSelectedAt: element ? Date.now() : null
          };

          // Add to history if element is selected
          if (element) {
            const history = [...state.elementHistory];
            
            // Remove duplicate if exists
            const existingIndex = history.findIndex(el => el.selector === element.selector);
            if (existingIndex !== -1) {
              history.splice(existingIndex, 1);
            }
            
            // Add to beginning and limit to 50 items
            history.unshift(element);
            if (history.length > 50) {
              history.splice(50);
            }
            
            newState.elementHistory = history;
          }

          return { ...state, ...newState };
        });
      },

      addToHistory: (element) => {
        set((state) => {
          const history = [...state.elementHistory];
          
          // Remove duplicate if exists
          const existingIndex = history.findIndex(el => el.id === element.id);
          if (existingIndex !== -1) {
            history.splice(existingIndex, 1);
          }
          
          // Add to beginning and limit to 50 items
          history.unshift(element);
          if (history.length > 50) {
            history.splice(50);
          }
          
          return { elementHistory: history };
        });
      },

      clearElement: () => {
        set({
          currentElement: null,
          lastSelectedAt: null
        });
      },

      clearHistory: () => {
        set({
          elementHistory: [],
          currentElement: null,
          lastSelectedAt: null
        });
      },

      setTargeting: (isTargeting) => {
        set({ isTargeting });
      },

      getElementById: (id) => {
        const state = get();
        return state.elementHistory.find(el => el.id === id) || null;
      },

      getElementsBySelector: (selector) => {
        const state = get();
        return state.elementHistory.filter((el: TargetedElement) => el.selector === selector);
      }
    }),
    {
      name: 'element-store',
      partialize: (state: ElementState) => ({
        elementHistory: state.elementHistory.slice(0, 10), // Only persist last 10 elements
        lastSelectedAt: state.lastSelectedAt
      })
    }
  )
);

