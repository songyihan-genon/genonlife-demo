# DUMMY_DATA_SPEC — 더미 데이터 메타데이터 사전 (Data Dictionary)

> **대상: 실제 앱 화면의 목업 데이터.** (PPT 아님)
> 목적: 같은 엔티티가 **모든 화면에서 일관되게** 보이도록 스키마·허용값·불변식·등장 화면을 못박음.
> 시연 흐름·LOCKED 값은 [DEMO_SPEC.md](./DEMO_SPEC.md) 참조. 값 변경 시 두 문서 동기화.

---

## 0. 공용 정본 엔티티 (여러 화면에 걸쳐 등장 — 절대 불일치 금지)

같은 사람/상담이 화면마다 다르게 보이면 안 됨. 아래는 **화면 간 공유되는 고정 엔티티**.

| 엔티티 | 정본 값 | 등장 화면 (일관 유지 대상) |
|---|---|---|
| 고객 **김민준** | `C-10294857` · 우량 · 010-****-4857 · 총 상담 4건 · 최근 문의 "보험금 청구 서류 보완" | 상담사 홈(콜 인입) · 실시간 고객 상담(case=kim) · 상담 이력 `CL-20260514-018` · 후속업무(DEMO_CONSULT_ID) · 관리자 실시간 모니터링 쇼케이스 |
| 상담 **CL-20260513-027 / 정해린** | `C-10422190` · 챗봇 이관 · 담당 김제나 · 환급률 오안내(100%→80%) | 상담 검수(메인 케이스) · 후속 재안내 부모(`-t01`) · 관리자 검수 큐(REVIEW_OVERRIDES) · 상담 이력 |
| 상담사 **김제나** | 상담사 로그인 · 오늘 상담 9건 · 잠실1센터 | 상담사 전 화면 · 관리자 모니터링 로비 쇼케이스 · 검수 담당 |

> 이 값들이 바뀌면 등장 화면 전부 함께 확인. [DEMO_SPEC §2](./DEMO_SPEC.md) LOCKED.

---

## 1. Consultation (상담) — `components/PostConsultationView.tsx:80`

상담 이력·후속업무·검수의 기본 단위. `CONSULTATIONS = [...SEEDS, ...TODAY_BULK, ...PAST_BULK]`.

| 필드 | 타입 | 허용값/형식 | 규칙·불변식 |
|---|---|---|---|
| `id` | string | `CL-YYYYMMDD-###` | 날짜 remap 안 함(문자열 고정). PK |
| `customer` / `customerNo` | string | 이름 / `C-########` | 공용 엔티티는 §0 값과 일치 |
| `time` / `date` | string | `HH:MM` / `YYYY-MM-DD` | date는 remap 대상(표시 시 오늘 기준) |
| `channel` | string | 콜센터 인바운드 / 콜센터 아웃바운드 / 모바일 앱 / 챗봇 이관 | |
| `agent` | string? | BULK_AGENTS 12명 | 상담사 뷰는 김제나 건만 |
| `cat`(템플릿) | Cat | consult3·claimDoc·claimReceipt·autodebit·surrender·lapse·premium·beneficiary·address·loan·renewal (11) | 주제 템플릿 매핑 |
| `topics` / `keywords` | string[] | 템플릿 파생 | |
| `smsSent` | boolean | | false → 후속 "발송요청" 대상 |
| `contactRegistered` | boolean | | false → 후속 "미등록" 대상 |
| `audited` | boolean? | | 오늘 건 true → 검수 "검수중" |
| `status` | ReviewStatus | 리뷰 대기 / 리뷰 완료 | 오늘=대기, 과거=완료 |
| `transcript` | {speaker,time,text,seg}[] | speaker: agent/customer | 검수·상세 원문 |
| `sttCorrections` | {before,after}[] | | STT 보정 이력 |
| `summary` | string | | AI 요약 |
| `contactTypes` | ContactType[] | rank·title·weight·importance·major/middle/minor·draft* | 접촉 유형(대/중/소) 초안 |
| `processing` | {item,status,location?,expectedScript?}[] | status: 수행/미수행 | 검수 매뉴얼 수행 여부 |
| `references` | Reference[] | type: 약관/구비서류/업무기준 | 근거 팝업 |
| `smsDraft` | string | | SMS 초안 |
| `audit` | AuditItem[] | id·label·result(통과/주의/위반)·note | AI 검수 결과 |

