import { useState } from 'react';

export interface DateToggleConfig {
  fontSize: number;
  fontWeight: number;
  height: number;
  paddingX: number;
}

export interface PositionsConfig {
  fontSize: number;
  fontWeight: number;
  height: number;
  paddingX: number;
  borderRadius: number;
}

export interface MetricsConfig {
  scale: number;
  marginTop: number;
  marginBottom: number;
  fontWeight: number;
}

export interface LayoutConfig {
  maxWidth: number;
  paddingX: number;
  paddingY: number;
  chartHeight: number;
}

export interface TextConfig {
  headingScale: number;
  bodyScale: number;
  smallScale: number;
}

export interface FilterBarSpacing {
  left: number;
  right: number;
}

export const useLayoutConfig = () => {
  const [menuScale, setMenuScale] = useState(1);
  const [controlsScale, setControlsScale] = useState(1.05);
  const [edgeOffset, setEdgeOffset] = useState(24);

  const [dateToggleConfig, setDateToggleConfig] = useState<DateToggleConfig>({
    fontSize: 14,
    fontWeight: 500,
    height: 36,
    paddingX: 10
  });

  const [positionsConfig, setPositionsConfig] = useState<PositionsConfig>({
    fontSize: 14,
    fontWeight: 700,
    height: 30,
    paddingX: 10,
    borderRadius: 12
  });

  const [metricsConfig, setMetricsConfig] = useState<MetricsConfig>({
    scale: 0.95,
    marginTop: 24,
    marginBottom: 48,
    fontWeight: 500
  });

  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    maxWidth: 1440,
    paddingX: 152,
    paddingY: 56,
    chartHeight: 420
  });

  const [rightGutter, setRightGutter] = useState(24);
  const [leftGutter, setLeftGutter] = useState(24);
  const [filterBarSpacing, setFilterBarSpacing] = useState<FilterBarSpacing>({ left: 40, right: 0 });

  const [textConfig, setTextConfig] = useState<TextConfig>({
    headingScale: 1.2,
    bodyScale: 1.2,
    smallScale: 1.2
  });

  return {
    menuScale,
    setMenuScale,
    controlsScale,
    setControlsScale,
    edgeOffset,
    setEdgeOffset,
    dateToggleConfig,
    setDateToggleConfig,
    positionsConfig,
    setPositionsConfig,
    metricsConfig,
    setMetricsConfig,
    layoutConfig,
    setLayoutConfig,
    rightGutter,
    setRightGutter,
    leftGutter,
    setLeftGutter,
    filterBarSpacing,
    setFilterBarSpacing,
    textConfig,
    setTextConfig
  };
};

