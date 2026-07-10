// 데모 세션 상태 관리 (DEMO_SPEC §7)
// 세션 = 브라우저 새로고침 기준. 새로고침 시 후속처리 상태를 baseline(미처리)으로 초기화.
// 모듈 스코프 플래그는 새로고침(JS 재실행) 때 리셋되고 SPA 화면 이동에서는 유지되므로
// "새로고침 = 데모 처음부터", "세션 중 화면 이동 = 처리 상태 유지"가 양립한다.
// 반드시 앱 진입점(layout-content)에서 호출 → 어떤 후속처리보다 먼저 1회 실행되어 DS-2/DS-3가 깨지지 않음.

export const FOLLOWUP_KEY = "genon:followup"

let demoResetDone = false

export function resetDemoFollowupOnce() {
  if (demoResetDone || typeof window === "undefined") return
  demoResetDone = true
  try {
    // 진행 중 후속처리(genon:followup) 전체를 baseline으로 초기화 → 모든 대상 미처리 복귀
    window.localStorage.setItem(FOLLOWUP_KEY, "{}")
    window.dispatchEvent(new Event("genon:followup-changed"))
  } catch {
    /* 데모 — 무시 */
  }
}