"use client"

import { useState, useEffect } from "react"
import { isAuthenticated, removeAuthToken } from "@/lib/auth"
import LoginForm from "@/components/login-form"
import Sidebar from "@/components/sidebar"
import TopBar from "@/components/top-bar"
import Dashboard from "@/components/pages/dashboard"
import Users from "@/components/pages/users"
import Connectors from "@/components/pages/connectors"

export interface User {
  id: number
  name: string
  email: string
  role: "admin" | "manager" | "user"
  createdAt: string
}

export interface Connector {
  yazakiPN: string
  customerPN: string
  supplierPN: string
  supplierName: string
  price: number
  drawing_2d_path: string | null
  model_3d_path: string | null
  image_path: string | null
}

export interface AppData {
  users: User[]
  connectors: Connector[]
}

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [currentPage, setCurrentPage] = useState<"dashboard" | "users" | "connectors">("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [appData, setAppData] = useState<AppData>({ users: [], connectors: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(isAuthenticated())
      setAuthChecked(true)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      loadData()
    }
  }, [isLoggedIn])

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    removeAuthToken()
    setIsLoggedIn(false)
    setCurrentPage("dashboard")
  }

  const loadData = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

      if (backendUrl) {
        // Use real data from backend
        const response = await fetch(`${backendUrl}/api/data`)
        const data = await response.json()
        setAppData(data)
      } else {
        // Use local JSON file data via API route
        const response = await fetch("/api/data")
        const data = await response.json()
        setAppData(data)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      // Fallback to empty data
      setAppData({ users: [], connectors: [] })
    } finally {
      setLoading(false)
    }
  }

  const addUser = async (userData: Omit<User, "id">) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })
      const newUser = await response.json()
      setAppData((prev) => ({ ...prev, users: [...prev.users, newUser] }))
      return newUser
    } catch (error) {
      console.error("Error adding user:", error)
      throw error
    }
  }

  const updateUser = async (updatedUser: User) => {
    try {
      const response = await fetch(`/api/users/${updatedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      })
      const user = await response.json()
      setAppData((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === user.id ? user : u)),
      }))
      return user
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  }

  const deleteUser = async (userId: number) => {
    try {
      await fetch(`/api/users/${userId}`, { method: "DELETE" })
      setAppData((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== userId),
      }))
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  }

  const addConnector = async (connectorData: Connector) => {
    try {
      const response = await fetch("/api/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectorData),
      })
      const newConnector = await response.json()
      setAppData((prev) => ({ ...prev, connectors: [...prev.connectors, newConnector] }))
      return newConnector
    } catch (error) {
      console.error("Error adding connector:", error)
      throw error
    }
  }

  const updateConnector = async (updatedConnector: Connector) => {
    try {
      const response = await fetch(`/api/connectors/${updatedConnector.yazakiPN}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConnector),
      })
      const connector = await response.json()
      setAppData((prev) => ({
        ...prev,
        connectors: prev.connectors.map((c) => (c.yazakiPN === connector.yazakiPN ? connector : c)),
      }))
      return connector
    } catch (error) {
      console.error("Error updating connector:", error)
      throw error
    }
  }

  const deleteConnector = async (yazakiPN: string) => {
    try {
      await fetch(`/api/connectors/${yazakiPN}`, { method: "DELETE" })
      setAppData((prev) => ({
        ...prev,
        connectors: prev.connectors.filter((c) => c.yazakiPN !== yazakiPN),
      }))
    } catch (error) {
      console.error("Error deleting connector:", error)
      throw error
    }
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case "dashboard":
        return "Dashboard"
      case "users":
        return "Users Management"
      case "connectors":
        return "Connectors Management"
      default:
        return "Dashboard"
    }
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={getPageTitle()} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-auto p-6">
          {currentPage === "dashboard" && (
            <Dashboard totalUsers={appData.users.length} totalConnectors={appData.connectors.length} />
          )}

          {currentPage === "users" && (
            <Users users={appData.users} onAddUser={addUser} onUpdateUser={updateUser} onDeleteUser={deleteUser} />
          )}

          {currentPage === "connectors" && (
            <Connectors
              connectors={appData.connectors}
              onAddConnector={addConnector}
              onUpdateConnector={updateConnector}
              onDeleteConnector={deleteConnector}
            />
          )}
        </main>
      </div>
    </div>
  )
}
