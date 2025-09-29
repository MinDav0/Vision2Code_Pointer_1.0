/**
 * Element Detector Utility
 * Handles element detection, highlighting, and selection
 */

import type { TargetedElement } from '@mcp-pointer/shared';

export interface ElementDetectorConfig {
  onElementHover?: (element: TargetedElement) => void;
  onElementSelect?: (element: TargetedElement) => void;
  highlightColor?: string;
  highlightDuration?: number;
}

export class ElementDetector {
  private config: ElementDetectorConfig;
  private isTargeting = false;
  private currentHighlight: HTMLElement | null = null;
  private hoveredElement: HTMLElement | null = null;
  private originalStyles: { [key: string]: string } = {};
  private eventListeners: Array<{ element: Element; event: string; handler: EventListener }> = [];

  constructor(config: ElementDetectorConfig) {
    this.config = {
      highlightColor: '#3b82f6',
      highlightDuration: 3000,
      ...config
    };
  }

  public initialize(): void {
    console.log('🎯 Element detector initialized');
  }

  public startTargeting(): void {
    if (this.isTargeting) return;
    
    this.isTargeting = true;
    this.addEventListeners();
    this.showTargetingIndicator();
    console.log('🎯 Element targeting started');
  }

  public stopTargeting(): void {
    if (!this.isTargeting) return;
    
    this.isTargeting = false;
    this.removeEventListeners();
    this.clearHighlight();
    this.hideTargetingIndicator();
    console.log('🎯 Element targeting stopped');
  }

  public destroy(): void {
    this.stopTargeting();
    console.log('🎯 Element detector destroyed');
  }

