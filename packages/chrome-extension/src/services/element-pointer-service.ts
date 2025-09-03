import OverlayService from './overlay-service';
import {
  getReactFiberInfo,
  getElementAttributes,
  generateSelector,
  getElementPosition,
  getElementCSSProperties,
  getElementClasses,
} from '../element-utils';
import type { TargetedElement } from '../types';
import { OverlayType } from '../types';
import logger from '../logger';

export default class ElementPointerService {
  private overlayService: OverlayService;

  private selectedElement: HTMLElement | null = null;

  private hoveredElement: HTMLElement | null = null;

  private lastMouseEvent: MouseEvent | null = null;

  private boundHandleMouseOver: (event: MouseEvent) => void;

  private boundHandleMouseOut: (event: MouseEvent) => void;

  constructor() {
    this.overlayService = OverlayService.getInstance();

    // Bind mouse event handlers once for consistent reference
    this.boundHandleMouseOver = this.handleMouseOver.bind(this);
    this.boundHandleMouseOut = this.handleMouseOut.bind(this);

    this.init();
  }

  private init(): void {
    // High-priority window listener to intercept Alt+clicks FIRST
    window.addEventListener('click', this.handleWindowClick.bind(this), true);

    // Always track mouse position for cursor detection
    document.addEventListener('mousemove', this.trackMousePosition.bind(this), true);

    // Only keyboard listeners are always active
    document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
    document.addEventListener('keyup', this.handleKeyUp.bind(this), true);

    logger.info('👆 Element pointer loaded');
  }

  private handleWindowClick(event: MouseEvent): void {
    if (!this.isOnlyTriggerKeyRelated(event)) return;

    // Stop the event from reaching any other handlers
    event.stopImmediatePropagation();
    event.preventDefault();

    // Call our Alt+click logic
    this.handleAltClick();
  }

  private handleAltClick(): void {
    const element = this.getElementUnderCursor();
    if (!element) return;

    logger.debug('🎯 Option+click detected on:', element);

    // Check if clicking on the same already selected element
    if (this.selectedElement === element) {
      logger.debug('🔄 Deselecting same element:', element);
      this.clearSelection();
      return;
    }

    this.selectElement(element);
    const targetedElement = this.extractElementData(element);
    this.sendToBackground(targetedElement);
  }

  private selectElement(element: HTMLElement): void {
    this.clearSelection();
    this.clearHoverEffect(); // Clear hover overlay when selecting
    // Remove any lingering hover effect from the element being selected
    element.classList.remove('mcp-pointer__hover');
    this.selectedElement = element;
    this.overlayService.create(element, OverlayType.SELECTION);
  }

  private clearSelection(): void {
    this.overlayService.remove(OverlayType.SELECTION);
    this.selectedElement = null;
  }

  private handleMouseOver(event: MouseEvent): void {
    if (this.isOnlyTriggerKeyRelated(event)) {
      const element = event.target as HTMLElement;
      if (element && element !== this.selectedElement && element !== this.hoveredElement) {
        // Remove any existing hover overlay first
        this.clearHoverEffect();
        // Create new hover overlay and track the element
        this.hoveredElement = element;
        this.overlayService.create(element, OverlayType.HOVER);
      }
    }
  }

  private handleMouseOut(event: MouseEvent): void {
    if (this.isOnlyTriggerKeyRelated(event)) {
      const element = event.target as HTMLElement;
      // Only remove if we're actually leaving the hovered element
      if (element === this.hoveredElement) {
        this.clearHoverEffect();
      }
    }
  }

  private clearHoverEffect(): void {
    this.overlayService.remove(OverlayType.HOVER);
    this.hoveredElement = null;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.isOnlyTriggerKeyRelated(event)) {
      document.body.classList.add('mcp-pointer--trigger-key-pressed');
      this.attachMouseListeners();

      // Check what element is currently under the cursor and add hover effect
      // Defer this to prevent forced reflow from DOM read→read→write pattern
      requestAnimationFrame(() => {
        const elementUnderCursor = this.getElementUnderCursor();
        if (elementUnderCursor && elementUnderCursor !== this.selectedElement) {
          this.clearHoverEffect();
          this.hoveredElement = elementUnderCursor;
          this.overlayService.create(elementUnderCursor, OverlayType.HOVER);
        }
      });
    } else if (this.isTriggerKeyRelated(event) && document.body.classList.contains('mcp-pointer--trigger-key-pressed')) {
      document.body.classList.remove('mcp-pointer--trigger-key-pressed');
      this.clearHoverEffect();
      this.removeMouseListeners();
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (this.isTriggerKeyRelated(event)) {
      document.body.classList.remove('mcp-pointer--trigger-key-pressed');
      this.removeMouseListeners();
      this.clearHoverEffect();
    }
  }

  private attachMouseListeners(): void {
    document.addEventListener('mouseover', this.boundHandleMouseOver, true);
    document.addEventListener('mouseout', this.boundHandleMouseOut, true);
  }

  private removeMouseListeners(): void {
    document.removeEventListener('mouseover', this.boundHandleMouseOver, true);
    document.removeEventListener('mouseout', this.boundHandleMouseOut, true);
  }

  private trackMousePosition(event: MouseEvent): void {
    this.lastMouseEvent = event;
  }

  private isTriggerKeyRelated(event: MouseEvent | KeyboardEvent): boolean {
    if (event instanceof KeyboardEvent) {
      return event.altKey || event.key === 'Alt';
    }

    return event.altKey;
  }

  private isOnlyTriggerKeyRelated(event: MouseEvent | KeyboardEvent): boolean {
    return this.isTriggerKeyRelated(event) && !event.ctrlKey
           && !event.shiftKey && !event.metaKey;
  }

  private getElementUnderCursor(): HTMLElement | null {
    // Get cursor position from last mouse event
    const mouseEvent = this.lastMouseEvent;

    if (!mouseEvent) return null;

    return document.elementFromPoint(mouseEvent.clientX, mouseEvent.clientY) as HTMLElement;
  }

  private extractElementData(element: HTMLElement): TargetedElement {
    return {
      selector: generateSelector(element),
      tagName: element.tagName,
      id: element.id || undefined,
      classes: getElementClasses(element),
      innerText: element.innerText || element.textContent || '',
      attributes: getElementAttributes(element),
      position: getElementPosition(element),
      cssProperties: getElementCSSProperties(element),
      componentInfo: getReactFiberInfo(element),
      timestamp: Date.now(),
      url: window.location.href,
    };
  }

  private sendToBackground(element: TargetedElement): void {
    logger.info('📤 Sending element to background:', element);

    // Send via window messaging (main world can't access chrome.runtime directly)
    window.postMessage({
      type: 'MCP_POINTER_ELEMENT_SELECTED',
      data: element,
    }, '*');
  }
}
