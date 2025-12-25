import React, { useMemo } from 'react';
import { Home, PenTool, BookOpen, Settings, BarChart2 } from 'lucide-react';

interface NavigationDockProps {
  currentTab: string;
  changeTab: (id: string) => void;
  onNavHover?: (id: string) => void;
  position: 'bottom' | 'top' | 'left' | 'right';
  scale: number;
  edgeOffset: number;
  onOpenSettings: () => void;
}

const NavigationDockComponent: React.FC<NavigationDockProps> = ({ currentTab, changeTab, onNavHover, position, scale, edgeOffset, onOpenSettings }) => {
  const menuItems = useMemo(() => [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'stats', icon: BarChart2, label: 'Analytics' },
    { id: 'journal', icon: BookOpen, label: 'Journal' },
    { id: 'traders', icon: PenTool, label: 'Whiteboard' }
  ], []);

  // Updated to White/Clean Aesthetic
  const baseClasses = 'fixed bg-white border border-slate-200 shadow-2xl shadow-slate-200/60 p-2 rounded-3xl z-50 flex items-center gap-2 transition-all duration-300 ease-spring';
  
  const orientationClasses = useMemo(() => ({
    bottom: 'flex-row left-1/2',
    top: 'flex-row left-1/2',
    left: 'flex-col top-1/2',
    right: 'flex-col top-1/2'
  }), []);

  const isVertical = useMemo(() => position === 'left' || position === 'right', [position]);

  // Memoized transform string
  const transform = useMemo(() => {
    switch (position) {
      case 'bottom':
      case 'top':
        return `translateX(-50%) scale(${scale})`;
      case 'left':
      case 'right':
        return `translateY(-50%) scale(${scale})`;
      default:
        return `scale(${scale})`;
    }
  }, [position, scale]);

  // Memoized transform origin
  const transformOrigin = useMemo(() => {
    switch (position) {
      case 'bottom': return 'bottom center';
      case 'top': return 'top center';
      case 'left': return 'center left';
      case 'right': return 'center right';
      default: return 'center';
    }
  }, [position]);

  // Memoized position styles
  const positionStyles = useMemo(() => {
    const styles: React.CSSProperties = {
      transform,
      transformOrigin
    };

    switch (position) {
      case 'bottom': styles.bottom = `${edgeOffset}px`; break;
      case 'top': styles.top = `${edgeOffset}px`; break;
      case 'left': styles.left = `${edgeOffset}px`; break;
      case 'right': styles.right = `${edgeOffset}px`; break;
    }
    return styles;
  }, [position, edgeOffset, transform, transformOrigin]);

  return (
    <nav 
      className={`${baseClasses} ${orientationClasses[position]}`}
      style={positionStyles}
    >
      {menuItems.map(item => (
        <button
          key={item.id}
          onClick={() => changeTab(item.id)}
          onMouseEnter={() => onNavHover?.(item.id)}
          className={`
            relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 group border
            ${currentTab === item.id 
              ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20 scale-100' 
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }
          `}
          title={item.label}
        >
          <item.icon className="w-5 h-5 stroke-[1.5]" />
          
          {/* Hover Tooltip for Vertical layouts */}
          {isVertical && (
            <span className={`
              absolute ${position === 'left' ? 'left-14' : 'right-14'} 
              bg-white border border-slate-200 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-lg 
              opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl
            `}>
              {item.label}
            </span>
          )}
        </button>
      ))}

      {/* Divider */}
      <div className={`${isVertical ? 'w-8 h-[1px]' : 'h-8 w-[1px]'} bg-slate-200 mx-1`}></div>

      {/* Settings Button */}
      <button
        onClick={onOpenSettings}
        className="flex items-center justify-center w-12 h-12 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all duration-300 hover:rotate-90"
        title="Settings"
      >
        <Settings className="w-5 h-5 stroke-[1.5]" />
      </button>
    </nav>
  );
};

NavigationDockComponent.displayName = 'NavigationDock';

export const NavigationDock = React.memo(NavigationDockComponent);

