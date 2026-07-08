"use client"

import { ResponsiveFunnel } from "@nivo/funnel"
import { ResponsiveLine } from "@nivo/line"
import { ResponsivePie } from "@nivo/pie"
import ReactECharts from "echarts-for-react"

type FunnelDatum = { k: string; v: number; c: string }

// 통계 차트 공통 테마 팔레트 — 블루·민트 중심 + 소프트 액센트
// 네이비 계열 + 서비스품질 블루·민트 액센트를 섞은 팔레트 — 톤 유지하되 단조로움 완화
const THEME = ["#13355c", "#2f8bff", "#3a6ea5", "#15c2a2", "#5183b5", "#0c8f78", "#89abcf", "#6d97c2"]
// 제논라이프 그라데이션(딥네이비→블루→시안→민트) 기반 트리맵 팔레트 — 값 큰 셀=진함, 작을수록 밝게
const TREEMAP_PALETTE = ["#13355c", "#1f4f86", "#2f6aa8", "#3f83c0", "#5a8fbf", "#7ba6cf", "#17b39a", "#0c8f78", "#4c86b0", "#9bbdd8", "#b9d0e6"]

// ECharts 트리맵 — 유형 점유율
export function EChartTreemap({ items }: { items: { label: string; value: number }[] }) {
  const option = {
    tooltip: { show: true, confine: true, formatter: (p: { name: string; value: number }) => `${p.name}<br/>${p.value.toLocaleString()}건` },
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
        data: items.map((it, i) => ({ name: it.label, value: it.value, itemStyle: { color: TREEMAP_PALETTE[i % TREEMAP_PALETTE.length] } })),
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
export function EChartRadar({ axes, series, height = 200 }: { axes: string[]; series: { name: string; color: string; values: number[] }[]; height?: number }) {
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
  return <ReactECharts option={option} style={{ height, width: "100%" }} opts={{ renderer: "svg" }} notMerge lazyUpdate />
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
// hex를 흰색 방향으로 amt(0~1)만큼 밝히기 — 2톤 면적용
function tint(hex: string, amt: number) {
  const n = parseInt(hex.replace("#", ""), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const mix = (c: number) => Math.round(c + (255 - c) * amt)
  return `#${((mix(r) << 16) | (mix(g) << 8) | mix(b)).toString(16).padStart(6, "0")}`
}
// nivo 면적 스파크라인 — 저번달 평균(진한 네이비, 아래·앞) + 금일(옅은 톤, 위·뒤) 2층 면적, 뾰족한 직선
export function NivoSparkline({ data, baseline, color }: { data: number[]; baseline?: number[]; color: string }) {
  const cur = { id: "cur", data: data.map((y, i) => ({ x: SPARK_HOURS[i] ?? String(i), y })) }
  const base = baseline ? { id: "base", data: baseline.map((y, i) => ({ x: SPARK_HOURS[i] ?? String(i), y })) } : null
  // cur(옅은 톤)를 먼저(뒤에), base(진한 톤)를 나중(앞·아래)에 → 진한 면적이 앞을 덮고, 금일이 더 높은 구간만 옅게 위로 비침
  const series = base ? [cur, base] : [cur]
  return (
    <div style={{ height: 28 }}>
      <ResponsiveLine
        data={series}
        margin={{ top: 3, right: 4, bottom: 9, left: 4 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, max: "auto" }}
        curve="linear"
        colors={base ? [tint(color, 0.5), color] : [color]}
        lineWidth={1}
        enablePoints={false}
        enableArea
        areaBaselineValue={0}
        areaOpacity={1}
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

// nivo 파이(도넛) — VoC 구성. 중앙에 합계 라벨. size로 크기 조절(범례는 카드 쪽에서 우측 배치)
export function NivoPie({ segments, centerTop, centerSub, size = 64 }: { segments: { label: string; value: number; color: string }[]; centerTop: string; centerSub: string; size?: number }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const big = size >= 90
  const Center = ({ centerX, centerY }: { centerX: number; centerY: number }) => (
    <g>
      <text x={centerX} y={centerY - (big ? 4 : 3)} textAnchor="middle" style={{ fontSize: big ? 13 : 11, fontWeight: 700, fill: "#10233f" }}>{centerTop}</text>
      <text x={centerX} y={centerY + (big ? 8 : 7)} textAnchor="middle" style={{ fontSize: big ? 8 : 6.5, fill: "#9aa6b6" }}>{centerSub}</text>
    </g>
  )
  return (
    <div style={{ height: size, width: size }}>
      <ResponsivePie
        data={segments.map((s) => ({ id: s.label, label: s.label, value: s.value, color: s.color }))}
        colors={{ datum: "data.color" }}
        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        innerRadius={0.5}
        padAngle={1}
        cornerRadius={2}
        borderWidth={1}
        borderColor="#ffffff"
        enableArcLinkLabels={false}
        arcLabel={(d) => `${Math.round((d.value / total) * 100)}%`}
        arcLabelsTextColor="#ffffff"
        arcLabelsSkipAngle={12}
        arcLabelsRadiusOffset={0.55}
        theme={{ labels: { text: { fontSize: 8, fontWeight: 700 } } }}
        layers={["arcs", "arcLabels", Center]}
        animate={false}
      />
    </div>
  )
}

// nivo 퍼널 — 직선 사다리꼴(곡선 없음), 단계 색 + 값 라벨
// 밴드 크기(면적)는 실제 건수 비례가 아니라 단계별로 완만히 줄어드는 합성값으로 그린다.
// (전체 문의가 압도적이라 뒷 단계가 사라지거나, 적체>위험이라 마지막이 커지는 문제 방지)
// 표시 숫자는 실제 건수로 되돌려 매핑한다.
export function NivoFunnel({ data }: { data: FunnelDatum[] }) {
  const sizes = data.map((_, i) => Math.round(1000 * Math.pow(0.66, i))) // 1000 → 660 → 436 → 288 ...
  const realBySize = new Map(sizes.map((sz, i) => [sz, data[i].v]))
  return (
    <div style={{ height: 54 }}>
      <ResponsiveFunnel
        data={data.map((s, i) => ({ id: s.k, value: sizes[i], label: s.k.replace(/\s*\(.*\)/, "") }))}
        direction="horizontal"
        margin={{ top: 6, right: 14, bottom: 6, left: 14 }}
        colors={data.map((s) => s.c)}
        borderWidth={0}
        labelColor="#ffffff"
        valueFormat={(v) => (realBySize.get(v as number) ?? (v as number)).toLocaleString()}
        shapeBlending={0}
        spacing={2}
        enableBeforeSeparators={false}
        enableAfterSeparators={false}
        motionConfig="gentle"
      />
    </div>
  )
}
