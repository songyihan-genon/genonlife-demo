"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowRight,
  Activity,
  BarChart3,
  Bot,
  CloudSun,
  Clock3,
  Cpu,
  FilePenLine,
  GitFork,
  ShieldCheck,
  Sparkles,
  Building2,
  Search,
  MessageCircleMore,
  FileText,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface GenPortalHomeProps {
  displayName: string
}

const services = [
  {
    title: "실시간 고객상담",
    description: "고객 문의 응대 문구와 상담 흐름 가이드를 대화형으로 지원합니다.",
    href: "/insight-chat?agent=assistant&feature=counseling",
    label: "상담 중",
    icon: Bot,
    accent: "from-blue-500/10 to-sky-400/10",
    category: "during",
  },
  {
    title: "단순 질의응답 챗봇",
    description: "상품, 절차, 청구 서류 같은 일반적인 질문을 빠르게 확인할 수 있습니다.",
    href: "/insight-chat?agent=assistant&feature=general-qa",
    label: "상담 중",
    icon: Bot,
    accent: "from-sky-500/10 to-blue-400/10",
    category: "during",
  },
  {
    title: "상담지식 에이전트",
    description: "약관, 업무지침, 상담 스크립트를 바탕으로 답변 근거를 제공합니다.",
    href: "/counseling-knowledge",
    label: "상담 중",
    icon: ShieldCheck,
    accent: "from-blue-600/10 to-cyan-400/10",
    category: "during",
  },
  {
    title: "데이터길잡이",
    description: "고객상담·계약·운영 데이터를 자연어 질의로 분석하고 주요 지표를 시각화합니다.",
    href: "/data-guide",
    label: "상담 후",
    icon: BarChart3,
    accent: "from-sky-500/10 to-indigo-500/10",
    category: "after",
  },
  {
    title: "문서작성 지원",
    description: "안내문, 보고서, FAQ 초안 등 업무 문서를 생성하고 수정합니다.",
    href: "/documentation?feature=document-writing",
    label: "상담 후",
    icon: FilePenLine,
    accent: "from-blue-400/10 to-cyan-400/10",
    category: "after",
  },
  {
    title: "문서작성 지원 에이전트",
    description: "글다듬이, 번역, FAQ 문서 생성을 한 화면에서 지원합니다.",
    href: "/insight-chat?agent=document-writer&tool=polish",
    label: "상담 후",
    icon: FilePenLine,
    accent: "from-cyan-500/10 to-blue-500/10",
    category: "after",
  },
  {
    title: "문서분석 지원",
    description: "업로드한 문서를 요약·발췌·번역해 영업과 운영에 필요한 정보를 정리합니다.",
    href: "/translation",
    label: "상담 중",
    icon: Search,
    accent: "from-blue-500/10 to-sky-300/10",
    category: "during",
  },
  {
    title: "고객민원 처리 지원",
    description: "고객민원 내용을 바탕으로 유사 사례와 답변 초안을 빠르게 정리합니다.",
    href: "/formatting",
    label: "상담 후",
    icon: MessageCircleMore,
    accent: "from-blue-600/10 to-sky-500/10",
    category: "after",
  },
  {
    title: "SMS 자동생성 Agent",
    description: "상담 이력을 바탕으로 고객 안내 SMS 초안을 생성하고 검토·전송합니다.",
    href: "/sms-agent",
    label: "상담 후",
    icon: MessageCircleMore,
    accent: "from-sky-500/10 to-blue-500/10",
    category: "after",
  },
  {
    title: "문서 요약/생성 Agent",
    description: "대상문서와 참조자료를 기반으로 요약본, 업무매뉴얼, SOK 콘텐츠를 생성합니다.",
    href: "/doc-summary-agent",
    label: "상담 후",
    icon: FileText,
    accent: "from-blue-500/10 to-indigo-500/10",
    category: "after",
  },
  {
    title: "업무담당자 배정",
    description: "고객 문의와 업무 내용을 기준으로 적정 부서와 담당자를 추천하고 배정 근거를 제공합니다.",
    href: "/staff-assignment?view=new",
    label: "상담 후",
    icon: Users,
    accent: "from-sky-500/10 to-blue-500/10",
    category: "after",
  },
  {
    title: "심사이력 추론 에이전트",
    description: "과거 심사·이관 이력을 바탕으로 현재 처리 경로와 검토 포인트를 추론합니다.",
    href: "/debt-transfer",
    label: "이력 추론",
    icon: GitFork,
    accent: "from-indigo-500/10 to-blue-500/10",
    category: "after",
  },
] as const

