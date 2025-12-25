import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Eraser, Trash2, Palette, Move } from 'lucide-react';
import { DebouncedColorInput } from '../common/DebouncedColorInput';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
  tool: 'pen' | 'eraser';
}

interface WhiteboardProps {
  className?: string;
}

// Error Boundary Component
class WhiteboardErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Whiteboard Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-slate-50 text-slate-500">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">Something went wrong with the whiteboard.</h3>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const WhiteboardComponent: React.FC<WhiteboardProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for strokes history (Vector data instead of Raster)
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  
  // Viewport State (Managed via Refs for performance and stability in event listeners)
  const transformRef = useRef({ scale: 1, offset: { x: 0, y: 0 } });
  // Force update trigger for UI sync
  const [, setTick] = useState(0);
  
  // UI State
  const [tool, setTool] = useState<'pen' | 'eraser' | 'pan'>('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [undoCount, setUndoCount] = useState(0);
  const [isDebugCollapsed, setIsDebugCollapsed] = useState(false);
  
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number, y: number } | null>(null);
  const undoCountRef = useRef(0);
  
  // Performance optimization: RAF throttling
  const rafIdRef = useRef<number | null>(null);
  const pendingRedrawRef = useRef(false);

  // Simplified color palette
  const presetColors = [
    '#000000', // Black
    '#FF0000', // Red
    '#0000FF', // Blue
    '#00FF00', // Green
  ];

  // --- Core Rendering Logic ---
  // Using a stable function that reads from refs
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { 
      willReadFrequently: false, // Performance optimization
      alpha: true 
    });
    if (!ctx) return;

    // Determine render size
    const width = canvas.width;
    const height = canvas.height;

    // Reset Context for clearing
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const { scale, offset } = transformRef.current;

    // Apply Viewport Transform
    ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y);
    
    // Optimization: Calculate visible bounds in world coordinates
    const visibleLeft = -offset.x / scale;
    const visibleTop = -offset.y / scale;
    const visibleRight = (width - offset.x) / scale;
    const visibleBottom = (height - offset.y) / scale;

    // Render All Strokes
    const renderStroke = (stroke: Stroke) => {
      if (stroke.points.length < 2) return;
      
      // Simple culling
      const inBounds = stroke.points.some(p => 
          p.x >= visibleLeft - 100 && p.x <= visibleRight + 100 &&
          p.y >= visibleTop - 100 && p.y <= visibleBottom + 100
      );

      if (!inBounds) return;
      
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === 'pen' ? stroke.color : '#FFFFFF';
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Start path
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      // Draw smooth curve or lines
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
    };

    strokesRef.current.forEach(renderStroke);
    if (currentStrokeRef.current) {
      renderStroke(currentStrokeRef.current);
    }
  }, []);

  // Throttled redraw using requestAnimationFrame
  const scheduleRedraw = useCallback(() => {
    if (pendingRedrawRef.current) return; // Already scheduled
    
    pendingRedrawRef.current = true;
    
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    rafIdRef.current = requestAnimationFrame(() => {
      pendingRedrawRef.current = false;
      rafIdRef.current = null;
      redraw();
    });
  }, [redraw]);

  // --- Native Event Listeners (Zoom & Undo) ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Non-passive wheel listener to allow preventDefault
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        
        const { scale, offset } = transformRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(0.1, scale + delta), 10);
        
        // Calculate mouse position in canvas device pixels (same as getMousePos)
        const dpr = window.devicePixelRatio || 1;
        const cssX = e.clientX - rect.left;
        const cssY = e.clientY - rect.top;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = cssX * scaleX;
        const mouseY = cssY * scaleY;
        
        // Calculate world point under mouse before zoom
        const worldX = (mouseX - offset.x) / scale;
        const worldY = (mouseY - offset.y) / scale;
        
        // Calculate new offset to keep that world point under mouse
        const newOffsetX = mouseX - worldX * newScale;
        const newOffsetY = mouseY - worldY * newScale;
        
        transformRef.current = {
          scale: newScale,
          offset: { x: newOffsetX, y: newOffsetY }
        };
        
        scheduleRedraw();
        setTick(t => t + 1); // Trigger UI update for debug info
      }
    };

    // Keyboard listener for Undo
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyZ' || e.key === 'z') && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        
        if (strokesRef.current.length > 0) {
          strokesRef.current.pop();
          undoCountRef.current += 1;
          setUndoCount(undoCountRef.current);
          scheduleRedraw();
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [scheduleRedraw]); 

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Handle Resize with ResizeObserver (Better for display:none / dynamic layout)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const canvas = canvasRef.current;
        if (!canvas) continue;
        
        const { width, height } = entry.contentRect;
        // Check if dimension is valid (not 0) to avoid issues when hidden
        if (width === 0 || height === 0) return;

        const dpr = window.devicePixelRatio || 1;
        
        // Only resize if actually changed to avoid redraw loops
        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            scheduleRedraw();
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [scheduleRedraw]);

  // --- Coordinate Systems ---
  const getMousePos = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    // getBoundingClientRect() returns dimensions in CSS pixels (accounts for browser zoom)
    // clientX/clientY are also in CSS pixels (accounts for browser zoom)
    const rect = canvas.getBoundingClientRect();
    
    // Calculate mouse position in CSS pixels relative to canvas
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    
    // Get the actual canvas dimensions
    // canvas.width/height are in device pixels (internal resolution)
    // canvas.style.width/height are in CSS pixels (display size)
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width; // device pixels
    const canvasHeight = canvas.height; // device pixels
    const displayWidth = rect.width; // CSS pixels (accounts for browser zoom)
    const displayHeight = rect.height; // CSS pixels (accounts for browser zoom)
    
    // Convert CSS pixel coordinates to canvas device pixel coordinates
    // The ratio between canvas internal size and display size gives us the scale
    const scaleX = canvasWidth / displayWidth;
    const scaleY = canvasHeight / displayHeight;
    
    return {
      x: cssX * scaleX,
      y: cssY * scaleY
    };
  }, []);

  const toWorldPos = (screenPos: Point) => {
    const { scale, offset } = transformRef.current;
    return {
      x: (screenPos.x - offset.x) / scale,
      y: (screenPos.y - offset.y) / scale
    };
  };

  // --- Event Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    // Pan trigger
    if (e.button === 1 || tool === 'pan' || (e.button === 0 && e.shiftKey)) {
      isPanningRef.current = true;
      // Store RAW client coordinates for delta calculation
      lastMousePosRef.current = { x: e.clientX, y: e.clientY }; 
      e.preventDefault();
      return;
    }

    if (e.button !== 0) return;

    // Drawing trigger
    isDrawingRef.current = true;
    const screenPos = getMousePos(e);
    const worldPos = toWorldPos(screenPos);
    
    currentStrokeRef.current = {
      points: [worldPos],
      color: color,
      size: brushSize,
      tool: tool as 'pen' | 'eraser'
    };
    
    scheduleRedraw();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanningRef.current) {
      // Calculate delta in CSS pixels (already accounts for browser zoom)
      const dxRaw = e.clientX - (lastMousePosRef.current?.x || e.clientX);
      const dyRaw = e.clientY - (lastMousePosRef.current?.y || e.clientY);
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      
      // Convert CSS pixels to canvas pixels
      const dpr = window.devicePixelRatio || 1;
      const dx = dxRaw * dpr;
      const dy = dyRaw * dpr;

      const { scale, offset } = transformRef.current;
      transformRef.current = {
        scale,
        offset: { x: offset.x + dx, y: offset.y + dy }
      };
      
      setTick(t => t + 1); // Update UI
      scheduleRedraw();
      return;
    }

    if (isDrawingRef.current && currentStrokeRef.current) {
      const screenPos = getMousePos(e);
      const worldPos = toWorldPos(screenPos);
      currentStrokeRef.current.points.push(worldPos);
      scheduleRedraw();
    }
  };

  const handleMouseUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    if (isDrawingRef.current && currentStrokeRef.current) {
      if (currentStrokeRef.current.points.length > 0) {
        strokesRef.current.push(currentStrokeRef.current);
      }
      currentStrokeRef.current = null;
      isDrawingRef.current = false;
      scheduleRedraw();
    }
  };

  // Helper for reset
  const handleResetView = () => {
    transformRef.current = { scale: 1, offset: { x: 0, y: 0 } };
    scheduleRedraw();
    setTick(t => t + 1);
  };

  const handleClear = () => {
    strokesRef.current = [];
    scheduleRedraw();
    setUndoCount(0);
    undoCountRef.current = 0;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-white overflow-hidden ${className}`}
      tabIndex={0}
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 block touch-none w-full h-full ${tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Debug Info */}
      <div className="absolute top-4 right-4 z-20">
        {isDebugCollapsed ? (
          <button
            onClick={() => setIsDebugCollapsed(false)}
            className="bg-black/90 text-white text-xs font-mono rounded-lg p-2 hover:bg-black/95 transition-all"
          >
            🔍
          </button>
        ) : (
          <div className="bg-black/90 text-white text-xs font-mono rounded-lg p-3 space-y-2 max-w-md">
             <div className="flex justify-between items-center mb-2">
                <span className="font-bold">Debug</span>
                <button onClick={() => setIsDebugCollapsed(true)} className="text-white/70 hover:text-white">✕</button>
             </div>
             <div>Objects: {strokesRef.current.length}</div>
             <div>Undo Count: {undoCount}</div>
             <div>Scale: {transformRef.current.scale.toFixed(2)}x</div>
             <div>Offset: {Math.round(transformRef.current.offset.x)}, {Math.round(transformRef.current.offset.y)}</div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-3 flex items-center gap-2">
        <button
          onClick={() => setTool('pen')}
          className={`p-2 rounded-lg transition-all ${tool === 'pen' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          title="Pen"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-lg transition-all ${tool === 'eraser' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          title="Eraser (Whiteout)"
        >
          <Eraser className="w-4 h-4" />
        </button>

        <button
          onClick={() => setTool('pan')}
          className={`p-2 rounded-lg transition-all ${tool === 'pan' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          title="Pan Tool"
        >
          <Move className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-300" />

        {/* Colors */}
        <div className="flex items-center gap-2">
          {presetColors.map((c) => (
             <button
               key={c}
               onClick={() => { setColor(c); if(tool === 'pan') setTool('pen'); }}
               className={`w-6 h-6 rounded-md border-2 ${color === c ? 'border-slate-900 scale-110' : 'border-slate-300 hover:border-slate-500'}`}
               style={{ backgroundColor: c }}
             />
          ))}
          <div className={`relative flex items-center justify-center w-8 h-8 rounded-md border-2 transition-all ${
             !presetColors.includes(color) 
               ? 'border-slate-900 bg-slate-100' 
               : 'border-slate-300 hover:border-slate-500 hover:bg-slate-50'
          }`}>
             <Palette className="w-4 h-4 text-slate-600 pointer-events-none absolute" />
             <div className="opacity-0 w-full h-full overflow-hidden cursor-pointer">
               <DebouncedColorInput 
                 initialColor={color}
                 onActive={() => {}}
                 onColorChange={(c) => { setColor(c); if(tool === 'pan') setTool('pen'); }}
               />
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2">
          <span className="text-xs text-slate-600 font-medium min-w-[40px]">
            {brushSize}px
          </span>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
          />
        </div>

        <div className="w-px h-6 bg-slate-300" />

        {/* Reset View */}
        <button
          onClick={handleResetView}
          className="px-2 py-1 text-xs font-bold bg-slate-100 rounded hover:bg-slate-200 text-slate-600"
        >
          100%
        </button>

        {/* Clear */}
        <button
          onClick={handleClear}
          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};

export const Whiteboard: React.FC<WhiteboardProps> = (props) => (
  <WhiteboardErrorBoundary>
    <WhiteboardComponent {...props} />
  </WhiteboardErrorBoundary>
);

Whiteboard.displayName = 'Whiteboard';
