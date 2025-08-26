import { type NextRequest, NextResponse } from "next/server"
import { addUser } from "@/lib/data-service"

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    const newUser = await addUser(userData)
    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
