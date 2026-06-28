import React from 'react';

interface TrendPoint {
  snapshotDate: string;
  score: number;
  level: string;
}

interface Props {
  data: TrendPoint[];
  width?: number;
  height?: number;
}

const LEVEL_COLORS: Record<string, string> = {
  FREE: '#10b981',
  LIGHT: '#3b82f6',
  NORMAL: '#f59e0b',
  HEAVY: '#f97316',
  OVERLOADED: '#ef4444',
};

export const WorkloadTrendChart: React.FC<Props> = ({ data, width = 700, height = 240 }) => {
  if (!data || data.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '13px' }}>
        بيانات غير كافية لعرض الرسم البياني
      </div>
    );
  }

  const padLeft = 50;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const minScore = Math.min(...data.map(d => d.score));
  const maxScore = Math.max(...data.map(d => d.score));
  const scoreRange = Math.max(maxScore - minScore, 1);
  const yMax = maxScore + scoreRange * 0.1;
  const yMin = Math.max(0, minScore - scoreRange * 0.1);

  const xScale = (_i: number) => padLeft + (_i / (data.length - 1)) * chartW;
  const yScale = (v: number) => padTop + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

  const linePath = data.map((d, i) => {
    const x = xScale(i);
    const y = yScale(d.score);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  const areaPath = data.map((d, i) => {
    const x = xScale(i);
    const y = yScale(d.score);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ') + ` L${xScale(data.length - 1)},${yScale(0)} L${xScale(0)},${yScale(0)} Z`;

  const yTicks = 5;
  const yStep = (yMax - yMin) / yTicks;

  return (
    <svg width={width} height={height} style={{ display: 'block', maxWidth: '100%' }}>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const y = yScale(yMin + yStep * i);
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={padLeft - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>
              {Math.round((yMin + yStep * i) * 10) / 10}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#trendFill)" />
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />

      {data.map((d, i) => {
        if (data.length > 15 && i > 0 && i < data.length - 1 && i % 3 !== 0) return null;
        const x = xScale(i);
        const y = yScale(d.score);
        const isLast = i === data.length - 1;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={isLast ? 5 : 3} fill={LEVEL_COLORS[d.level] || '#3b82f6'} stroke="#fff" strokeWidth={2} />
            {isLast && (
              <text x={x + 8} y={y + 4} fill={LEVEL_COLORS[d.level]} fontSize={10} fontWeight="bold">
                {d.score}
              </text>
            )}
          </g>
        );
      })}

      {data.length > 1 && (
        <>
          {[0, Math.floor(data.length / 2), data.length - 1].map(i => (
            <text key={i} x={xScale(i)} y={height - 6} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              {new Date(data[i].snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          ))}
        </>
      )}
    </svg>
  );
};
