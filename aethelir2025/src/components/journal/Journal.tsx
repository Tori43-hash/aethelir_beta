
import React, { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useProgressiveLoad } from '../../hooks/useProgressiveLoad';
import { 
  ArrowUp, ArrowDown, ChevronDown, ChevronLeft, ChevronRight, 
  Check, Plus, Minus, LineChart, Columns3, Filter, Star, Search, Inbox, Settings,
  Eye, EyeOff, GripVertical, ListFilter, AlignLeft, WrapText,
  ArrowLeftRight, Calendar, Globe, CalendarDays, Timer, LogIn, LogOut, Hash, BarChart3, AlertTriangle, CalendarCheck, Banknote
} from 'lucide-react';
import { Trade } from '../../types';
import { formatPercent } from '../../utils';

interface JournalProps {
  trades: Trade[];
  openTradeModal: () => void;
  openTradeDetail: (trade: Trade) => void;
  controlsScale: number;
  dateToggleConfig: { fontSize: number; fontWeight: number; height: number; paddingX: number };
  positionsConfig: { fontSize: number; fontWeight: number; height: number; paddingX: number; borderRadius: number };
  metricsConfig: { scale: number; marginTop: number; marginBottom: number; fontWeight: number };
  rightGutter: number;
  leftGutter: number;
  filterBarSpacing: { left: number; right: number };
  skipAnimation?: boolean;
}

type SortField = 'date' | 'ticker' | 'direction' | 'style' | 'risk' | 'pnl';
type SortDirection = 'asc' | 'desc';

type StyleOption = 'All' | 'Scalping' | 'Intraday' | 'Intraweek' | 'Swing';
type OutcomeOption = 'All' | 'Win' | 'BE' | 'Loss';
type DirectionOption = 'All' | 'Long' | 'Short';

interface FilterState {
  startDate: string;
  endDate: string;
  direction: DirectionOption;
  status: 'All' | 'Open' | 'Closed';
  style: StyleOption[];
  outcome: OutcomeOption[];
}

const SELECTION_COL_WIDTH = 48; // Explicit pixel width for alignment

// --- Helpers for the new Table Design ---

const getSession = (dateStr: string) => {
    if (!dateStr) return '—';
    const hour = new Date(dateStr).getHours();
    if (hour >= 22 || hour < 8) return 'Asian';
    if (hour >= 8 && hour < 14) return 'London';
    return 'New-York';
};

const getWeekday = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
};

const getHoldTime = (start: string, end?: string) => {
    if (!start || !end) return '—';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
};

const formatTableDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    }).replace(',', '');
};

