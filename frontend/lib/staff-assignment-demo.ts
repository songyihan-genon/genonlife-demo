export type StaffAssignmentRequest = {
  requestText: string
  uploadedFileName: string
  extraCondition: string
}

export type StaffAssignmentDepartment = {
  name: string
  team: string
  confidenceLabel: string
  reason: string
}

export type StaffAssignmentOwner = {
  name: string
  position: string
  department: string
  phone: string
  email: string
  score: number
  summary: string
}

export type StaffAssignmentResult = {
  intentLabel: string
  keywordSummary: string[]
  recommendedDepartment: StaffAssignmentDepartment
  recommendedOwner: StaffAssignmentOwner
  alternateOwners: StaffAssignmentOwner[]
  rationale: string[]
  verification: string[]
  notices: string[]
}

export type StaffAssignmentPreset = {
  id: string
  title: string
  description: string
  request: StaffAssignmentRequest
  result: StaffAssignmentResult
}

export type StaffAssignmentSession = {
  id: string
  title: string
  description: string
  timestamp: number
  request: StaffAssignmentRequest
  result: StaffAssignmentResult
  source: "preset" | "generated"
}

const basePresets: StaffAssignmentPreset[] = [
  {
    id: "rehab-doc-owner",
    title: "보험금 청구 서류 보완 담당",
    description: "추가 서류 제출 문의 건의 1순위 담당자 추천",
    request: {
      requestText:
        "보험금 청구 접수 후 추가 서류 문의가 접수되었습니다. 제출 서류와 심사 일정을 안내할 수 있는 담당자 배정이 필요합니다.",
      uploadedFileName: "보험금청구_보완문의.pdf",
      extraCondition: "고객이 접수 후 진행 상황도 함께 문의하고 있어 상태 조회 가능 담당자를 우선 고려해줘.",
    },
    result: {
      intentLabel: "보험금 청구 서류 보완 및 진행상황 문의",
      keywordSummary: ["보험금 청구", "보완 서류", "진행상황", "심사 일정"],
      recommendedDepartment: {
        name: "보험금심사부",
        team: "지급심사 운영팀",
        confidenceLabel: "적합도 0.67",
        reason: "보험금 청구 접수 후 보완 서류 검토와 심사 진행 단계 확인을 함께 담당하는 부서입니다.",
      },
      recommendedOwner: {
        name: "신재훈",
        position: "과장",
        department: "보험금심사부 지급심사 운영팀",
        phone: "02-3456-2184",
        email: "jaehoon.shin@shinhanlife.co.kr",
        score: 0.67,
        summary: "최근 유사 고객민원 처리 이력이 있고, 보완 서류 검토 권한을 가진 담당자입니다.",
      },
      alternateOwners: [
        {
          name: "홍길동",
          position: "대리",
          department: "고객서비스센터 진행안내팀",
          phone: "02-3456-1107",
          email: "honggil.dong@shinhanlife.co.kr",
          score: 0.58,
          summary: "접수 상태 조회와 1차 진행 안내에 적합한 대체 담당자입니다.",
        },
        {
          name: "박서윤",
          position: "대리",
          department: "보험금심사부 지급심사 운영팀",
          phone: "02-3456-2193",
          email: "seoyoon.park@shinhanlife.co.kr",
          score: 0.55,
          summary: "동일 업무 분장을 보유한 대체 후보입니다.",
        },
      ],
      rationale: [
        "민원 내용에서 `보험금 청구`, `보완 서류`, `진행 상황` 키워드가 함께 확인되어 지급심사 운영팀 범위로 탐색을 좁혔습니다.",
        "유사 민원 처리 이력을 기준으로 보완 서류 검토 경험이 있는 담당자를 우선 배정 후보로 산정했습니다.",
        "상태 조회성 문의가 함께 있어 고객서비스센터 협업 후보를 대체 담당자로 함께 제시했습니다.",
      ],
      verification: [
        "인사정보 기준 재직 상태 정상",
        "당일 휴가·부재 일정 없음",
        "최근 30일 내 유사 민원 처리 이력 4건 확인",
      ],
      notices: [
        "업무분장 최신 업데이트 일시는 2026.04.05입니다.",
        "민감 고객민원으로 전환될 경우 소비자보호팀 병행 검토가 필요할 수 있습니다.",
      ],
    },
  },
  {
    id: "microloan-owner",
    title: "계약 변경 문의 담당",
    description: "계약 변경 절차와 처리 가능 여부를 안내할 담당자 추천",
    request: {
      requestText:
        "수익자 변경과 자동이체 계좌 변경 가능 여부를 문의한 고객 요청이 접수되었습니다. 처리 절차와 필요 서류를 안내할 담당자를 추천해 주세요.",
      uploadedFileName: "",
      extraCondition: "전화 재연락이 가능한 담당자를 우선 추천해줘.",
    },
    result: {
      intentLabel: "계약 변경 가능 여부 및 신청 절차 문의",
      keywordSummary: ["수익자 변경", "자동이체 변경", "처리 절차", "필요 서류"],
      recommendedDepartment: {
        name: "계약관리부",
        team: "계약변경 운영팀",
        confidenceLabel: "적합도 0.71",
        reason: "계약 변경 요청 검토와 신청 절차 안내를 동시에 수행하는 실무 부서입니다.",
      },
      recommendedOwner: {
        name: "이수민",
        position: "차장",
        department: "계약관리부 계약변경 운영팀",
        phone: "02-3456-3072",
        email: "sumin.lee@shinhanlife.co.kr",
        score: 0.71,
        summary: "계약 변경 상담과 처리 요건 안내 경험이 가장 많은 담당자입니다.",
      },
      alternateOwners: [
        {
          name: "정현우",
          position: "대리",
          department: "고객서비스센터 초기상담팀",
          phone: "02-3456-1003",
          email: "hyunwoo.jung@shinhanlife.co.kr",
          score: 0.61,
          summary: "기본 안내와 초기 분류 응대가 가능한 대체 후보입니다.",
        },
      ],
      rationale: [
        "질의 의도 분석 결과 `계약 변경 안내`와 `처리 가능 여부 확인`이 동시에 필요한 문의로 분류되었습니다.",
        "업무분장 문서에서 계약변경 운영팀이 우선 담당으로 정의되어 있어 관련 부서를 1순위로 제안했습니다.",
        "전화 재연락 가능 조건을 반영해 현재 외근 일정이 없는 담당자를 우선 배정했습니다.",
      ],
      verification: [
        "인사정보 기준 재직 상태 정상",
        "당일 외근 일정 없음",
        "최근 주간 평균 응답량 12건으로 배정 가능",
      ],
      notices: [
        "계약 유형에 따라 제출 서류가 달라질 수 있어 최신 운영 공지를 함께 확인하는 것이 좋습니다.",
      ],
    },
  },
  {
    id: "status-followup-owner",
    title: "진행상황 확인 담당",
    description: "접수 상태 조회성 문의의 우선 담당자 추천",
    request: {
      requestText:
        "민원인이 본인 신청 건의 진행 상태와 예상 회신 시점을 확인하고 싶다고 문의했습니다. 조회 가능한 담당자를 추천해 주세요.",
      uploadedFileName: "진행상황문의_요약.docx",
      extraCondition: "",
    },
    result: {
      intentLabel: "진행상황 조회 및 회신 일정 문의",
      keywordSummary: ["진행 상태", "회신 시점", "조회", "안내"],
      recommendedDepartment: {
        name: "고객서비스센터",
        team: "진행안내팀",
        confidenceLabel: "적합도 0.64",
        reason: "접수 상태 조회와 회신 일정 안내를 담당하는 부서입니다.",
      },
      recommendedOwner: {
        name: "최유진",
        position: "과장",
        department: "고객서비스센터 진행안내팀",
        phone: "02-3456-1120",
        email: "yujin.choi@shinhanlife.co.kr",
        score: 0.64,
        summary: "진행상황 확인 문의의 1차 응대를 가장 많이 처리한 담당자입니다.",
      },
      alternateOwners: [
        {
          name: "한도윤",
          position: "차장",
          department: "고객경험혁신팀",
          phone: "02-3456-1455",
          email: "doyoon.han@shinhanlife.co.kr",
          score: 0.52,
          summary: "장기 미회신 또는 민감 민원 escalations 대응 후보입니다.",
        },
      ],
      rationale: [
        "민원 본문에 상태 조회와 회신 일정 안내 요청이 명확히 포함되어 조회성 문의로 분류했습니다.",
        "고객서비스센터 진행안내팀이 접수 상태 조회 권한을 보유하고 있어 1순위 부서로 추천했습니다.",
      ],
      verification: [
        "인사정보 기준 재직 상태 정상",
        "현재 휴가 일정 없음",
        "관련 시스템 조회 권한 보유 여부 확인 완료",
      ],
      notices: [
        "장기 지연 건으로 확인될 경우 고객경험혁신팀 병행 공유가 필요합니다.",
      ],
    },
  },
  {
    id: "org-hr-mismatch",
    title: "업무분장-인사정보 불일치",
    description: "업무분장과 현재 인사정보 불일치로 업데이트가 필요한 사례",
    request: {
      requestText:
        "보험금 심사 관련 고객민원이 접수되었는데 기존 업무분장 문서상 담당자로 표시된 인력이 현재 인사정보와 다르게 확인됩니다. 담당자 배정 가능 여부를 검토해 주세요.",
      uploadedFileName: "업무분장_현행인사_비교표.pdf",
      extraCondition: "업무분장 문서와 현재 인사정보가 다를 경우 업데이트 필요 여부도 함께 확인해줘.",
    },
    result: {
      intentLabel: "업무분장-인사정보 정합성 검토 필요",
      keywordSummary: ["보험금 심사", "업무분장", "인사정보", "정합성 검토"],
      recommendedDepartment: {
        name: "보험금심사부",
        team: "지급심사 1팀",
        confidenceLabel: "검토 필요",
        reason: "민원 성격상 지급심사 1팀이 우선 담당 범위에 포함되지만, 현재 인사정보와 업무분장 문서 정합성 확인이 선행되어야 합니다.",
      },
      recommendedOwner: {
        name: "최종 배정 보류",
        position: "업데이트 필요",
        department: "업무분장/인사정보 정합성 확인 후 확정",
        phone: "-",
        email: "-",
        score: 0.41,
        summary: "현재 데이터 기준으로 즉시 배정 가능한 담당자를 확정하기 어렵습니다. 관련 문서와 인사정보 최신화 후 재탐색이 필요합니다.",
      },
      alternateOwners: [
        {
          name: "임시 검토 후보",
          position: "팀장",
          department: "보험금심사부 지급심사 1팀",
          phone: "02-3456-1200",
          email: "temporary.owner@shinhanlife.co.kr",
          score: 0.39,
          summary: "긴급 응대 시 임시 검토는 가능하나, 정식 배정 전 데이터 정합성 확인이 필요합니다.",
        },
      ],
      rationale: [
        "민원 키워드 기준으로는 지급심사 1팀이 1차 배정 후보로 분류되었습니다.",
        "다만 업무분장 문서의 담당자와 인사정보시스템의 재직/소속 정보가 일치하지 않아 자동 확정 배정을 보류했습니다.",
        "정합성 검토 후 최신 인사정보를 반영해 담당자 후보를 재산정하는 것이 적절합니다.",
      ],
      verification: [
        "민원 유형 분류는 정상 수행됨",
        "관련 부서 범위는 도출됨",
        "자동 확정 배정은 보류됨",
      ],
      notices: [
        "업무 분장 데이터와 현재 인사정보가 불일치 하므로 업데이트가 필요합니다.",
        "업무분장 문서 최신본 반영 후 재탐색을 권장합니다.",
      ],
    },
  },
]

