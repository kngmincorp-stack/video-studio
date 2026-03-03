import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompts";
import { parseAIResponse } from "@/lib/ai/scene-parser";
import { AIResponseSchema } from "@/lib/ai/response-schema";
import type { VideoBlueprint } from "@/types/schema";

export async function POST(request: NextRequest) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const body = await request.json();
    const {
      message,
      blueprint,
      history,
    }: {
      message: string;
      blueprint: VideoBlueprint | null;
      history: Array<{ role: "user" | "assistant"; content: string }>;
    } = body;

    // Build conversation in Gemini format
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    // Add recent history for context
    if (history?.length) {
      for (const msg of history.slice(-6)) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current user message with blueprint context
    contents.push({
      role: "user",
      parts: [{ text: buildUserPrompt(message, blueprint) }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(AIResponseSchema),
      },
    });

    // Parse structured JSON response
    const raw = JSON.parse(response.text ?? "{}");
    const { blueprint: newBlueprint, message: responseMessage } =
      parseAIResponse(raw);

    return NextResponse.json({
      blueprint: newBlueprint,
      message: responseMessage,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        blueprint: null,
        message: "APIエラーが発生しました。GEMINI_API_KEYが設定されているか確認してください。",
      },
      { status: 500 }
    );
  }
}
