import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Line } from 'react-native-svg';

const formatINR = value => {
  const num = Number(value) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toLocaleString('en-IN')}`;
};

export const DonutChart = ({
  labels,
  series,
  colors,
  efficientValue,
  theme,
  size = 200,
}) => {
  const total = series.reduce((sum, v) => sum + (Number(v) || 0), 0);
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments =
    total > 0
      ? series.map((value, index) => {
          const pct = (Number(value) || 0) / total;
          const dash = pct * circumference;
          const segment = {
            color: colors[index % colors.length],
            dash,
            gap: circumference - dash,
            rotation: (offset / circumference) * 360 - 90,
          };
          offset += dash;
          return segment;
        })
      : [];

  return (
    <View style={chartStyles.donutWrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={theme.borderLight}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {segments.map((seg, i) => (
          <Circle
            key={`seg-${i}`}
            cx={cx}
            cy={cy}
            r={radius}
            stroke={seg.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeLinecap="butt"
            rotation={seg.rotation}
            origin={`${cx}, ${cy}`}
          />
        ))}
      </Svg>
      <View style={[chartStyles.donutCenter, { width: size, height: size }]}>
        <Text style={[chartStyles.donutEfficiency, { color: theme.primary }]}>
          {Number(efficientValue || 0).toFixed(0)}%
        </Text>
        <Text style={[chartStyles.donutEfficiencyLabel, { color: theme.textMuted }]}>
          Efficiency
        </Text>
        <Text style={[chartStyles.donutTotal, { color: theme.textPrimary }]}>
          {total.toLocaleString('en-IN')}
        </Text>
      </View>
      <View style={chartStyles.legendWrap}>
        {labels.map((label, i) => (
          <View key={label} style={chartStyles.legendRow}>
            <View
              style={[chartStyles.legendDot, { backgroundColor: colors[i % colors.length] }]}
            />
            <Text style={[chartStyles.legendLabel, { color: theme.textSecondary }]}>
              {label}
            </Text>
            <Text style={[chartStyles.legendValue, { color: theme.textPrimary }]}>
              {Number(series[i] || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const HorizontalBarChart = ({ labels, series, colors, theme }) => {
  const max = Math.max(...series.map(v => Number(v) || 0), 1);

  return (
    <View style={chartStyles.barChartWrap}>
      {labels.map((label, index) => {
        const value = Number(series[index]) || 0;
        const widthPct = (value / max) * 100;
        return (
          <View key={label} style={chartStyles.barRow}>
            <View style={chartStyles.barLabelRow}>
              <Text style={[chartStyles.barLabel, { color: theme.textSecondary }]}>
                {label}
              </Text>
              <Text style={[chartStyles.barValue, { color: theme.textPrimary }]}>
                {formatINR(value)}
              </Text>
            </View>
            <View style={[chartStyles.barTrack, { backgroundColor: theme.borderLight }]}>
              <View
                style={[
                  chartStyles.barFill,
                  {
                    width: `${Math.max(widthPct, value > 0 ? 4 : 0)}%`,
                    backgroundColor: colors[index % colors.length],
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

export const CollectionSpeedometer = ({
  collection,
  target,
  saleVolume,
  theme,
  size = 240,
}) => {
  const value = Number(collection) || 0;
  const maxValue = useMemo(() => {
    const sale = Number(saleVolume) || 0;
    const tgt = Number(target) || 0;
    const base = Math.max(sale, tgt, value);
    return base > 0 ? base * 1.15 : Math.max(value * 1.2, 100000);
  }, [collection, saleVolume, target]);

  const pct = Math.min((value / maxValue) * 100, 100);
  const cx = size / 2;
  const cy = size * 0.58;
  const radius = size * 0.38;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const needleAngle = startAngle + (pct / 100) * Math.PI;

  const polarToCartesian = (angle, r) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const describeArc = (fromAngle, toAngle) => {
    const start = polarToCartesian(fromAngle, radius);
    const end = polarToCartesian(toAngle, radius);
    const largeArc = toAngle - fromAngle > Math.PI ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const bgPath = describeArc(startAngle, endAngle);
  const valuePath = describeArc(startAngle, startAngle + (pct / 100) * Math.PI);
  const needleEnd = polarToCartesian(needleAngle, radius - 8);

  const ticks = [0, 25, 50, 75, 100];

  return (
    <View style={chartStyles.speedoWrap}>
      <Svg width={size} height={size * 0.72}>
        <Path
          d={bgPath}
          stroke={theme.borderLight}
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={valuePath}
          stroke="#258a25"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        {ticks.map(tick => {
          const angle = startAngle + (tick / 100) * Math.PI;
          const inner = polarToCartesian(angle, radius - 18);
          const outer = polarToCartesian(angle, radius + 4);
          return (
            <Line
              key={tick}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={theme.border}
              strokeWidth={1.5}
            />
          );
        })}
        <G>
          <Line
            x1={cx}
            y1={cy}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke={theme.textPrimary}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Circle cx={cx} cy={cy} r={8} fill={theme.primary} />
          <Circle cx={cx} cy={cy} r={4} fill={theme.surface} />
        </G>
      </Svg>
      <View style={chartStyles.speedoCenter}>
        <Text style={[chartStyles.speedoValue, { color: '#258a25' }]}>
          {formatINR(value)}
        </Text>
        <Text style={[chartStyles.speedoLabel, { color: theme.textMuted }]}>
          Total Collection
        </Text>
        <Text style={[chartStyles.speedoPct, { color: theme.textSecondary }]}>
          {pct.toFixed(0)}% of target range
        </Text>
      </View>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  donutWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  donutCenter: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutEfficiency: {
    fontSize: 22,
    fontWeight: '800',
  },
  donutEfficiencyLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  donutTotal: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  legendWrap: {
    width: '100%',
    marginTop: 12,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  barChartWrap: {
    gap: 16,
    paddingVertical: 8,
  },
  barRow: {
    gap: 6,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  barValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  barTrack: {
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  speedoWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  speedoCenter: {
    alignItems: 'center',
    marginTop: -8,
  },
  speedoValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  speedoLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  speedoPct: {
    fontSize: 11,
    marginTop: 4,
  },
});
