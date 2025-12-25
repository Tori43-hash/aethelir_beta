import React, { useState } from 'react';
import { ArrowLeft, Calendar, Save, Trash2 } from 'lucide-react';
import { Trade, TdaItem } from '../../types';
import { formatPercent, formatTradeDate } from '../../utils';

interface TradeDetailProps {
  trade: Trade;
  goBack: () => void;
  onSave: (updatedTrade: Trade) => void;
}

export const TradeDetail: React.FC<TradeDetailProps> = ({ trade, goBack, onSave }) => {
  // Local state for editing to avoid mutating prop directly
  const [activeTrade, setActiveTrade] = useState<Trade>(JSON.parse(JSON.stringify(trade)));

  const handleSave = () => {
    onSave(activeTrade);
  };

  const removeTdaItem = (index: number) => {
    const newTda = [...(activeTrade.tda || [])];
    newTda.splice(index, 1);
    setActiveTrade({...activeTrade, tda: newTda});
  };

  const addTdaItem = () => {
    const newTda = [...(activeTrade.tda || []), { tf: '', image: '', note: '' }];
    setActiveTrade({...activeTrade, tda: newTda});
  };

  const updateTdaItem = (index: number, field: keyof TdaItem, value: string) => {
    const newTda = [...(activeTrade.tda || [])];
    newTda[index] = { ...newTda[index], [field]: value };
    setActiveTrade({...activeTrade, tda: newTda});
  };

  return (
    <div className="space-y-8">
        <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Journal
        </button>

        <header className="flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <span>{activeTrade.ticker}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${activeTrade.direction === 'Long' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {activeTrade.direction}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                        {activeTrade.style || 'Intraday'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100 text-xs font-semibold">
                        Risk: {activeTrade.risk || '1.0'}%
                    </span>
                </h2>
                <p className="text-slate-400 mt-1 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span dangerouslySetInnerHTML={formatTradeDate(activeTrade, true)} />
                </p>
            </div>
            <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outcome</span>
                <div className={`text-3xl font-light tracking-tight ${activeTrade.pnl >= 0 ? 'text-green-600' : 'text-rose-500'}`}>
                    {formatPercent(activeTrade.pnl)}
                </div>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="soft-card p-6 space-y-4">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Entry Execution</h3>
                <input 
                  type="text" 
                  value={activeTrade.entryImg || ''} 
                  onChange={e => setActiveTrade({...activeTrade, entryImg: e.target.value})}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 mb-2 focus:outline-none focus:ring-1 focus:ring-slate-300"
                  placeholder="Paste Image URL here..."
                />
                <div className="aspect-video bg-slate-50 rounded-xl overflow-hidden border border-slate-100 img-placeholder relative group">
                    {activeTrade.entryImg && <img src={activeTrade.entryImg} className="w-full h-full object-cover" alt="Entry" />}
                </div>
            </div>
            <div className="soft-card p-6 space-y-4">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Exit Execution</h3>
                <input 
                  type="text" 
                  value={activeTrade.exitImg || ''} 
                  onChange={e => setActiveTrade({...activeTrade, exitImg: e.target.value})}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 mb-2 focus:outline-none focus:ring-1 focus:ring-slate-300"
                  placeholder="Paste Image URL here..."
                />
                <div className="aspect-video bg-slate-50 rounded-xl overflow-hidden border border-slate-100 img-placeholder relative">
                    {activeTrade.exitImg && <img src={activeTrade.exitImg} className="w-full h-full object-cover" alt="Exit" />}
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-xl font-semibold text-slate-700 mb-4">Top-Down Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTrade.tda?.map((item, idx) => (
                    <div key={idx} className="soft-card p-4 space-y-3 relative group">
                        <div className="flex justify-between items-center gap-2">
                            <select 
                              value={item.tf} 
                              onChange={e => updateTdaItem(idx, 'tf', e.target.value)}
                              className="flex-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none"
                            >
                                <option value="">Select TF</option>
                                <option value="1M">1 Month</option>
                                <option value="1W">1 Week</option>
                                <option value="1D">1 Day</option>
                                <option value="4H">4 Hour</option>
                                <option value="1H">1 Hour</option>
                                <option value="15m">15 Min</option>
                                <option value="5m">5 Min</option>
                            </select>
                            <button 
                              onClick={() => removeTdaItem(idx)}
                              className="text-slate-300 hover:text-rose-500 transition p-1 rounded-md hover:bg-slate-50"
                              title="Remove Frame"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <input 
                          type="text" 
                          value={item.image} 
                          onChange={e => updateTdaItem(idx, 'image', e.target.value)}
                          className="w-full text-[10px] border border-slate-200 rounded-lg p-1.5 text-slate-500 focus:outline-none focus:border-slate-400"
                          placeholder="Image URL"
                        />
                        <div className="aspect-video bg-slate-50 rounded-lg border border-slate-100 img-placeholder overflow-hidden">
                            {item.image && <img src={item.image} className="w-full h-full object-cover" alt="TDA" />}
                        </div>

                        <textarea 
                          value={item.note} 
                          onChange={e => updateTdaItem(idx, 'note', e.target.value)}
                          className="w-full h-20 text-xs bg-slate-50 border border-slate-100 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-slate-200"
                          placeholder="Analysis notes..."
                        ></textarea>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-center">
                <button 
                  onClick={addTdaItem}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-800 transition py-2 px-4 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 border-dashed"
                >
                    + Add Analysis Frame
                </button>
            </div>
        </div>

        <div className="soft-card p-6 lg:p-8">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Conclusions & Lessons</h3>
            <textarea 
              value={activeTrade.conclusions || ''}
              onChange={e => setActiveTrade({...activeTrade, conclusions: e.target.value})}
              className="w-full h-32 text-sm text-slate-600 leading-relaxed bg-transparent border-none focus:ring-0 p-0 resize-none placeholder-slate-300"
              placeholder="What did you learn from this trade? What went well? What could be improved?"
            ></textarea>
        </div>

        <div className="flex justify-end pt-4 pb-10">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200 transform active:scale-95"
            >
                <Save className="w-4 h-4" /> Save Changes
            </button>
        </div>
    </div>
  );
};

TradeDetail.displayName = 'TradeDetail';
