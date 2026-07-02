"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X } from "lucide-react"

type Props = {
  label?: string
  accept?: string
  files: File[]
  onFilesChange: (files: File[]) => void
  placeholder?: string
  multiple?: boolean
}

export function FileUploadBox({
  label,
  accept,
  files,
  onFilesChange,
  placeholder = "파일을 드래그하거나 클릭하여 업로드",
  multiple = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    if (files.length === 0 && inputRef.current) {
      inputRef.current.value = ""
    }
  }, [files])

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return
    const next = multiple ? [...files, ...selected] : [selected[0]]
    onFilesChange(dedupeByName(next))
  }

  const onDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const dropped = Array.from(e.dataTransfer.files || [])
    if (dropped.length === 0) return
    const next = multiple ? [...files, ...dropped] : [dropped[0]]
    onFilesChange(dedupeByName(next))
  }

  const onRemove = (idx: number) => {
    const next = files.filter((_, i) => i !== idx)
    onFilesChange(next)
  }

  const openPicker = () => inputRef.current?.click()

  const hasFiles = files.length > 0

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div
        ref={dropRef}
        className={`w-full border-2 rounded-md bg-card transition-colors ${
          isDragOver
            ? "border-primary bg-primary/10 dark:bg-primary/20"
            : hasFiles
              ? "border-border"
              : "border-dashed border-border hover:bg-muted"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDropFile}
        role="button"
        tabIndex={0}
        onClick={openPicker}
      >
        <div className="flex items-center justify-between p-3 gap-3">
          {hasFiles ? (
            <div className="flex flex-wrap items-center gap-2">
              {files.map((f, idx) => (
                <div key={`${f.name}-${idx}`} className="flex items-center gap-2 px-2 py-1 border rounded bg-muted text-sm">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="max-w-[220px] truncate" title={f.name}>{shorten(f.name)}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(idx) }}
                    className="p-0.5 hover:bg-accent rounded"
                    aria-label="첨부 삭제"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openPicker() }}>
            <Upload className="h-4 w-4 mr-2" /> 파일 선택
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={onPick}
          multiple={multiple}
        />
      </div>
    </div>
  )
}

function dedupeByName(arr: File[]) {
  const seen = new Set<string>()
  const out: File[] = []
  for (const f of arr) {
    if (seen.has(f.name)) continue
    seen.add(f.name)
    out.push(f)
  }
  return out
}

function shorten(name: string) {
  if (name.length <= 30) return name
  const start = name.slice(0, 18)
  const end = name.slice(-8)
  return `${start}…${end}`
}
