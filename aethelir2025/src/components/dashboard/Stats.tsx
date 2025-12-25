import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, EyeOff, ChevronUp, ChevronDown, Plus, Settings, Palette, TrendingUp, Percent, Activity, PieChart, Calendar, Layers, Clock, TrendingDown, Trophy, AlertTriangle } from 'lucide-react';
import { Trade, Stat, Timeframe, ChartStyle, ChartColor } from '../../types';
import { formatPercent, calculateRiskStats } from '../../utils';
import { ProgressiveChart } from '../common/ProgressiveChart';
import { DebouncedColorInput } from '../common/DebouncedColorInput';

interface StatsProps {
  trades: Trade[];
  changeTab: (tab: string) => void;
}

const StatsComponent: React.FC<StatsProps> = ({ trades, changeTab }) => {
  const [statsFilter, setStatsFilter] = useState('all');
  const [hiddenStatIds, setHiddenStatIds] = useState<string[]>([]);
  const [statsOrder, setStatsOrder] = useState(['net', 'avg', 'winrate', 'pf', 'roi', 'total', 'hold']);
  const [showHiddenStats, setShowHiddenStats] = useState(false);
  const [draggingStatId, setDraggingStatId] = useState<string | null>(null);
  
  // Chart state specific to this view
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('line');
  const [chartColor, setChartColor] = useState<ChartColor>('default');
  const [showChartSettings, setShowChartSettings] = useState(false);
  
  // Color State
  const [customColor, setCustomColor] = useState('#000000'); 

  const [selectedStatId, setSelectedStatId] = useState('net');

  const filteredStatsTrades = useMemo(() => {
    if (statsFilter === 'all') return trades;
    return trades.filter(t => (t.style || 'Intraday') === statsFilter);
  }, [trades, statsFilter]);

  const currentStatsList = useMemo(() => {
    const tradesToUse = filteredStatsTrades;
    const totalPnL = tradesToUse.reduce((acc, t) => acc + t.pnl, 0);
    const avgReturn = tradesToUse.length > 0 ? (totalPnL / tradesToUse.length) : 0;
    const months = new Set(tradesToUse.map(t => t.date.substring(0, 7))).size || 1;
    const monthlyRoi = (totalPnL / months).toFixed(1);
    
    const wins = tradesToUse.filter(t => t.pnl > 0).reduce((a, t) => a + t.pnl, 0);
    const losses = Math.abs(tradesToUse.filter(t => t.pnl < 0).reduce((a, t) => a + t.pnl, 0));
    const pf = losses === 0 ? wins.toFixed(2) : (wins / losses).toFixed(2);
    
    const winCount = tradesToUse.filter(t => t.pnl > 0).length;
    const winrate = tradesToUse.length === 0 ? 0 : Math.round((winCount / tradesToUse.length) * 100);

    const rawStats: Stat[] = [
        { id: 'net', label: 'Total Return', icon: 'trending-up', desc: 'Total cumulative return', value: formatPercent(totalPnL) },
        { id: 'avg', label: 'Avg Return', icon: 'percent', desc: 'Average PnL per trade', value: formatPercent(avgReturn) },
        { id: 'winrate', label: 'Winrate', icon: 'activity', desc: 'Percentage of profitable trades', value: winrate + '%' },
        { id: 'pf', label: 'Profit Factor', icon: 'pie-chart', desc: 'Ratio of gross profit to gross loss', value: pf },
        { id: 'roi', label: 'Monthly ROI', icon: 'calendar', desc: 'Average return per month', value: formatPercent(monthlyRoi) },
        { id: 'total', label: 'Total Trades', icon: 'layers', desc: 'Number of executed trades', value: tradesToUse.length },
        { id: 'hold', label: 'Time in Trade', icon: 'clock', desc: 'Average position duration', value: '4h 12m' }
    ];

    const ordered = statsOrder
      .map(id => rawStats.find(s => s.id === id))
      .filter(s => s !== undefined) as Stat[];

    const missing = rawStats.filter(s => !statsOrder.includes(s.id));
    return [...ordered, ...missing];
  }, [filteredStatsTrades, statsOrder]);

  const selectedStat = currentStatsList.find(s => s.id === selectedStatId) || currentStatsList[0];
  const advancedRiskStats = useMemo(() => calculateRiskStats(filteredStatsTrades), [filteredStatsTrades]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingStatId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    if (e.currentTarget instanceof HTMLElement) {
       e.currentTarget.classList.add('opacity-50', 'scale-95');
    }
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
     e.preventDefault();
     if (!draggingStatId || draggingStatId === targetId) return;

     const fromIndex = statsOrder.indexOf(draggingStatId);
     const toIndex = statsOrder.indexOf(targetId);

     if (fromIndex !== -1 && toIndex !== -1) {
        const newOrder = [...statsOrder];
        newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, draggingStatId);
        setStatsOrder(newOrder);
     }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.classList.remove('opacity-50', 'scale-95');
    }
    setDraggingStatId(null);
  };

  const toggleStatVisibility = (id: string, e?: React.MouseEvent) => {
     e?.stopPropagation();
     if (hiddenStatIds.includes(id)) {
        setHiddenStatIds(hiddenStatIds.filter(x => x !== id));
     } else {
        setHiddenStatIds([...hiddenStatIds, id]);
        if (selectedStatId === id) {
           const firstVisible = currentStatsList.find(s => !hiddenStatIds.includes(s.id) && s.id !== id);
           if (firstVisible) setSelectedStatId(firstVisible.id);
        }
     }
  };

  const getIcon = (name: string) => {
    switch(name) {
        case 'trending-up': return TrendingUp;
        case 'percent': return Percent;
        case 'activity': return Activity;
        case 'pie-chart': return PieChart;
        case 'calendar': return Calendar;
        case 'layers': return Layers;
        case 'clock': return Clock;
        default: return TrendingUp;
    }
  };

  return (
    <div className="space-y-8 flex flex-col h-full">
       <header className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-light text-slate-800">Advanced Analytics</h2>
            <p className="text-slate-400 mt-1">Deep dive into your performance metrics.</p>
          </div>
          <button 
            onClick={() => changeTab('dashboard')} 
            className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition mb-1 text-sm font-medium"
          >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
       </header>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-1 space-y-4 blur-loading animate-blur-in">
            <div className="flex items-center justify-between px-2 mb-2">
               <h3 className="font-semibold text-slate-700 uppercase text-xs tracking-wider">Select Metric</h3>
               <select 
                 value={statsFilter} 
                 onChange={e => setStatsFilter(e.target.value)} 
                 className="bg-white border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg px-2 py-1 outline-none hover:border-slate-300 cursor-pointer shadow-sm"
               >
                 <option value="all">All Styles</option>
                 <option value="Swing">Swing</option>
                 <option value="Intraday">Intraday</option>
               </select>
            </div>
            <div className="space-y-3">
               {currentStatsList.filter(s => !hiddenStatIds.includes(s.id)).map(stat => {
                   const Icon = getIcon(stat.icon);
                   return (
                       <div 
                         key={stat.id}
                         onClick={() => setSelectedStatId(stat.id)}
                         draggable
                         onDragStart={(e) => handleDragStart(e, stat.id)}
                         onDragOver={(e) => handleDragOver(e, stat.id)}
                         onDragEnd={handleDragEnd}
                         className={`soft-card p-4 flex items-center gap-4 cursor-pointer transition-all duration-300 hover:shadow-md group relative ${selectedStatId === stat.id ? 'ring-2 ring-slate-800 bg-slate-50' : 'hover:-translate-y-1'} ${draggingStatId === stat.id ? 'cursor-grabbing' : 'cursor-grab'}`}
                       >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${selectedStatId === stat.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                             <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                             <div className="font-medium text-slate-800 text-sm">{stat.label}</div>
                             <div className="text-xs text-slate-400">{stat.desc}</div>
                          </div>
                          <div className="text-sm font-semibold text-slate-700">{stat.value}</div>
                          <button 
                            onClick={(e) => toggleStatVisibility(stat.id, e)}
                            className="absolute -top-2 -right-2 bg-white border border-slate-200 shadow-sm p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:border-rose-200 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                            title="Hide metric"
                          >
                             <EyeOff className="w-3 h-3" />
                          </button>
                       </div>
                   );
               })}
               
               {hiddenStatIds.length > 0 && (
                   <div className="pt-6 border-t border-slate-100 animate-fade-in">
                       <button onClick={() => setShowHiddenStats(!showHiddenStats)} className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 hover:text-slate-600 transition w-full">
                          <EyeOff className="w-3 h-3" />
                          <span>Hidden Metrics</span>
                          <span className="ml-auto">
                              {showHiddenStats ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                          </span>
                       </button>
                       {showHiddenStats && (
                           <div className="flex flex-wrap gap-2">
                               {currentStatsList.filter(s => hiddenStatIds.includes(s.id)).map(stat => {
                                   const Icon = getIcon(stat.icon);
                                   return (
                                       <button key={stat.id} onClick={() => toggleStatVisibility(stat.id)} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:bg-white hover:border-slate-300 hover:text-slate-700 hover:shadow-sm transition group">
                                           <Icon className="w-3 h-3 opacity-50" />
                                           <span>{stat.label}</span>
                                           <Plus className="w-3 h-3 ml-1 text-slate-300 group-hover:text-slate-600" />
                                       </button>
                                   );
                               })}
                           </div>
                       )}
                   </div>
               )}
            </div>
         </div>

         <div className="lg:col-span-2">
            <div className="soft-card p-6 lg:p-8 flex flex-col blur-loading animate-blur-in">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h3 className="font-medium text-slate-700 text-lg">{selectedStat?.label}</h3>
                        <p className="text-xs text-slate-400 mt-1">Historical Performance</p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto flex-wrap items-center justify-end">
                       <select 
                         value={timeframe} 
                         onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                         className="custom-select bg-white border border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none hover:border-slate-300 transition cursor-pointer font-medium shadow-sm"
                         style={{minWidth: '140px'}}
                        >
                            <option value="all">All Time</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom</option>
                       </select>

                       <div className="relative">
                          <button onClick={() => setShowChartSettings(!showChartSettings)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition border border-transparent hover:border-slate-200">
                             <Settings className="w-5 h-5" />
                          </button>
                          {showChartSettings && (
                              <>
                                <div className="fixed inset-0 z-0" onClick={() => setShowChartSettings(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-5 z-10 space-y-5 animate-fade-in">
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
                    trades={filteredStatsTrades} 
                    timeframe={timeframe} 
                    customStart="" 
                    customEnd=""
                    chartStyle={chartStyle}
                    chartColor={chartColor}
                    customColor={customColor}
                    selectedStat={selectedStat}
                    isDetailed={true}
                />
            </div>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="soft-card p-6 flex flex-col justify-between h-40 group hover:border-rose-200 transition blur-loading animate-blur-in" style={{ animationDelay: '0.1s' }}>
                <div className="flex justify-between items-start">
                    <span className="text-slate-400 text-sm font-medium">Max Drawdown</span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition">
                        <TrendingDown className="w-4 h-4" />
                    </div>
                </div>
                <div>
                    <span className="text-3xl font-light text-slate-800">{advancedRiskStats.dd}</span>
                    <div className="text-xs text-slate-400 mt-1">Peak to Valley</div>
                </div>
            </div>

            <div className="soft-card p-6 flex flex-col justify-between h-40 group hover:border-green-200 transition blur-loading animate-blur-in" style={{ animationDelay: '0.15s' }}>
                <div className="flex justify-between items-start">
                    <span className="text-slate-400 text-sm font-medium">Max Win Streak</span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-green-50 group-hover:text-green-600 transition">
                        <Trophy className="w-4 h-4" />
                    </div>
                </div>
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-light text-slate-800">{advancedRiskStats.maxWinStreak}</span>
                        <span className="text-sm text-slate-400 font-medium">Trades</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        Total Gain: <span className="font-semibold text-green-600">{advancedRiskStats.maxWinStreakVal}</span>
                    </div>
                </div>
            </div>

            <div className="soft-card p-6 flex flex-col justify-between h-40 group hover:border-orange-200 transition blur-loading animate-blur-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex justify-between items-start">
                    <span className="text-slate-400 text-sm font-medium">Max Loss Streak</span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                </div>
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-light text-slate-800">{advancedRiskStats.maxLossStreak}</span>
                        <span className="text-sm text-slate-400 font-medium">Trades</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        Total Loss: <span className="font-semibold text-rose-500">{advancedRiskStats.maxLossStreakVal}</span>
                    </div>
                </div>
            </div>
       </div>
    </div>
  );
};

StatsComponent.displayName = 'Stats';

export const Stats = React.memo(StatsComponent);
