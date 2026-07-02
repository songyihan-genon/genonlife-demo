/**
 * SFR-015 · Agent 상담지식 데모 프리셋.
 *
 * 구조화 문서 p.5 SFR-015 섹션의 워크플로우(①의도분류 → ②영역별 RAG → ③관련도 평가 → ④답변 생성)를
 * 그대로 시연할 수 있도록 3가지 시나리오를 정의한다.
 *
 *  - Preset A: 신뢰도 충분 → 단일 영역 RAG → 관련도 통과 → 답변 생성
 *  - Preset B: 신뢰도 미달 → 역질문 → 멀티턴 후 RAG → 관련도 미달 → 재쿼리 → 답변 생성
 *  - Preset C: 복수 영역 신뢰도 → 병렬 검색 → 답변 생성
 */

import type { CounselingPreset } from "./types"

const presetA: CounselingPreset = {
  id: "A",
  label: "개인채무조정 대상 요건",
  query: "개인채무조정 대상 요건이 어떻게 돼?",
  description:
    "단일 업무 영역으로 신뢰도가 임계값을 충분히 상회하는 경우. 역질문 없이 곧바로 RAG 검색이 수행됩니다.",
  messages: [
    {
      id: "a-u1",
      role: "user",
      text: "개인채무조정 대상 요건이 어떻게 돼?",
    },
    {
      id: "a-a1",
      role: "agent",
      text: "",
      final: true,
    },
    {
      id: "a-a-advisory",
      role: "agent",
      tone: "advisory-confirm",
      text:
        "위 답변은 규정·매뉴얼 기반의 참고 정보입니다. 정확한 적용 여부는 담당 상담사와 사실관계를 확인해 주세요.",
    },
  ],
  intent: {
    domain: "개인채무조정",
    candidates: [
      { domain: "개인채무조정", score: 0.94 },
      { domain: "새출발기금", score: 0.06 },
    ],
    confidence: 0.94,
    threshold: 0.7,
    triggeredClarify: false,
  },
  retrieval: {
    knowledgeBase: "개인채무조정 규정",
    strategy: "키워드 + 의미 기반 하이브리드 검색 (제규정 · QnA · 매뉴얼)",
    hits: [
      {
        title: "채무조정 업무규정 제12조 (대상 채무자)",
        snippet:
          "총 채무액이 15억원 이하이고, 협약대상 채권금융회사에 대한 채무를 보유한 개인 채무자를 대상으로 한다.",
        score: 0.92,
      },
      {
        title: "개인채무조정 시행세칙 제4조 (신청 자격)",
        snippet:
          "최근 6개월 이내 연체 발생 또는 연체가 우려되는 자, 정상 변제가 곤란한 사정이 객관적으로 확인되는 자.",
        score: 0.88,
      },
      {
        title: "운영매뉴얼 2장 (제외 사유)",
        snippet:
          "고의 부도, 재산 은닉, 사해행위 등이 확인된 경우 신청이 제한될 수 있다.",
        score: 0.81,
      },
      {
        title: "QnA #1043 (대상 요건 안내)",
        snippet:
          "주거래 채권금융회사 1개 이상에 대해 협약 대상 채무를 보유해야 하며, 보증채무·구상채무도 포함됩니다.",
        score: 0.76,
      },
    ],
  },
  relevance: {
    score: 0.89,
    threshold: 0.7,
    passed: true,
  },
  answer: {
    body:
      "개인채무조정은 채무조정 업무규정 제12조에 따라 총 채무액 15억원 이하이며 협약대상 채권금융회사에 채무를 보유한 개인 채무자를 대상으로 합니다. 시행세칙 제4조에서 정한 바와 같이 최근 6개월 이내 연체가 발생했거나 정상 변제가 곤란한 사정이 객관적으로 확인되어야 신청이 가능합니다. 보증채무와 구상채무도 협약 대상 채무에 포함되며, 고의 부도·재산 은닉 등 제외 사유에 해당하는 경우 신청이 제한될 수 있습니다. 구체적인 적용 여부는 상담 창구를 통해 사실관계 확인 후 안내드리는 것을 권해드립니다.",
    citations: [
      { label: "채무조정 업무규정 제12조", source: "제규정" },
      { label: "개인채무조정 시행세칙 제4조", source: "시행세칙" },
      { label: "운영매뉴얼 2장", source: "매뉴얼" },
    ],
    cot: [
      {
        title: "① 의도 식별 — 단일 영역 · 고신뢰",
        rationale:
          "'개인채무조정 대상 요건' 질의에서 단일 업무 영역(개인채무조정) + '대상 요건' 의도를 식별. " +
          "후보 영역 점수에서 개인채무조정이 0.94로 임계(0.70)를 크게 상회하여 역질문 없이 바로 검색 진행.",
      },
      {
        title: "② 근거 1 · 채무조정 업무규정 제12조(대상 채무자)",
        rationale:
          "질의의 '대상'이 제12조의 '대상 채무자 정의'와 직접 매칭. 총 채무액·협약 대상 채권금융회사 조건이 " +
          "1차 판정 기준이 되는 핵심 조항이어서 관련도 0.92로 최상위, 핵심 근거로 채택.",
      },
      {
        title: "③ 근거 2 · 시행세칙 제4조(신청 자격)",
        rationale:
          "업무규정 제12조가 '채무자 정의'를 담당한다면 시행세칙 제4조는 '신청 시점의 자격 요건'(연체 기준·" +
          "정상 변제 곤란 사유)을 보완. 대상 요건을 완결하려면 두 조항이 짝으로 필요하여 보완 근거로 결합.",
      },
      {
        title: "④ 보조 근거 · 운영매뉴얼 2장(제외 사유)",
        rationale:
          "대상 요건을 설명할 때 '예외/제외 사유'를 함께 안내해야 상담 오해를 줄일 수 있음. " +
          "매뉴얼 2장의 고의 부도·재산 은닉 등 제외 조항을 보조 근거로 결합해 답변 완결성 확보.",
        followUp:
          "개별 채무자의 연체 기간·재산 상황·채권금융회사 정보는 상담 창구에서 사실관계 확인 후 자격 판정 권장.",
      },
    ],
    treatments: {
      citation: true,
      cot: true,
      advisory: true,
      pii: false,
    },
  },
}

