import { Message } from "@/lib/event-system"

export type DocumentWritingTool = "polish" | "translation" | "faq"

type DocumentWritingHistoryPreset = {
  id: string
  tool: DocumentWritingTool
  title: string
  description: string
  messages: Message[]
}

type DocumentWritingToolDefinition = {
  id: DocumentWritingTool
  label: string
  description: string
  starterPrompt: string
  workflow: string[]
  deliverables: string[]
}

function buildMessages(sessionId: string, baseTimeIso: string, userContent: string, assistantContent: string): Message[] {
  const baseTime = new Date(baseTimeIso)

  return [
    {
      id: `${sessionId}-user`,
      role: "user",
      content: userContent,
      timestamp: baseTime,
      sessionId,
    },
    {
      id: `${sessionId}-assistant`,
      role: "assistant",
      content: assistantContent,
      timestamp: new Date(baseTime.getTime() + 60_000),
      sessionId,
      isMarkdown: true,
    },
  ]
}

export const documentWritingTools: DocumentWritingToolDefinition[] = [
  {
    id: "polish",
    label: "글다듬이",
    description: "텍스트 초안을 문서 유형(메일, 게시글, 보도자료, 공문, 고객 발송 문구, 심사 입력)과 톤에 맞춘 교정본으로 정제합니다.",
    starterPrompt: "이 텍스트 초안을 정중한 톤의 공문서 유형에 맞춰 다듬어 줘.",
    workflow: [
      "텍스트 초안을 입력창에 작성합니다.",
      "상단 옵션 바에서 문서 유형(메일·게시글·보도자료·공문·고객 발송 문구·심사 입력)과 톤을 선택합니다.",
      "전송하면 선택한 유형과 톤이 반영된 정제본이 생성됩니다. 핵심 사실관계는 유지되며, 결과는 참고 초안입니다.",
    ],
    deliverables: [
      "문서 유형·톤 반영 정제본",
      "원문-교정본 대조 결과",
      "사실 왜곡 없는 AI 참고 초안",
    ],
  },
  {
    id: "translation",
    label: "번역",
    description: "텍스트 또는 업로드 문서를 번역합니다. 구어체 변환 옵션과 위원회 도메인 영어사전을 지원하며, 원문-번역문 대조 형태로 제공됩니다.",
    starterPrompt: "아래 제논라이프 안내 문구를 영어로 번역하고 구어체로 바꿔줘.",
    workflow: [
      "번역할 텍스트를 입력하거나, 상단 옵션 바에서 문서 파일(PDF·HWP·DOCX)을 업로드합니다.",
      "상담 스크립트·안내 문구의 경우 '구어체 변환' 버튼을 활성화합니다.",
      "원문(좌측)과 번역문(우측)이 대조된 결과를 확인합니다. 위원회 도메인 영어사전이 자동 적용됩니다.",
    ],
    deliverables: [
      "원문-번역문 병렬 대조 결과",
      "구어체 변환 번역문",
      "위원회 도메인 영어사전 적용본",
    ],
  },
  {
    id: "faq",
    label: "FAQ 자동생성기",
    description: "업로드된 규정 문서를 바탕으로 내부 직원(제논라이프) 관점의 FAQ를 자동 생성합니다. 문서 외 사실은 생성하지 않습니다.",
    starterPrompt: "첨부한 규정 문서를 바탕으로 직원용 FAQ 5개를 생성해줘.",
    workflow: [
      "상단 옵션 바에서 기준 규정 문서를 업로드합니다 (PDF·HWP·DOCX, 용량 제한 적용).",
      "생성할 FAQ 개수(3·5·10개)를 선택합니다.",
      "내부 직원 관점으로 생성된 FAQ를 확인합니다. 본 자료는 AI 생성 참고 자료이므로 검토 후 사용하세요.",
    ],
    deliverables: [
      "규정 문서 기반 FAQ 목록",
      "내부 직원 관점의 Q&A",
      "AI 생성 참고 안내 포함",
    ],
  },
]

const promptSuggestionsByTool: Record<DocumentWritingTool, string[]> = {
  polish: [
    "다음 초안을 고객 발송 문구 문서 유형으로 부드러운 톤에 맞춰 다듬어줘.",
    "이 내용을 사내 게시글 형태로 간결하고 명확하게 수정해줘.",
    "작성된 초안을 정중한 메일 톤으로 핵심만 남겨 재작성해줄래?",
  ],
  translation: [
    "아래 안내 문구를 영어로 번역하고 자연스러운 구어체 톤으로 바꿔줘.",
    "첨부된 대외문 문서를 위원회 도메인 영어사전에 맞춰 번역해줄래?",
    "이 상담 스크립트를 자연스러운 외국인 고객 응대용 영어로 번역해줘.",
  ],
  faq: [
    "입력된 규정 문서에서 내부 직원(제논라이프) 관점의 FAQ 5개를 생성해줘.",
    "새로 개정된 지침서를 바탕으로 실무자가 자주 물어볼 만한 FAQ 10개 만들어줘.",
    "근거 문서에 없는 내용을 생성하지 말고, 핵심 주제에 대해 FAQ 3개를 정리해줄래?",
  ],
}

