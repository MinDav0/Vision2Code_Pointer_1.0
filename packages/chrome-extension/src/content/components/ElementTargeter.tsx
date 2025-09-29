/**
 * ElementTargeter Component
 * Main UI component for element targeting and display
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, X, Info, CheckCircle, AlertCircle } from 'lucide-react';
import type { TargetedElement } from '@mcp-pointer/shared';

interface ElementTargeterProps {
  isConnected: boolean;
  currentElement: TargetedElement | null;
  isTargeting: boolean;
  onToggleTargeting: () => void;
  onClearElement: () => void;
}

export const ElementTargeter: React.FC<ElementTargeterProps> = ({
  isConnected,
  currentElement,
  isTargeting,
  onToggleTargeting,
  onClearElement
}) => {
  return (
    <div className="mcp-pointer-overlay">
      {/* Connection Status Indicator */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 bg-error-500 text-white px-3 py-2 rounded-lg shadow-medium flex items-center gap-2 text-sm font-medium"
          >
            <AlertCircle size={16} />
            Not connected to server
          </motion.div>
        )}
      </AnimatePresence>

      {/* Targeting Mode Indicator */}
      <AnimatePresence>
        {isTargeting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white px-4 py-2 rounded-full shadow-medium flex items-center gap-2 text-sm font-medium"
          >
            <Target size={16} />
            Targeting Mode Active
            <span className="text-xs opacity-75">(Option+Click to select)</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Element Information Panel */}
      <AnimatePresence>
        {currentElement && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-20 right-4 w-80 bg-white rounded-lg shadow-strong border border-secondary-200 p-4 pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-success-500" size={20} />
                <h3 className="font-semibold text-secondary-900">Element Selected</h3>
              </div>
              <button
                onClick={onClearElement}
                className="p-1 hover:bg-secondary-100 rounded transition-colors"
              >
                <X size={16} className="text-secondary-500" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Basic Info */}
              <div>
                <div className="text-xs font-medium text-secondary-600 mb-1">Tag</div>
                <div className="text-sm font-mono bg-secondary-50 px-2 py-1 rounded">
                  {currentElement.tagName}
                </div>
              </div>

              {/* Selector */}
              <div>
                <div className="text-xs font-medium text-secondary-600 mb-1">Selector</div>
                <div className="text-sm font-mono bg-secondary-50 px-2 py-1 rounded break-all">
                  {currentElement.selector}
                </div>
              </div>

              {/* Text Content */}
              {currentElement.innerText && (
                <div>
                  <div className="text-xs font-medium text-secondary-600 mb-1">Text</div>
                  <div className="text-sm bg-secondary-50 px-2 py-1 rounded max-h-20 overflow-y-auto">
                    {currentElement.innerText.length > 100 
                      ? `${currentElement.innerText.substring(0, 100)}...`
                      : currentElement.innerText
                    }
                  </div>
                </div>
              )}

              {/* Classes */}
              {currentElement.classes && currentElement.classes.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-secondary-600 mb-1">Classes</div>
                  <div className="flex flex-wrap gap-1">
                    {currentElement.classes.slice(0, 3).map((className: string, index: number) => (
                      <span
                        key={index}
                        className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded"
                      >
                        {className}
                      </span>
                    ))}
                    {currentElement.classes.length > 3 && (
                      <span className="text-xs text-secondary-500">
                        +{currentElement.classes.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* URL */}
              <div>
                <div className="text-xs font-medium text-secondary-600 mb-1">Page</div>
                <div className="text-xs text-secondary-600 truncate">
                  {currentElement.url}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-secondary-200">
                <button
                  onClick={() => {
                    // Copy selector to clipboard
                    navigator.clipboard.writeText(currentElement.selector);
                  }}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-xs py-2 px-3 rounded transition-colors"
                >
                  Copy Selector
                </button>
                <button
                  onClick={() => {
                    // Copy element data to clipboard
                    navigator.clipboard.writeText(JSON.stringify(currentElement, null, 2));
                  }}
                  className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white text-xs py-2 px-3 rounded transition-colors"
                >
                  Copy Data
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 right-6 pointer-events-auto"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <button
          onClick={onToggleTargeting}
          className={`
            w-14 h-14 rounded-full shadow-strong flex items-center justify-center transition-all
            ${isTargeting 
              ? 'bg-error-500 hover:bg-error-600 text-white' 
              : 'bg-primary-500 hover:bg-primary-600 text-white'
            }
          `}
        >
          {isTargeting ? (
            <X size={24} />
          ) : (
            <Target size={24} />
          )}
        </button>
      </motion.div>

      {/* Instructions */}
      <AnimatePresence>
        {!currentElement && !isTargeting && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 bg-white rounded-lg shadow-medium border border-secondary-200 p-3 pointer-events-auto max-w-xs"
          >
            <div className="flex items-start gap-2">
              <Info size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-secondary-700">
                <div className="font-medium mb-1">How to use:</div>
                <div className="space-y-1 text-xs">
                  <div>1. Click the target button</div>
                  <div>2. Hold Option + Click any element</div>
                  <div>3. View element details</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

