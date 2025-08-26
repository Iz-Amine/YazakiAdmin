import { type NextRequest, NextResponse } from "next/server"
import { updateConnector, deleteConnector } from "@/lib/data-service"

export async function PUT(request: NextRequest, { params }: { params: { yazakiPN: string } }) {
  try {
    const connectorData = await request.json()
    const updatedConnector = await updateConnector({ ...connectorData, yazakiPN: params.yazakiPN })
    return NextResponse.json(updatedConnector)
  } catch (error) {
    console.error("Error updating connector:", error)
    return NextResponse.json({ error: "Failed to update connector" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { yazakiPN: string } }) {
  try {
    await deleteConnector(params.yazakiPN)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting connector:", error)
    return NextResponse.json({ error: "Failed to delete connector" }, { status: 500 })
  }
}
