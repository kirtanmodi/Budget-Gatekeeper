import type { ForecastData } from '../types';
import { formatCompactCurrency } from '../utils/format';

interface ForecastChartProps {
  data: ForecastData;
  height?: number;
}

export function ForecastChart({ data, height = 140 }: ForecastChartProps) {
  const { points, currentDay, daysInMonth, isOverspending } = data;

  const padding = { top: 20, right: 10, bottom: 24, left: 45 };
  const width = 320;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxSpend = Math.max(...points.map(p => Math.max(p.projected, p.budget)));
  const maxValue = Math.ceil(maxSpend / 10000) * 10000 || 10000;

  const xScale = (day: number) =>
    padding.left + ((day - 1) / (daysInMonth - 1)) * chartWidth;

  const yScale = (value: number) =>
    padding.top + chartHeight - (value / maxValue) * chartHeight;

  const actualPoints = points.filter(p => p.actual !== null);
  const futurePoints = points.filter(p => p.actual === null);

  const actualPath = actualPoints.length > 0
    ? actualPoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.day)} ${yScale(p.actual!)}`)
        .join(' ')
    : '';

  const actualAreaPath = actualPoints.length > 0
    ? `${actualPath} L ${xScale(actualPoints[actualPoints.length - 1].day)} ${yScale(0)} L ${xScale(actualPoints[0].day)} ${yScale(0)} Z`
    : '';

  const lastActual = points.find(p => p.day === currentDay);
  const projectedPath = futurePoints.length > 0 && lastActual
    ? `M ${xScale(currentDay)} ${yScale(lastActual.projected)} ` +
      futurePoints.map(p => `L ${xScale(p.day)} ${yScale(p.projected)}`).join(' ')
    : '';

  const budgetPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.day)} ${yScale(p.budget)}`)
    .join(' ');

  const projectedColor = isOverspending ? 'rgb(239,68,68)' : 'rgb(34,197,94)';
  const actualColor = 'rgb(34,197,94)';

  const currentPointY = points[currentDay - 1]?.projected ?? 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={actualColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={actualColor} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <text
        x={padding.left - 4}
        y={padding.top}
        className="text-[10px] fill-gray-500"
        textAnchor="end"
        dominantBaseline="middle"
      >
        {formatCompactCurrency(maxValue)}
      </text>
      <text
        x={padding.left - 4}
        y={padding.top + chartHeight / 2}
        className="text-[10px] fill-gray-500"
        textAnchor="end"
        dominantBaseline="middle"
      >
        {formatCompactCurrency(maxValue / 2)}
      </text>
      <text
        x={padding.left - 4}
        y={padding.top + chartHeight}
        className="text-[10px] fill-gray-500"
        textAnchor="end"
        dominantBaseline="middle"
      >
        0
      </text>

      <path
        d={budgetPath}
        fill="none"
        stroke="rgb(156,163,175)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />

      {actualAreaPath && (
        <path d={actualAreaPath} fill="url(#actualGradient)" />
      )}
      {actualPath && (
        <path
          d={actualPath}
          fill="none"
          stroke={actualColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}

      {projectedPath && (
        <path
          d={projectedPath}
          fill="none"
          stroke={projectedColor}
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeLinecap="round"
        />
      )}

      <line
        x1={xScale(currentDay)}
        y1={padding.top}
        x2={xScale(currentDay)}
        y2={padding.top + chartHeight}
        stroke="rgb(17,24,39)"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <circle
        cx={xScale(currentDay)}
        cy={yScale(currentPointY)}
        r="4"
        fill="rgb(17,24,39)"
      />

      <text
        x={xScale(1)}
        y={height - 6}
        className="text-[10px] fill-gray-500"
        textAnchor="start"
      >
        1
      </text>
      <text
        x={xScale(Math.ceil(daysInMonth / 2))}
        y={height - 6}
        className="text-[10px] fill-gray-500"
        textAnchor="middle"
      >
        {Math.ceil(daysInMonth / 2)}
      </text>
      <text
        x={xScale(daysInMonth)}
        y={height - 6}
        className="text-[10px] fill-gray-500"
        textAnchor="end"
      >
        {daysInMonth}
      </text>
    </svg>
  );
}
