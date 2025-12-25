export interface Trade {
  id: number;
  date: string;
  entryDate: string;
  exitDate: string;
  ticker: string;
  direction: 'Long' | 'Short';
  style: 'Scalping' | 'Intraday' | 'Intraweek' | 'Swing';
  risk: number;
  pnl: number;
  entryImg?: string;
  exitImg?: string;
  conclusions?: string;
  tda?: TdaItem[];
}

export interface TdaItem {
  tf: string;
  image: string;
  note: string;
}

export interface Plan {
  id: number;
  date: string;
  ticker: string;
  image: string;
  desc: string;
}

export interface Trader {
  id: number;
  name: string;
  initials: string;
  winrate: number;
  pnl: number;
  trades: number;
  rr: string;
  pf: number;
  isFunded: boolean;
}

export interface Stat {
  id: string;
  label: string;
  icon: string;
  desc: string;
  value: string | number;
}

export interface RiskStats {
  dd: string;
  maxWinStreak: number;
  maxWinStreakVal: string;
  maxLossStreak: number;
  maxLossStreakVal: string;
}

export type Timeframe = 'all' | 'week' | 'month' | 'custom';
export type ChartType = 'equity' | 'winrate';
export type ChartStyle = 'line' | 'bar';
export type ChartColor = 'default' | 'blue' | 'purple' | 'custom';

