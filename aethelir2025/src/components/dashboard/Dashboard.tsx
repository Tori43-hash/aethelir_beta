import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BadgeCheck, Plus, Settings, Palette, TrendingUp, Activity, Layers } from 'lucide-react';
import { Trade, Timeframe, ChartStyle, ChartColor, Stat } from '../../types';
import { formatPercent } from '../../utils';
import { ProgressiveChart } from '../common/ProgressiveChart';
import { DebouncedColorInput } from '../common/DebouncedColorInput';

interface DashboardProps {
  trades: Trade[];
  totalPnL: number;
  winrate: number;
  openTradeModal: () => void;
  changeTab: (tab: string) => void;
}

const DashboardComponent: React.FC<DashboardProps> = ({ trades, totalPnL, winrate, openTradeModal, changeTab }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showChartSettings, setShowChartSettings] = useState(false);
  
  // Metric Selection
  const [selectedMetric, setSelectedMetric] = useState<string>('net');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('line');
  const [chartColor, setChartColor] = useState<ChartColor>('custom');
  
  // Color State
  const [customColor, setCustomColor] = useState('#5b21b6'); 

  const metrics = [
    { id: 'net', label: 'Net Return' },
    { id: 'winrate', label: 'Winrate' },
    { id: 'avg', label: 'Avg Return' },
    { id: 'pf', label: 'Profit Factor' },
    { id: 'total', label: 'Total Trades' }
  ];

  const chartTitle = metrics.find(m => m.id === selectedMetric)?.label || 'Net Return';

  // Memoize the selectedStat object to prevent unnecessary re-renders of DashboardChart
  const selectedStatObj = useMemo(() => ({ id: selectedMetric } as Stat), [selectedMetric]);

  return (
    <div className="space-y-8 flex flex-col h-full">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-light text-slate-800 flex items-center gap-3">
            Hello, <span className="font-semibold">Tori</span>
            <span title="Funded Trader"><BadgeCheck className="w-6 h-6 verified-badge" /></span>
          </h2>
          <p className="text-slate-400 mt-1">Here is your Weekly briefing.</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Return</span>
          <div 
            className={`text-3xl font-light tracking-tight mb-2 ${totalPnL >= 0 ? 'text-green-600' : 'text-rose-500'}`}
          >
             {formatPercent(totalPnL)}
          </div>
          <button 
            onClick={openTradeModal}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
          >
            <Plus className="w-3 h-3" /> New Trade
          </button>
        </div>
      </header>

      <div className="soft-card p-6 lg:p-8 blur-loading animate-blur-in">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="font-medium text-slate-700 w-full sm:w-auto">{chartTitle}</h3>
          <div className="flex gap-3 w-full sm:w-auto flex-wrap items-center justify-end">
            
            <div className="flex items-center gap-2">
              <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                className="custom-select bg-white border border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none hover:border-slate-300 transition cursor-pointer font-medium shadow-sm"
                style={{ minWidth: '140px' }}
              >
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {timeframe === 'custom' && (
              <div className="flex gap-2 items-center animate-fade-in">
                <input 
                  type="date" 
                  value={customStart} 
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-600 text-xs rounded-xl px-3 py-2 outline-none hover:border-slate-300 transition font-medium shadow-sm cursor-pointer"
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="date" 
                  value={customEnd} 
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-600 text-xs rounded-xl px-3 py-2 outline-none hover:border-slate-300 transition font-medium shadow-sm cursor-pointer"
                />
              </div>
            )}
            
            <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>

            <div className="relative">
              <button 
                onClick={() => setShowChartSettings(!showChartSettings)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition border border-transparent hover:border-slate-200"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {showChartSettings && (
                 <>
                 <div className="fixed inset-0 z-0" onClick={() => setShowChartSettings(false)}></div>
                 <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-5 z-10 space-y-5 animate-fade-in">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Metric</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl">
                            {metrics.map(m => (
                                <button 
                                  key={m.id}
                                  onClick={() => setSelectedMetric(m.id)}
                                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${selectedMetric === m.id ? 'bg-white shadow-sm text-slate-800 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Type</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button onClick={() => setChartStyle('line')} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${chartStyle === 'line' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Line</button>
                            <button onClick={() => setChartStyle('bar')} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${chartStyle === 'bar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Bar</button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Color</label>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setChartColor('default')} className={`px-2 py-1 bg-slate-100 rounded text-[10px] font-bold uppercase text-slate-500 hover:bg-slate-200 transition ${chartColor === 'default' ? 'ring-2 ring-slate-300' : ''}`}>Auto</button>
                            <div onClick={() => setChartColor('blue')} className={`color-radio bg-blue-500 ${chartColor === 'blue' ? 'active' : ''}`}></div>
                            <div onClick={() => setChartColor('purple')} className={`color-radio bg-violet-500 ${chartColor === 'purple' ? 'active' : ''}`}></div>
                            <div className={`color-radio flex items-center justify-center bg-slate-100 border border-slate-200 ${chartColor === 'custom' ? 'active ring-2 ring-slate-300' : ''}`}>
                                <Palette className="w-3 h-3 text-slate-400" />
                                <DebouncedColorInput 
                                  initialColor={customColor} 
                                  onActive={() => setChartColor('custom')}
                                  onColorChange={(c) => setCustomColor(c)}
                                />
                            </div>
                        </div>
                    </div>
                 </div>
                 </>
              )}
            </div>
          </div>
        </div>
        <ProgressiveChart 
            trades={trades} 
            timeframe={timeframe} 
            customStart={customStart} 
            customEnd={customEnd}
            chartStyle={chartStyle}
            chartColor={chartColor}
            customColor={customColor}
            isDetailed={true}
            selectedStat={selectedStatObj}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="soft-card p-6 flex flex-col justify-between h-40 group hover:border-blue-200 transition blur-loading animate-blur-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex justify-between items-start">
                <span className="text-slate-400 text-sm font-medium">Net Return</span>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-green-50 group-hover:text-green-600 transition">
                    <TrendingUp className="w-4 h-4" />
                </div>
            </div>
            <div>
                <span className={`text-3xl font-light ${totalPnL >= 0 ? 'text-slate-800' : 'text-rose-500'}`}>{formatPercent(totalPnL)}</span>
            </div>
        </div>
        <div className="soft-card p-6 flex flex-col justify-between h-40 group hover:border-blue-200 transition blur-loading animate-blur-in" style={{ animationDelay: '0.15s' }}>
            <div className="flex justify-between items-start">
                <span className="text-slate-400 text-sm font-medium">Win Rate</span>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition">
                    <Activity className="w-4 h-4" />
                </div>
            </div>
            <div>
                <span className="text-3xl font-light text-slate-800">{winrate}%</span>
            </div>
        </div>
        <div className="soft-card p-6 flex flex-col justify-between h-40 group hover:border-blue-200 transition blur-loading animate-blur-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex justify-between items-start">
                <span className="text-slate-400 text-sm font-medium">Total Trades</span>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                    <Layers className="w-4 h-4" />
                </div>
            </div>
            <div>
                <span className="text-3xl font-light text-slate-800">{trades.length}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

DashboardComponent.displayName = 'Dashboard';

export const Dashboard = React.memo(DashboardComponent);

