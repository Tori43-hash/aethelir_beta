import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Trader } from '../../types';
import { STORAGE_KEYS } from '../../constants';
import { Whiteboard } from './Whiteboard';

// --- Types for the Builder ---

interface Block {
  id: number;
  type: 'text' | 'image' | 'svg';
  content: string; 
  x: number;
  y: number;
  w: number;
  h: number;
  style?: React.CSSProperties;
  objectFit?: 'contain' | 'cover'; 
}

interface BackgroundConfig {
  url: string;
  x: number;
  y: number;
  scale: number;
}

interface TradersProps {
  tradersList: Trader[];
  openProfile: (trader: Trader) => void;
}

interface ProfileProps {
  trader: Trader;
  goBack: () => void;
}

// Reference resolution for percentage calculations
const REF_WIDTH = 1920; 
const REF_HEIGHT = 1080;

// Helper to handle SVG aspect ratio
const processSvgContent = (content: string, fit: 'contain' | 'cover' = 'contain') => {
    const target = fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';
    if (/preserveAspectRatio\s*=\s*["']/.test(content)) {
        return content.replace(
            /preserveAspectRatio\s*=\s*(["'])[^"']*\1/, 
            `preserveAspectRatio="${target}"`
        );
    }
    return content.replace(/<svg/i, `<svg preserveAspectRatio="${target}"`);
};

export const Traders: React.FC<TradersProps> = ({ tradersList, openProfile }) => {
  // --- Mode State ---
  const [isEditing, setIsEditing] = useState(false); // Toggle between View (Whiteboard) and Edit (Builder)

  // --- Builder State (kept for potential future use) ---
  const [windowSize, setWindowSize] = useState({ w: 1920, h: 1080 });

  // Default Config with requested background
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.BG_CONFIG); // Bumped version for new default
      return saved ? JSON.parse(saved) : {
        "url": "https://messages-prod.27c852f3500f38c1e7786e2c9ff9e48f.r2.cloudflarestorage.com/019b0caa-d29e-7059-bd9f-2e7bba6eaeca/1765651853929-019b190a-e898-7f6c-9106-6ed883b1c5e4.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=af634fe044bd071ab4c5d356fdace60f%2F20251213%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20251213T185054Z&X-Amz-Expires=3600&X-Amz-Signature=5692804a6ec6ac97d18c6cc24f39a00717974c581afdc93dd15c3436a95dea41&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject",
        "x": 0,
        "y": 0,
        "scale": 1
      };
  });

  const [blocks, setBlocks] = useState<Block[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.BLOCKS);
      return saved ? JSON.parse(saved) : [
        {
          "id": 1765288246843,
          "type": "svg",
          "content": "<?xml version=\"1.0\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 20010904//EN\"\n \"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">\n<svg version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\"\n width=\"100%\" height=\"100%\" viewBox=\"0 0 1090.000000 229.000000\"\n preserveAspectRatio=\"xMidYMid meet\">\n<g transform=\"translate(0.000000,229.000000) scale(0.100000,-0.100000)\"\nfill=\"#000000\" stroke=\"none\">\n<path d=\"M5232 1461 c-38 -28 -119 -123 -172 -201 -31 -45 -38 -50 -81 -50\n-55 0 -100 -11 -96 -24 3 -7 26 -10 65 -8 l62 4 -34 -74 c-31 -69 -36 -75 -95\n-105 -69 -36 -144 -45 -154 -18 -7 17 -2 20 43 29 44 8 100 41 100 60 0 51\n-85 43 -142 -14 -42 -42 -47 -67 -20 -101 27 -33 94 -29 177 10 59 27 65 28\n65 11 0 -55 76 -66 156 -22 l51 29 -11 -28 c-11 -31 -2 -49 18 -34 101 74 161\n115 169 115 5 0 7 -14 3 -31 -7 -36 7 -59 35 -59 11 0 49 14 86 30 36 17 67\n29 67 28 12 -35 37 -63 59 -69 34 -9 135 19 182 51 39 26 45 25 45 -3 0 -29\n29 -57 57 -57 29 0 100 26 132 49 27 20 28 20 44 0 25 -29 89 -25 165 11 34\n16 62 27 62 24 0 -3 -7 -18 -15 -34 -25 -48 1 -46 57 4 47 43 53 46 87 39 55\n-12 130 -6 157 12 38 24 20 35 -33 19 -37 -11 -58 -12 -104 -3 -50 10 -60 9\n-85 -7 -27 -18 -28 -18 -21 -1 14 36 -4 34 -88 -9 -83 -42 -146 -56 -160 -35\n-3 6 9 26 26 45 25 29 28 37 16 42 -9 3 -38 -13 -74 -42 -65 -53 -133 -87\n-166 -82 -19 3 -22 9 -21 45 1 39 6 47 83 119 92 87 203 228 227 291 28 73 0\n95 -62 48 -46 -35 -172 -205 -218 -295 -65 -125 -173 -205 -268 -198 -56 4\n-59 29 -4 40 74 16 119 55 95 84 -20 25 -55 15 -183 -51 -69 -36 -132 -65\n-139 -65 -10 0 -13 13 -13 43 1 36 -2 42 -22 45 -13 2 -46 -12 -82 -37 -33\n-21 -60 -38 -60 -36 0 15 45 75 69 93 42 31 193 222 230 291 17 32 31 68 31\n80 0 30 -27 37 -51 15 -31 -28 -126 -162 -208 -295 -41 -66 -89 -130 -110\n-147 -57 -46 -116 -74 -148 -70 -25 3 -28 7 -31 43 -3 37 2 46 65 114 l67 74\n68 -6 c41 -4 68 -2 68 4 0 13 -45 29 -82 29 l-31 0 27 33 c88 107 146 191 146\n213 0 33 -27 31 -78 -5z m883 -60 c-32 -59 -137 -191 -191 -241 l-37 -35 28\n50 c50 89 108 169 163 228 31 31 57 55 60 53 2 -3 -8 -27 -23 -55z m-899 -33\nc-87 -113 -122 -151 -134 -147 -7 2 12 35 41 74 56 76 136 159 145 151 3 -3\n-20 -38 -52 -78z m254 20 c-45 -73 -124 -180 -151 -203 l-23 -20 18 30 c11 17\n55 81 99 143 82 116 114 144 57 50z m-424 -226 c-18 -16 -18 -16 -6 6 6 13 14\n21 18 18 3 -4 -2 -14 -12 -24z m-216 -87 c0 -9 -62 -36 -73 -32 -7 3 4 12 23\n20 37 17 50 20 50 12z m840 0 c0 -2 -14 -12 -31 -20 -40 -21 -63 -13 -24 8 29\n16 55 22 55 12z\"/>\n<path d=\"M4655 1311 c-44 -38 -116 -110 -159 -160 -74 -84 -83 -91 -125 -96\n-25 -4 -52 -7 -59 -8 -31 -5 -8 -22 28 -22 22 0 40 -1 40 -3 0 -1 -7 -14 -16\n-28 -11 -16 -14 -28 -7 -35 6 -6 21 5 42 31 l32 40 78 0 79 0 -64 -120 c-35\n-67 -64 -127 -64 -135 0 -37 24 -5 90 119 67 127 73 135 103 138 35 3 40 20 8\n28 -18 5 -15 14 40 133 95 201 83 231 -46 118z m73 11 c-1 -5 -30 -66 -62\n-135 l-60 -127 -73 0 c-40 0 -73 3 -73 6 0 10 253 264 263 264 5 0 7 -4 5 -8z\"/>\n<path d=\"M6150 1171 c0 -21 13 -41 26 -41 17 0 18 22 2 38 -14 14 -28 16 -28\n3z\"/>\n</g>\n</svg>",
          "x": 1570.173913043478,
          "y": 47.0869565217391,
          "w": 264.304347826087,
          "h": 215.97535456870494,
          "style": {},
          "objectFit": "cover"
        }
      ];
  });

  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Derived state for the currently selected block
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // Dragging / Resizing State
  const [interaction, setInteraction] = useState<{
    type: 'drag' | 'resize' | null;
    blockId: number | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
    handle?: string; 
  }>({
    type: null,
    blockId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialW: 0,
    initialH: 0
  });

  // --- Effects ---
  useEffect(() => {
    const handleResize = () => {
        setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BG_CONFIG, JSON.stringify(bgConfig));
  }, [bgConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(blocks));
  }, [blocks]);

  // --- Handlers ---
  const addBlock = (type: 'text' | 'image' | 'svg') => {
    const defaultContent = type === 'text' ? 'New Text' : type === 'image' ? 'https://via.placeholder.com/300' : 'SVG Code...';
    const newBlock: Block = {
      id: Date.now(),
      type,
      content: defaultContent,
      x: REF_WIDTH / 2 - 150, 
      y: REF_HEIGHT / 2 - 100,
      w: type === 'text' ? 400 : 300,
      h: type === 'text' ? 150 : (type === 'svg' ? 100 : 300),
      style: type === 'text' ? { fontSize: '48px', color: '#000000', fontWeight: 'normal' } : {},
      objectFit: 'contain'
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: number, updates: Partial<Block>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const updateBlockStyle = (id: number, styleUpdates: React.CSSProperties) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, style: { ...b.style, ...styleUpdates } } : b));
  };

  const deleteBlock = (id: number) => {
    setBlocks(blocks.filter(b => b.id !== id));
    setSelectedBlockId(null);
  };

  const copyConfigToClipboard = () => {
    const config = { background: bgConfig, blocks: blocks };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Interaction Logic (disabled - view mode only) ---
  const handleMouseDown = (e: React.MouseEvent, block: Block, type: 'drag' | 'resize', handle?: string) => {
    // Disabled in view mode
    return;
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    if (!interaction.type || !interaction.blockId) return;
    e.preventDefault();
    
    const scaleX = windowSize.w / REF_WIDTH;
    const scaleY = windowSize.h / REF_HEIGHT;
    
    const deltaX = (e.clientX - interaction.startX) / scaleX;
    const deltaY = (e.clientY - interaction.startY) / scaleY;

    if (interaction.type === 'drag') {
        updateBlock(interaction.blockId, {
            x: interaction.initialX + deltaX,
            y: interaction.initialY + deltaY
        });
    } else if (interaction.type === 'resize') {
        const { initialX, initialY, initialW, initialH, handle } = interaction;
        let newX = initialX;
        let newY = initialY;
        let newW = initialW;
        let newH = initialH;

        if (handle?.includes('e')) newW = initialW + deltaX;
        if (handle?.includes('w')) { newW = initialW - deltaX; newX = initialX + deltaX; }
        if (handle?.includes('s')) newH = initialH + deltaY;
        if (handle?.includes('n')) { newH = initialH - deltaY; newY = initialY + deltaY; }

        if (newW < 20) newW = 20;
        if (newH < 20) newH = 20;

        updateBlock(interaction.blockId, { x: newX, y: newY, w: newW, h: newH });
    }
  };

  const handleGlobalMouseUp = () => {
    setInteraction({ ...interaction, type: null, blockId: null });
  };

  return (
    <div 
        className="fixed inset-0 z-40 bg-[#111] overflow-hidden select-none w-screen h-screen blur-loading animate-blur-in"
        onMouseMove={handleGlobalMouseMove}
        onMouseUp={handleGlobalMouseUp}
        onClick={() => {}}
    >
      
      {/* 1. Background / Canvas Layer */}
      {/* Disabled pointer events for whiteboard interaction */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 overflow-hidden bg-black">
             <div 
                className="w-full h-full"
                style={{
                    transform: `translate(${bgConfig.x}px, ${bgConfig.y}px) scale(${bgConfig.scale})`,
                    transformOrigin: 'center center',
                }}
             >
                <img 
                    src={bgConfig.url} 
                    alt="Background" 
                    className="w-full h-full object-cover"
                    style={{ filter: 'none' }}
                />
             </div>
             {/* Dark overlay for readability - reduced opacity to see background better */}
             <div className="absolute inset-0 bg-black/10"></div>
          </div>

          {blocks.map(block => {
              const isSelected = false; // Disabled in view mode
              const leftPct = (block.x / REF_WIDTH) * 100;
              const topPct = (block.y / REF_HEIGHT) * 100;
              const widthPct = (block.w / REF_WIDTH) * 100;
              const heightPct = (block.h / REF_HEIGHT) * 100;
              
              return (
                  <div
                    key={block.id}
                    className={`absolute group ${isSelected ? 'z-20' : 'z-10'}`}
                    style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, block, 'drag')}
                  >
                      <div className="w-full h-full transition-all duration-200">
                        {block.type === 'image' ? (
                            <div className="w-full h-full overflow-hidden pointer-events-none">
                                <img src={block.content} alt="Block" className="w-full h-full" style={{ filter: 'none', objectFit: block.objectFit || 'contain' }} />
                            </div>
                        ) : block.type === 'svg' ? (
                            <div className="w-full h-full pointer-events-none [&>svg]:w-full [&>svg]:h-full [&>svg]:block" style={{ shapeRendering: 'geometricPrecision' }} dangerouslySetInnerHTML={{ __html: processSvgContent(block.content, block.objectFit) }} />
                        ) : (
                            <div className="w-full h-full break-words whitespace-pre-wrap pointer-events-none" style={block.style}>{block.content}</div>
                        )}
                        {isSelected && (
                            <>
                                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, block, 'resize', 'nw')} />
                                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, block, 'resize', 'ne')} />
                                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, block, 'resize', 'sw')} />
                                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, block, 'resize', 'se')} />
                            </>
                        )}
                      </div>
                  </div>
              );
          })}
      </div>

      {/* 2. Whiteboard */}
      <div className="absolute inset-0 z-30 blur-loading animate-blur-in" style={{ animationDelay: '0.1s' }}>
        <Whiteboard className="w-full h-full" />
      </div>

    </div>
  );
};

export const Profile: React.FC<ProfileProps> = ({ trader, goBack }) => {
    return (
        <div className="p-10 flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
            <button onClick={goBack} className="flex items-center gap-2 mb-4 hover:text-slate-800"><ArrowLeft className="w-4 h-4" /> Go Back</button>
            <p>Profile View Placeholder</p>
        </div>
    );
};

Traders.displayName = 'Traders';
Profile.displayName = 'Profile';