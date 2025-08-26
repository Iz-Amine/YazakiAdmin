import type { User, Connector, AppData } from "@/app/page"
import fs from "fs/promises"
import path from "path"

const DATA_FILE_PATH = path.join(process.cwd(), "data", "app-data.json")

export async function readDataFromFile(): Promise<AppData> {
  try {
    const fileContent = await fs.readFile(DATA_FILE_PATH, "utf-8")
    return JSON.parse(fileContent)
  } catch (error) {
    console.error("Error reading data file:", error)
    // Return empty data if file doesn't exist or can't be read
    return { users: [], connectors: [] }
  }
}

export async function writeDataToFile(data: AppData): Promise<void> {
  try {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8")
  } catch (error) {
    console.error("Error writing data file:", error)
    throw error
  }
}

export async function addUser(user: Omit<User, "id">): Promise<User> {
  const data = await readDataFromFile()
  const newId = Math.max(...data.users.map((u) => u.id), 0) + 1
  const newUser: User = { ...user, id: newId }
  data.users.push(newUser)
  await writeDataToFile(data)
  return newUser
}

export async function updateUser(updatedUser: User): Promise<User> {
  const data = await readDataFromFile()
  const index = data.users.findIndex((u) => u.id === updatedUser.id)
  if (index === -1) throw new Error("User not found")
  data.users[index] = updatedUser
  await writeDataToFile(data)
  return updatedUser
}

export async function deleteUser(userId: number): Promise<void> {
  const data = await readDataFromFile()
  data.users = data.users.filter((u) => u.id !== userId)
  await writeDataToFile(data)
}

export async function addConnector(connector: Connector): Promise<Connector> {
  const data = await readDataFromFile()
  // Check if Yazaki PN already exists
  if (data.connectors.some((c) => c.yazakiPN === connector.yazakiPN)) {
    throw new Error("Yazaki PN already exists")
  }
  data.connectors.push(connector)
  await writeDataToFile(data)
  return connector
}

export async function updateConnector(updatedConnector: Connector): Promise<Connector> {
  const data = await readDataFromFile()
  const index = data.connectors.findIndex((c) => c.yazakiPN === updatedConnector.yazakiPN)
  if (index === -1) throw new Error("Connector not found")
  data.connectors[index] = updatedConnector
  await writeDataToFile(data)
  return updatedConnector
}

export async function deleteConnector(yazakiPN: string): Promise<void> {
  const data = await readDataFromFile()
  data.connectors = data.connectors.filter((c) => c.yazakiPN !== yazakiPN)
  await writeDataToFile(data)
}
