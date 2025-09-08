"use client";

import { useState, useEffect } from "react";
import { isAuthenticated, removeAuthToken } from "@/lib/auth";
import LoginForm from "@/components/login-form";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";
import Dashboard from "@/components/pages/dashboard";
import Users from "@/components/pages/users";
import Connectors from "@/components/pages/connectors";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: "admin" | "manager" | "user" | null;
  createdAt: string;
}

export interface Connector {
  id?: number;                      // backend id (PUT/DELETE)
  yazakiPN: string;                 // y_pn
  customerPN: string;               // c_pn
  supplierPN: string;               // s_pn
  supplierName: string;             // supplier_name
  connectorName?: string | null;    // connector_name
  price: number | null;             // can be null
  drawing_2d_path: string | null;
  model_3d_path: string | null;
  image_path: string | null;        // e.g. "/images/xyz.jpg"
  createdAt?: string;               // created_at
}

export interface AppData {
  users: User[];
  connectors: Connector[];
}

/** Safer JSON fetch that surfaces HTML/404 issues clearly */
async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} ${res.statusText} at ${url}\n` +
      `Content-Type: ${contentType}\n` +
      `Body snippet: ${text.slice(0, 300)}`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Invalid JSON at ${url}\n` +
      `Content-Type: ${contentType}\n` +
      `Body starts with: ${text.slice(0, 300)}`
    );
  }
}

/** Build headers, adding ngrok bypass when needed */
function apiHeaders(url: string, extra?: HeadersInit): HeadersInit {
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (url.includes("ngrok")) {
    base["ngrok-skip-browser-warning"] = "true";
  }
  return { ...base, ...(extra || {}) };
}

