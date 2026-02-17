import { NextResponse } from "next/server";
import { getSnapshot, getSnapshots } from "@/lib/storage";
import { computeDiff, computeHistory } from "@/lib/diff";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const snapshotId = searchParams.get("snapshotId");

    if (!snapshotId) {
      return NextResponse.json(
        { error: "Missing snapshotId query parameter" },
        { status: 400 }
      );
    }

    const snapshot = await getSnapshot(snapshotId);

    if (!snapshot) {
      return NextResponse.json(
        { error: "Snapshot not found" },
        { status: 404 }
      );
    }

    const diff = computeDiff(snapshot);

    // Find the previous snapshot to compute history
    const allSnapshots = await getSnapshots();
    const sorted = allSnapshots
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const currentIndex = sorted.findIndex((s) => s.id === snapshotId);
    let history = undefined;

    if (currentIndex > 0) {
      const previousSnapshot = sorted[currentIndex - 1];
      history = computeHistory(previousSnapshot, snapshot);
    }

    return NextResponse.json({ diff, history });
  } catch (error) {
    console.error("Diff computation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to compute diff" },
      { status: 500 }
    );
  }
}
