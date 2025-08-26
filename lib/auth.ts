export interface AdminCredentials {
  username: string
  email: string
  password: string
}

export const defaultAdmin: AdminCredentials = {
  username: "admin",
  email: "admin@yazaki.com",
  password: "admin123",
}

export function validateCredentials(usernameOrEmail: string, password: string): boolean {
  return (
    (usernameOrEmail === defaultAdmin.username || usernameOrEmail === defaultAdmin.email) &&
    password === defaultAdmin.password
  )
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("yazaki_auth_token", token)
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("yazaki_auth_token")
  }
  return null
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("yazaki_auth_token")
  }
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null
}
