import React from 'react'

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void
  className?: string
  direction?: "horizontal" | "vertical"
}

export const ResizeHandle = ({ 
  onMouseDown, 
  className = "", 
  direction = "vertical" 
}: ResizeHandleProps) => {
  if (direction === "horizontal") {
    return (
      <div
        className={`w-full h-4 cursor-row-resize transition-colors relative group flex items-center justify-center ${className}`}
        onMouseDown={onMouseDown}
      >
        <div className="h-[2px] w-8 bg-gray-300 rounded-full opacity-80 transition-colors group-hover:bg-blue-500 group-hover:opacity-100" />
      </div>
    )
  }

  return (
    <div
      className={`h-full w-4 cursor-col-resize transition-colors relative group flex items-center justify-center ${className}`}
      onMouseDown={onMouseDown}
    >
      <div className="w-[2px] h-10 bg-gray-300 rounded-full opacity-80 transition-colors group-hover:bg-blue-500 group-hover:opacity-100" />
    </div>
  )
}

