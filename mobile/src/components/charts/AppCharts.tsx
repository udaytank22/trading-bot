import React from 'react';
import { View, Dimensions, StyleProp, ViewStyle } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';
import Stylesheet from '../common/Stylesheet';

// Get screen width for responsiveness
const screenWidth = Dimensions.get('window').width;

interface BarChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 160,
  color = '#8b5cf6', // purple-500
  style,
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  const chartWidth = screenWidth - 64; // adjust for padding
  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 25;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1000);
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  const gridLineColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const labelColor = isDark ? '#9ca3af' : '#4b5563';

  const containerStyle = Stylesheet.cls(theme, 'w-full items-center');

  return (
    <View style={[containerStyle, style]}>
      <Svg width={chartWidth} height={height}>
        {/* Y Axis Gridlines and Labels */}
        {yTicks.map((tick, i) => {
          const y = paddingTop + graphHeight - (tick / maxVal) * graphHeight;
          return (
            <React.Fragment key={i}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke={gridLineColor}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 4}
                fill={labelColor}
                fontSize={9}
                fontWeight="bold"
                textAnchor="end"
              >
                {tick >= 1000 ? `$${(tick / 1000).toFixed(1)}k` : `$${tick}`}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* X Axis Line */}
        <Line
          x1={paddingLeft}
          y1={paddingTop + graphHeight}
          x2={chartWidth - paddingRight}
          y2={paddingTop + graphHeight}
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          strokeWidth={1}
        />

        {/* Bars */}
        {data.map((item, idx) => {
          const barWidth = (graphWidth / data.length) * 0.55;
          const spacing = graphWidth / data.length;
          const x = paddingLeft + idx * spacing + (spacing - barWidth) / 2;
          const barHeight = (item.value / maxVal) * graphHeight;
          const y = paddingTop + graphHeight - barHeight;

          return (
            <React.Fragment key={idx}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 4)} // minimum height of 4 for visibility
                rx={4}
                fill={color}
              />
              <SvgText
                x={x + barWidth / 2}
                y={paddingTop + graphHeight + 15}
                fill={labelColor}
                fontSize={9}
                fontWeight="bold"
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

interface LineChartProps {
  data: BarChartData[];
  height?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 160,
  color = '#8b5cf6',
  style,
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  const chartWidth = screenWidth - 64;
  const paddingLeft = 40;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1000);
  const yTicks = [0, maxVal * 0.33, maxVal * 0.66, maxVal];

  const gridLineColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const labelColor = isDark ? '#9ca3af' : '#4b5563';

  // Calculate coordinates
  const points = data.map((item, idx) => {
    const spacing = graphWidth / (data.length - 1);
    const x = paddingLeft + idx * spacing;
    const y = paddingTop + graphHeight - (item.value / maxVal) * graphHeight;
    return { x, y };
  });

  // Construct path string
  let pathD = '';
  let areaD = '';

  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`;
  }

  const containerStyle = Stylesheet.cls(theme, 'w-full items-center');

  return (
    <View style={[containerStyle, style]}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </LinearGradient>
        </Defs>

        {/* Y Axis Gridlines and Labels */}
        {yTicks.map((tick, i) => {
          const y = paddingTop + graphHeight - (tick / maxVal) * graphHeight;
          return (
            <React.Fragment key={i}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke={gridLineColor}
                strokeWidth={1}
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 3}
                fill={labelColor}
                fontSize={9}
                fontWeight="bold"
                textAnchor="end"
              >
                {tick >= 1000 ? `$${(tick / 1000).toFixed(1)}k` : `$${tick}`}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Shaded Area Under Line */}
        {areaD ? <Path d={areaD} fill="url(#areaGrad)" /> : null}

        {/* Line Path */}
        {pathD ? <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} /> : null}

        {/* Data points */}
        {points.map((pt, idx) => (
          <React.Fragment key={idx}>
            <Circle
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill={isDark ? '#0c0e12' : '#ffffff'}
              stroke={color}
              strokeWidth={2}
            />
            <SvgText
              x={pt.x}
              y={paddingTop + graphHeight + 15}
              fill={labelColor}
              fontSize={9}
              fontWeight="bold"
              textAnchor="middle"
            >
              {data[idx].label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

interface DonutData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutData[];
  size?: number;
  thickness?: number;
  style?: StyleProp<ViewStyle>;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 140,
  thickness = 22,
  style,
}) => {
  const theme = useAppStore((state) => state.theme);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedAngle = 0;

  const containerStyle = Stylesheet.cls(theme, 'items-center flex-row justify-center');
  const innerWrapperStyle = Stylesheet.cls(theme, 'absolute items-center justify-center');
  const textStyle = Stylesheet.cls(theme, 'font-bold text-center');
  const captionStyle = Stylesheet.cls(theme, 'text-gray-400 text-center uppercase tracking-wider text-[9px]');
  const legendContainer = Stylesheet.cls(theme, 'ml-6 justify-center');

  return (
    <View style={[containerStyle, style]}>
      <View style={{ width: size, height: size, position: 'relative' }}>
        <Svg width={size} height={size}>
          {data.map((item, idx) => {
            const percentage = total > 0 ? item.value / total : 0;
            const strokeDashoffset = circumference - circumference * percentage;
            const strokeDasharray = `${circumference} ${circumference}`;
            const rotation = accumulatedAngle * 360;
            
            accumulatedAngle += percentage;

            return (
              <Circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={thickness}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(${rotation - 90} ${size / 2} ${size / 2})`}
              />
            );
          })}
        </Svg>
        
        {/* Central Overlay for Donut Text */}
        <View 
          style={[
            innerWrapperStyle,
            {
              top: thickness,
              left: thickness,
              width: size - thickness * 2,
              height: size - thickness * 2,
            }
          ]}
        >
          <AppText variant="h2" style={textStyle}>
            {total}
          </AppText>
          <AppText variant="captionSemibold" style={captionStyle}>
            Total Deals
          </AppText>
        </View>
      </View>
      
      {/* Legend */}
      <View style={legendContainer}>
        {data.map((item, idx) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
          return (
            <View key={idx} style={Stylesheet.cls(theme, 'flex-row items-center mb-2')}>
              <View 
                style={[
                  Stylesheet.cls(theme, 'w-3 h-3 rounded-full mr-2'),
                  { backgroundColor: item.color }
                ]}
              />
              <AppText variant="captionSemibold" style={Stylesheet.cls(theme, 'text-gray-700 dark:text-gray-300')}>
                {item.label} ({pct}%)
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
};
export default BarChart;