**건수·구성(LOCKED)**: SEEDS 오늘 14 + TODAY_BULK 180 + PAST_BULK 1,200 ≈ 1,406.
**불변식**:
- 김제나 오늘 9건 中 접촉 미등록 5(`018·044·048·056·064`) · SMS 미발송 3(`029·037·052`), **교집합 없음**.
- TODAY_BULK 전부 `contact:true/sms:true`·"리뷰 대기"; PAST_BULK 전부 완료·"리뷰 완료".

---

## 2. Followup (후속조치) — localStorage `genon:followup`

상담ID → 후속 상태(런타임 저장). `Record<string, Followup>`.

| 필드 | 타입 | 규칙 |
|---|---|---|
| `smsSent` / `smsText` | boolean / string | SMS 발송 처리 |
| `contactRegistered` / `contactText` / `contactItems[]` | boolean / string / {label,body}[] | 접촉 등록 처리 |
| `vocExp` | "일반 문의" \| "불만 VoC" | VoC 성격 |
| `actionDone` / `actionAt` / `actionItems[]` | boolean / string / string[] | 검수 후속 조치 → true면 재안내 이력(`-t01`) 생성 |
| `adminClosed` | boolean | 관리자 종결 |

**상태 파생 규칙(LOCKED)**: `contactDoneOf`(=`contactRegistered`, -t01은 false) · `smsStateOf`(미발송→"요청", 발송→ID해시 30% "미요청"/70% "발송", -t01→"발송").

---

## 3. ReviewState / REVIEW_OVERRIDES — `PostConsultationView.tsx:3220`

| 필드 | 타입 | 값 |
|---|---|---|
| `ai` | enum | 검수중 / 통과 / 감지 |
| `guideN` / `workN` | number | 오안내 / 누락 건수 |
| `admin` | AdminState\|null | 검토필요·검수완료·필요·완료·이관 |
| `severity` | enum? | 경미 / 심각 |
| `pending` | boolean? | |

**큐레이션(LOCKED)**: `027`(감지·1·1·필요·심각) · `097`(감지·2·0·검토필요·심각) · `066`(감지·0·1·이관·경미) · `070`(감지·1·1·완료·심각). 그 외 오늘=검수중, 과거=해시 분포(≈90% 통과).

---

## 4. Detection (콜 STT 탐지) — `components/ComplaintDetectionView.tsx:37`

| 필드 | 타입 | 허용값 |
|---|---|---|
| `callId` / `customer` / `customerNo` | string | `CL-…` / 이름 / `C-…` |
| `datetime` / `channel` | string | `MM.DD HH:MM`(remapCDDate) / 콜센터 IB |
| `sentiment` | Sentiment | 부정 / 보통 / 긍정 |
| `discomfort` | number | 불편도 0–100 |
| `risk` / `riskScore` | Level / number | 낮음·보통·높음·매우높음 / 0–100 |
| `urgency` | Urgency | 긴급·높음·보통·낮음 |
| `vocMajor` / `vocMinor` | string | 7대분류 / 55중분류 |
| `reg` | RegState | 비대상·대상·등록완료·제외·실패 |
| `vocId?` / `vocStatus?` / `failReason?` | string | 등록 결과 |
| `summary` / `cues[]` / `signal` / `systemArea?` / `reason` | string | 근거·발화 |

**건수(LOCKED)**: 25건(`CL-20260612-201`~`CL-20260613-225`, 기준일 2026-06-13). 위험도 매우높음6/높음10/보통7/낮음2.

---

## 5. VoC (멀티채널) — `components/VocServiceView.tsx:24` (export)

| 필드 | 타입 | 허용값 |
|---|---|---|
| `id` | string | `VOC-YYMMDD-###` |
| `customer` | string | |
| `channel` | Channel | 콜센터 / 이메일 / 대외기관 민원 / 모바일 챗봇 |
| `datetime` | string | `MM.DD HH:MM` |
| `vocType` | string | 보험금 지급·해지·환급·응대·서비스·수금·납입·계약 유지·변경·불완전판매·전산·디지털 |
| `exp` | Exp | 칭찬·불만·건의·제안·단순문의·철회항변·기타 |
| `dept` | string | 6부서 |
| `keywords[]` / `triggers[]` | string[] | triggers 예: 금감원·분쟁조정·법적 조치 |
| `score` / `risk` | number / Level | 0–100 / 낮음·보통·높음·매우높음 |
| `summary` / `status` | string | status: 분석 완료·이관 완료·처리 중·처리 완료 |

**건수(LOCKED)**: 32건(`001`~`211`). 콜 22·이메일 3·챗봇 3·대외기관 4.
**부서 매핑(LOCKED)**: [DEMO_SPEC §3.6](./DEMO_SPEC.md).

---