// --- Dual Calendar Component ---
const DualCalendar: React.FC<{
    startDate: string;
    endDate: string;
    onChange: (start: string, end: string) => void;
    onClose?: () => void;
}> = ({ startDate, endDate, onChange, onClose }) => {
    const [viewDate, setViewDate] = useState(() => {
        if (startDate) return new Date(startDate);
        return new Date();
    });

    const parseDate = (str: string) => {
        if (!str) return null;
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const startObj = useMemo(() => parseDate(startDate), [startDate]);
    const endObj = useMemo(() => parseDate(endDate), [endDate]);

    const fmt = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setViewDate(newDate);
    };

    const handleDateClick = (clickedDate: Date) => {
        const dateStr = fmt(clickedDate);

        if (!startDate || (startDate && endDate)) {
            onChange(dateStr, '');
        } else if (startDate && !endDate) {
            if (clickedDate < (startObj || new Date())) {
                onChange(dateStr, '');
            } else {
                onChange(startDate, dateStr);
                if (onClose) onClose();
            }
        }
    };

    const isSelected = (d: Date) => {
        const t = d.getTime();
        if (startObj && t === startObj.getTime()) return 'start';
        if (endObj && t === endObj.getTime()) return 'end';
        if (startObj && endObj && t > startObj.getTime() && t < endObj.getTime()) return 'range';
        return null;
    };

    const renderMonth = (offset: number) => {
        const currentMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Monday start
        const firstDay = new Date(year, month, 1).getDay();
        const paddingDays = firstDay === 0 ? 6 : firstDay - 1;

        const days = [];
        for (let i = 0; i < paddingDays; i++) {
            days.push(<div key={`empty-${offset}-${i}`} className="h-9 w-9"></div>);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const status = isSelected(date);
            const isToday = date.toDateString() === new Date().toDateString();

            let btnClass = "relative w-9 h-9 flex items-center justify-center text-sm rounded-full transition z-10 ";
            
            if (status === 'start' || status === 'end') {
                btnClass += "bg-slate-800 text-white font-bold ";
            } else if (status === 'range') {
                btnClass += "text-slate-700 bg-slate-100 rounded-none w-full ";
            } else {
                btnClass += "text-slate-600 hover:bg-slate-100 ";
                if (isToday) btnClass += "font-bold text-slate-900 ring-1 ring-slate-200 ";
            }

            const rangeBg = status === 'range' ? <div className="absolute inset-0 bg-slate-100 -z-0"></div> : null;
            const startConnector = (status === 'start' && endObj) ? <div className="absolute top-0 bottom-0 right-0 w-1/2 bg-slate-100 -z-0"></div> : null;
            const endConnector = (status === 'end' && startObj) ? <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-slate-100 -z-0"></div> : null;

            days.push(
                <div key={`day-${offset}-${i}`} className="relative p-0 flex items-center justify-center">
                    {rangeBg}
                    {startConnector}
                    {endConnector}
                    <button onClick={() => handleDateClick(date)} className={btnClass}>
                        {i}
                    </button>
                </div>
            );
        }

        return (
            <div className="w-64">
                <div className="text-center font-bold text-slate-800 mb-4">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <div className="grid grid-cols-7 mb-2 text-center">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                        <div key={d} className="text-xs font-bold text-slate-400 h-8 flex items-center justify-center">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 row-auto gap-y-1">
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div className="flex items-start gap-8 relative p-6 bg-white rounded-2xl shadow-xl border border-slate-200 animate-fade-in" onClick={e => e.stopPropagation()}>
            <button 
                onClick={() => changeMonth(-1)} 
                className="absolute left-4 top-6 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
                title="Previous Month"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
                onClick={() => changeMonth(1)} 
                className="absolute right-4 top-6 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
                title="Next Month"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {renderMonth(0)}
            {renderMonth(1)}
        </div>
    );
};

// --- Isolated Metrics Menu Component ---
const MetricsMenu: React.FC<{
    initialOrder: string[];
    hiddenMetrics: string[];
    onCommitOrder: (order: string[]) => void;
    onToggleVisibility: (id: string) => void;
    labels: Record<string, string>;
}> = ({ initialOrder, hiddenMetrics, onCommitOrder, onToggleVisibility, labels }) => {
    // Local state for instant drag reordering
    const [order, setOrder] = useState(initialOrder);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const lastUpdate = useRef(0);
    const dragEnabled = useRef(false);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        if (!dragEnabled.current) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        setTimeout(() => {
            setDraggingId(id);
        }, 0);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        if (!draggingId || draggingId === targetId) return;

        const now = Date.now();
        if (now - lastUpdate.current < 30) return;

        const fromIdx = order.indexOf(draggingId);
        const toIdx = order.indexOf(targetId);

        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
            const newOrder = [...order];
            newOrder.splice(fromIdx, 1);
            newOrder.splice(toIdx, 0, draggingId);
            setOrder(newOrder);
            lastUpdate.current = now;
        }
    };

    const handleDragEnd = () => {
        setDraggingId(null);
        onCommitOrder(order);
        dragEnabled.current = false;
    };

    const onHandleMouseDown = () => { dragEnabled.current = true; };
    const onHandleMouseUp = () => { dragEnabled.current = false; };

    return (
        <div 
            className={`absolute top-full right-0 mt-2 w-64 bg-white border border-slate-100 rounded-xl shadow-xl z-50 p-2 animate-fade-in origin-top-right ${draggingId ? 'cursor-grabbing' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; }}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
            <div className="px-3 py-2 flex items-center justify-between border-b border-slate-50 mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configure Metrics</span>
            </div>
            <div className="space-y-1">
                {order.map(id => (
                    <div 
                    key={id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, id)}
                    onDragOver={(e) => handleDragOver(e, id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${draggingId === id ? 'opacity-50' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div 
                                className={`p-1 -ml-1 text-slate-300 hover:text-slate-500 transition-colors ${draggingId ? 'cursor-grabbing' : 'cursor-pointer active:cursor-grabbing'}`}
                                onMouseDown={onHandleMouseDown}
                                onMouseUp={onHandleMouseUp}
                                onMouseLeave={onHandleMouseUp}
                            >
                                <GripVertical className="w-3.5 h-3.5" />
                            </div>
                            <span className={`text-sm font-medium ${hiddenMetrics.includes(id) ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}>
                                {labels[id]}
                            </span>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleVisibility(id); }}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition"
                        >
                            {hiddenMetrics.includes(id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Properties Menu Component (For Table Columns) ---
const PropertiesMenu: React.FC<{
    initialOrder: string[];
    hiddenIds: string[];
    onCommitOrder: (order: string[]) => void;
    onToggleVisibility: (id: string) => void;
    labels: Record<string, string>;
}> = ({ initialOrder, hiddenIds, onCommitOrder, onToggleVisibility, labels }) => {
    // Local state for instant drag reordering
    const [order, setOrder] = useState(initialOrder);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const lastUpdate = useRef(0);
    const dragEnabled = useRef(false);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        if (!dragEnabled.current) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        setTimeout(() => {
            setDraggingId(id);
        }, 0);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        if (!draggingId || draggingId === targetId) return;

        const now = Date.now();
        if (now - lastUpdate.current < 30) return;

        const fromIdx = order.indexOf(draggingId);
        const toIdx = order.indexOf(targetId);

        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
            const newOrder = [...order];
            newOrder.splice(fromIdx, 1);
            newOrder.splice(toIdx, 0, draggingId);
            setOrder(newOrder);
            lastUpdate.current = now;
        }
    };

    const handleDragEnd = () => {
        setDraggingId(null);
        onCommitOrder(order);
        dragEnabled.current = false;
    };

    const onHandleMouseDown = () => { dragEnabled.current = true; };
    const onHandleMouseUp = () => { dragEnabled.current = false; };

    return (
        <div 
            className={`absolute top-full right-0 mt-2 w-64 bg-white border border-slate-100 rounded-xl shadow-xl z-50 p-2 animate-fade-in origin-top-right ${draggingId ? 'cursor-grabbing' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; }}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
            <div className="px-3 py-2 flex items-center justify-between border-b border-slate-50 mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configure Properties</span>
            </div>
            <div className="space-y-1">
                {order.map(id => (
                    <div 
                    key={id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, id)}
                    onDragOver={(e) => handleDragOver(e, id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${draggingId === id ? 'opacity-50' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div 
                                className={`p-1 -ml-1 text-slate-300 hover:text-slate-500 transition-colors ${draggingId ? 'cursor-grabbing' : 'cursor-pointer active:cursor-grabbing'}`}
                                onMouseDown={onHandleMouseDown}
                                onMouseUp={onHandleMouseUp}
                                onMouseLeave={onHandleMouseUp}
                            >
                                <GripVertical className="w-3.5 h-3.5" />
                            </div>
                            <span className={`text-sm font-medium ${hiddenIds.includes(id) ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}>
                                {labels[id]}
                            </span>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleVisibility(id); }}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition"
                        >
                            {hiddenIds.includes(id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Filter Menu Component ---
const FilterMenu: React.FC = () => {
    const filterOptions = [
        { id: 'ticker', label: 'Pair', icon: ArrowLeftRight },
        { id: 'date', label: 'Open Date', icon: Calendar },
        { id: 'session', label: 'Session', icon: Globe },
        { id: 'weekday', label: 'Weekday', icon: CalendarDays },
        { id: 'holdtime', label: 'Holdtime', icon: Timer },
        { id: 'entry', label: 'Entry', icon: LogIn },
        { id: 'exit', label: 'Exit', icon: LogOut },
        { id: 'size', label: 'Size', icon: Hash },
        { id: 'volume', label: 'Volume', icon: BarChart3 },
        { id: 'risk', label: 'Risk', icon: AlertTriangle },
        { id: 'exitDate', label: 'Close Date', icon: CalendarCheck },
        { id: 'pnl', label: 'PnL', icon: Banknote },
    ];

    return (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 p-2 animate-fade-in origin-top-right">
            <div className="px-3 py-2 flex items-center justify-between border-b border-slate-50 mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Add Filter</span>
            </div>
            <div className="space-y-0.5 max-h-[320px] overflow-y-auto custom-scrollbar">
                {filterOptions.map(opt => (
                    <button
                        key={opt.id}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-50 text-left group"
                    >
                        <div className="text-slate-300 group-hover:text-slate-500 transition-colors">
                            <opt.icon className="w-4 h-4 stroke-[1.5]" />
                        </div>
                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                            {opt.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- View Settings Menu (New) ---
const ViewSettingsMenu: React.FC<{
    isTextWrapEnabled: boolean;
    setIsTextWrapEnabled: (v: boolean) => void;
}> = ({ isTextWrapEnabled, setIsTextWrapEnabled }) => {
    return (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 p-2 animate-fade-in origin-top-right">
            <div className="px-3 py-2 flex items-center justify-between border-b border-slate-50 mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">View Settings</span>
            </div>
            <div className="space-y-1">
                <button
                    onClick={() => setIsTextWrapEnabled(!isTextWrapEnabled)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:bg-slate-50 text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className="text-slate-300 group-hover:text-slate-500 transition-colors">
                            <WrapText className="w-4 h-4 stroke-[1.5]" />
                        </div>
                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                            Text Wrap
                        </span>
                    </div>
                    {isTextWrapEnabled && <Check className="w-4 h-4 text-blue-500" />}
                </button>
            </div>
        </div>
    );
};

// --- Sortable Header Component ---
interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentSort: { field: SortField; direction: SortDirection };
  onSort: (field: SortField) => void;
  style?: React.CSSProperties;
  className?: string;
  align?: 'left' | 'center' | 'right';
  children?: React.ReactNode;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ 
  label, field, currentSort, onSort, style, className, align = 'left', children 
}) => {
  return (
    <th 
      style={style} 
      className={`border-y border-slate-200 p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative group text-${align} align-middle break-words cursor-pointer select-none hover:bg-slate-50 transition-colors ${className || ''}`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {label}
        {currentSort.field === field && (
          currentSort.direction === 'asc' 
            ? <ArrowUp className="w-3 h-3 text-slate-600" /> 
            : <ArrowDown className="w-3 h-3 text-slate-600" />
        )}
      </div>
      {children}
    </th>
  );
};

const METRIC_LABELS: Record<string, string> = {
  totalPnL: 'Total PnL',
  winrate: 'Winrate',
  avgR: 'Avg. R',
  pf: 'Profit Factor',
  avgRisk: 'Avg. Risk'
};

const PROPERTY_LABELS: Record<string, string> = {
  ticker: 'Pair',
  date: 'Open Date',
  session: 'Session',
  weekday: 'Weekday',
  holdtime: 'Holdtime',
  entry: 'Entry',
  exit: 'Exit',
  size: 'Size',
  volume: 'Volume',
  risk: 'Risk',
  exitDate: 'Close Date',
  pnl: 'PnL'
};


export const Journal: React.FC<JournalProps> = ({ trades, openTradeModal, openTradeDetail, controlsScale, dateToggleConfig, positionsConfig, metricsConfig, rightGutter, leftGutter, filterBarSpacing, skipAnimation = false }) => {
  // View Settings State
  const [isTextWrapEnabled, setIsTextWrapEnabled] = useState(true);
  const [isViewSettingsOpen, setIsViewSettingsOpen] = useState(false);
  const viewSettingsMenuRef = useRef<HTMLDivElement>(null);
  const viewSettingsButtonRef = useRef<HTMLButtonElement>(null);
  const journalViewRef = useRef<HTMLElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    startDate: '', endDate: '', direction: 'All', status: 'All', style: ['All'], outcome: ['All']
  });

  const [dateFilterMode, setDateFilterMode] = useState<'All' | 'Q' | 'M' | 'W' | 'Custom'>('All');
  const [showPositionMenu, setShowPositionMenu] = useState(false);
  const positionMenuRef = useRef<HTMLDivElement>(null);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // --- NEW DATE SELECTOR LOGIC ---
  const dateOptions = ['All', 'Q', 'M', 'W', 'Custom'];
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlightStyle, setHighlightStyle] = useState({ width: 0, transform: 'translateX(0px)' });
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);
  const customPickerRef = useRef<HTMLDivElement>(null);

  // --- Metrics State ---
  const [metricsOrder, setMetricsOrder] = useState(['totalPnL', 'winrate', 'avgR', 'pf', 'avgRisk']);
  
  const [hiddenMetrics, setHiddenMetrics] = useState<string[]>([]);
  const [isMetricsMenuOpen, setIsMetricsMenuOpen] = useState(false);
  const metricsMenuRef = useRef<HTMLDivElement>(null);
  const metricsButtonRef = useRef<HTMLButtonElement>(null);

  // --- Table Columns State ---
  const [columnsOrder, setColumnsOrder] = useState(['ticker', 'date', 'session', 'weekday', 'holdtime', 'entry', 'exit', 'size', 'volume', 'risk', 'exitDate', 'pnl']);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [isPropertiesMenuOpen, setIsPropertiesMenuOpen] = useState(false);
  const propertiesMenuRef = useRef<HTMLDivElement>(null);
  const propertiesButtonRef = useRef<HTMLButtonElement>(null);

  // Column Resizing State
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    ticker: 120,
    date: 140,
    session: 100,
    weekday: 100,
    holdtime: 100,
    entry: 100,
    exit: 100,
    size: 80,
    volume: 80,
    risk: 100,
    exitDate: 140,
    pnl: 100
  });

  const [resizeState, setResizeState] = useState<{col: string, startX: number, startW: number} | null>(null);

  // Size counter for sticky column
  const stickyColumnRef = useRef<HTMLTableCellElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [stickyColumnSize, setStickyColumnSize] = useState({ width: 0, height: 0 });

  const startResize = useCallback((col: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizeState({ col, startX: e.clientX, startW: columnWidths[col] });
  }, [columnWidths]);

  useEffect(() => {
    if (!resizeState) return;

    const onMove = (e: MouseEvent) => {
        const diff = e.clientX - resizeState.startX;
        const newWidth = Math.max(50, resizeState.startW + diff); // Min width 50px
        setColumnWidths(prev => ({ ...prev, [resizeState.col]: newWidth }));
    };

    const onUp = () => {
        setResizeState(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
    };
  }, [resizeState]);


  // --- Filter Menu State ---
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  const visibleColumns = useMemo(() => columnsOrder.filter(id => !hiddenColumns.includes(id)), [columnsOrder, hiddenColumns]);

  // Memoize updateHighlight to prevent recreating event listeners unnecessarily
  const updateHighlight = useCallback(() => {
    const activeIndex = dateOptions.indexOf(dateFilterMode);
    const el = tabsRef.current[activeIndex];
    
    if (el) {
      const width = el.offsetWidth;
      const left = el.offsetLeft;
      setHighlightStyle({
        width: width,
        transform: `translateX(${left - 2}px)`
      });
    }
  }, [dateFilterMode]);

  useEffect(() => {
    updateHighlight();
    const timeoutId = setTimeout(updateHighlight, 50);
    window.addEventListener('resize', updateHighlight);
    
    return () => {
      window.removeEventListener('resize', updateHighlight);
      clearTimeout(timeoutId);
    };
  }, [updateHighlight, controlsScale, dateToggleConfig]); 

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (positionMenuRef.current && !positionMenuRef.current.contains(target)) {
        setShowPositionMenu(false);
      }
      if (customPickerRef.current && !customPickerRef.current.contains(target) && !tabsRef.current[4]?.contains(target)) {
          setIsCustomPickerOpen(false);
      }
      if (metricsMenuRef.current && !metricsMenuRef.current.contains(target) && !metricsButtonRef.current?.contains(target)) {
          setIsMetricsMenuOpen(false);
      }
      if (propertiesMenuRef.current && !propertiesMenuRef.current.contains(target) && !propertiesButtonRef.current?.contains(target)) {
          setIsPropertiesMenuOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(target) && !filterButtonRef.current?.contains(target)) {
          setIsFilterMenuOpen(false);
      }
      if (viewSettingsMenuRef.current && !viewSettingsMenuRef.current.contains(target) && !viewSettingsButtonRef.current?.contains(target)) {
          setIsViewSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track sticky column size - using useRef to store ResizeObserver instance
  useEffect(() => {
    const updateSize = () => {
      if (stickyColumnRef.current) {
        const rect = stickyColumnRef.current.getBoundingClientRect();
        setStickyColumnSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
      }
    };

    // Initial update with delay to ensure element is rendered
    const timeoutId = setTimeout(() => {
      updateSize();
    }, 100);

    // Setup ResizeObserver only once using useRef
    if (stickyColumnRef.current && !resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(updateSize);
      resizeObserverRef.current.observe(stickyColumnRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, []); // Run once on mount

  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'date', direction: 'desc'
  });

  const handleSort = useCallback((field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  // Toggle visibility (Passed to isolated menu)
  const toggleMetricVisibility = useCallback((id: string) => {
    setHiddenMetrics(prev => {
      if (prev.includes(id)) {
        return prev.filter(m => m !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const toggleColumnVisibility = useCallback((id: string) => {
    setHiddenColumns(prev => {
      if (prev.includes(id)) {
        return prev.filter(c => c !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);


  const applyDateFilter = useCallback((mode: 'All' | 'Q' | 'M' | 'W' | 'Custom') => {
      setDateFilterMode(mode);
      
      if (mode === 'Custom') {
          setIsCustomPickerOpen(!isCustomPickerOpen);
          return;
      }
      
      setIsCustomPickerOpen(false);

      const now = new Date();
      const fmt = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      let start = '';
      let end = '';

      if (mode === 'W') {
          const day = now.getDay() || 7; 
          const d = new Date(now);
          if (day !== 1) d.setDate(d.getDate() - (day - 1));
          start = fmt(d);
          end = fmt(now); 
      } else if (mode === 'M') {
          start = fmt(new Date(now.getFullYear(), now.getMonth(), 1));
          end = fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      } else if (mode === 'Q') {
          const q = Math.floor(now.getMonth() / 3);
          start = fmt(new Date(now.getFullYear(), q * 3, 1));
          end = fmt(new Date(now.getFullYear(), q * 3 + 3, 0));
      }
      
      setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
  }, []);

  // Memoize filtered trades separately to avoid unnecessary recalculations
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      if (filters.startDate && trade.date < filters.startDate) return false;
      if (filters.endDate && trade.date > filters.endDate) return false;
      if (filters.direction !== 'All' && trade.direction !== filters.direction) return false;
      
      // Status Filter
      if (filters.status === 'Open' && trade.exitDate) return false;
      if (filters.status === 'Closed' && !trade.exitDate) return false;

      if (!filters.style.includes('All') && !filters.style.includes((trade.style || 'Intraday') as StyleOption)) return false;
      if (!filters.outcome.includes('All')) {
        let match = false;
        if (filters.outcome.includes('Win') && trade.pnl > 0) match = true;
        if (filters.outcome.includes('Loss') && trade.pnl < 0) match = true;
        if (filters.outcome.includes('BE') && trade.pnl === 0) match = true;
        if (!match) return false;
      }
      return true;
    });
  }, [trades, filters]);

  // Memoize sorted trades separately
  const processedTrades = useMemo(() => {
    // Create a new array for sorting to avoid mutating the filtered array
    const sorted = [...filteredTrades];
    sorted.sort((a, b) => {
      let aValue: any = a[sortConfig.field];
      let bValue: any = b[sortConfig.field];
      if (sortConfig.field === 'style') { aValue = a.style || 'Intraday'; bValue = b.style || 'Intraday'; }
      if (sortConfig.field === 'risk') { aValue = a.risk || 0; bValue = b.risk || 0; }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredTrades, sortConfig]);

  // Selection Logic
  const toggleSelection = useCallback((id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(i => i !== id);
        } else {
          return [...prev, id];
        }
      });
  }, []);

  const toggleSelectAll = useCallback(() => {
      setSelectedIds(prev => {
        if (prev.length === processedTrades.length && processedTrades.length > 0) {
          return [];
        } else {
          return processedTrades.map(t => t.id);
        }
      });
  }, [processedTrades]);

  const metrics = useMemo(() => {
    const defaults = { totalPnL: 0, winrate: 0, pf: '0.00', avgR: '0.0R', avgRisk: '0.0%' };
    if (processedTrades.length === 0) return defaults;

    const totalPnL = processedTrades.reduce((acc, t) => acc + t.pnl, 0);
    const winCount = processedTrades.filter(t => t.pnl > 0).length;
    const winrate = Math.round((winCount / processedTrades.length) * 100);
    
    const grossWin = processedTrades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = Math.abs(processedTrades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
    const pf = grossLoss === 0 ? (grossWin === 0 ? 0 : 100) : grossWin / grossLoss; 

    // Avg R
    const totalR = processedTrades.reduce((acc, t) => acc + (t.risk ? t.pnl / t.risk : 0), 0);
    const avgR = totalR / processedTrades.length;
    
    // Avg Risk
    const totalRisk = processedTrades.reduce((acc, t) => acc + t.risk, 0);
    const avgRisk = totalRisk / processedTrades.length;

    return {
        totalPnL,
        winrate,
        pf: pf === 100 ? '∞' : pf.toFixed(2),
        avgR: (avgR > 0 ? '+' : '') + avgR.toFixed(1) + 'R',
        avgRisk: avgRisk.toFixed(1) + '%'
    };
  }, [processedTrades]);

  const getMetricDisplay = useCallback((id: string) => {
      switch(id) {
          case 'totalPnL': return { 
              label: 'Total PnL', 
              val: formatPercent(metrics.totalPnL), 
              className: metrics.totalPnL >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
          };
          case 'winrate': return { label: 'Winrate', val: `${metrics.winrate}%`, className: 'bg-white border-slate-200 text-slate-900' };
          case 'avgR': return { label: 'Avg. R', val: metrics.avgR, className: 'bg-white border-slate-200 text-slate-900' };
          case 'pf': return { label: 'Profit Factor', val: metrics.pf, className: 'bg-white border-slate-200 text-slate-900' };
          case 'avgRisk': return { label: 'Avg. Risk', val: metrics.avgRisk, className: 'bg-white border-slate-200 text-slate-900' };
          default: return null;
      }
  }, [metrics]);

  // Helper for rendering table headers dynamically
  const renderHeader = useCallback((id: string, isLast: boolean) => {
    const width = columnWidths[id];
    const borderClass = isLast ? '' : 'border-r border-slate-200';
    
    // Common props for SortableHeader and Static Header
    const commonProps = {
        style: { width: width, minWidth: width },
        className: borderClass
    };

    // Resizer Element
    const Resizer = (
        <div 
            onMouseDown={(e) => startResize(id, e)}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors z-10 hover:w-1.5 hover:-right-0.5" 
        />
    );

    switch(id) {
        case 'ticker': return <SortableHeader key={id} label="Pair" field="ticker" currentSort={sortConfig} onSort={handleSort} {...commonProps}>{Resizer}</SortableHeader>;
        case 'date': return <SortableHeader key={id} label="Open Date" field="date" currentSort={sortConfig} onSort={handleSort} {...commonProps}>{Resizer}</SortableHeader>;
        case 'session': return <th key={id} style={commonProps.style} className={`border-y border-slate-200 p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative group text-left align-middle break-words ${borderClass}`}>Session {Resizer}</th>;
        case 'weekday': return <th key={id} style={commonProps.style} className={`border-y border-slate-200 p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative group text-left align-middle break-words ${borderClass}`}>Weekday {Resizer}</th>;
        case 'holdtime': return <th key={id} style={commonProps.style} className={`border-y border-slate-200 p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative group text-left align-middle break-words ${borderClass}`}>Holdtime {Resizer}</th>;
        case 'entry': return <th key={id} style={commonProps.style} className={`border-y border-slate-200 p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative group text-left align-middle break-words ${borderClass}`}>Entry {Resizer}</th>;
        case 'exit': return <th key={id} style={commonProps.style} className={`border-y border-slate-200 p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative group text-left align-middle break-words ${borderClass}`}>Exit {Resizer}</th>;
        case 'size': return <th key={id} style={commonProps.style} className={`border-y border-slate-200 p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative group text-left align-middle break-words ${borderClass}`}>Size {Resizer}</th>;
        case 'volume': return <th key={id} style={commonProps.style} className={`border-y border-slate-200 p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative group text-left align-middle break-words ${borderClass}`}>Volume {Resizer}</th>;
        case 'risk': return <SortableHeader key={id} label="Risk Per Trade" field="risk" currentSort={sortConfig} onSort={handleSort} {...commonProps}>{Resizer}</SortableHeader>;
        case 'exitDate': return <th key={id} style={commonProps.style} className={`border-y border-slate-200 p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative group text-left align-middle break-words ${borderClass}`}>Close Date {Resizer}</th>;
        case 'pnl': return <SortableHeader key={id} label="PnL" field="pnl" currentSort={sortConfig} onSort={handleSort} align="left" {...commonProps}>{Resizer}</SortableHeader>;
        default: return null;
    }
  }, [columnWidths, sortConfig, handleSort, startResize]);

  // Helper for rendering table cells dynamically
  const renderCell = useCallback((id: string, trade: Trade, cellBorder: string, isLast: boolean) => {
    const width = columnWidths[id];
    const verticalBorder = isLast ? '' : 'border-r border-slate-100';
    // Dynamic text wrap class: truncate with ellipsis when disabled
    const wrapClass = isTextWrapEnabled ? 'whitespace-normal break-words' : 'whitespace-nowrap overflow-hidden text-ellipsis';
    const combinedClasses = `${cellBorder} ${verticalBorder} text-left ${wrapClass}`;
    
    const style = { width: width, minWidth: width, maxWidth: width }; 
    
    switch(id) {
        case 'ticker': 
            return <td key={id} style={style} className={`p-4 font-bold text-slate-900 ${combinedClasses}`}>{trade.ticker}/USDT</td>;
        case 'date': 
            return <td key={id} style={style} className={`p-4 font-medium text-slate-900 ${combinedClasses}`}>{formatTableDate(trade.entryDate)}</td>;
        case 'session': 
            return <td key={id} style={style} className={`p-4 font-medium text-slate-900 ${combinedClasses}`}>{getSession(trade.entryDate)}</td>;
        case 'weekday': 
            return <td key={id} style={style} className={`p-4 font-medium text-slate-900 ${combinedClasses}`}>{getWeekday(trade.entryDate)}</td>;
        case 'holdtime': 
            return (
                <td key={id} style={style} className={`p-4 ${combinedClasses}`}>
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-semibold border border-blue-100/50">
                        {getHoldTime(trade.entryDate, trade.exitDate)}
                    </span>
                </td>
            );
        case 'entry': 
            return <td key={id} style={style} className={`p-4 font-medium text-slate-900 ${combinedClasses}`}>—</td>;
        case 'exit': 
            return <td key={id} style={style} className={`p-4 font-medium text-slate-900 ${combinedClasses}`}>—</td>;
        case 'size': 
            return <td key={id} style={style} className={`p-4 font-medium text-slate-900 ${combinedClasses}`}>—</td>;
        case 'volume': 
            return <td key={id} style={style} className={`p-4 font-medium text-slate-900 ${combinedClasses}`}>—</td>;
        case 'risk': 
            return <td key={id} style={style} className={`p-4 font-medium text-slate-900 ${combinedClasses}`}>{trade.risk ? trade.risk + '%' : '—'}</td>;
        case 'exitDate': 
            return <td key={id} style={style} className={`p-4 font-medium text-slate-900 ${combinedClasses}`}>{formatTableDate(trade.exitDate)}</td>;
        case 'pnl': 
            return (
                <td key={id} style={style} className={`p-4 font-bold ${trade.pnl > 0 ? 'text-green-600' : trade.pnl < 0 ? 'text-rose-500' : 'text-slate-900'} ${combinedClasses}`}>
                    {formatPercent(trade.pnl)}
                </td>
            );
        default: 
            return null;
    }
  }, [columnWidths, isTextWrapEnabled]);

  // Progressive loading: Load table only when visible
  const [tableRef, isTableVisible] = useProgressiveLoad<HTMLDivElement>({
    threshold: 0.05,
    rootMargin: '200px', // Start loading 200px before table becomes visible
    enabled: true
  });

  // Virtualization: Only render visible rows for large lists to save memory
  // For tables, we'll use a simpler approach - limit the number of rendered rows
  const VIRTUALIZATION_THRESHOLD = 100;
  const shouldLimitRendering = processedTrades.length > VIRTUALIZATION_THRESHOLD;
  const MAX_VISIBLE_ROWS = 50; // Render only first 50 rows initially, user can scroll to see more

  // Ensure journal-view is immediately visible without animation
  useLayoutEffect(() => {
    if (journalViewRef.current) {
      const element = journalViewRef.current;
      // Force immediate visibility without any animation
      element.style.opacity = '1';
      element.style.transform = 'none';
      element.style.animation = 'none';
      // Remove animation class if it was added
      element.classList.remove('animate-fade-in');
    }
  }, []);

  return (
    <>
      <section 
        ref={journalViewRef}
        id="journal-view" 
        className="journal-view flex flex-col h-full bg-white relative"
        style={{ opacity: 1, transform: 'none', animation: 'none' }}
      >
        <header 
            id="journal-header"
            className="journal-view__header w-full bg-white z-40 pt-6"
            style={{ 
                marginBottom: `${metricsConfig.marginBottom}px`,
                paddingLeft: `${stickyColumnSize.width || SELECTION_COL_WIDTH}px`
            }}
        >
            <div 
                id="filters-toolbar" 
                className="journal-view__toolbar flex flex-col md:flex-row md:items-center md:justify-between mb-4"
            >
                <nav 
                    id="filter-nav"
                    aria-label="Filter Navigation"
                    className="journal-view__nav flex items-center gap-3 origin-left transition-transform duration-200 flex-shrink-0"
                    style={{ zoom: controlsScale }}
                >
                        {/* Position Dropdown */}
                        <div className="bg-white p-1 border border-slate-200 shadow-sm w-fit" style={{ borderRadius: `${positionsConfig.borderRadius + 4}px` }}>
                            <div className="relative" ref={positionMenuRef}>
                                <button 
                                    onClick={() => setShowPositionMenu(!showPositionMenu)}
                                    className="flex items-center gap-2 text-slate-700 hover:bg-slate-50 transition select-none min-w-[140px] justify-between leading-none outline-none focus:outline-none"
                                    style={{
                                        height: `${positionsConfig.height}px`,
                                        paddingLeft: `${positionsConfig.paddingX}px`,
                                        paddingRight: `${positionsConfig.paddingX}px`,
                                        fontSize: `${positionsConfig.fontSize}px`,
                                        fontWeight: positionsConfig.fontWeight,
                                        borderRadius: `${positionsConfig.borderRadius}px`
                                    }}
                                >
                                    <span>
                                        {filters.status === 'All' ? 'All Positions' : 
                                         filters.status === 'Open' ? 'Open Positions' : 'Closed Positions'}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                                {showPositionMenu && (
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-30 p-1 animate-fade-in">
                                        {['All', 'Open', 'Closed'].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    setFilters({...filters, status: opt as any});
                                                    setShowPositionMenu(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg flex items-center justify-between group whitespace-nowrap"
                                            >
                                                {opt === 'All' ? 'All Positions' : `${opt} Positions`}
                                                {filters.status === opt && <Check className="w-3 h-3 text-blue-500" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

                        {/* Date Toggle */}
                        <div 
                            className="relative inline-flex bg-[#ededed] p-[2px] rounded-[10px] items-center box-border select-none w-fit"
                            style={{ height: `${dateToggleConfig.height}px` }}
                        >
                            <div
                                className="absolute top-[2px] left-[2px] h-[calc(100%-4px)] bg-white rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] z-10 pointer-events-none"
                                style={{
                                    width: `${highlightStyle.width}px`,
                                    transform: highlightStyle.transform,
                                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s ease'
                                }}
                            />
                            {dateOptions.map((m, i) => (
                                <button
                                    key={m}
                                    ref={el => { tabsRef.current[i] = el; }}
                                    onClick={() => applyDateFilter(m as any)}
                                    className={`relative z-20 bg-transparent border-none h-full cursor-pointer flex items-center justify-center min-w-[32px] outline-none focus:outline-none transition-colors duration-200 leading-none whitespace-nowrap ${dateFilterMode === m ? 'text-[#1c2026]' : 'text-[#8e8e93] hover:text-[#333]'}`}
                                    style={{ 
                                        fontSize: `${dateToggleConfig.fontSize}px`, 
                                        fontWeight: dateToggleConfig.fontWeight,
                                        padding: `0 ${dateToggleConfig.paddingX}px`
                                    }}
                                >
                                    {m}
                                </button>
                            ))}

                            {isCustomPickerOpen && (
                                <div 
                                    ref={customPickerRef}
                                    className="absolute top-full left-0 mt-4 z-50 animate-fade-in origin-top-left"
                                >
                                    <DualCalendar 
                                        startDate={filters.startDate}
                                        endDate={filters.endDate}
                                        onChange={(s, e) => setFilters({ ...filters, startDate: s, endDate: e })}
                                    />
                                </div>
                            )}
                        </div>
                </nav>
                <nav id="action-nav" aria-label="Action Menu" className="journal-view__nav flex flex-wrap gap-1.5 items-center justify-end flex-shrink-0" style={{ margin: 0, padding: 0 }}>
                        <div className="flex items-center gap-0.5 mr-1 relative">
                          <div className="relative" ref={metricsMenuRef}>
                              <button 
                                ref={metricsButtonRef}
                                onClick={() => setIsMetricsMenuOpen(!isMetricsMenuOpen)}
                                className={`p-2 transition rounded-lg outline-none focus:outline-none ${isMetricsMenuOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                              >
                                  <LineChart className="w-5 h-5 stroke-[1.5]" />
                              </button>
                              {isMetricsMenuOpen && (
                                  <MetricsMenu 
                                    initialOrder={metricsOrder}
                                    hiddenMetrics={hiddenMetrics}
                                    onCommitOrder={setMetricsOrder}
                                    onToggleVisibility={toggleMetricVisibility}
                                    labels={METRIC_LABELS}
                                  />
                              )}
                          </div>

                          <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

                          <div className="relative" ref={propertiesMenuRef}>
                            <button 
                                ref={propertiesButtonRef}
                                onClick={() => setIsPropertiesMenuOpen(!isPropertiesMenuOpen)}
                                className={`p-2 transition rounded-lg outline-none focus:outline-none ${isPropertiesMenuOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Columns3 className="w-5 h-5 stroke-[1.5]" />
                            </button>
                            {isPropertiesMenuOpen && (
                                <PropertiesMenu
                                    initialOrder={columnsOrder}
                                    hiddenIds={hiddenColumns}
                                    onCommitOrder={setColumnsOrder}
                                    onToggleVisibility={toggleColumnVisibility}
                                    labels={PROPERTY_LABELS}
                                />
                            )}
                          </div>

                          <div className="relative" ref={filterMenuRef}>
                              <button 
                                ref={filterButtonRef}
                                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                                className={`p-2 transition rounded-lg outline-none focus:outline-none ${isFilterMenuOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                              >
                                <Filter className="w-5 h-5 stroke-[1.5]" />
                              </button>
                              {isFilterMenuOpen && <FilterMenu />}
                          </div>

                          <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>
                          <button className="p-2 text-slate-400 hover:text-slate-600 transition hover:bg-slate-50 rounded-lg outline-none focus:outline-none"><Star className="w-5 h-5 stroke-[1.5]" /></button>
                          <button className="p-2 text-slate-400 hover:text-slate-600 transition hover:bg-slate-50 rounded-lg outline-none focus:outline-none"><Search className="w-5 h-5 stroke-[1.5]" /></button>
                          <button className="p-2 text-slate-400 hover:text-slate-600 transition hover:bg-slate-50 rounded-lg outline-none focus:outline-none"><Inbox className="w-5 h-5 stroke-[1.5]" /></button>
                          
                          <div className="relative" ref={viewSettingsMenuRef}>
                              <button 
                                ref={viewSettingsButtonRef}
                                onClick={() => setIsViewSettingsOpen(!isViewSettingsOpen)}
                                className={`p-2 transition rounded-lg outline-none focus:outline-none ${isViewSettingsOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                              >
                                <Settings className="w-5 h-5 stroke-[1.5]" />
                              </button>
                              {isViewSettingsOpen && (
                                  <ViewSettingsMenu 
                                    isTextWrapEnabled={isTextWrapEnabled}
                                    setIsTextWrapEnabled={setIsTextWrapEnabled}
                                  />
                              )}
                          </div>
                        </div>
                        <button 
                            onClick={openTradeModal}
                            className="px-6 py-2 rounded-xl bg-[#007AFF] text-white text-sm font-bold shadow-md hover:bg-blue-600 transition flex items-center gap-2 transform active:scale-95 outline-none focus:outline-none"
                        >
                            New
                        </button>
                </nav>
            </div>
            {metrics && (
                <section 
                    id="performance-metrics"
                    className="journal-view__metrics flex flex-wrap gap-2 items-center origin-left transition-transform duration-200 blur-loading animate-blur-in"
                    style={{ transform: `scale(${metricsConfig.scale})`, animationDelay: '0.1s' }}
                >
                    {metricsOrder.map(id => {
                        if (hiddenMetrics.includes(id)) return null;
                        const item = getMetricDisplay(id);
                        if (!item) return null;
                        
                        return (
                            <div 
                                key={id}
                                className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${item.className}`}
                                style={{ fontWeight: metricsConfig.fontWeight }}
                            >
                                <span className={id === 'totalPnL' ? 'opacity-70' : 'text-slate-900'}>{item.label}:</span>
                                <span>{item.val}</span>
                            </div>
                        );
                    })}
                </section>
            )}
        </header>

        {/* === BLOCK: DATA GRID (TABLE) === */}
        <section id="data-grid" className="journal-view__grid flex-1 w-full bg-white">
            <div ref={tableRef} className="overflow-x-auto blur-loading animate-blur-in" style={{ animationDelay: '0.2s' }}>
                {isTableVisible ? (
                    <table className="w-full text-left border-collapse min-w-[1000px] table-fixed">
                        <thead className="bg-slate-50">
                            <tr>
                                <th 
                                    ref={stickyColumnRef}
                                    className="sticky z-20 bg-white pl-6 pr-2 py-4 text-center border-r border-transparent" 
                                    style={{ 
                                        left: 0,
                                        width: SELECTION_COL_WIDTH,
                                        minWidth: SELECTION_COL_WIDTH,
                                        maxWidth: SELECTION_COL_WIDTH
                                    }}
                                >
                                    <div className="flex items-center justify-center">
                                        <button 
                                            onClick={toggleSelectAll}
                                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedIds.length > 0 && selectedIds.length === processedTrades.length ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-300 bg-white hover:border-slate-400'}`}
                                        >
                                            {selectedIds.length > 0 && selectedIds.length === processedTrades.length && <Check className="w-3 h-3" />}
                                            {selectedIds.length > 0 && selectedIds.length < processedTrades.length && <Minus className="w-3 h-3 text-slate-800" />}
                                        </button>
                                    </div>
                                </th>
                                {visibleColumns.map((id, index) => {
                                    const isLast = index === visibleColumns.length - 1;
                                    return renderHeader(id, isLast);
                                })}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {processedTrades.length > 0 ? (
                                // For large lists, only render visible rows to save memory
                                (shouldLimitRendering ? processedTrades.slice(0, MAX_VISIBLE_ROWS) : processedTrades).map((trade, index) => {
                                    const isSelected = selectedIds.includes(trade.id);
                                    const isLastRow = index === (shouldLimitRendering ? Math.min(MAX_VISIBLE_ROWS, processedTrades.length) - 1 : processedTrades.length - 1);
                                    const cellBorder = isLastRow ? 'border-b border-slate-200' : 'border-b border-slate-100';

                                    return (
                                        <tr 
                                            key={trade.id} 
                                            onClick={() => openTradeDetail(trade)}
                                            className={`hover:bg-slate-50 transition cursor-pointer group text-sm ${isSelected ? 'bg-slate-50' : ''}`}
                                        >
                                            <td 
                                                className="sticky z-20 bg-white pl-6 pr-2 py-4 text-center border-r border-transparent" 
                                                style={{ 
                                                    left: 0,
                                                    width: SELECTION_COL_WIDTH,
                                                    minWidth: SELECTION_COL_WIDTH,
                                                    maxWidth: SELECTION_COL_WIDTH
                                                }} 
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-center">
                                                    <button 
                                                        onClick={(e) => toggleSelection(trade.id, e)}
                                                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-300 bg-white opacity-0 group-hover:opacity-100 hover:border-slate-400'}`}
                                                    >
                                                        {isSelected && <Check className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            </td>
                                            {visibleColumns.map((id, colIndex) => {
                                                const isLastCol = colIndex === visibleColumns.length - 1;
                                                return renderCell(id, trade, cellBorder, isLastCol);
                                            })}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={visibleColumns.length + 1} className="p-12 text-center text-slate-400">
                                        No trades found.
                                    </td>
                                </tr>
                            )}
                            {shouldLimitRendering && processedTrades.length > MAX_VISIBLE_ROWS && (
                                <tr>
                                    <td colSpan={visibleColumns.length + 1} className="p-4 text-center text-slate-400 text-sm">
                                        Showing first {MAX_VISIBLE_ROWS} of {processedTrades.length} trades. Use filters to narrow down results.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                            <span className="text-xs">Loading table...</span>
                        </div>
                    </div>
                )}
            </div>
        </section>
        <footer id="journal-footer" className="journal-view__footer text-xs text-slate-400 text-center py-4">
            Showing {processedTrades.length} of {trades.length} trades
        </footer>
      </section>
    </>
  );
};

Journal.displayName = 'Journal';
