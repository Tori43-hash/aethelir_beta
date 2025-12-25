
import React from 'react';
import { createPortal } from 'react-dom';
import { Trade, Plan } from '../../types';
import { LayoutTemplate } from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTrade: Partial<Trade>;
  setNewTrade: React.Dispatch<React.SetStateAction<Partial<Trade>>>;
  onSave: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({ isOpen, onClose, newTrade, setNewTrade, onSave }) => {
  if (!isOpen) return null;

  const styles = ['Scalping', 'Intraday', 'Intraweek', 'Swing'];

  return createPortal(
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trade-modal-title"
    >
      <div className="absolute inset-0 bg-slate-200/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
        <h3 id="trade-modal-title" className="text-xl font-bold text-slate-800 mb-6 text-center">Log a new trade</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ticker</label>
            <input 
              type="text" 
              value={newTrade.ticker || ''}
              onChange={e => setNewTrade({...newTrade, ticker: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white transition"
              placeholder="e.g. AAPL"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Entry Date</label>
              <input 
                type="datetime-local" 
                value={newTrade.entryDate || ''}
                onChange={e => setNewTrade({...newTrade, entryDate: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Exit Date</label>
              <input 
                type="datetime-local" 
                value={newTrade.exitDate || ''}
                onChange={e => setNewTrade({...newTrade, exitDate: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setNewTrade({...newTrade, direction: 'Long'})}
              className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${newTrade.direction === 'Long' ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
            >Long</button>
            <button 
              onClick={() => setNewTrade({...newTrade, direction: 'Short'})}
              className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${newTrade.direction === 'Short' ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
            >Short</button>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">PnL ($)</label>
              <input 
                type="number" 
                value={newTrade.pnl || ''}
                onChange={e => setNewTrade({...newTrade, pnl: parseFloat(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white transition"
                placeholder="0.00"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Risk (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={newTrade.risk || ''}
                onChange={e => setNewTrade({...newTrade, risk: parseFloat(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white transition"
                placeholder="1.0"
              />
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Style</label>
            <div className="grid grid-cols-2 gap-2">
                {styles.map(s => (
                    <button 
                        key={s}
                        onClick={() => setNewTrade({...newTrade, style: s as any})}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${newTrade.style === s ? 'bg-slate-800 border-slate-800 text-white shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                    >
                        {s}
                    </button>
                ))}
            </div>
          </div>

          <button 
            onClick={onSave}
            className="w-full py-4 mt-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200 transition-all transform active:scale-95"
          >Save Entry</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

TradeModal.displayName = 'TradeModal';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  newPlan: Partial<Plan>;
  setNewPlan: React.Dispatch<React.SetStateAction<Partial<Plan>>>;
  onSave: () => void;
}

export const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose, newPlan, setNewPlan, onSave }) => {
  if (!isOpen) return null;

  return createPortal(
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-modal-title"
    >
        <div className="absolute inset-0 bg-slate-200/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
            <h3 id="plan-modal-title" className="text-xl font-bold text-slate-800 mb-6">Sketch a plan</h3>
            <div className="space-y-4">
                <input 
                  type="text" 
                  value={newPlan.ticker || ''}
                  onChange={e => setNewPlan({...newPlan, ticker: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-800 font-medium placeholder-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="Asset (Ticker)"
                />
                <input 
                  type="text" 
                  value={newPlan.image || ''}
                  onChange={e => setNewPlan({...newPlan, image: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-800 font-medium placeholder-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="Image URL"
                />
                <div className="relative">
                    <textarea 
                      value={newPlan.desc || ''}
                      onChange={e => setNewPlan({...newPlan, desc: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 text-slate-600 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 h-32 resize-none leading-relaxed"
                      placeholder="Write your thoughts here..."
                    ></textarea>
                </div>
                <button 
                  onClick={onSave}
                  className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
                >Save Note</button>
            </div>
        </div>
    </div>,
    document.body
  );
};

PlanModal.displayName = 'PlanModal';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: 'bottom' | 'top' | 'left' | 'right';
  setPosition: (pos: 'bottom' | 'top' | 'left' | 'right') => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({ isOpen, onClose, position, setPosition }) => {
  if (!isOpen) return null;

  const positions = [
    { id: 'bottom', label: 'Bottom', icon: <div className="w-full h-2 bg-current rounded-full mt-auto mb-1"></div> },
    { id: 'top', label: 'Top', icon: <div className="w-full h-2 bg-current rounded-full mb-auto mt-1"></div> },
    { id: 'left', label: 'Left', icon: <div className="w-2 h-full bg-current rounded-full mr-auto ml-1"></div> },
    { id: 'right', label: 'Right', icon: <div className="w-2 h-full bg-current rounded-full ml-auto mr-1"></div> },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-200/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-800">
                <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800">Menu Position</h3>
                <p className="text-xs text-slate-400">Customize your workspace layout.</p>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            {positions.map((pos) => (
                <button
                    key={pos.id}
                    onClick={() => setPosition(pos.id as any)}
                    className={`
                        relative h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300
                        ${position === pos.id 
                            ? 'border-slate-800 bg-slate-50 text-slate-800' 
                            : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                        }
                    `}
                >
                    <div className="w-12 h-16 border border-current/20 rounded-lg flex p-1 opacity-50">
                        {pos.icon}
                    </div>
                    <span className="text-xs font-bold">{pos.label}</span>
                </button>
            ))}
        </div>
        
        <button 
          onClick={onClose}
          className="w-full py-3 mt-6 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
        >
          Done
        </button>
      </div>
    </div>,
    document.body
  );
};

PreferencesModal.displayName = 'PreferencesModal';
