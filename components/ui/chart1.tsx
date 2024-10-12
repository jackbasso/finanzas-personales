"use client";

import * as React from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Grid } from "@visx/grid";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";

import { cn } from "@/lib/utils";

const tooltipStyles = {
  ...defaultStyles,
  background: "rgba(0, 0, 0, 0.8)",
  border: "none",
  borderRadius: "4px",
  color: "white",
  fontSize: "12px",
  padding: "8px",
};

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: { name: string; value: number }[];
  config: {
    [key: string]: {
      label: string;
      color: string;
    };
  };
}

export function ChartContainer({ className, data = [], config, ...props }: ChartProps) {
  const width = 500;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = scaleBand<string>({
    range: [0, xMax],
    round: true,
    domain: data.map((d) => d.name),
    padding: 0.4,
  });

  const yScale = scaleLinear<number>({
    range: [yMax, 0],
    round: true,
    domain: [0, Math.max(...data.map((d) => d.value), 0)],
  });

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  });

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-[300px]", className)} {...props}>
        <p>No hay datos disponibles para mostrar.</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} ref={containerRef} {...props}>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <Grid xScale={xScale} yScale={yScale} width={xMax} height={yMax} stroke="currentColor" strokeOpacity={0.1} />
          <AxisBottom
            top={yMax}
            scale={xScale}
            tickLabelProps={() => ({
              fill: "currentColor",
              fontSize: 11,
              textAnchor: "middle",
            })}
          />
          <AxisLeft
            scale={yScale}
            tickLabelProps={() => ({
              fill: "currentColor",
              fontSize: 11,
              textAnchor: "end",
              dy: "0.33em",
            })}
          />
          {data.map((d) => {
            const barWidth = xScale.bandwidth();
            const barHeight = yMax - (yScale(d.value) ?? 0);
            const barX = xScale(d.name);
            const barY = yMax - barHeight;
            return (
              <Bar
                key={`bar-${d.name}`}
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={config[d.name]?.color ?? "currentColor"}
                onMouseLeave={() => hideTooltip()}
                onMouseMove={() => {
                  const top = barY;
                  const left = (barX ?? 0) + barWidth / 2;
                  showTooltip({
                    tooltipData: d,
                    tooltipTop: top,
                    tooltipLeft: left,
                  });
                }}
              />
            );
          })}
        </Group>
      </svg>
      {tooltipOpen && tooltipData && (
        <TooltipInPortal top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
          <div className="flex flex-col">
            <span className="text-xs">{tooltipData.name}</span>
            <span className="font-bold">{tooltipData.value}</span>
          </div>
        </TooltipInPortal>
      )}
    </div>
  );
}

export function ChartTooltip({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center rounded-lg border bg-background p-2 shadow-sm">{children}</div>;
}

export function ChartTooltipContent() {
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center space-x-2">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-sm font-medium">Value</span>
      </div>
      <div className="text-xs font-medium">100</div>
    </div>
  );
}
