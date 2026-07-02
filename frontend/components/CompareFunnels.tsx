"use client"

import { ResponsiveFunnel } from "@nivo/funnel"
import { ResponsiveLine } from "@nivo/line"
import { ResponsivePie } from "@nivo/pie"
import ReactECharts from "echarts-for-react"

type FunnelDatum = { k: string; v: number; c: string }

// 통계 차트 공통 테마 팔레트 — 블루·민트 중심 + 소프트 액센트
const THEME = ["#2f8bff", "#16c2a3", "#6a8cff", "#3db0ff", "#9b8cff", "#0c8f78", "#ffb454", "#ff7a9c"]

// ECharts 트리맵 — 유형 점유율
export function EChartTreemap({ items }: { items: { label: string; value: number }[] }) {
  const option = {
    series: [
      {
        type: "treemap",
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        top: 2,
        left: 2,
        right: 2,
        bottom: 2,
        label: { show: true, formatter: "{b}\n{c}", fontSize: 10, fontWeight: 600, color: "#fff", lineHeight: 13, overflow: "truncate" },
        itemStyle: { borderColor: "#fff", borderWidth: 2, gapWidth: 2, borderRadius: 3 },
        data: items.map((it, i) => ({ name: it.label, value: it.value, itemStyle: { color: THEME[i % THEME.length] } })),
      },
    ],
  }
  return <ReactECharts option={option} style={{ height: 200, width: "100%" }} opts={{ renderer: "svg" }} notMerge lazyUpdate />
}

// ECharts 버블 — 유형 포지셔닝(건수 × 위험% × 대기=원 크기)
export function EChartBubble({ items }: { items: { label: string; x: number; y: number; r: number }[] }) {
  const maxR = Math.max(...items.map((i) => i.r), 1)
  const option = {
    grid: { left: 40, right: 18, top: 18, bottom: 30 },
    tooltip: { trigger: "item", confine: true, formatter: (p: { value: (string | number)[] }) => `${p.value[3]}<br/>건수 ${p.value[0]} · 위험 ${p.value[1]}% · 대기 ${p.value[2]}` },
    xAxis: { type: "value", name: "건수", nameLocation: "middle", nameGap: 18, nameTextStyle: { fontSize: 9, color: "#9aa6b6" }, axisLabel: { fontSize: 9, color: "#9aa6b6" }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: "#eef2f7" } } },
    yAxis: { type: "value", name: "위험%", nameTextStyle: { fontSize: 9, color: "#9aa6b6" }, axisLabel: { fontSize: 9, color: "#9aa6b6" }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: "#eef2f7" } } },
    series: [
      {
        type: "scatter",
        symbolSize: (d: number[]) => 10 + (d[2] / maxR) * 30,
        data: items.map((it, i) => ({ value: [it.x, it.y, it.r, it.label], itemStyle: { color: THEME[i % THEME.length], opacity: 0.75, borderColor: "#fff", borderWidth: 1 } })),
        label: { show: true, formatter: (p: { value: (string | number)[] }) => p.value[3] as string, position: "top", distance: 4, fontSize: 8.5, color: "#33445c", fontWeight: 700 },
        labelLayout: { hideOverlap: false },
      },
    ],
  }
  return <ReactECharts option={option} style={{ height: 200, width: "100%" }} opts={{ renderer: "svg" }} notMerge lazyUpdate />
}

// ECharts 레이더 — 채널별 위험 프로파일
export function EChartRadar({ axes, series }: { axes: string[]; series: { name: string; color: string; values: number[] }[] }) {
  const option = {
    color: series.map((s) => s.color),
    tooltip: { trigger: "item", confine: true },
    legend: { data: series.map((s) => s.name), bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 9, color: "#5b6b80" } },
    radar: {
      indicator: axes.map((a) => ({ name: a, max: 100 })),
      radius: "62%",
      center: ["50%", "48%"],
      axisName: { fontSize: 8.5, color: "#5b6b80" },
      splitLine: { lineStyle: { color: "#e6edf5" } },
      splitArea: { areaStyle: { color: ["#fbfdff", "#f4f8fd"] } },
      axisLine: { lineStyle: { color: "#e6edf5" } },
    },
    series: [
      {
        type: "radar",
        data: series.map((s) => ({ value: s.values, name: s.name, areaStyle: { opacity: 0.15 }, lineStyle: { width: 2 }, symbolSize: 3 })),
      },
    ],
  }
  return <ReactECharts option={option} style={{ height: 200, width: "100%" }} opts={{ renderer: "svg" }} notMerge lazyUpdate />
}

// ECharts 가로 막대 — 민원 원인 분류(서비스 품질 / 제도 개선)
export function EChartCauseBar({ items }: { items: { k: string; n: number; c: string }[] }) {
  const option = {
    grid: { left: 96, right: 30, top: 6, bottom: 6 },
    tooltip: { trigger: "item", confine: true, formatter: (p: { name: string; value: number }) => `${p.name}<br/>${p.value.toLocaleString()}건` },
    xAxis: { type: "value", axisLabel: { fontSize: 9, color: "#9aa6b6" }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: "#eef2f7" } } },
    yAxis: { type: "category", inverse: true, data: items.map((i) => i.k), axisLabel: { fontSize: 9, color: "#5b6b80" }, axisLine: { show: false }, axisTick: { show: false } },
    series: [
      {
        type: "bar",
        barWidth: "58%",
        data: items.map((i) => ({ value: i.n, itemStyle: { color: i.c, borderRadius: [0, 3, 3, 0] } })),
        label: { show: true, position: "right", fontSize: 9, fontWeight: 600, color: "#10233f", formatter: (p: { value: number }) => p.value.toLocaleString() },
      },
    ],
  }
  return <ReactECharts option={option} style={{ height: 200, width: "100%" }} opts={{ renderer: "svg" }} notMerge lazyUpdate />
}

