import { NextResponse } from "next/server";
import { getSnapshots } from "@/lib/storage";

export async function GET() {
  try {
    const allSnapshots = await getSnapshots();

    const snapshots = allSnapshots.map((snapshot) => ({
      id: snapshot.id,
      createdAt: snapshot.createdAt,
      followerCount: snapshot.followers.length,
      followingCount: snapshot.following.length,
    }));

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("Snapshots fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch snapshots" },
      { status: 500 }
    );
  }
}
