import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 이름에서 한국어(한글) 부분을 추출합니다.
 * 한글이 있으면 한글 부분만 반환하고, 없으면 원본 이름을 반환합니다.
 * 
 * @param name - 추출할 이름 (예: "김영우", "yeongwoo.kim", "김영우 (yeongwoo.kim)")
 * @returns 한국어 이름 또는 원본 이름
 */
export function extractKoreanName(name: string | undefined | null): string {
  if (!name) return "사용자"
  
  // 한글 문자 추출 (가-힣 범위)
  const koreanMatch = name.match(/[가-힣]+/g)
  if (koreanMatch && koreanMatch.length > 0) {
    // 한글이 있으면 첫 번째 한글 부분 반환
    return koreanMatch[0]
  }
  
  // 한글이 없으면 원본 이름 반환
  return name
}
