'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Currency, ChartInterval } from '@/types/finance';
import { DailyPoint } from '@/services/metrics';
import { formatCurrency } from '@/services/currency';

interface RevenueChartProps {
  data: DailyPoint[];
  currency: Currency;
  activeInterval: ChartInterval;
  onChangeInterval: (interval: ChartInterval) => void;
  onOpenAddModal: () => void;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  currency,
  activeInterval,
  onChangeInterval,
  onOpenAddModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const intervals: { id: ChartInterval; label: string }[] = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: '6m', label: '6M' },
    { id: '1y', label: '1A' },
  ];

  // SVG internal coordinates
  const width = 1000;
  const height = 280;
  const padding = { top: 25, right: 25, bottom: 40, left: 65 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Max value calculation
  const maxAmount = useMemo(() => {
    if (!data.length) return 100;
    const max = Math.max(...data.map((d) => d.amount));
    if (max <= 0) return 100;
    const power = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / power) * power;
  }, [data]);

  const hasData = useMemo(() => {
    return data.some((d) => d.amount > 0);
  }, [data]);

  // Points mapping
  const points = useMemo(() => {
    if (!data.length) return [];
    return data.map((d, i) => {
      const x = padding.left + (i / Math.max(1, data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (d.amount / maxAmount) * chartHeight;
      return { x, y, data: d, index: i };
    });
  }, [data, chartWidth, chartHeight, maxAmount, padding.left, padding.top]);

  // Smooth cubic bezier path
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };
    if (points.length === 1) {
      const p = points[0];
      return {
        linePath: `M ${p.x} ${p.y}`,
        areaPath: `M ${p.x} ${p.y} L ${p.x} ${padding.top + chartHeight} Z`,
      };
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX1 = current.x + (next.x - current.x) / 2.8;
      const controlY1 = current.y;
      const controlX2 = next.x - (next.x - current.x) / 2.8;
      const controlY2 = next.y;
      d += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`;
    }

    const baselineY = padding.top + chartHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const area = `${d} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;

    return { linePath: d, areaPath: area };
  }, [points, chartHeight, padding.top]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!points.length || !containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    let closestIndex = 0;
    let minDistance = Infinity;
    points.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    setHoverIndex(closestIndex);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoveredPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  // Horizontal guidelines
  const yTicks = [0, 0.5, 1].map((ratio) => {
    const val = maxAmount * ratio;
    const y = padding.top + chartHeight - ratio * chartHeight;
    return { val, y };
  });

  // Responsive sample labels
  const xLabels = useMemo(() => {
    if (!data.length) return [];
    if (data.length <= 7) return data.map((d, i) => ({ label: d.label, index: i }));

    const step = Math.ceil(data.length / 5);
    const result: { label: string; index: number }[] = [];
    for (let i = 0; i < data.length; i += step) {
      result.push({ label: data[i].label, index: i });
    }
    if (result[result.length - 1].index !== data.length - 1) {
      result.push({ label: data[data.length - 1].label, index: data.length - 1 });
    }
    return result;
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="glass-panel-primary glass-specular glass-corner-sheen rounded-xl p-5 sm:p-6 w-full"
    >
      {/* Top Header of Chart */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 font-mono text-xs relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-[#858593] uppercase tracking-wider text-[11px]">
            EVOLUÇÃO DIÁRIA DE FATURAMENTO
          </span>
          <span className="text-white/20">|</span>
          <span className="text-[10px] text-[#C69BFF]">
            {data.length} DIAS
          </span>
        </div>

        {/* Intervals */}
        <div className="flex items-center gap-1 p-0.5 bg-black/40 border border-white/[0.06] rounded-md self-start sm:self-auto">
          {intervals.map((int) => (
            <button
              key={int.id}
              onClick={() => onChangeInterval(int.id)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition-all ${
                activeInterval === int.id
                  ? 'bg-[#9B4DFF]/25 border border-[#9B4DFF]/50 text-[#F0E9FF] font-semibold shadow-[0_0_15px_rgba(157,78,255,0.2)]'
                  : 'text-[#858593] hover:text-white'
              }`}
            >
              {int.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/[0.08] bg-black/20 rounded-lg my-2">
          <p className="text-xs font-mono text-[#858593] mb-3">
            Seu gráfico aparecerá aqui quando você adicionar dados no período de {activeInterval.toUpperCase()}.
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 text-xs font-mono text-[#C69BFF] border border-[#9B4DFF]/40 hover:bg-[#9B4DFF]/15 transition-colors rounded"
          >
            + REGISTRAR PRIMEIRO DADO
          </button>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto cursor-crosshair overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              {/* Purple Ambient Area Gradient */}
              <linearGradient id="glassChartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9B4DFF" stopOpacity="0.16" />
                <stop offset="70%" stopColor="#7C3AED" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.0" />
              </linearGradient>

              {/* Glowing stroke filter */}
              <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid Guidelines (0.035 opacity) */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={tick.y}
                  x2={width - padding.right}
                  y2={tick.y}
                  stroke="rgba(255, 255, 255, 0.035)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 12}
                  y={tick.y + 3.5}
                  textAnchor="end"
                  fontSize="9.5"
                  fill="#858593"
                  className="font-mono select-none"
                >
                  {formatCurrency(tick.val, currency).split(',')[0]}
                </text>
              </g>
            ))}

            {/* X Axis Labels */}
            {xLabels.map((lbl, idx) => {
              const pt = points[lbl.index];
              if (!pt) return null;
              return (
                <text
                  key={idx}
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="#858593"
                  className="font-mono select-none uppercase tracking-tight"
                >
                  {lbl.label}
                </text>
              );
            })}

            {/* Sheer Fill */}
            <path d={areaPath} fill="url(#glassChartAreaGrad)" />

            {/* Soft Glow Stroke Behind Main Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#A855F7"
              strokeWidth="4"
              opacity="0.25"
              filter="url(#purpleGlow)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Main Sharp 2px Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#C084FC"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Active Point Tracker */}
            {hoveredPoint && (
              <g>
                <line
                  x1={hoveredPoint.x}
                  y1={padding.top}
                  x2={hoveredPoint.x}
                  y2={padding.top + chartHeight}
                  stroke="#C69BFF"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="6"
                  fill="#9B4DFF"
                  fillOpacity="0.3"
                />
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="3.5"
                  fill="#F0E9FF"
                  stroke="#7C3AED"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {/* Glass Floating Tooltip */}
          {hoveredPoint && (
            <div
              className="pointer-events-none absolute z-30 top-2 px-3 py-1.5 bg-[#12101C]/90 border border-[#9B4DFF]/40 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md rounded text-[11px] font-mono"
              style={{
                left: `${Math.min(85, Math.max(15, (hoveredPoint.x / width) * 100))}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="text-[#858593] text-[9.5px]">
                {hoveredPoint.data.date}
              </div>
              <div className="font-bold text-[#F0E9FF] text-xs">
                {formatCurrency(hoveredPoint.data.amount, currency)}
              </div>
              {hoveredPoint.data.count > 0 && (
                <div className="text-[9px] text-[#C69BFF]">
                  {hoveredPoint.data.count} {hoveredPoint.data.count === 1 ? 'entrada' : 'entradas'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
