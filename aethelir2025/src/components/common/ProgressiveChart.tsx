import React, { useRef, useEffect, useState } from 'react';
import { useProgressiveLoad } from '../../hooks/useProgressiveLoad';
import { DashboardChart } from './Charts';
import { Trade, Timeframe, ChartStyle, ChartColor, Stat } from '../../types';

interface ProgressiveChartProps {
  trades: Trade[];
  timeframe: Timeframe;
  customStart: string;
  customEnd: string;
  chartStyle: ChartStyle;
  chartColor: ChartColor;
  customColor: string;
  selectedStat?: Stat;
  isDetailed?: boolean;
}

/**
 * Обертка для графика с прогрессивной загрузкой
 * График загружается только когда становится видимым
 */
export const ProgressiveChart: React.FC<ProgressiveChartProps> = (props) => {
  const [chartRef, isVisible] = useProgressiveLoad<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '100px', // Начинаем загрузку за 100px до появления
    enabled: true
  });

  return (
    <div ref={chartRef} style={{ height: 'var(--chart-height)', width: '100%', minHeight: '1px' }}>
      {isVisible ? (
        <DashboardChart {...props} />
      ) : (
        <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
            <span className="text-xs text-slate-400">Loading chart...</span>
          </div>
        </div>
      )}
    </div>
  );
};

ProgressiveChart.displayName = 'ProgressiveChart';