const serviceGroups = [
  {
    key: "during",
    title: "민원 상담 중 활용",
    description: "상담사가 고객과 대화하는 중에 바로 조회하고 답변을 보강하는 어시스턴트입니다.",
  },
  {
    key: "after",
    title: "민원 상담 후 활용",
    description: "상담 이후 처리, 배정, 문서화, 분석 단계에서 후속 업무를 정리하는 어시스턴트입니다.",
  },
] as const

const operationShortcuts = [
  {
    title: "품질 모니터링",
    description: "답변 정확도, 환각률, 만족도, 최근 품질 이슈를 점검합니다.",
    href: "/admin?feature=quality-monitoring",
    icon: Activity,
  },
  {
    title: "자원 관리",
    description: "모델별 GPU/CPU 점유, 서비스-모델 매핑, 운영 경고를 확인합니다.",
    href: "/admin?feature=resource-management",
    icon: Cpu,
  },
  {
    title: "프롬프트 라이브러리",
    description: "민원 상담, 규정 검색, 문서 작성용 표준 템플릿을 관리합니다.",
    href: "/prompt-hub",
    icon: FileText,
  },
] as const

export function GenPortalHome({ displayName }: GenPortalHomeProps) {
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    })

    const updateTime = () => {
      setCurrentTime(formatter.format(new Date()))
    }

    updateTime()
    const timer = window.setInterval(updateTime, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <Card className="border-border/70 bg-card/95 py-0">
          <CardContent className="flex flex-col gap-5 px-6 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[#005BAC] text-white hover:bg-[#005BAC]">Shinhan Life</Badge>
              <Badge variant="outline" className="border-border/70 bg-background/60">
                생성형 AI 통합 포털
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-background/60">
                사내 서비스 연계
              </Badge>
            </div>

            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                제논라이프 생성형 AI 포털
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {displayName}님, 필요한 서비스를 선택해 바로 업무를 시작하세요.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                AI Portal은 사내 로그인과 연계된 단일 포털에서 고객상담, 지식 검색, 데이터 분석,
                문서 작성, 문서 분석, 민원 처리와 운영 관리 서비스를 통합 제공하는 데모 환경입니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <Card className="border-border/70 bg-card/95 py-0">
            <CardContent className="flex items-center gap-3 px-5 py-4">
              <CloudSun className="h-8 w-8 text-sky-500" />
              <div>
                <p className="text-xs text-muted-foreground">서울 날씨</p>
                <p className="text-sm font-semibold text-foreground">맑음 15°C</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/95 py-0">
            <CardContent className="flex items-center gap-3 px-5 py-4">
              <Clock3 className="h-8 w-8 text-[#005BAC]" />
              <div>
                <p className="text-xs text-muted-foreground">현재 시간</p>
                <p className="text-sm font-semibold text-foreground">{currentTime || "시간 확인 중"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/95 py-0">
            <CardContent className="flex items-center gap-3 px-5 py-4">
              <Sparkles className="h-8 w-8 text-[#00A3E0]" />
              <div>
                <p className="text-xs text-muted-foreground">로그인 정보</p>
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-7">
        {serviceGroups.map((group) => (
          <section key={group.key} className="space-y-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">{group.title}</h2>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {services
                .filter((service) => service.category === group.key)
                .map((service) => {
                  const Icon = service.icon

                  return (
                    <Card
                      key={service.title}
                      className={cn(
                        "group h-full border-border/70 bg-card/95 py-0 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                        `bg-gradient-to-br ${service.accent}`
                      )}
                    >
                      <CardHeader className="px-5 pt-5 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-background/80 shadow-sm">
                            <Icon className="h-5 w-5 text-foreground" />
                          </div>
                          <Badge variant="outline" className="border-border/70 bg-background/75">
                            {service.label}
                          </Badge>
                        </div>
                        <CardTitle className="pt-2 text-lg">{service.title}</CardTitle>
                        <CardDescription className="leading-6">{service.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto px-5 pb-5">
                        <Button asChild className="w-full justify-between">
                          <Link href={service.href}>
                            서비스 열기
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </section>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">운영 관리 바로가기</h2>
            <p className="text-sm text-muted-foreground">
              서비스 품질, 자원 현황, 표준 프롬프트를 운영 관점에서 바로 점검할 수 있습니다.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {operationShortcuts.map((item) => {
            const Icon = item.icon

            return (
              <Card key={item.title} className="border-border/70 bg-card/95 py-0">
                <CardContent className="flex items-start justify-between gap-4 px-5 py-5">
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background/80">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={item.href}>열기</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