## 6. FSS_DETAIL (대외민원) — `components/VocServiceView.tsx`

실제 금감원 연계 스키마 기준. `FssKind`=이첩/사실조회/직접처리/자율조정, `FssTrack`=일반민원/분쟁민원.

| 필드 | 의미 | 예시 |
|---|---|---|
| `idMinwon` | 사내 민원관리번호 | MW20260616-056845 |
| `docNo` | 금감원 문서번호 | 금소보-2026-제03825호 |
| `noRecv` | 금감원 접수번호 | 2026V9501 |
| `ymdRecv` / `ymdDeadline` | 접수일 / 처리기한 | YYYYMMDD / YYYY-MM-DD |
| `reqKind` | 처리 유형 | 이첩 / 자율조정 / 사실조회 |
| `dept` / `officer` | 금감원 담당 부서 / 담당자 | |
| `reminwon` | 원민원 / 재민원 | |
| `custReq` | 민원인 신청 내용(원문) | fss_ds_cont |
| `fssReq` | 금감원 처리 의뢰 공문 | fss_ds_req |

**케이스 6건(LOCKED)**: [DEMO_SPEC §3.7](./DEMO_SPEC.md). 처리 스테퍼: 분석 완료→부서 배정→처리 중→처리 완료.
⚠️ **미확정**: `ymdDeadline` remap 여부([DEMO_SPEC §7](./DEMO_SPEC.md)).

---

## 7. PeriodAgg (VoC 통계 앵커) — `ComplaintDetectionView.tsx:255`

기간별(today/7d/30d) 집계 앵커. 전체 문의 **16 / 68 / 214**. 전사 실시간 합계·부서별 처리율 등 상세 수치는 [DEMO_SPEC §3.4~3.5](./DEMO_SPEC.md) (LOCKED).

---

## 8. Criterion (AI 평가 기준 6종) — `ComplaintDetectionView.tsx:364`

| 필드 | 값 |
|---|---|
| `id` | c1~c6 |
| 기준명 | 부정 감정어 탐지 / 위험도 평가 / 제도 개선 신호 / 긴급도 산정 / VOC 자동 분류 / 중복 접수 필터 |
| 적용 단계 | 불편 탐지 / 위험도 평가 / 긴급도 산정 / VOC 분류 |
| AI 적용 · 검증 상태 | 적용 가능·검증 완료 (c3만 검토 필요·검토 중) |

---

## 9. 에이전트 도구 프리셋 데이터

각 도구 프리셋의 id·순서·핵심값은 [DEMO_SPEC §4](./DEMO_SPEC.md)에 고정. 소스:
`lib/general-qa-demo-history.ts` · `lib/compliance-demo-history.ts` · `lib/staff-assignment-demo.ts` · `lib/document-writing-demo-history.ts` · `components/DebtTransferTool.tsx` · `components/counseling-knowledge/demo-presets.ts` · `components/partner-search/mock-partners.ts`.

---

## 10. Enum 레지스트리 (전역 허용값 — 화면 간 통일)

| Enum | 값 | 쓰는 곳 |
|---|---|---|
| Cat | consult3·claimDoc·claimReceipt·autodebit·surrender·lapse·premium·beneficiary·address·loan·renewal | 상담 주제 |
| AuditResult | 통과·주의·위반 | 검수 항목 |
| AdminState | 검토필요·검수완료·필요·완료·이관 | 휴먼 검수 |
| Level(위험도) | 낮음·보통·높음·매우높음 | Detection·VoC |
| Urgency | 긴급·높음·보통·낮음 | Detection |
| Sentiment | 부정·보통·긍정 | Detection |
| Exp(경험) | 칭찬·불만·건의·제안·단순문의·철회항변·기타 | VoC |
| Channel(VoC) | 콜센터·이메일·대외기관 민원·모바일 챗봇 | VoC |
| Channel(상담) | 콜센터 인바운드·콜센터 아웃바운드·모바일 앱·챗봇 이관 | Consultation |
| RegState | 비대상·대상·등록완료·제외·실패 | Detection 등록 |
| StatusTag 톤 | action·warn·done·pending·neutral | 상태 뱃지 |
| 부서(6) | 보상서비스부·고객만족부·수금관리부·디지털서비스부·계약관리부·준법감시부 | 전역 |

> 새 화면에서 상태/유형을 표기할 때 **반드시 위 값**만 사용(신규 문자열 임의 도입 금지).

---

## 변경 로그
| 날짜 | 변경 | 사유 |
|---|---|---|
| 2026-07-10 | 최초 작성(코드 타입 정의 기준) | 화면 간 더미 데이터 통일 관리 |