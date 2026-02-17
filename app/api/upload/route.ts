import { NextResponse } from "next/server";
import { parseDataExport } from "@/lib/instagram-parser";
import { saveSnapshot } from "@/lib/storage";
import { Snapshot } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const fileContents: { name: string; content: string }[] = [];

    for (const file of files) {
      const text = await file.text();
      fileContents.push({ name: file.name, content: text });
    }

    const { followers, following } = parseDataExport(fileContents);

    const snapshot: Snapshot = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      followers,
      following,
    };

    await saveSnapshot(snapshot);

    return NextResponse.json({
      id: snapshot.id,
      createdAt: snapshot.createdAt,
      followerCount: snapshot.followers.length,
      followingCount: snapshot.following.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process upload" },
      { status: 500 }
    );
  }
}
