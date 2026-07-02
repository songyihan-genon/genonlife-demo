"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PromptCard, type Prompt } from "@/components/PromptCard"
import { PromptDetailModal } from "@/components/PromptDetailModal"

const promptLibrary: Prompt[] = [
  {
    id: "1",
    title: "민원 접수 확인 답변 초안",
    content:
      "민원 접수 확인 메시지를 작성해줘. 정중한 톤을 유지하되, 접수 완료 사실과 후속 검토 일정 안내, 추가 제출 서류가 있을 수 있다는 점을 포함해줘.",
    author: "민원운영팀",
    department: "민원지원센터",
    sector: "complaint",
    tags: ["민원응대", "초기답변", "정중한톤"],
    views: 1247,
    likes: 89,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    title: "사내규정 조항 근거형 답변",
    content:
      "사내규정 관련 질문에 답할 때, 답변 본문 다음에 규정명, 조항, 시행일, 참고 원문 순으로 근거를 정리해줘. 마지막에는 AI 참고 문안이라는 검토 문구를 포함해줘.",
    author: "준법지원팀",
    department: "준법감시부",
    sector: "knowledge",
    tags: ["규정검색", "근거명시", "검토문구"],
    views: 1114,
    likes: 75,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    title: "민원 유형 자동 분류 프롬프트",
    content:
      "입력된 민원 내용을 읽고 보험금 청구 문의, 계약 변경 문의, 진행상황 확인, 서류 보완 요청 중 가장 적절한 유형으로 분류해줘. 분류 이유를 한 줄로 덧붙여줘.",
    author: "서비스기획팀",
    department: "디지털혁신실",
    sector: "complaint",
    tags: ["민원분류", "자동태깅", "운영지원"],
    views: 938,
    likes: 61,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    title: "담당자 배정 추천 문안",
    content:
      "민원 내용과 첨부 문서를 기반으로 적합한 부서와 담당자를 추천해줘. 1순위 담당자, 대체 후보, 배정 근거, 인사정보 검증 포인트를 구분해서 정리해줘.",
    author: "업무혁신팀",
    department: "디지털혁신실",
    sector: "assignment",
    tags: ["배정추천", "담당자", "근거설명"],
    views: 861,
    likes: 58,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "5",
    title: "FAQ 자동 생성 템플릿",
    content:
      "업무 규정이나 안내 문서를 바탕으로 예상 질문과 답변 5개를 생성해줘. 실무자가 바로 FAQ 게시판에 옮길 수 있게 질문형 제목과 짧은 답변으로 정리해줘.",
    author: "고객지원팀",
    department: "민원지원센터",
    sector: "document",
    tags: ["FAQ", "문서작성", "지식정리"],
    views: 1056,
    likes: 84,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: "6",
    title: "민원 데이터 요약 분석 요청",
    content:
      "최근 접수 민원 데이터를 바탕으로 민원 유형별 비중, 반복 문의 패턴, 후속 안내가 많이 필요한 구간을 요약해줘. 운영 개선 포인트를 3개로 정리해줘.",
    author: "데이터운영팀",
    department: "AI전략TF",
    sector: "analytics",
    tags: ["민원분석", "운영개선", "리포트"],
    views: 912,
    likes: 65,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    id: "7",
    title: "상담 스크립트 정제 프롬프트",
    content:
      "상담사가 사용하는 표준 상담 스크립트를 더 공감형이면서도 명확한 톤으로 정제해줘. 도입, 본론, 종결 3단 구조로 재작성하고 주의할 표현도 함께 알려줘.",
    author: "상담품질팀",
    department: "콜센터운영부",
    sector: "counseling",
    tags: ["상담스크립트", "공감형", "표준화"],
    views: 1172,
    likes: 92,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
  {
    id: "8",
    title: "운영 모니터링 요약 프롬프트",
    content:
      "품질 모니터링 대시보드 수치를 읽고 오늘 점검이 필요한 서비스와 원인을 요약해줘. 관리자 보고용으로 3줄 요약과 권장 조치를 함께 작성해줘.",
    author: "플랫폼운영팀",
    department: "디지털혁신실",
    sector: "operation",
    tags: ["운영관리", "품질모니터링", "관리자보고"],
    views: 744,
    likes: 47,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
]

const sectorOptions = [
  { value: "all", label: "전체 영역" },
  { value: "counseling", label: "민원 상담" },
  { value: "knowledge", label: "규정/지식" },
  { value: "document", label: "문서 작성" },
  { value: "complaint", label: "민원 처리" },
  { value: "assignment", label: "담당자 배정" },
  { value: "analytics", label: "데이터 분석" },
  { value: "operation", label: "운영 관리" },
]

export default function PromptHubPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSector, setSelectedSector] = useState("all")
  const [likedPrompts, setLikedPrompts] = useState<Set<string>>(new Set())
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const savedLikes = localStorage.getItem("likedPrompts")
    if (savedLikes) {
      setLikedPrompts(new Set(JSON.parse(savedLikes)))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("likedPrompts", JSON.stringify([...likedPrompts]))
  }, [likedPrompts])

  const promptsWithLikeStatus = useMemo(
    () =>
      promptLibrary.map((prompt) => ({
        ...prompt,
        isLiked: likedPrompts.has(prompt.id),
        likes: prompt.likes + (likedPrompts.has(prompt.id) ? 1 : 0),
        aiTitle: prompt.title,
      })),
    [likedPrompts],
  )

  const filteredPrompts = promptsWithLikeStatus.filter((prompt) => {
    const searchMatch =
      searchTerm === "" ||
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const sectorMatch = selectedSector === "all" || prompt.sector === selectedSector
    return searchMatch && sectorMatch
  })

  const popularPrompts = [...promptsWithLikeStatus]
    .sort((a, b) => b.likes + b.views - (a.likes + a.views))
    .slice(0, 6)

  const chronologicalPrompts = [...filteredPrompts].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )

  const handleLike = (id: string) => {
    setLikedPrompts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handlePromptClick = (id: string) => {
    const prompt = promptsWithLikeStatus.find((item) => item.id === id) || null
    setSelectedPrompt(prompt)
    setModalOpen(Boolean(prompt))
  }

  return (
    <div className="container mx-auto flex h-screen flex-col space-y-6 p-6">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-3xl font-bold text-foreground">프롬프트 라이브러리</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            제논라이프 업무에 바로 적용할 수 있는 상담, 규정 검색, 민원 처리, 운영 관리용 프롬프트를 모아둔 라이브러리입니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-[#005BAC] text-white hover:bg-[#005BAC]">운영 템플릿</Badge>
          <Badge variant="outline">상담/민원</Badge>
          <Badge variant="outline">규정/지식</Badge>
          <Badge variant="outline">문서/FAQ</Badge>
          <Badge variant="outline">운영 관리</Badge>
        </div>
      </div>

      <div className="flex-1 min-h-0 md:flex md:gap-6">
        <div className="flex h-full min-h-0 flex-col md:w-3/5 md:pr-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">인기 템플릿</h2>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {popularPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onLike={handleLike}
                  onClick={handlePromptClick}
                  showDepartmentOnly
                  likeIcon="thumbsUp"
                  truncateTitle
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex h-full min-h-0 flex-col md:mt-0 md:w-2/5 md:pl-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">전체 템플릿</h2>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="프롬프트 검색..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="분류 선택" />
              </SelectTrigger>
              <SelectContent>
                {sectorOptions.map((sector) => (
                  <SelectItem key={sector.value} value={sector.value}>
                    {sector.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {chronologicalPrompts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg text-muted-foreground">검색 조건에 맞는 템플릿이 없습니다.</p>
              <p className="mt-2 text-sm text-muted-foreground">다른 검색어나 분류를 선택해보세요.</p>
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{chronologicalPrompts.length}개의 템플릿</p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto divide-y rounded-md border">
                {chronologicalPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="cursor-pointer p-4 hover:bg-muted"
                    onClick={() => handlePromptClick(prompt.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{prompt.aiTitle || prompt.title}</div>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{prompt.content}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">{sectorOptions.find((item) => item.value === prompt.sector)?.label}</Badge>
                          {prompt.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end whitespace-nowrap text-xs text-muted-foreground">
                        <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
                        {prompt.department && <span className="mt-1">{prompt.department}</span>}
                        <span className="mt-1">조회 {prompt.views.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <PromptDetailModal
        prompt={selectedPrompt}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onLike={handleLike}
      />
    </div>
  )
}