const presetB: CounselingPreset = {
  id: "B",
  label: "새출발기금 지원 문의",
  query: "기금 지원 받으려면?",
  description:
    "'기금'이 모호하여 의도 분류 신뢰도가 임계값에 미달합니다. 역질문으로 영역을 확인한 뒤 멀티턴을 유지하여 검색을 진행합니다.",
  messages: [
    {
      id: "b-u1",
      role: "user",
      text: "홍길동(901010-1******)입니다. 기금 지원 받으려면 어떻게 해야 하나요?",
      piiOriginal: "홍길동 (901010-1234567)",
    },
    {
      id: "b-a1",
      role: "agent",
      tone: "clarify",
      text:
        "문의 주신 '기금'이 제논라이프의 특정 지원 프로그램이나 제휴 혜택을 말씀하시는 것이 맞을까요? 말씀해 주시면 해당 영역의 기준으로 안내드리겠습니다.",
    },
    {
      id: "b-u2",
      role: "user",
      text: "네, 새출발기금이요.",
    },
    {
      id: "b-a2",
      role: "agent",
      text: "",
      final: true,
    },
    {
      id: "b-a-advisory",
      role: "agent",
      tone: "advisory-confirm",
      text:
        "위 답변은 규정·매뉴얼 기반의 참고 정보입니다. 정확한 적용 여부는 담당 상담사와 사실관계를 확인해 주세요.",
    },
  ],
  intent: {
    domain: "새출발기금 (역질문 후 확정)",
    candidates: [
      { domain: "새출발기금", score: 0.48 },
      { domain: "소액대출", score: 0.32 },
      { domain: "개인채무조정", score: 0.2 },
    ],
    confidence: 0.48,
    threshold: 0.7,
    triggeredClarify: true,
    clarifyPrompt:
      "'기금' 표현이 새출발기금/햇살론기금 등 복수 영역과 매칭되어 임계값(0.70) 미달 → 역질문 발동, 멀티턴 컨텍스트 유지.",
  },
  retrieval: {
    knowledgeBase: "새출발기금 규정",
    strategy: "키워드 + 의미 기반 하이브리드 검색, 멀티턴 컨텍스트 결합",
    hits: [
      {
        title: "새출발기금 운영규정 제5조 (지원 대상)",
        snippet:
          "코로나19 피해 등 경제적 사정으로 채무 상환이 곤란한 개인사업자 및 소상공인 채무자를 지원 대상으로 한다.",
        score: 0.86,
      },
      {
        title: "새출발기금 시행세칙 제3조 (신청 절차)",
        snippet:
          "온라인 신청서 접수 → 자격 심사 → 채권금융회사 협의 → 조정 협약 체결 순으로 진행한다.",
        score: 0.82,
      },
      {
        title: "운영매뉴얼 4장 (제출 서류)",
        snippet:
          "신분증, 사업자등록증명, 소득금액증명원, 부채현황 자료 등을 제출해야 한다.",
        score: 0.74,
      },
      {
        title: "QnA #2210 (대상 요건 FAQ)",
        snippet:
          "폐업 사실이 확인되거나 90일 이상 연체 중인 경우 신청이 가능합니다.",
        score: 0.71,
      },
    ],
  },
  relevance: {
    score: 0.62,
    threshold: 0.7,
    passed: false,
    rewriteLog: {
      rewrittenQuery:
        "새출발기금 지원 대상 요건 및 신청 절차 (개인사업자 · 소상공인)",
      secondScore: 0.84,
    },
  },
  answer: {
    body:
      "새출발기금은 운영규정 제5조에 따라 코로나19 등으로 경제적 사정이 악화되어 채무 상환이 곤란한 개인사업자·소상공인 채무자를 지원 대상으로 합니다. 폐업 사실이 확인되거나 90일 이상 장기 연체 중인 경우 신청 자격이 인정되며, 시행세칙 제3조에 따라 온라인 신청서 접수 → 자격 심사 → 채권금융회사 협의 → 조정 협약 체결 순으로 진행됩니다. 운영매뉴얼 4장에서 정한 신분증, 사업자등록증명, 소득금액증명원, 부채현황 자료를 사전에 준비해 두시면 절차 진행이 원활합니다. 개인 사정에 따라 적용 요건이 달라질 수 있어, 정확한 자격 판단은 상담 창구의 사실관계 확인 후 안내드리는 것을 권해드립니다.",
    citations: [
      { label: "새출발기금 운영규정 제5조", source: "제규정" },
      { label: "새출발기금 시행세칙 제3조", source: "시행세칙" },
      { label: "운영매뉴얼 4장", source: "매뉴얼" },
    ],
    cot: [
      {
        title: "① 의도 확정 — 저신뢰 → 역질문 → 멀티턴",
        rationale:
          "'기금'이 새출발기금·햇살론기금 등 복수 영역과 매칭되어 1차 신뢰도 0.48로 임계(0.70) 미달. " +
          "역질문으로 영역 확인 후 사용자 재확답을 통해 '새출발기금' 영역으로 확정, 멀티턴 컨텍스트 유지.",
      },
      {
        title: "② 1차 관련도 미달 → 쿼리 재작성",
        rationale:
          "초기 쿼리('기금 지원 받으려면')가 광범위해 1차 검색 관련도 0.62로 기준(0.70) 미달. " +
          "확정된 영역과 사용자 의도를 반영해 '새출발기금 지원 대상 요건 및 신청 절차'로 구체화해 재검색(0.84 통과).",
      },
      {
        title: "③ 근거 1 · 새출발기금 운영규정 제5조(지원 대상)",
        rationale:
          "재작성된 쿼리의 '지원 대상'이 제5조의 '경제적 사정으로 채무 상환이 곤란한 개인사업자·소상공인' " +
          "정의와 직접 매칭. 대상 요건 판정의 1차 기준 조항이어서 관련도 0.86 최상위, 핵심 근거로 채택.",
      },
      {
        title: "④ 근거 2 · 시행세칙 제3조(신청 절차)",
        rationale:
          "질의에 '어떻게 해야 하나요'(절차) 의도가 포함되어 있어 대상 정의(제5조)만으로는 답변 불완전. " +
          "시행세칙 제3조의 4단계 절차(접수 → 심사 → 협의 → 체결)를 운영규정과 짝지어 보완 근거로 결합.",
      },
      {
        title: "⑤ 보조 근거 · 운영매뉴얼 4장(제출 서류)",
        rationale:
          "신청 절차를 실제로 수행하려면 준비 서류 안내가 필요함. 매뉴얼 4장의 서류 목록(신분증·사업자등록증명·" +
          "소득금액증명원·부채현황)을 보조 근거로 결합해 답변 후반부에서 실무 준비 가이드 제공.",
        followUp:
          "사업자등록 말소 여부, 연체 기간 90일 이상 여부, 폐업 사실 증빙 가능 여부는 상담 창구에서 사실관계 확인 필요.",
      },
    ],
    piiMaskedFrom: "홍길동 (901010-1234567)",
    treatments: {
      citation: true,
      cot: true,
      advisory: true,
      pii: true,
    },
  },
}

