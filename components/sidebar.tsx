"use client"

import type { Dispatch, SetStateAction } from "react"

interface SidebarProps {
  currentPage: "dashboard" | "users" | "connectors"
  setCurrentPage: Dispatch<SetStateAction<"dashboard" | "users" | "connectors">>
  sidebarOpen: boolean
  setSidebarOpen: Dispatch<SetStateAction<boolean>>
  onLogout: () => void
}

export default function Sidebar({ currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, onLogout }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "connectors", label: "Connectors", icon: "🔌" },
  ] as const

  const handleMenuClick = (page: "dashboard" | "users" | "connectors") => {
    setCurrentPage(page)
    setSidebarOpen(false) // Close sidebar on mobile after navigation
  }

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <nav
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex items-center justify-center h-16 bg-blue-600 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">🔌 Yazaki</h2>
        </div>

        <div className="flex-1">
          <ul className="mt-6">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.id)}
                  className={`
                    w-full flex items-center px-6 py-3 text-left transition-colors duration-200
                    ${
                      currentPage === item.id
                        ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-200 p-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <span className="mr-3 text-lg">🚪</span>
            Sign Out
          </button>
        </div>
      </nav>
    </>
  )
}
