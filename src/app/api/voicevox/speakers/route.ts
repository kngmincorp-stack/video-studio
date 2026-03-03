import { NextResponse } from "next/server";
import { getSpeakers } from "@/lib/voicevox/client";

export async function GET() {
  try {
    const speakers = await getSpeakers();
    return NextResponse.json(speakers);
  } catch (error) {
    console.error("Voicevox speakers error:", error);
    return NextResponse.json(
      { error: "Voicevox Engineに接続できません。起動しているか確認してください。" },
      { status: 503 }
    );
  }
}