  private addEventListeners(): void {
    // Mouse move for hover effects
    const mouseMoveHandler = (event: MouseEvent) => {
      if (!this.isTargeting) return;
      
      const element = event.target as HTMLElement;
      if (element && element !== this.hoveredElement) {
        this.handleElementHover(element);
      }
    };

    // Click handler for element selection
    const clickHandler = (event: MouseEvent) => {
      if (!this.isTargeting) return;
      
      // Check for Option/Alt key
      if (event.altKey || event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        
        const element = event.target as HTMLElement;
        if (element) {
          this.handleElementSelect(element);
        }
      }
    };

    // Key down handler for escape
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.isTargeting) {
        this.stopTargeting();
      }
    };

    document.addEventListener('mousemove', mouseMoveHandler as EventListener);
    document.addEventListener('click', clickHandler as EventListener, true);
    document.addEventListener('keydown', keyDownHandler as EventListener);

    this.eventListeners.push(
      { element: document as any, event: 'mousemove', handler: mouseMoveHandler as EventListener },
      { element: document as any, event: 'click', handler: clickHandler as EventListener },
      { element: document as any, event: 'keydown', handler: keyDownHandler as EventListener }
    );
  }

  private removeEventListeners(): void {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }

  private handleElementHover(element: HTMLElement): void {
    this.clearHighlight();
    this.hoveredElement = element;
    this.highlightElement(element);
    
    // Generate element data
    const elementData = this.generateElementData(element);
    this.config.onElementHover?.(elementData);
  }

  private handleElementSelect(element: HTMLElement): void {
    this.clearHighlight();
    
    // Generate element data
    const elementData = this.generateElementData(element);
    this.config.onElementSelect?.(elementData);
    
    // Stop targeting after selection
    this.stopTargeting();
  }

  private highlightElement(element: HTMLElement): void {
    if (this.currentHighlight === element) return;
    
    this.currentHighlight = element;
    
    // Store original styles
    this.originalStyles = {
      outline: element.style.outline,
      outlineOffset: element.style.outlineOffset,
      boxShadow: element.style.boxShadow
    };
    
    // Apply highlight styles
    element.style.outline = `2px solid ${this.config.highlightColor}`;
    element.style.outlineOffset = '2px';
    element.style.boxShadow = `0 0 0 4px ${this.config.highlightColor}20`;
  }

  private clearHighlight(): void {
    if (this.currentHighlight) {
      // Restore original styles
      Object.entries(this.originalStyles).forEach(([property, value]) => {
        if (value) {
          this.currentHighlight!.style.setProperty(property, value);
        } else {
          this.currentHighlight!.style.removeProperty(property);
        }
      });
      
      this.currentHighlight = null;
      this.originalStyles = {};
    }
  }

  private generateElementData(element: HTMLElement): TargetedElement {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    // Generate CSS selector
    const selector = this.generateSelector(element);
    
    // Extract class names
    const classNames = element.className 
      ? element.className.split(/\s+/).filter(cls => cls.trim())
      : [];
    
    // Extract attributes
    const attributes: { [key: string]: string } = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }
    
    // Extract computed styles
    const styles = {
      display: computedStyle.display,
      position: computedStyle.position,
      fontSize: computedStyle.fontSize,
      color: computedStyle.color,
      backgroundColor: computedStyle.backgroundColor,
      border: computedStyle.border,
      borderRadius: computedStyle.borderRadius,
      boxShadow: computedStyle.boxShadow,
      zIndex: computedStyle.zIndex
    };
    
    // Accessibility information
    const accessibility = {
      role: element.getAttribute('role') || this.getImplicitRole(element),
      ariaLabel: element.getAttribute('aria-label') || 
                 element.getAttribute('title') || 
                 element.getAttribute('alt') ||
                 this.getAccessibleName(element),
      ariaDescribedBy: element.getAttribute('aria-describedby') || undefined,
      tabIndex: element.tabIndex,
      isFocusable: this.isElementFocusable(element),
      isVisible: this.isElementVisible(element)
    };
    
    // React information (if available)
    const reactInfo = this.getReactInfo(element);
    
    return {
      id: this.generateElementId(element),
      selector,
      tagName: element.tagName,
      innerText: element.innerText?.trim() || '',
      attributes,
      classes: classNames,
      position: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      },
      cssProperties: styles,
      accessibility,
      componentInfo: reactInfo,
      url: window.location.href,
      timestamp: Date.now()
    };
  }

  private generateSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    const path: string[] = [];
    let current: Element | null = element;
    
    while (current && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      } else {
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(
            child => child.tagName === current!.tagName
          );
          
          if (siblings.length > 1) {
            const index = siblings.indexOf(current) + 1;
            selector += `:nth-of-type(${index})`;
          }
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  private generateElementId(element: HTMLElement): string {
    if (element.id) {
      return element.id;
    }
    
    const tagName = element.tagName.toLowerCase();
    const classNames = element.className.split(/\s+/).filter(cls => cls.trim());
    const classSuffix = classNames.length > 0 ? `.${classNames[0]}` : '';
    
    return `${tagName}${classSuffix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getImplicitRole(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const roleMap: { [key: string]: string } = {
      'button': 'button',
      'a': 'link',
      'input': 'textbox',
      'img': 'img',
      'h1': 'heading',
      'h2': 'heading',
      'h3': 'heading',
      'h4': 'heading',
      'h5': 'heading',
      'h6': 'heading'
    };
    
    return roleMap[tagName] || 'generic';
  }

  private getAccessibleName(element: HTMLElement): string {
    // Try various methods to get accessible name
    return element.getAttribute('aria-label') ||
           element.getAttribute('title') ||
           element.getAttribute('alt') ||
           element.textContent?.trim() ||
           '';
  }


  private getReactInfo(element: HTMLElement): any {
    // Try to get React fiber information
    const reactKey = Object.keys(element).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('_reactInternalFiber'));
    
    if (reactKey) {
      const fiber = (element as any)[reactKey];
      if (fiber) {
        return {
          componentName: fiber.type?.displayName || fiber.type?.name || 'Unknown',
          props: fiber.memoizedProps || {},
          state: fiber.memoizedState || null,
          sourceFile: fiber._debugSource?.fileName || 'Unknown'
        };
      }
    }
    
    return null;
  }

  private isElementFocusable(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    const tabIndex = element.tabIndex;
    
    // Elements that are naturally focusable
    const focusableTags = ['input', 'select', 'textarea', 'button', 'a'];
    if (focusableTags.includes(tagName)) {
      return true;
    }
    
    // Elements with tabindex >= 0
    if (tabIndex >= 0) {
      return true;
    }
    
    // Check if element has contenteditable
    if (element.contentEditable === 'true') {
      return true;
    }
    
    return false;
  }

  private isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  private showTargetingIndicator(): void {
    // Add visual indicator that targeting is active
    const indicator = document.createElement('div');
    indicator.id = 'mcp-pointer-targeting-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #3b82f6;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      z-index: 2147483647;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    `;
    indicator.textContent = '🎯 Targeting Mode - Hold Option + Click to select';
    
    document.body.appendChild(indicator);
  }

  private hideTargetingIndicator(): void {
    const indicator = document.getElementById('mcp-pointer-targeting-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}

