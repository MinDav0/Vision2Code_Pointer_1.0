/**
 * Elements API Routes for MCP Pointer v2.0
 * Handles element detection, analysis, and interaction
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import type { TargetedElement, User } from '@mcp-pointer/shared';
import { createAppError, ErrorCode } from '@mcp-pointer/shared';
import type { AIManager } from '../ai/ai.manager.js';

export class ElementsAPI {
  private app: Hono;
  private aiManager?: AIManager;

  constructor(aiManager?: AIManager) {
    this.app = new Hono();
    this.aiManager = aiManager;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Detect element (from browser extension)
    this.app.post('/detect', async (c: Context) => {
      try {
        const _user = c.get('user') as Partial<User>;
        const body = await c.req.json();
        
        // Validate element data
        const elementData: TargetedElement = {
          id: body.id || `element_${Date.now()}`,
          selector: body.selector,
          tagName: body.tagName,
          innerText: body.innerText,
          attributes: body.attributes || {},
          classes: body.classNames || [],
          position: body.boundingRect,
          cssProperties: body.styles,
          accessibility: body.accessibility,
          componentInfo: body.reactInfo,
          url: body.url,
          timestamp: Date.now()
        };
        
        // Here you would typically:
        // 1. Store element data in database
        // 2. Process element for analysis
        // 3. Update user's current element
        
        return c.json({
          success: true,
          element: elementData,
          message: 'Element detected and processed successfully'
        });
      } catch (error) {
        c.status(500);
        return c.json({
          error: 'Failed to detect element',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get element history for user
    this.app.get('/history', async (c: Context) => {
      try {
        const _user = c.get('user') as Partial<User>;
        const limit = parseInt(c.req.query('limit') || '10');
        const offset = parseInt(c.req.query('offset') || '0');
        
        // Here you would typically get element history from database
        // For now, we'll return a mock response
        const elements = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
          id: `element_${i + 1}`,
          selector: `.example-${i + 1}`,
          tagName: 'DIV',
          innerText: `Example element ${i + 1}`,
          url: 'https://example.com',
          timestamp: Date.now() - (i * 60000), // 1 minute apart
          detectedBy: _user.id
        }));
        
        return c.json({
          success: true,
          elements,
          pagination: {
            limit,
            offset,
            total: elements.length,
            hasMore: false
          }
        });
      } catch (error) {
        c.status(500);
        return c.json({
          error: 'Failed to get element history',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Analyze element
    this.app.post('/analyze', async (c: Context) => {
      try {
        const _user = c.get('user') as Partial<User>;
        const body = await c.req.json();
        
        const { elementId, analysisType = 'comprehensive', element } = body;
        
        if (!elementId && !element) {
          throw createAppError(ErrorCode.INVALID_INPUT, 'Element ID or element data is required', 400);
        }
        
        // Use provided element data or create a mock element for testing
        const elementData: TargetedElement = element || {
          id: elementId || 'test-element',
          tagName: 'DIV',
          selector: '#test-element',
          xpath: '//div[@id="test-element"]',
          textContent: 'Test element for analysis',
          className: 'test-class',
          innerText: 'Test element content',
          attributes: { id: elementId || 'test-element', class: 'test-class' },
          classes: ['test-class'],
          position: { x: 100, y: 100, width: 200, height: 50 },
          cssProperties: { color: '#000000', fontSize: '14px' },
          accessibility: { role: 'button', ariaLabel: 'Test button' },
          componentInfo: null,
          url: 'https://example.com',
          timestamp: Date.now()
        };
        
        // Use AI Manager for real analysis if available
        if (this.aiManager) {
          const aiResponse = await this.aiManager.analyzeElement({
            element: elementData,
            analysisType: analysisType as 'accessibility' | 'performance' | 'semantics' | 'usability' | 'comprehensive',
            includeSuggestions: true,
            includeCodeExamples: true,
            context: `Analysis request for element ${elementId || elementData.id}`
          });
          
          return c.json({
            success: true,
            analysis: {
              elementId: elementData.id,
              analysisType,
              aiAnalysis: aiResponse.analysis,
              suggestions: aiResponse.suggestions,
              codeExamples: aiResponse.codeExamples,
              confidence: aiResponse.confidence,
              source: aiResponse.source,
              metadata: aiResponse.metadata,
              timestamp: Date.now()
            }
          });
        } else {
          // Fallback to mock analysis if AI Manager not available
          const analysis = {
            elementId: elementData.id,
            analysisType,
            results: {
              accessibility: {
                score: 85,
                issues: [
                  'Missing alt text on image',
                  'Low color contrast ratio'
                ],
                recommendations: [
                  'Add descriptive alt text',
                  'Increase color contrast to meet WCAG standards'
                ]
              },
              performance: {
                score: 92,
                issues: [],
                recommendations: [
                  'Element is well optimized'
                ]
              },
              seo: {
                score: 78,
                issues: [
                  'Missing meta description'
                ],
                recommendations: [
                  'Add relevant meta description'
                ]
              }
            },
            timestamp: Date.now()
          };
          
          return c.json({
            success: true,
            analysis
          });
        }
      } catch (error) {
        const status = error instanceof Error && 'statusCode' in error 
          ? (error as any).statusCode 
          : 500;
        
        c.status(status);
        return c.json({
          error: 'Failed to analyze element',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get element statistics
    this.app.get('/stats', async (c: Context) => {
      try {
        const _user = c.get('user') as Partial<User>;
        const period = c.req.query('period') || '7d'; // 7 days, 30d, 90d, 1y
        
        // Here you would typically get statistics from database
        // For now, we'll return a mock response
        const stats = {
          period,
          totalElements: 156,
          uniqueSelectors: 89,
          mostCommonTags: [
            { tag: 'DIV', count: 45 },
            { tag: 'SPAN', count: 32 },
            { tag: 'A', count: 28 },
            { tag: 'P', count: 25 },
            { tag: 'IMG', count: 18 }
          ],
          accessibilityScore: 82,
          performanceScore: 91,
          topPages: [
            { url: 'https://example.com/page1', count: 23 },
            { url: 'https://example.com/page2', count: 18 },
            { url: 'https://example.com/page3', count: 15 }
          ],
          dailyActivity: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            elements: Math.floor(Math.random() * 50) + 10
          }))
        };
        
        return c.json({
          success: true,
          stats
        });
      } catch (error) {
        c.status(500);
        return c.json({
          error: 'Failed to get element statistics',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Export element data
    this.app.get('/export', async (c: Context) => {
      try {
        const _user = c.get('user') as Partial<User>;
        const format = c.req.query('format') || 'json'; // json, csv, xlsx
        const _startDate = c.req.query('startDate');
        const _endDate = c.req.query('endDate');
        
        // Here you would typically:
        // 1. Get elements from database based on date range
        // 2. Format data according to requested format
        // 3. Return file or data
        
        const elements = [
          {
            id: 'element_1',
            selector: '.example-1',
            tagName: 'DIV',
            innerText: 'Example element 1',
            url: 'https://example.com',
            timestamp: Date.now(),
            detectedBy: _user.id
          }
        ];
        
        if (format === 'csv') {
          const csv = 'id,selector,tagName,innerText,url,timestamp\n' +
            elements.map(el => `${el.id},${el.selector},${el.tagName},"${el.innerText}",${el.url},${el.timestamp}`).join('\n');
          
          c.header('Content-Type', 'text/csv');
          c.header('Content-Disposition', 'attachment; filename="elements.csv"');
          return c.text(csv);
        }
        
        return c.json({
          success: true,
          format,
          data: elements,
          count: elements.length
        });
      } catch (error) {
        c.status(500);
        return c.json({
          error: 'Failed to export element data',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Search elements
    this.app.get('/search', async (c: Context) => {
      try {
        const _user = c.get('user') as Partial<User>;
        const query = c.req.query('q');
        const limit = parseInt(c.req.query('limit') || '10');
        
        if (!query) {
          throw createAppError(ErrorCode.INVALID_INPUT, 'Search query is required', 400);
        }
        
        // Here you would typically search elements in database
        // For now, we'll return a mock response
        const results = [
          {
            id: 'element_1',
            selector: '.search-result-1',
            tagName: 'DIV',
            innerText: `Search result for "${query}"`,
            url: 'https://example.com',
            timestamp: Date.now(),
            relevanceScore: 0.95
          }
        ];
        
        return c.json({
          success: true,
          query,
          results,
          total: results.length,
          pagination: {
            limit,
            hasMore: false
          }
        });
      } catch (error) {
        const status = error instanceof Error && 'statusCode' in error 
          ? (error as any).statusCode 
          : 500;
        
        c.status(status);
        return c.json({
          error: 'Failed to search elements',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  public getApp(): Hono {
    return this.app;
  }
}

