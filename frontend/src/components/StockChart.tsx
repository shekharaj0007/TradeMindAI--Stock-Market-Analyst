"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, IChartApi, ISeriesApi, CandlestickData, Time } from "lightweight-charts";
import { Candle } from "@/lib/api";

interface StockChartProps {
  candles: Candle[];
  height?: number;
}

export function StockChart({ candles, height = 320 }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#181a20" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#2a2d35" },
        horzLines: { color: "#2a2d35" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#2a2d35" },
      timeScale: { borderColor: "#2a2d35" },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [height]);

  useEffect(() => {
    if (!seriesRef.current || !candles.length) return;

    const data: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.timestamp.slice(0, 10) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />;
}
