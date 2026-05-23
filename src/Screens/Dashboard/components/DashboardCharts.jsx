import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  G,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';

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
        <Text
          style={[chartStyles.donutEfficiencyLabel, { color: theme.textMuted }]}
        >
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
              style={[
                chartStyles.legendDot,
                { backgroundColor: colors[i % colors.length] },
              ]}
            />
            <Text
              style={[chartStyles.legendLabel, { color: theme.textSecondary }]}
            >
              {label}
            </Text>
            <Text
              style={[chartStyles.legendValue, { color: theme.textPrimary }]}
            >
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
              <Text
                style={[chartStyles.barLabel, { color: theme.textSecondary }]}
              >
                {label}
              </Text>
              <Text
                style={[chartStyles.barValue, { color: theme.textPrimary }]}
              >
                {formatINR(value)}
              </Text>
            </View>
            <View
              style={[
                chartStyles.barTrack,
                { backgroundColor: theme.borderLight },
              ]}
            >
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

const SPEEDO_ZONES = [
  { from: 0, to: 33, color: '#FF6B6B' },
  { from: 33, to: 66, color: '#FFB020' },
  { from: 66, to: 100, color: '#2ECC71' },
];

export const CollectionSpeedometer = ({
  collection,
  target,
  saleVolume,
  pendingPayment,
  theme,
  size = 280,
}) => {
  const value = Number(collection) || 0;
  const sale = Number(saleVolume) || 0;
  const tgt = Number(target) || 0;
  const pending =
    pendingPayment != null ? Number(pendingPayment) : Math.max(sale - value, 0);

  const maxValue = useMemo(() => {
    const base = Math.max(sale, tgt, value);
    return base > 0 ? base * 1.12 : Math.max(value * 1.2, 100000);
  }, [value, sale, tgt]);

  const pct = Math.min((value / maxValue) * 100, 100);
  const achievementPct = sale > 0 ? Math.min((value / sale) * 100, 999) : pct;

  const svgHeight = size * 0.68;
  const cx = size / 2;
  const cy = svgHeight * 0.82;
  const radius = size * 0.34;
  const centerOverlayTop = cy - radius * 0.64;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const needleAngle = startAngle + (pct / 100) * Math.PI;

  const polarToCartesian = (angle, r) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const describeArc = (fromAngle, toAngle, r = radius) => {
    const start = polarToCartesian(fromAngle, r);
    const end = polarToCartesian(toAngle, r);
    const largeArc = toAngle - fromAngle > Math.PI ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const progressPath = describeArc(
    startAngle,
    startAngle + (pct / 100) * Math.PI,
  );
  const needleEnd = polarToCartesian(needleAngle, radius - 12);
  const needleBaseL = polarToCartesian(needleAngle + Math.PI / 2, 5);
  const needleBaseR = polarToCartesian(needleAngle - Math.PI / 2, 5);

  const tickMarks = [0, 25, 50, 75, 100];

  const needleColor = pct < 33 ? '#E53E3E' : pct < 66 ? '#DD6B00' : '#258a25';

  return (
    <View style={chartStyles.speedoWrap}>
      <View
        style={[
          chartStyles.speedoCard,
          {
            backgroundColor: theme.dark
              ? 'rgba(37, 138, 37, 0.08)'
              : 'rgba(37, 138, 37, 0.06)',
            borderColor: theme.dark
              ? 'rgba(46, 204, 113, 0.25)'
              : 'rgba(37, 138, 37, 0.15)',
          },
        ]}
      >
        <View style={chartStyles.speedoGaugeArea}>
          <Svg width={size} height={svgHeight}>
            <Defs>
              <LinearGradient
                id="speedoProgress"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <Stop offset="0%" stopColor="#5D6AD1" />
                <Stop offset="50%" stopColor="#2ECC71" />
                <Stop offset="100%" stopColor="#258a25" />
              </LinearGradient>
              <LinearGradient
                id="speedoTrack"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <Stop offset="0%" stopColor={theme.borderLight} />
                <Stop offset="100%" stopColor={theme.border} />
              </LinearGradient>
            </Defs>

            {/* Outer subtle ring */}
            <Path
              d={describeArc(startAngle, endAngle, radius + 10)}
              stroke={theme.borderLight}
              strokeWidth={2}
              fill="none"
              opacity={0.5}
            />

            {/* Color zones (background) */}
            {SPEEDO_ZONES.map(zone => {
              const fromA = startAngle + (zone.from / 100) * Math.PI;
              const toA = startAngle + (zone.to / 100) * Math.PI;
              return (
                <Path
                  key={zone.from}
                  d={describeArc(fromA, toA)}
                  stroke={zone.color}
                  strokeWidth={16}
                  fill="none"
                  strokeLinecap="butt"
                  opacity={0.22}
                />
              );
            })}

            {/* Track */}
            <Path
              d={describeArc(startAngle, endAngle)}
              stroke="url(#speedoTrack)"
              strokeWidth={16}
              fill="none"
              strokeLinecap="round"
              opacity={0.85}
            />

            {/* Progress arc */}
            {pct > 0 ? (
              <Path
                d={progressPath}
                stroke="url(#speedoProgress)"
                strokeWidth={16}
                fill="none"
                strokeLinecap="round"
              />
            ) : null}

            {/* Tick marks + labels */}
            {tickMarks.map(tick => {
              const angle = startAngle + (tick / 100) * Math.PI;
              const inner = polarToCartesian(angle, radius - 22);
              const outer = polarToCartesian(angle, radius + 6);
              const labelPos = polarToCartesian(angle, radius + 18);
              return (
                <G key={tick}>
                  <Line
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    stroke={theme.textMuted}
                    strokeWidth={tick % 50 === 0 ? 2 : 1.2}
                    opacity={0.8}
                  />
                  {tick !== 50 ? (
                    <SvgText
                      x={labelPos.x}
                      y={labelPos.y + 4}
                      fontSize="10"
                      fontWeight="600"
                      fill={theme.textMuted}
                      textAnchor="middle"
                    >
                      {tick}
                    </SvgText>
                  ) : null}
                </G>
              );
            })}

            {/* Needle */}
            <Path
              d={`M ${needleBaseL.x} ${needleBaseL.y} L ${needleEnd.x} ${needleEnd.y} L ${needleBaseR.x} ${needleBaseR.y} Z`}
              fill={needleColor}
              opacity={0.95}
            />
            <Circle
              cx={cx}
              cy={cy}
              r={12}
              fill={theme.surface}
              stroke={needleColor}
              strokeWidth={3}
            />
            <Circle cx={cx} cy={cy} r={5} fill={needleColor} />
          </Svg>

          <View
            style={[chartStyles.speedoCenterOverlay, { top: centerOverlayTop }]}
            pointerEvents="none"
          >
            {/* <View
              style={[
                chartStyles.speedoBadge,
                { backgroundColor: theme.surface },
              ]}
            >
              <Icon name="wallet-outline" size={14} color="#258a25" />
              <Text style={[chartStyles.speedoBadgeText, { color: theme.textMuted }]}>
                Collection
              </Text>
            </View> */}
            <Text
              style={[chartStyles.speedoValue, { color: theme.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {formatINR(value)}
            </Text>
          </View>
        </View>

        <View style={chartStyles.speedoAchievedRow}>
          <View
            style={[
              chartStyles.speedoPctPill,
              { backgroundColor: `${needleColor}18` },
            ]}
          >
            <Text style={[chartStyles.speedoPctText, { color: needleColor }]}>
              {achievementPct.toFixed(0)}% achieved
            </Text>
          </View>
        </View>

        <View style={chartStyles.speedoStatsRow}>
          <View
            style={[
              chartStyles.speedoStatBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.borderLight,
              },
            ]}
          >
            <Text
              style={[chartStyles.speedoStatLabel, { color: theme.textMuted }]}
            >
              Sale Volume
            </Text>
            <Text style={[chartStyles.speedoStatValue, { color: '#5b6aca' }]}>
              {formatINR(sale)}
            </Text>
          </View>
          <View
            style={[
              chartStyles.speedoStatBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.borderLight,
              },
            ]}
          >
            <Text
              style={[chartStyles.speedoStatLabel, { color: theme.textMuted }]}
            >
              Collection
            </Text>
            <Text style={[chartStyles.speedoStatValue, { color: '#258a25' }]}>
              {formatINR(value)}
            </Text>
          </View>
          <View
            style={[
              chartStyles.speedoStatBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.borderLight,
              },
            ]}
          >
            <Text
              style={[chartStyles.speedoStatLabel, { color: theme.textMuted }]}
            >
              Pending
            </Text>
            <Text style={[chartStyles.speedoStatValue, { color: '#b22021' }]}>
              {formatINR(pending)}
            </Text>
          </View>
        </View>
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
  speedoCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  speedoGaugeArea: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingBottom: 4,
  },
  speedoCenterOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    maxWidth: '100%',
  },
  speedoAchievedRow: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  speedoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  speedoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  speedoValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    width: '100%',
  },
  speedoPctPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  speedoPctText: {
    fontSize: 12,
    fontWeight: '700',
  },
  speedoStatsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 0,
  },
  speedoStatBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  speedoStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  speedoStatValue: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
});
