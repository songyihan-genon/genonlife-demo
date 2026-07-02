"use client"

import { Suspense } from "react"
import { StaffAssignmentTool } from "@/components/staff-assignment-tool"

function StaffAssignmentPageContent() {
  return (
    <div className="h-full overflow-auto bg-background">
      <StaffAssignmentTool />
    </div>
  )
}

export default function StaffAssignmentPage() {
  return (
    <Suspense>
      <StaffAssignmentPageContent />
    </Suspense>
  )
}
