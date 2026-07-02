"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Plus, Trash2, Settings } from "lucide-react"

type TemplateKey = "email" | "client-share"
type FormattingTemplate = { id: string; key: TemplateKey; title: string; description: string }

const FORMAT_TEMPLATES_KEY = "formatting_templates_v1"
const DEFAULTS: FormattingTemplate[] = [
  { id: "email", key: "email", title: "이메일", description: "핵심 요약, 시장 함의, 다음 액션을 이메일 형식으로 정리" },
  { id: "client-share", key: "client-share", title: "고객사 공유", description: "고객사 공유용 개요/핵심/세부/결론 섹션 구성" },
]

export default function FormatTemplateManagerPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<FormattingTemplate[]>([])
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [key, setKey] = useState<TemplateKey>("email")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FORMAT_TEMPLATES_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as FormattingTemplate[]
        setTemplates(parsed.length ? parsed : DEFAULTS)
      } else {
        setTemplates(DEFAULTS)
      }
    } catch {
      setTemplates(DEFAULTS)
    }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(FORMAT_TEMPLATES_KEY, JSON.stringify(templates)) } catch {}
  }, [templates])

  const add = () => {
    const t = title.trim()
    if (!t) { toast({ description: "제목을 입력하세요." }); return }
    const id = `${Date.now()}`
    setTemplates(prev => [{ id, key, title: t, description: desc.trim() }, ...prev])
    setTitle("")
    setDesc("")
    setKey("email")
    toast({ description: "포맷이 추가되었습니다." })
  }

  const del = (id: string) => setTemplates(prev => prev.filter(x => x.id !== id))

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h1 className="text-xl font-bold">포맷 관리</h1>
          </div>
          <Link href="/?task=formatting">
            <Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" /> 돌아가기</Button>
          </Link>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>포맷 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fmtTitle">제목</Label>
                <Input id="fmtTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 이메일" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fmtKey">유형</Label>
                <select id="fmtKey" className="border rounded h-9 px-3" value={key} onChange={(e) => setKey(e.target.value as TemplateKey)}>
                  <option value="email">이메일</option>
                  <option value="client-share">고객사 공유</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fmtDesc">설명</Label>
              <Textarea id="fmtDesc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="간단한 설명" className="min-h-[80px]" />
            </div>
            <div>
              <Button onClick={add}><Plus className="h-4 w-4 mr-2" /> 추가</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>포맷 목록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">등록된 포맷이 없습니다.</div>
            ) : (
              templates.map(t => (
                <div key={t.id} className="flex items-center justify-between text-sm border rounded p-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.title} <span className="text-[11px] text-muted-foreground">({t.key})</span></div>
                    <div className="text-xs text-muted-foreground truncate">{t.description}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => del(t.id)} title="삭제">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
