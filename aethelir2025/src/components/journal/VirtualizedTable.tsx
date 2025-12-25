import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Trade } from '../../types';

interface VirtualizedTableProps {
  trades: Trade[];
  visibleColumns: string[];
  columnWidths: Record<string, number>;
  selectedIds: number[];
  isTextWrapEnabled: boolean;
  renderCell: (id: string, trade: Trade, cellBorder: string, isLast: boolean) => React.ReactNode;
  renderHeader: (id: string, isLast: boolean) => React.ReactNode;
  toggleSelection: (id: number, e: React.MouseEvent) => void;
  openTradeDetail: (trade: Trade) => void;
  SELECTION_COL_WIDTH: number;
}

/**
 * Виртуализированная таблица для больших списков
 * Рендерит только видимые строки для максимальной производительности
 */
export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  trades,
  visibleColumns,
  columnWidths,
  selectedIds,
  isTextWrapEnabled,
  renderCell,
  renderHeader,
  toggleSelection,
  openTradeDetail,
  SELECTION_COL_WIDTH
}) => {
  const totalWidth = useMemo(() => {
    return SELECTION_COL_WIDTH + visibleColumns.reduce((sum, id) => sum + (columnWidths[id] || 0), 0);
  }, [visibleColumns, columnWidths, SELECTION_COL_WIDTH]);

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const trade = trades[index];
    if (!trade) return null;

    const isSelected = selectedIds.includes(trade.id);
    const isLastRow = index === trades.length - 1;
    const cellBorder = isLastRow ? 'border-b border-slate-200' : 'border-b border-slate-100';

    return (
      <tr 
        style={style}
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
              {isSelected && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </td>
        {visibleColumns.map((id, colIndex) => {
          const isLastCol = colIndex === visibleColumns.length - 1;
          return renderCell(id, trade, cellBorder, isLastCol);
        })}
      </tr>
    );
  }, [trades, selectedIds, visibleColumns, renderCell, toggleSelection, openTradeDetail, SELECTION_COL_WIDTH]);

  // Используем виртуализацию только для больших списков
  if (trades.length < 50) {
    // Для маленьких списков рендерим все строки
    return (
      <tbody className="bg-white">
        {trades.map((trade, index) => {
          const isSelected = selectedIds.includes(trade.id);
          const isLastRow = index === trades.length - 1;
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
                    {isSelected && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </td>
              {visibleColumns.map((id, colIndex) => {
                const isLastCol = colIndex === visibleColumns.length - 1;
                return renderCell(id, trade, cellBorder, isLastCol);
              })}
            </tr>
          );
        })}
      </tbody>
    );
  }

  // Для больших списков используем виртуализацию
  return (
    <tbody className="bg-white">
      <tr>
        <td colSpan={visibleColumns.length + 1} style={{ padding: 0, height: 'auto' }}>
          <List
            height={Math.min(600, trades.length * 60)} // Максимальная высота 600px или высота всех строк
            itemCount={trades.length}
            itemSize={60} // Высота одной строки
            width={totalWidth}
            style={{ width: '100%' }}
          >
            {Row}
          </List>
        </td>
      </tr>
    </tbody>
  );
};

VirtualizedTable.displayName = 'VirtualizedTable';