export const documentWritingHistoryPresets: DocumentWritingHistoryPreset[] = [
  {
    id: "draft-polish",
    tool: "polish",
    title: "글다듬이",
    description: "입력된 텍스트 초안을 정중한 공문 형태로 정제",
    messages: buildMessages(
      "document-writing-history-draft-polish",
      "2026-03-23T11:10:00+09:00",
      "[문서 유형: 공문] [톤: 정중한]\n\n다음 초안을 공문 톤에 맞게 다듬어 주세요.\n\n'신규 규정 시스템 4월 1일 오픈. 많은 사용 부탁드립니다.'",
      [
        "**[글다듬이 결과 — 문서 유형: 공문 / 톤: 정중한]**",
        "",
        "> ⚠️ 본 결과는 AI 생성 참고 초안입니다. 핵심 사실관계를 임의 변경·삭제하지 않았으며, 입력 외 사실을 생성하지 않았습니다.",
        "",
        "---",
        "**신규 규정 시스템 오픈 안내의 건**",
        "",
        "1. 귀 부서의 무궁한 발전을 기원합니다.",
        "2. 당 위원회는 업무 효율성을 제고하기 위하여 신규 규정 시스템을 구축 완료하였으며, 오는 4월 1일부로 정식 운용을 개시할 예정입니다.",
        "3. 원활한 업무 수행을 위하여 관련 임직원 여러분의 적극적인 활용을 권장해 드립니다.",
        "---",
        "",
        "| 구분 | 내용 |",
        "|------|------|",
        "| 원문 | 신규 규정 시스템 4월 1일 오픈. 많은 사용 부탁드립니다. |",
        "| 정제본 | 신규 규정 시스템을 4월 1일부로 정식 운용 개시 예정이며, 적극적인 활용을 권장 |",
      ].join("\n"),
    ),
  },
  {
    id: "document-translation",
    tool: "translation",
    title: "번역",
    description: "신용회복 안내 문구를 구어체 영어로 번역",
    messages: buildMessages(
      "document-writing-history-document-translation",
      "2026-03-23T11:30:00+09:00",
      "[구어체 변환 요청]\n\n아래 상담 스크립트를 외국인 고객 응대를 위해 자연스러운 구어체 영어로 번역해줘. '안녕하세요, 제논라이프입니다. 상담을 위해 본인 확인이 먼저 필요한데요, 신분증을 보여주시겠어요?'",
      [
        "**[번역 결과 — 구어체 변환 적용 / 위원회 도메인 영어사전 반영]**",
        "",
        "| 원문 (좌) | 번역문 (우) |",
        "|-----------|------------|",
        "| 안녕하세요, 제논라이프입니다. | Hello, this is Shinhan Life. |",
        "| 상담을 위해 본인 확인이 먼저 필요한데요, | I'll need to verify your identity before we get started. |",
        "| 신분증을 보여주시겠어요? | Could you please show me your ID? |",
        "",
        "**전체 번역문:**",
        "Hello, this is the Credit Counseling & Recovery Service (CCRS). I'll need to verify your identity before we get started. Could you please show me your ID?",
        "",
        "> 💡 구어체 변환 및 위원회 도메인 영어사전(CCRS 등)이 적용되었습니다.",
      ].join("\n"),
    ),
  },
  {
    id: "rule-faq",
    tool: "faq",
    title: "규정 문서 FAQ 생성",
    description: "업로드된 지침서에서 내부 직원용 FAQ 3개 생성",
    messages: buildMessages(
      "document-writing-history-rule-faq",
      "2026-03-23T11:50:00+09:00",
      "[FAQ 3개 생성] [첨부: 정보보안_업무지침_v2.pdf]\n\n첨부된 신규 보안 지침 문서를 바탕으로 내부 직원(제논라이프) 관점의 FAQ 3개를 만들어줘. 문서에 없는 내용은 생성하지 말고.",
      [
        "**[FAQ 자동생성 결과 — 내부 직원(제논라이프) 관점]**",
        "",
        "> ⚠️ 본 자료는 AI 생성 참고 자료입니다. 해당 내용을 검토 후 사용해야 합니다.",
        "",
        "---",
        "**Q1. 외부망에서 사내 시스템 접속 시 필요한 절차는 무엇입니까?**",
        "A. 지침서 제3조에 근거하여, 사전에 등록된 VPN 클라이언트를 실행하고 이중 인증(2FA)을 완료한 후 접속해야 합니다.",
        "",
        "**Q2. 업무용 PC의 비밀번호 변경 주기는 어떻게 되나요?**",
        "A. 비밀번호는 최소 90일에 1회 이상 변경해야 하며, 변경 기한 7일 전부터 시스템 안내 팝업이 노출됩니다.",
        "",
        "**Q3. 외부 USB 매체를 사용하려면 어떻게 해야 합니까?**",
        "A. 인가되지 않은 이동식 저장매체의 사용은 전면 금지되어 있습니다. 업무상 절대적으로 필요한 경우 정보보안팀의 사전 승인 및 보안 USB 사용 절차를 준수해야 합니다.",
        "",
        "---",
        "*근거 문서: 정보보안_업무지침_v2.pdf*",
      ].join("\n"),
    ),
  },
]

export function getDocumentWritingTool(toolId: string | null | undefined): DocumentWritingToolDefinition {
  return documentWritingTools.find((item) => item.id === toolId) ?? documentWritingTools[0]
}

export function getDocumentWritingPromptSuggestions(toolId: DocumentWritingTool): string[] {
  return promptSuggestionsByTool[toolId]
}

export function getDocumentWritingPresetMessages(presetId: string | null) {
  if (!presetId) return null
  return documentWritingHistoryPresets.find((item) => item.id === presetId)?.messages ?? null
}
