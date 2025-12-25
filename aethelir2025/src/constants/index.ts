import { Trader } from '../types';

export const STORAGE_KEYS = {
  TRADES: 'garden_trades_final_17',
  BG_CONFIG: 'aethelir_bg_config_v6',
  BLOCKS: 'aethelir_blocks_v3',
  WHITEBOARD: 'aethelir_whiteboard_v1',
} as const;

export const DEFAULT_TRADERS: Trader[] = [
  { id: 1, name: 'Tori (You)', initials: 'ME', winrate: 68, pnl: 42.5, trades: 142, rr: '1:2.4', pf: 2.1, isFunded: true },
  { id: 2, name: 'Sarah_Trade', initials: 'ST', winrate: 74, pnl: 125.2, trades: 310, rr: '1:1.8', pf: 2.8, isFunded: false },
  { id: 3, name: 'BearHunter', initials: 'BH', winrate: 45, pnl: 12.4, trades: 89, rr: '1:4.5', pf: 1.9, isFunded: false },
  { id: 4, name: 'CryptoWhale', initials: 'CW', winrate: 52, pnl: -4.5, trades: 215, rr: '1:1.2', pf: 0.8, isFunded: false },
  { id: 5, name: 'ScalpMaster', initials: 'SM', winrate: 81, pnl: 32.1, trades: 850, rr: '1:0.9', pf: 1.5, isFunded: true }
];

export const DEFAULT_TRADE = {
  direction: 'Long' as const,
  style: 'Intraday' as const,
  risk: 1.0
};