// ECharts 생키 — 채널 → 유형 분류 → 담당 부서, 그라데이션 곡선 링크
const SANKEY_PALETTE = ["#5B8FF9", "#5AD8A6", "#F6BD16", "#E8684A", "#6DC8EC", "#9270CA", "#FF9D4D", "#269A99", "#FF99C3", "#5D7092", "#7DD3C0"]
export function EChartSankey({ data }: { data: { nodes: { id: string; nodeColor: string }[]; links: { source: string; target: string; value: number }[] } }) {
  const option = {
    color: SANKEY_PALETTE,
    tooltip: { trigger: "item", triggerOn: "mousemove", confine: true },
    series: [
      {
        type: "sankey",
        left: 6,
        right: 116,
        top: 10,
        bottom: 10,
        nodeWidth: 13,
        nodeGap: 13,
        draggable: false,
        emphasis: { focus: "adjacency" },
        data: data.nodes.map((n) => ({ name: n.id, itemStyle: { borderWidth: 0, borderColor: "transparent" } })),
        links: data.links.map((l) => ({ source: l.source, target: l.target, value: l.value })),
        lineStyle: { color: "gradient", opacity: 0.5, curveness: 0.5 },
        label: { fontSize: 10.5, fontWeight: 600, color: "#3a4250" },
      },
    ],
  }
  return <ReactECharts option={option} style={{ height: 300, width: "100%" }} opts={{ renderer: "svg" }} notMerge lazyUpdate />
}

const SPARK_HOURS = ["09", "11", "13", "15", "16", "17", "18"]
// nivo 라인 스파크라인 — KPI 금일 운영시간대 미니 추이
export function NivoSparkline({ data, color }: { data: number[]; color: string }) {
  const series = [{ id: "v", data: data.map((y, i) => ({ x: SPARK_HOURS[i] ?? String(i), y })) }]
  return (
    <div style={{ height: 46 }}>
      <ResponsiveLine
        data={series}
        margin={{ top: 4, right: 4, bottom: 14, left: 4 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: "auto", max: "auto" }}
        curve="monotoneX"
        colors={[color]}
        lineWidth={1.6}
        enablePoints={false}
        enableArea
        areaOpacity={0.12}
        enableGridX={false}
        enableGridY={false}
        axisLeft={null}
        axisBottom={{ tickSize: 0, tickPadding: 3, tickRotation: 0, tickValues: ["09", "13", "16", "18"] }}
        theme={{ axis: { ticks: { text: { fontSize: 7, fill: "#9aa6b6" } } } }}
        isInteractive={false}
        animate={false}
      />
    </div>
  )
}

// nivo 파이(도넛) — 전체 VoC 구성. 중앙에 합계 라벨
export function NivoPie({ segments, centerTop, centerSub }: { segments: { label: string; value: number; color: string }[]; centerTop: string; centerSub: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const Center = ({ centerX, centerY }: { centerX: number; centerY: number }) => (
    <g>
      <text x={centerX} y={centerY - 4} textAnchor="middle" style={{ fontSize: 15, fontWeight: 700, fill: "#10233f" }}>{centerTop}</text>
      <text x={centerX} y={centerY + 9} textAnchor="middle" style={{ fontSize: 8, fill: "#9aa6b6" }}>{centerSub}</text>
    </g>
  )
  return (
    <div style={{ height: 150 }}>
      <ResponsivePie
        data={segments.map((s) => ({ id: s.label, label: s.label, value: s.value, color: s.color }))}
        colors={{ datum: "data.color" }}
        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        innerRadius={0.62}
        padAngle={1}
        cornerRadius={2}
        borderWidth={1}
        borderColor="#ffffff"
        enableArcLinkLabels={false}
        arcLabel={(d) => `${Math.round((d.value / total) * 100)}%`}
        arcLabelsTextColor="#ffffff"
        arcLabelsSkipAngle={14}
        layers={["arcs", "arcLabels", Center]}
        animate={false}
      />
    </div>
  )
}

// nivo 퍼널 — 직선 사다리꼴(곡선 없음), 단계 색 + 값 라벨
export function NivoFunnel({ data }: { data: FunnelDatum[] }) {
  return (
    <div style={{ height: 196 }}>
      <ResponsiveFunnel
        data={data.map((s) => ({ id: s.k, value: s.v, label: s.k.replace(/\s*\(.*\)/, "") }))}
        direction="horizontal"
        margin={{ top: 16, right: 18, bottom: 16, left: 18 }}
        colors={data.map((s) => s.c)}
        borderWidth={0}
        labelColor="#ffffff"
        valueFormat=">-,"
        shapeBlending={0}
        spacing={2}
        enableBeforeSeparators={false}
        enableAfterSeparators={false}
        motionConfig="gentle"
      />
    </div>
  )
}