const presetC: CounselingPreset = {
  id: "C",
  label: "두 제도 비교",
  query: "개인채무조정과 새출발기금 차이가 뭐야?",
  description:
    "두 업무 영역이 동시에 매칭되어 병렬 RAG 검색 후 영역을 구분 표시하여 답변합니다.",
  messages: [
    {
      id: "c-u1",
      role: "user",
      text: "개인채무조정과 새출발기금 차이가 뭐야?",
    },
    {
      id: "c-a-clarify",
      role: "agent",
      tone: "clarify",
      text:
        "개인채무조정과 새출발기금 두 영역이 동시에 매칭됩니다. 두 제도를 비교 분석해 드릴까요, 아니면 특정 제도에 대해 집중해서 안내해 드릴까요?",
    },
    {
      id: "c-u2",
      role: "user",
      text: "둘 다 비교해서 알려줘.",
    },
    {
      id: "c-a-final",
      role: "agent",
      text: "",
      final: true,
    },
    {
      id: "c-a-advisory",
      role: "agent",
      tone: "advisory-confirm",
      text:
        "위 답변은 규정·매뉴얼 기반의 참고 정보입니다. 정확한 적용 여부는 담당 상담사와 사실관계를 확인해 주세요.",
    },
  ],
  intent: {
    domain: "개인채무조정 + 새출발기금 (병렬)",
    candidates: [
      { domain: "개인채무조정", score: 0.78 },
      { domain: "새출발기금", score: 0.74 },
    ],
    confidence: 0.78,
    threshold: 0.7,
    triggeredClarify: false,
  },
  retrieval: {
    knowledgeBase: "개인채무조정 규정 + 새출발기금 규정 (병렬)",
    strategy: "복수 영역 병렬 하이브리드 검색 후 영역별 결과 구분",
    hits: [
      {
        title: "[개인채무조정] 업무규정 제12조 (대상)",
        snippet:
          "총 채무액 15억원 이하 개인 채무자를 대상으로 협약 채권금융회사 채무를 조정한다.",
        score: 0.9,
      },
      {
        title: "[개인채무조정] 시행세칙 제6조 (조정 효과)",
        snippet:
          "이자 감면, 원금 분할 상환 등의 조정안을 채권자와 협약하여 적용한다.",
        score: 0.83,
      },
      {
        title: "[새출발기금] 운영규정 제5조 (대상)",
        snippet:
          "코로나19 피해 등 경제적 사정으로 채무 상환이 곤란한 개인사업자·소상공인 채무자.",
        score: 0.87,
      },
      {
        title: "[새출발기금] 시행세칙 제7조 (조정 효과)",
        snippet:
          "원금 감면율을 차등 적용하고 장기 분할 상환 일정을 제공한다.",
        score: 0.79,
      },
    ],
  },
  relevance: {
    score: 0.84,
    threshold: 0.7,
    passed: true,
  },
  answer: {
    body:
      "두 제도는 지원 대상과 조정 방식에서 차이가 있습니다. 개인채무조정(업무규정 제12조)은 총 채무액 15억원 이하의 일반 개인 채무자를 폭넓게 대상으로 하며, 시행세칙 제6조에 따라 이자 감면과 원금 분할 상환을 중심으로 채권금융회사와의 협약을 통해 조정합니다. 반면 새출발기금(운영규정 제5조)은 코로나19 등 경제적 사정으로 채무 상환이 곤란해진 개인사업자·소상공인을 대상으로 하며, 시행세칙 제7조에 따라 원금 감면율을 차등 적용하고 장기 분할 상환 일정을 함께 제공합니다. 신청자의 사업자 여부, 채무 규모, 연체 기간에 따라 적합한 제도가 달라지므로 상담 창구를 통해 사실관계 확인 후 적용 가능 여부를 안내드리는 것을 권해드립니다.",
    citations: [
      { label: "채무조정 업무규정 제12조", source: "제규정" },
      { label: "개인채무조정 시행세칙 제6조", source: "시행세칙" },
      { label: "새출발기금 운영규정 제5조", source: "제규정" },
      { label: "새출발기금 시행세칙 제7조", source: "시행세칙" },
    ],
    cot: [
      {
        title: "① 복수 영역 병렬 의도 식별",
        rationale:
          "'개인채무조정과 새출발기금 차이'에서 두 제도명이 동시 등장 → 개인채무조정 0.78·새출발기금 0.74로 " +
          "양쪽 영역이 임계(0.70)를 상회. 비교 의도로 판정해 두 지식베이스 병렬 검색 결정.",
      },
      {
        title: "② 근거 1 · 개인채무조정 업무규정 제12조(대상)",
        rationale:
          "개인채무조정의 적용 대상 범위(총 채무액 15억원 이하 일반 개인 채무자)를 정의하는 기준 조항. " +
          "비교의 '대상' 축에서 개인채무조정 측 근거로 관련도 0.90 최상위.",
      },
      {
        title: "③ 근거 2 · 개인채무조정 시행세칙 제6조(조정 효과)",
        rationale:
          "'차이'를 설명하려면 대상뿐 아니라 '조정 방식'의 차이를 보여야 함. 제6조의 이자 감면·원금 분할 상환 " +
          "중심 조정 방식을 개인채무조정 측 '조정 효과' 근거로 채택(관련도 0.83).",
      },
      {
        title: "④ 근거 3 · 새출발기금 운영규정 제5조(지원 대상)",
        rationale:
          "새출발기금의 대상 차별점(코로나 피해 개인사업자·소상공인)을 명시한 조항. 개인채무조정 측의 제12조와 " +
          "짝이 되어 '대상' 비교축의 새출발기금 측 근거로 관련도 0.87 채택.",
      },
      {
        title: "⑤ 근거 4 · 새출발기금 시행세칙 제7조(조정 효과)",
        rationale:
          "'조정 방식' 비교축의 새출발기금 측 대응 근거. 원금 감면율 차등 적용·장기 분할 상환 특성을 " +
          "제시해 개인채무조정(이자 감면·분할 상환)과의 차이점을 대조적으로 드러냄(관련도 0.79).",
        followUp:
          "신청자의 사업자 여부·채무 규모·연체 기간에 따라 적합 제도가 달라지므로 상담 창구에서 사실관계 확인 후 최종 판정 필요.",
      },
    ],
    treatments: {
      citation: true,
      cot: true,
      advisory: true,
      pii: false,
    },
  },
}

