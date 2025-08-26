import { NextResponse } from "next/server"
import { readDataFromFile } from "@/lib/data-service"

export async function GET() {
  try {
    const data = await readDataFromFile()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching data:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