/** Guard to avoid accidental calls to Next.js origin (which returns HTML) */
function assertBackendUrl(url: string) {
  if (!url) throw new Error("NEXT_PUBLIC_BACKEND_URL is empty/undefined.");
  if (/^https?:\/\/.+/.test(url) === false) {
    throw new Error(
      `NEXT_PUBLIC_BACKEND_URL must be an absolute URL (e.g., http://localhost:5000). Got: "${url}"`
    );
  }
}

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState<"dashboard" | "users" | "connectors">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appData, setAppData] = useState<AppData>({ users: [], connectors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Public backend origin (no trailing slash). Example: http://localhost:5000
  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleLogin = () => setIsLoggedIn(true);

  const handleLogout = () => {
    removeAuthToken();
    setIsLoggedIn(false);
    setCurrentPage("dashboard");
  };

  const fromBackendConnector = (c: any): Connector => ({
    id: c.id,
    yazakiPN: c.y_pn,
    customerPN: c.c_pn,
    supplierPN: c.s_pn,
    supplierName: c.supplier_name,
    connectorName: c.connector_name ?? null,
    price: c.price !== null && c.price !== undefined ? Number(c.price) : null,
    drawing_2d_path: c.drawing_2d_path ?? null,
    model_3d_path: c.model_3d_path ?? null,
    image_path: c.image_path
      ? (String(c.image_path).startsWith("/") ? c.image_path : `/${c.image_path}`)
      : null,
    createdAt: c.created_at,
  });

  const toBackendConnector = (conn: Connector) => ({
    y_pn: conn.yazakiPN,
    c_pn: conn.customerPN,
    s_pn: conn.supplierPN,
    supplier_name: conn.supplierName,
    connector_name: conn.connectorName ?? null,
    price: conn.price, // number or null
    drawing_2d_path: conn.drawing_2d_path,
    model_3d_path: conn.model_3d_path,
    image_path: conn.image_path ? conn.image_path.replace(/^\//, "") : null,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      assertBackendUrl(backendUrl);
      console.log("[AdminDashboard] BACKEND_URL =", backendUrl);

      // USERS
      const usersUrl = `${backendUrl}/users`;
      const usersData = await fetchJSON(usersUrl, {
        method: "GET",
        mode: "cors",
        headers: apiHeaders(usersUrl),
      });

      const users: User[] = usersData.map((user: any) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role ? (String(user.role).toLowerCase() as User["role"]) : "user",
        createdAt: user.created_at,
      }));

      // CONNECTORS
      const connectorsUrl = `${backendUrl}/connectors`;
      const connectorsData = await fetchJSON(connectorsUrl, {
        method: "GET",
        mode: "cors",
        headers: apiHeaders(connectorsUrl),
      });

      const connectors: Connector[] = connectorsData.map(fromBackendConnector);

      setAppData({ users, connectors });
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
      setAppData({ users: [], connectors: [] });
    } finally {
      setLoading(false);
    }
  };

  // USERS CRUD
  const addUser = async (userData: Omit<User, "id">) => {
    const url = `${backendUrl}/users`;
    const backendData = {
      full_name: userData.full_name,
      email: userData.email,
      role: userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : "User",
    };
    const res = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: apiHeaders(url),
      body: JSON.stringify(backendData),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Failed to add user: ${res.status} ${res.statusText} - ${text}`);
    const backendUser = JSON.parse(text);
    const newUser: User = {
      id: backendUser.id,
      full_name: backendUser.full_name,
      email: backendUser.email,
      role: backendUser.role ? (String(backendUser.role).toLowerCase() as User["role"]) : "user",
      createdAt: backendUser.created_at,
    };
    setAppData((prev) => ({ ...prev, users: [...prev.users, newUser] }));
    return newUser;
  };

  const updateUser = async (updatedUser: User) => {
    const url = `${backendUrl}/users/${updatedUser.id}`;
    const backendData = {
      full_name: updatedUser.full_name,
      email: updatedUser.email,
      role: updatedUser.role ? updatedUser.role.charAt(0).toUpperCase() + updatedUser.role.slice(1) : "User",
    };
    const res = await fetch(url, {
      method: "PUT",
      mode: "cors",
      headers: apiHeaders(url),
      body: JSON.stringify(backendData),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Failed to update user: ${res.status} ${res.statusText} - ${text}`);
    const backendUser = JSON.parse(text);
    const user: User = {
      id: backendUser.id,
      full_name: backendUser.full_name,
      email: backendUser.email,
      role: backendUser.role ? (String(backendUser.role).toLowerCase() as User["role"]) : "user",
      createdAt: backendUser.created_at,
    };
    setAppData((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === user.id ? user : u)),
    }));
    return user;
  };

  const deleteUser = async (userId: number) => {
    const url = `${backendUrl}/users/${userId}`;
    const res = await fetch(url, { method: "DELETE", mode: "cors", headers: apiHeaders(url) });
    const text = await res.text();
    if (!res.ok) throw new Error(`Failed to delete user: ${res.status} ${res.statusText} - ${text}`);
    setAppData((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
    }));
  };

  // CONNECTORS CRUD (ID-based)
  const addConnector = async (connectorData: Connector) => {
    const url = `${backendUrl}/connectors`;
    const res = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: apiHeaders(url),
      body: JSON.stringify(toBackendConnector(connectorData)),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Failed to add connector: ${res.status} ${res.statusText} - ${text}`);
    const created = fromBackendConnector(JSON.parse(text));
    setAppData((prev) => ({ ...prev, connectors: [...prev.connectors, created] }));
    return created;
  };

  const updateConnector = async (updatedConnector: Connector) => {
    if (!updatedConnector.id) throw new Error("Missing connector.id for update");
    const url = `${backendUrl}/connectors/${updatedConnector.id}`;
    const res = await fetch(url, {
      method: "PUT",
      mode: "cors",
      headers: apiHeaders(url),
      body: JSON.stringify(toBackendConnector(updatedConnector)),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Failed to update connector: ${res.status} ${res.statusText} - ${text}`);
    const saved = fromBackendConnector(JSON.parse(text));
    setAppData((prev) => ({
      ...prev,
      connectors: prev.connectors.map((c) => (c.id === saved.id ? saved : c)),
    }));
    return saved;
  };

  const deleteConnector = async (yazakiPN: string) => {
    const target = appData.connectors.find((c) => c.yazakiPN === yazakiPN);
    if (!target?.id) throw new Error(`Could not resolve connector id for y_pn=${yazakiPN}`);
    const url = `${backendUrl}/connectors/${target.id}`;
    const res = await fetch(url, { method: "DELETE", mode: "cors", headers: apiHeaders(url) });
    const text = await res.text();
    if (!res.ok) throw new Error(`Failed to delete connector: ${res.status} ${res.statusText} - ${text}`);
    setAppData((prev) => ({
      ...prev,
      connectors: prev.connectors.filter((c) => c.id !== target.id),
    }));
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case "dashboard":
        return "Dashboard";
      case "users":
        return "Users Management";
      case "connectors":
        return "Connectors Management";
      default:
        return "Dashboard";
    }
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading data from backend...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
          <pre className="text-red-600 mb-4 whitespace-pre-wrap text-sm">{error}</pre>
          <p className="text-sm text-gray-600 mb-4">
            Ensure your Flask backend is reachable at:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">{backendUrl}</code>
          </p>
          <button onClick={loadData} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Try Again
          </button>
        </div>
      </div>
    );
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
  );
}
