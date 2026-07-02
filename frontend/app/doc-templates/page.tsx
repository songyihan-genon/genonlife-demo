"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Plus, Trash2, Settings } from "lucide-react"

type OutputFormat = "pptx" | "html"
type Template = {
  id: string
  title: string
  description: string
  output: OutputFormat
}

const TEMPLATES_KEY = "doc_templates_v1"

export default function DocTemplateManagerPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newOutput, setNewOutput] = useState<OutputFormat>("pptx")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TEMPLATES_KEY)
      if (raw) setTemplates(JSON.parse(raw) as Template[])
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates)) } catch {}
  }, [templates])

  const addTemplate = () => {
    const title = newTitle.trim()
    if (!title) { toast({ description: "템플릿 제목을 입력하세요." }); return }
    const id = `${Date.now()}`
    const tpl: Template = { id, title, description: newDesc.trim(), output: newOutput }
    setTemplates(prev => [tpl, ...prev])
    setNewTitle("")
    setNewDesc("")
    setNewOutput("pptx")
    toast({ description: "템플릿이 추가되었습니다." })
  }

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h1 className="text-xl font-bold">문서 템플릿 관리</h1>
          </div>
          <Link href="/?task=documentation">
            <Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" /> 돌아가기</Button>
          </Link>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>템플릿 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tplTitle">템플릿 제목</Label>
                <Input id="tplTitle" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="예: 영업자료 (PPTX)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tplOutput">출력 형식</Label>
                <Select value={newOutput} onValueChange={(v) => setNewOutput(v as OutputFormat)}>
                  <SelectTrigger id="tplOutput">
                    <SelectValue placeholder="형식 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pptx">PPTX</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tplDesc">설명</Label>
              <Textarea id="tplDesc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="간단한 설명" className="min-h-[80px]" />
            </div>
            <div>
              <Button onClick={addTemplate}><Plus className="h-4 w-4 mr-2" /> 추가</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>템플릿 목록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">템플릿이 없습니다.</div>
            ) : (
              templates.map(t => (
                <div key={t.id} className="flex items-center justify-between text-sm border rounded p-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.title} <span className="text-[11px] text-muted-foreground">({t.output.toUpperCase()})</span></div>
                    <div className="text-xs text-muted-foreground truncate">{t.description}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteTemplate(t.id)} title="삭제">
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
