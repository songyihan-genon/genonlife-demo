import { Suspense } from "react"
import { RealtimeMonitoringView } from "@/components/RealtimeMonitoringView"

export default function RealtimeMonitoringPage() {
  return (
    <Suspense fallback={null}>
      <RealtimeMonitoringView />
    </Suspense>
  )
}
