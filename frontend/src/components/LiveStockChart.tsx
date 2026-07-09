"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  Time,
  IPriceLine,
} from "lightweight-charts";
import { Candle, TradingSignal, liveChartWsUrl } from "@/lib/api";

const INTERVALS = [
  { label: "1D", value: "1d" },
  { label: "1H", value: "1h" },
  { label: "15m", value: "15m" },
  { label: "5m", value: "5m" },
];

interface LiveStockChartProps {
  symbol: string;
  initialCandles: Candle[];
  signal?: TradingSignal | null;
  onQuoteUpdate?: (price: number, change: number) => void;
  onSignalUpdate?: (signal: Partial<TradingSignal>) => void;
  height?: number;
}

export function LiveStockChart({
  symbol,
  initialCandles,
  signal,
  onQuoteUpdate,
  onSignalUpdate,
  height = 420,
}: LiveStockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const [timeInterval, setTimeInterval] = useState("1d");
  const [live, setLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");

  const applyCandles = (candles: Candle[]) => {
    if (!candleRef.current || !volumeRef.current || !candles.length) return;

    const candleData: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.timestamp.slice(0, 10) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volData: HistogramData<Time>[] = candles.map((c) => ({
      time: c.timestamp.slice(0, 10) as Time,
      value: c.volume,
      color: c.close >= c.open ? "#26a69a55" : "#ef535055",
    }));

    candleRef.current.setData(candleData);
    volumeRef.current.setData(volData);
    chartRef.current?.timeScale().fitContent();
  };

  const applyPriceLines = (sig: Partial<TradingSignal> | null | undefined) => {
    if (!candleRef.current) return;
    priceLinesRef.current.forEach((l) => candleRef.current?.removePriceLine(l));
    priceLinesRef.current = [];

    if (!sig?.entry_price) return;

    const lines = [
      { price: sig.entry_price, color: "#387ed1", title: "Entry" },
      { price: sig.target_price!, color: "#26a69a", title: "Target" },
      { price: sig.stop_loss!, color: "#ef5350", title: "Stop Loss" },
    ];

    for (const l of lines) {
      if (l.price) {
        const pl = candleRef.current.createPriceLine({
          price: l.price,
          color: l.color,
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: l.title,
        });
        priceLinesRef.current.push(pl);
      }
    }
  };

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
      timeScale: { borderColor: "#2a2d35", timeVisible: true },
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    chartRef.current = chart;
    candleRef.current = candles;
    volumeRef.current = volume;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [height]);

  useEffect(() => {
    applyCandles(initialCandles);
  }, [initialCandles]);

  const onQuoteRef = useRef(onQuoteUpdate);
  const onSignalRef = useRef(onSignalUpdate);
  onQuoteRef.current = onQuoteUpdate;
  onSignalRef.current = onSignalUpdate;

  useEffect(() => {
    applyPriceLines(signal);
  }, [signal?.entry_price, signal?.target_price, signal?.stop_loss]);

  useEffect(() => {
    if (!symbol) return;

    const ws = new WebSocket(liveChartWsUrl(symbol, timeInterval));

    ws.onopen = () => setLive(true);
    ws.onclose = () => setLive(false);
    ws.onerror = () => setLive(false);

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === "live") {
        applyCandles(msg.candles);
        applyPriceLines(msg.signal);
        onSignalRef.current?.(msg.signal);
        if (msg.quote) {
          onQuoteRef.current?.(msg.quote.price, msg.quote.change_percent);
        }
        setLastUpdate(new Date().toLocaleTimeString("en-IN"));
      }
    };

    return () => ws.close();
  }, [symbol, timeInterval]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          {INTERVALS.map((i) => (
            <button
              key={i.value}
              onClick={() => setTimeInterval(i.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                timeInterval === i.value
                  ? "bg-[#387ed1] text-white"
                  : "bg-[#0f1117] text-zinc-400 hover:text-white"
              }`}
            >
              {i.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-emerald-400" : "bg-zinc-600"}`} />
          {live ? "Live" : "Connecting..."}
          {lastUpdate && <span>· {lastUpdate}</span>}
        </div>
      </div>
      <div ref={containerRef} className="w-full overflow-hidden rounded-lg" />
    </div>
  );
}
