"use client"

import type { Dispatch, SetStateAction } from "react"

interface TopBarProps {
  title: string
  setSidebarOpen: Dispatch<SetStateAction<boolean>>
}

export default function TopBar({ title, setSidebarOpen }: TopBarProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 mr-4"
        >
          ☰
        </button>
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center text-gray-600">
        <span className="flex items-center gap-2">👤 Admin</span>
      </div>
    </header>
  )
}
