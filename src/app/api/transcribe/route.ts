import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  TRANSCRIPTION_SYSTEM_PROMPT,
  TranscriptionResponseSchema,
} from "@/lib/ai/transcribe-prompt";

const INLINE_SIZE_LIMIT = 15 * 1024 * 1024; // 15MB

export async function POST(request: NextRequest) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const body = await request.json();
    const { base64Data, mimeType, fileName } = body as {
      base64Data: string;
      mimeType: string;
      fileName: string;
    };

    if (!base64Data || !mimeType) {
      return NextResponse.json(
        { error: "base64Data and mimeType are required" },
        { status: 400 }
      );
    }

    // Calculate raw size from base64
    const rawSize = Math.ceil((base64Data.length * 3) / 4);

    let mediaPart: { inlineData: { data: string; mimeType: string } } | { fileData: { fileUri: string; mimeType: string } };

    if (rawSize <= INLINE_SIZE_LIMIT) {
      // Small file: inline data
      mediaPart = {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      };
    } else {
      // Large file: use File API
      const buffer = Buffer.from(base64Data, "base64");
      const blob = new Blob([buffer], { type: mimeType });
      const file = await ai.files.upload({
        file: blob,
        config: { mimeType },
      });

      // Wait for file to be processed
      let uploadedFile = file;
      while (uploadedFile.state === "PROCESSING") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        uploadedFile = await ai.files.get({ name: uploadedFile.name! });
      }

      if (uploadedFile.state === "FAILED") {
        return NextResponse.json(
          { error: "ファイルの処理に失敗しました" },
          { status: 500 }
        );
      }

      mediaPart = {
        fileData: {
          fileUri: uploadedFile.uri!,
          mimeType,
        },
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            mediaPart,
            {
              text: `このメディアファイル「${fileName}」の音声を文字起こししてください。`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: TRANSCRIPTION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(TranscriptionResponseSchema),
      },
    });

    const raw = JSON.parse(response.text ?? "{}");

    return NextResponse.json(raw);
  } catch (error) {
    console.error("Transcribe API error:", error);
    return NextResponse.json(
      { error: "文字起こしに失敗しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
