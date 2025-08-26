import { type NextRequest, NextResponse } from "next/server"
import { addConnector } from "@/lib/data-service"

export async function POST(request: NextRequest) {
  try {
    const connectorData = await request.json()
    const newConnector = await addConnector(connectorData)
    return NextResponse.json(newConnector, { status: 201 })
  } catch (error) {
    console.error("Error creating connector:", error)
    return NextResponse.json({ error: "Failed to create connector" }, { status: 500 })
  }
}