export const counselingPresets: CounselingPreset[] = [presetA, presetB, presetC]

export function getPresetById(id: CounselingPreset["id"]): CounselingPreset {
  const found = counselingPresets.find((preset) => preset.id === id)
  if (!found) {
    throw new Error(`Unknown SFR-015 preset id: ${id}`)
  }
  return found
}

/**
 * 시나리오(preset)의 메시지 리스트를 flat ChatMessage[]로 변환하면서
 * final / clarify agent 메시지에 해당 시나리오의 처리 과정 데이터를 부착한다.
 *
 * ChatPanel은 단일 평탄 리스트 API만 다루면 되고, 시나리오 전환은 이 함수로 한다.
 */
export function presetToMessages(
  preset: CounselingPreset,
): import("./types").ChatMessage[] {
  return preset.messages.map((msg) => {
    if (msg.role !== "agent") return { ...msg }
    if (msg.final) {
      return {
        ...msg,
        intent: preset.intent,
        retrieval: preset.retrieval,
        relevance: preset.relevance,
        answer: preset.answer,
      }
    }
    if (msg.tone === "clarify") {
      // 신뢰도 미달(triggeredClarify)인 경우에만 intent trace를 역질문 버블에 부착.
      // 복수 영역 확인(Scenario C)처럼 신뢰도는 충족하나 영역 수 확인 차원의
      // 역질문에서는 intent trace 없이 text만 표시한다.
      return {
        ...msg,
        ...(preset.intent.triggeredClarify ? { intent: preset.intent } : {}),
      }
    }
    return { ...msg }
  })
}
