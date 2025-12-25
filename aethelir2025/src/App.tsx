import React, { useState, useMemo, useCallback, Suspense, useRef, useEffect, useLayoutEffect } from 'react';
import { NavigationDock } from './components/common/NavigationDock';
import { Dashboard } from './components/dashboard/Dashboard';
import { Journal } from './components/journal/Journal';
import { TradeModal, PreferencesModal } from './components/modals/Modals';

// Lazy load components that are not always visible with preload capability
const Stats = React.lazy(() => 
  import('./components/dashboard/Stats').then(module => ({ default: module.Stats }))
);
const Traders = React.lazy(() => 
  import('./components/traders/Traders').then(module => ({ default: module.Traders }))
);
const Profile = React.lazy(() => 
  import('./components/traders/Traders').then(module => ({ default: module.Profile }))
);
const TradeDetail = React.lazy(() => 
  import('./components/journal/TradeDetail').then(module => ({ default: module.TradeDetail }))
);

// Preload functions for hover-based preloading
const preloadStats = () => import('./components/dashboard/Stats');
const preloadTraders = () => import('./components/traders/Traders');
const preloadTradeDetail = () => import('./components/journal/TradeDetail');

import { Trade, Trader } from './types';
import { DEFAULT_TRADERS, DEFAULT_TRADE, STORAGE_KEYS } from './constants';
import { useWindowSize } from './hooks/useWindowSize';
import { useTrades } from './hooks/useTrades';
import { useLayoutConfig } from './hooks/useLayoutConfig';
import { usePageTransition } from './hooks/usePageTransition';
import { usePreload } from './hooks/usePreload';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  // Keep track of visited tabs to keep them mounted (optimizes transition speed)
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['dashboard']));

  const [navPosition, setNavPosition] = useState<'bottom' | 'top' | 'left' | 'right'>('bottom');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [journalKey, setJournalKey] = useState(0);
  const prevTabRef = useRef<string>('dashboard');
  const [skipContainerTransition, setSkipContainerTransition] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const windowSize = useWindowSize();
  const { trades, saveTrades, addTrade: addTradeHook, updateTrade } = useTrades();
  const layoutConfig = useLayoutConfig();
  
  // Page transition and preload hooks
  const { transitionState, startTransition, isBlurActive } = usePageTransition({
    duration: 200,
    onTransitionEnd: () => {
      // Transition complete
    }
  });
  const { preloadComponent } = usePreload();

  // Modals state
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [newTrade, setNewTrade] = useState<Partial<Trade>>(DEFAULT_TRADE);

  // Navigation details state
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);

  const changeTab = useCallback((tab: string) => {
    if (tab === currentTab) return;
    
    // Start transition animation
    startTransition();
    
    // Use requestAnimationFrame for smooth transition and blur synchronization
    requestAnimationFrame(() => {
      setCurrentTab(tab);
      setVisitedTabs(prev => {
        const newSet = new Set(prev);
        newSet.add(tab);
        return newSet;
      });
    });
  }, [currentTab, startTransition]);
  
  // Preload handlers for navigation buttons
  const handleNavHover = useCallback((tab: string) => {
    switch(tab) {
      case 'stats':
        preloadComponent(preloadStats);
        break;
      case 'journal':
        // Journal is already loaded, no need to preload
        break;
      default:
        break;
    }
  }, [preloadComponent]);

  const addTrade = useCallback(() => {
    if (!newTrade.ticker || newTrade.pnl === undefined) return;
    const trade = addTradeHook(newTrade);
    if (trade) {
      setNewTrade(DEFAULT_TRADE);
      setIsTradeModalOpen(false);
    }
  }, [newTrade, addTradeHook]);

  const openTradeDetail = useCallback((trade: Trade) => {
    if (!trade.tda || trade.tda.length === 0) {
      trade.tda = Array(4).fill({ tf: '', image: '', note: '' });
    }
    setActiveTrade(trade);
    changeTab('trade-detail');
  }, [changeTab]);

  const saveTradeDetail = useCallback((updatedTrade: Trade) => {
    updateTrade(updatedTrade);
    changeTab('journal');
  }, [updateTrade, changeTab]);

  const openProfile = useCallback((trader: Trader) => {
    setSelectedTrader(trader);
    changeTab('profile');
  }, [changeTab]);

  // Memoized calculations
  const { totalPnL, winrate } = useMemo(() => {
    const total = trades.reduce((acc, t) => acc + t.pnl, 0);
    const winCount = trades.filter(t => t.pnl > 0).length;
    const winrate = trades.length === 0 ? 0 : Math.round((winCount / trades.length) * 100);
    return { totalPnL: total, winrate };
  }, [trades]);

  // Disable container transition for all page transitions to prevent expansion flicker
  useLayoutEffect(() => {
    // Always disable transition when tab changes to prevent visual flicker
    if (containerRef.current) {
      containerRef.current.style.transition = 'none';
    }
    setSkipContainerTransition(true);
    
    // Re-enable transition after a short delay (only for future changes, not current)
    const timeoutId = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.style.transition = '';
      }
      setSkipContainerTransition(false);
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [currentTab]);

  // Track previous tab for Journal animation skip
  useEffect(() => {
    prevTabRef.current = currentTab;
  }, [currentTab]);

  const getLayoutPadding = useCallback(() => {
    const basePaddingX = `clamp(16px, 8vw, ${layoutConfig.layoutConfig.paddingX}px)`;
    const basePaddingY = `clamp(24px, 5vh, ${layoutConfig.layoutConfig.paddingY}px)`;

    switch(navPosition) {
      case 'bottom': return { paddingLeft: basePaddingX, paddingRight: basePaddingX, paddingTop: basePaddingY, paddingBottom: '120px' };
      case 'top': return { paddingLeft: basePaddingX, paddingRight: basePaddingX, paddingTop: '120px', paddingBottom: basePaddingY };
      case 'left': return { paddingLeft: '120px', paddingRight: basePaddingX, paddingTop: basePaddingY, paddingBottom: basePaddingY };
      case 'right': return { paddingLeft: basePaddingX, paddingRight: '120px', paddingTop: basePaddingY, paddingBottom: basePaddingY };
      default: return { paddingLeft: basePaddingX, paddingRight: basePaddingX, paddingTop: basePaddingY, paddingBottom: basePaddingY };
    }
  }, [navPosition, layoutConfig.layoutConfig.paddingX, layoutConfig.layoutConfig.paddingY]);

  // Compute container styles with memoization to ensure correct dimensions on first render
  // This prevents expansion flicker on all page transitions
  const containerStyles = useMemo(() => {
    const needsWideLayout = currentTab === 'journal' || currentTab === 'dashboard' || currentTab === 'stats' || currentTab === 'traders';
    if (needsWideLayout) {
      const journalPadding = getLayoutPadding();
      return {
        maxWidth: '1800px',
        paddingLeft: 'clamp(16px, 8vw, 80px)',
        paddingRight: 'clamp(16px, 8vw, 80px)',
        paddingTop: journalPadding.paddingTop,
        paddingBottom: journalPadding.paddingBottom,
      };
    } else {
      const normalPadding = getLayoutPadding();
      return {
        maxWidth: `${layoutConfig.layoutConfig.maxWidth}px`,
        ...normalPadding,
      };
    }
  }, [currentTab, getLayoutPadding, layoutConfig.layoutConfig.maxWidth]);


  return (
    <div 
      className="min-h-screen bg-white overflow-x-hidden"
      style={{
        '--chart-height': `clamp(250px, 40vh, ${layoutConfig.layoutConfig.chartHeight}px)`,
        '--scale-heading': layoutConfig.textConfig.headingScale,
        '--scale-body': layoutConfig.textConfig.bodyScale,
        '--scale-small': layoutConfig.textConfig.smallScale,
      } as React.CSSProperties}
    >
      <NavigationDock 
        currentTab={currentTab} 
        changeTab={changeTab}
        onNavHover={handleNavHover}
        position={navPosition}
        scale={layoutConfig.menuScale}
        edgeOffset={layoutConfig.edgeOffset}
        onOpenSettings={() => setIsPreferencesOpen(true)}
      />
      
      <main className="w-full relative">
        <div 
          ref={containerRef}
          className="mx-auto box-border"
          style={containerStyles || { 
            maxWidth: `${(currentTab === 'journal' || currentTab === 'dashboard' || currentTab === 'stats') ? 1800 : layoutConfig.layoutConfig.maxWidth}px`,
            ...((currentTab === 'journal' || currentTab === 'dashboard' || currentTab === 'stats')
              ? { ...getLayoutPadding(), paddingLeft: 'clamp(16px, 8vw, 80px)', paddingRight: 'clamp(16px, 8vw, 80px)' }
              : getLayoutPadding()
            )
          }}
        >
          {/* Page Transition Wrapper */}
          <div 
            className={`page-transition-container ${transitionState === 'exiting' ? 'page-exiting' : transitionState === 'entering' ? 'page-entering' : 'page-idle'}`}
          >
            {/* Dashboard - Always rendered if visited (or default) */}
            <div 
              className={`page-content ${currentTab === 'dashboard' ? 'page-active' : 'page-inactive'} ${isBlurActive && currentTab === 'dashboard' ? 'page-content-blur' : ''}`}
              style={{ display: currentTab === 'dashboard' ? 'block' : 'none' }}
            >
              <Dashboard 
                trades={trades} 
                totalPnL={totalPnL} 
                winrate={winrate} 
                openTradeModal={() => setIsTradeModalOpen(true)} 
                changeTab={changeTab}
              />
            </div>

            {/* Stats - Render if visited */}
            {(visitedTabs.has('stats') || currentTab === 'stats') && (
              <div 
                className={`page-content ${currentTab === 'stats' ? 'page-active' : 'page-inactive'} ${isBlurActive && currentTab === 'stats' ? 'page-content-blur' : ''}`}
                style={{ display: currentTab === 'stats' ? 'block' : 'none' }}
              >
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                      <span className="text-xs">Loading Stats...</span>
                    </div>
                  </div>
                }>
                  <Stats trades={trades} changeTab={changeTab} />
                </Suspense>
              </div>
            )}

            {/* Traders (Whiteboard) - Render if visited. Important: keeps canvas memory alive */}
            {(visitedTabs.has('traders') || currentTab === 'traders') && (
              <div 
                className={`${isBlurActive && currentTab === 'traders' ? 'page-content-blur' : ''}`}
                style={{ display: currentTab === 'traders' ? 'block' : 'none', height: '80vh' }}
              >
                <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400">Loading Whiteboard...</div>}>
                  <Traders tradersList={DEFAULT_TRADERS} openProfile={openProfile} />
                </Suspense>
              </div>
            )}

            {/* Journal - Render if visited */}
            {(visitedTabs.has('journal') || currentTab === 'journal') && (
              <div 
                className={`page-content ${currentTab === 'journal' ? 'page-active' : 'page-inactive'} ${isBlurActive && currentTab === 'journal' ? 'page-content-blur' : ''}`}
                style={{ display: currentTab === 'journal' ? 'block' : 'none' }}
              >
                <Journal 
                  key={journalKey}
                  trades={trades} 
                  openTradeModal={() => setIsTradeModalOpen(true)}
                  openTradeDetail={openTradeDetail}
                  controlsScale={layoutConfig.controlsScale}
                  dateToggleConfig={layoutConfig.dateToggleConfig}
                  positionsConfig={layoutConfig.positionsConfig}
                  metricsConfig={layoutConfig.metricsConfig}
                  rightGutter={layoutConfig.rightGutter}
                  leftGutter={layoutConfig.leftGutter}
                  filterBarSpacing={layoutConfig.filterBarSpacing}
                  skipAnimation={true}
                />
              </div>
            )}

            {/* Sub-views (kept conditional for now as they are specific contexts) */}
            {currentTab === 'profile' && selectedTrader && (
              <div className={`page-content page-active ${isBlurActive ? 'page-content-blur' : ''}`}>
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                      <span className="text-xs">Loading Profile...</span>
                    </div>
                  </div>
                }>
                  <Profile trader={selectedTrader} goBack={() => changeTab('traders')} />
                </Suspense>
              </div>
            )}

            {currentTab === 'trade-detail' && activeTrade && (
              <div className={`page-content page-active ${isBlurActive ? 'page-content-blur' : ''}`}>
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                      <span className="text-xs">Loading Trade...</span>
                    </div>
                  </div>
                }>
                  <TradeDetail 
                    trade={activeTrade}
                    goBack={() => changeTab('journal')}
                    onSave={saveTradeDetail}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </main>

      <TradeModal 
        isOpen={isTradeModalOpen} 
        onClose={() => setIsTradeModalOpen(false)}
        newTrade={newTrade}
        setNewTrade={setNewTrade}
        onSave={addTrade}
      />

      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        position={navPosition}
        setPosition={setNavPosition}
      />

    </div>
  );
};

App.displayName = 'App';

export default App;
