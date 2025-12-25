import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Trade, ChartType, ChartStyle, ChartColor, Timeframe, Stat } from '../../types';
import { getFilteredTrades } from '../../utils';

// --- Safe Wrapper (AutoSizer) ---
interface SafeChartWrapperProps {
  children: (width: number, height: number) => React.ReactNode;
}

const SafeChartWrapper: React.FC<SafeChartWrapperProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      
      // Cancel any pending update to prevent stacking updates
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Schedule update for the next animation frame
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!element) return;
        
        const entry = entries[0];
        // Use Math.round for stability
        const width = Math.round(entry.contentRect.width);
        const height = Math.round(entry.contentRect.height);

        if (width > 0 && height > 0) {
          setDimensions(prev => {
            // Strict equality check to avoid re-rendering if integer dimensions are same
            if (prev.width === width && prev.height === height) return prev;
            return { width, height };
          });
        }
      });
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ minHeight: '1px', overflow: 'hidden' }}>
      {dimensions.width > 0 && dimensions.height > 0 && children(dimensions.width, dimensions.height)}
    </div>
  );
};

SafeChartWrapper.displayName = 'SafeChartWrapper';

interface ChartProps {
  trades: Trade[];
  timeframe: Timeframe;
  customStart: string;
  customEnd: string;
  chartType?: ChartType;
  chartStyle: ChartStyle;
  chartColor: ChartColor;
  customColor: string;
  selectedStat?: Stat;
  isDetailed?: boolean;
}

// Wrapped in React.memo to prevent re-renders when parent Dashboard re-renders 
// due to high-frequency color picker updates (debounced customColor prop stays same).
export const DashboardChart: React.FC<ChartProps> = React.memo(({
  trades,
  timeframe,
  customStart,
  customEnd,
  chartType = 'equity',
  chartStyle,
  chartColor,
  customColor,
  selectedStat,
  isDetailed = false
}) => {
  const data = useMemo(() => {
    const { trades: filteredTrades, initialData } = getFilteredTrades(trades, timeframe, customStart, customEnd);
    
    let balance = initialData.balance;
    let wins = initialData.wins;
    let count = initialData.count;
    let grossWin = initialData.grossWin;
    let grossLoss = initialData.grossLoss;

    return filteredTrades.map(t => {
      const pnl = t.pnl;
      let value = 0;

      if (!isDetailed) {
        // Standard dashboard logic
        if (chartType === 'equity') {
          balance += pnl;
          value = balance;
        } else {
          count++;
          if (pnl > 0) wins++;
          value = count === 0 ? 0 : Math.round((wins / count) * 100);
        }
      } else if (selectedStat) {
        // Detailed stats logic
        if (selectedStat.id === 'net') {
          balance += pnl;
          value = balance;
        } else if (selectedStat.id === 'winrate') {
          count++;
          if (pnl > 0) wins++;
          value = count === 0 ? 0 : Math.round((wins / count) * 100);
        } else if (selectedStat.id === 'total') {
          count++;
          value = count;
        } else if (selectedStat.id === 'avg') {
          balance += pnl;
          count++;
          value = parseFloat((balance / count).toFixed(2));
        } else if (selectedStat.id === 'pf') {
          if (pnl > 0) grossWin += pnl;
          else grossLoss += Math.abs(pnl);
          value = parseFloat((grossLoss === 0 ? grossWin : grossWin / grossLoss).toFixed(2));
        }
      }

      return {
        date: t.date,
        value: value
      };
    });
  }, [trades, timeframe, customStart, customEnd, chartType, isDetailed, selectedStat]);

  const color = useMemo(() => {
    if (chartColor === 'custom') return customColor;
    if (chartColor === 'blue') return '#3b82f6';
    if (chartColor === 'purple') return '#8b5cf6';
    
    // Default logic
    if (chartType === 'equity' || (selectedStat?.id === 'net')) {
       if (data.length > 0 && data[data.length - 1].value < 0) return '#f43f5e';
       return '#10b981';
    }
    return '#3b82f6';
  }, [chartColor, customColor, chartType, selectedStat, data]);

  // Stable ID for gradient to prevent re-rendering/flickering
  const gradientId = useMemo(() => `colorGradient-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <SafeChartWrapper>
      {(width, height) => (
        chartStyle === 'line' ? (
          <AreaChart width={width} height={height} data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '0.75rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}
              itemStyle={{ color: color, fontWeight: 600 }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill={`url(#${gradientId})`} 
              isAnimationActive={true}
            />
          </AreaChart>
        ) : (
          <BarChart width={width} height={height} data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
            />
            <Tooltip 
               contentStyle={{ borderRadius: '0.75rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}
               itemStyle={{ color: color, fontWeight: 600 }}
            />
            <Bar 
              dataKey="value" 
              fill={color} 
              radius={[4, 4, 0, 0]} 
              isAnimationActive={true}
            />
          </BarChart>
        )
      )}
    </SafeChartWrapper>
  );
});

DashboardChart.displayName = 'DashboardChart';

export const MockChart: React.FC<{ isProfitable: boolean; type: 'trader' | 'profile' }> = ({ isProfitable, type }) => {
  const data = useMemo(() => {
    const pointsCount = type === 'profile' ? 30 : 20;
    let balance = 0;
    const result = [];
    for (let i = 0; i < pointsCount; i++) {
        let move = (Math.random() * 5) - 2;
        if (isProfitable) move += 1.5; else move -= 1.0;
        balance += move;
        result.push({ idx: i, value: balance });
    }
    return result;
  }, [isProfitable, type]);

  const color = isProfitable ? '#10b981' : '#f43f5e';
  const gradientId = useMemo(() => `mockGradient-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <SafeChartWrapper>
      {(width, height) => (
        <AreaChart width={width} height={height} data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip cursor={false} content={() => null} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={3} 
            fillOpacity={1} 
            fill={`url(#${gradientId})`} 
            isAnimationActive={false}
          />
        </AreaChart>
      )}
    </SafeChartWrapper>
  );
};

MockChart.displayName = 'MockChart';

