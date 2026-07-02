"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let browserClient: SupabaseClient | null = null

export function getSupabaseClient() {
  if (browserClient) {
    return browserClient
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Supabase 환경 변수가 설정되지 않아 OAuth 로그인을 사용할 수 없습니다.")
    }
    return null
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      storageKey: "ai-research-portal.auth",
    },
  })

  return browserClient
}
