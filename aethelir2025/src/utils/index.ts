import { Trade, RiskStats, Timeframe } from '../types';

export const formatPercent = (value: number | string): string => {
  const val = parseFloat(value.toString());
  return (val >= 0 ? '+' : '') + val.toFixed(1) + '%';
};

export const formatTradeDate = (trade: Trade, isFull = false) => {
  if (!trade.entryDate) return { __html: trade.date };
  const d1 = new Date(trade.entryDate);
  const d2 = trade.exitDate ? new Date(trade.exitDate) : d1;

  const optionsDate: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const optionsTime: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

  const date1Str = d1.toLocaleDateString('en-US', optionsDate);
  const time1Str = d1.toLocaleTimeString('en-US', optionsTime);
  const date2Str = d2.toLocaleDateString('en-US', optionsDate);
  const time2Str = d2.toLocaleTimeString('en-US', optionsTime);

  if (isFull) {
    if (date1Str === date2Str) return { __html: `${date1Str}, ${time1Str} - ${time2Str}` };
    return { __html: `${date1Str} ${time1Str} - ${date2Str} ${time2Str}` };
  }

  if (date1Str === date2Str) {
    return {
      __html: `<span class="block text-slate-700 font-semibold">${date1Str}</span><span class="text-xs text-slate-400">${time1Str} - ${time2Str}</span>`
    };
  } else {
    return {
      __html: `<span class="block text-slate-700 font-semibold">${date1Str}</span><span class="text-xs text-slate-400">to ${date2Str}</span>`
    };
  }
};

export const calculateRiskStats = (trades: Trade[]): RiskStats => {
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let peak = -Infinity;
  let maxDD = 0;
  let runningPnL = 0;

  sortedTrades.forEach(t => {
    runningPnL += t.pnl;
    if (runningPnL > peak) peak = runningPnL;
    const dd = peak - runningPnL;
    if (dd > maxDD) maxDD = dd;
  });

  let currentWinStreak = 0;
  let currentWinSum = 0;
  let maxWinStreak = 0;
  let maxWinStreakVal = 0;

  let currentLossStreak = 0;
  let currentLossSum = 0;
  let maxLossStreak = 0;
  let maxLossStreakVal = 0;

  sortedTrades.forEach(t => {
    const pnl = t.pnl;
    if (pnl >= 0) {
      currentWinStreak++;
      currentWinSum += pnl;

      if (currentLossStreak > 0) {
        if (currentLossStreak > maxLossStreak) {
          maxLossStreak = currentLossStreak;
          maxLossStreakVal = currentLossSum;
        } else if (currentLossStreak === maxLossStreak) {
          if (currentLossSum < maxLossStreakVal) maxLossStreakVal = currentLossSum;
        }
        currentLossStreak = 0;
        currentLossSum = 0;
      }

      if (currentWinStreak > maxWinStreak) {
        maxWinStreak = currentWinStreak;
        maxWinStreakVal = currentWinSum;
      } else if (currentWinStreak === maxWinStreak) {
        if (currentWinSum > maxWinStreakVal) maxWinStreakVal = currentWinSum;
      }

    } else {
      currentLossStreak++;
      currentLossSum += pnl;

      if (currentWinStreak > 0) {
        if (currentWinStreak > maxWinStreak) {
          maxWinStreak = currentWinStreak;
          maxWinStreakVal = currentWinSum;
        } else if (currentWinStreak === maxWinStreak) {
          if (currentWinSum > maxWinStreakVal) maxWinStreakVal = currentWinSum;
        }
        currentWinStreak = 0;
        currentWinSum = 0;
      }

      if (currentLossStreak > maxLossStreak) {
        maxLossStreak = currentLossStreak;
        maxLossStreakVal = currentLossSum;
      } else if (currentLossStreak === maxLossStreak) {
        if (currentLossSum < maxLossStreakVal) maxLossStreakVal = currentLossSum;
      }
    }
  });

  if (currentLossStreak > maxLossStreak) {
    maxLossStreak = currentLossStreak;
    maxLossStreakVal = currentLossSum;
  }
  if (currentWinStreak > maxWinStreak) {
    maxWinStreak = currentWinStreak;
    maxWinStreakVal = currentWinSum;
  }

  return {
    dd: '-' + maxDD.toFixed(1) + '%',
    maxWinStreak,
    maxWinStreakVal: '+' + maxWinStreakVal.toFixed(1) + '%',
    maxLossStreak,
    maxLossStreakVal: maxLossStreakVal.toFixed(1) + '%'
  };
};

export const getFilteredTrades = (
  allTrades: Trade[], 
  timeframe: Timeframe, 
  customStart: string, 
  customEnd: string
) => {
  const sortedTrades = [...allTrades].sort((a, b) => a.id - b.id);
  const filteredTrades: Trade[] = [];
  const initialData = { balance: 0, wins: 0, count: 0, grossWin: 0, grossLoss: 0 };

  const toLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  let startDateStr = '';
  let endDateStr = '9999-12-31';

  if (timeframe === 'week') {
    const d = new Date();
    const day = d.getDay() || 7;
    if (day !== 1) d.setDate(d.getDate() - (day - 1));
    startDateStr = toLocalDateString(d);
  } else if (timeframe === 'month') {
    const d = new Date();
    startDateStr = toLocalDateString(new Date(d.getFullYear(), d.getMonth(), 1));
  } else if (timeframe === 'custom') {
    if (customStart || customEnd) {
      startDateStr = customStart || sortedTrades[0]?.date;
      endDateStr = customEnd || toLocalDateString(new Date());
    }
  }

  if (timeframe === 'all') {
    return { trades: sortedTrades, initialData };
  } else {
    sortedTrades.forEach(t => {
      const pnl = t.pnl;
      if (t.date < startDateStr) {
        initialData.balance += pnl;
        initialData.count++;
        if (pnl > 0) { initialData.wins++; initialData.grossWin += pnl; }
        else { initialData.grossLoss += Math.abs(pnl); }
      } else if (t.date >= startDateStr && t.date <= endDateStr) {
        filteredTrades.push(t);
      }
    });
    return { trades: filteredTrades, initialData };
  }
};