export const staffAssignmentPromptSuggestions = [
  "보험금 청구 보완 서류 문의 건을 배정할 담당자를 추천해 주세요.",
  "계약 변경 가능 여부 문의가 접수되었습니다. 담당자를 확인해 주세요.",
  "진행상황 확인 요청 민원을 배정할 부서와 담당자를 안내해 주세요.",
]

export const staffAssignmentHistoryPresets = basePresets

export function getStaffAssignmentPreset(id: string | null) {
  if (!id) return null
  return basePresets.find((preset) => preset.id === id) ?? null
}

function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function buildStaffAssignmentSession(
  request: StaffAssignmentRequest,
  presetId?: string | null,
): StaffAssignmentSession {
  const matchedPreset =
    getStaffAssignmentPreset(presetId ?? null) ??
    basePresets.find((preset) =>
      `${request.requestText} ${request.extraCondition}`.includes("계약 변경")
        ? preset.id === "microloan-owner"
        : `${request.requestText} ${request.extraCondition}`.includes("진행")
          ? preset.id === "status-followup-owner"
          : preset.id === "rehab-doc-owner",
    ) ??
    basePresets[0]

  const normalizedRequest: StaffAssignmentRequest = {
    requestText: request.requestText.trim() || matchedPreset.request.requestText,
    uploadedFileName: request.uploadedFileName.trim(),
    extraCondition: request.extraCondition.trim(),
  }

  const result: StaffAssignmentResult = {
    ...matchedPreset.result,
    notices: normalizedRequest.extraCondition
      ? [
          ...matchedPreset.result.notices,
          `추가 조건 반영: ${normalizedRequest.extraCondition}`,
        ]
      : matchedPreset.result.notices,
  }

  return {
    id: `staff-assignment-${slugifyTitle(matchedPreset.title)}-${Date.now()}`,
    title: matchedPreset.title,
    description: matchedPreset.description,
    timestamp: Date.now(),
    request: normalizedRequest,
    result,
    source: presetId ? "preset" : "generated",
  }
}
