import fs from "fs/promises";
import path from "path";
import { Snapshot } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Ensure the data directory exists, creating it if necessary.
 */
export async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/**
 * Save a snapshot as a JSON file in the data directory.
 * The file is named `snapshot-{id}.json`.
 */
export async function saveSnapshot(snapshot: Snapshot): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `snapshot-${snapshot.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf-8");
}

/**
 * List all saved snapshots, sorted by creation date descending (newest first).
 */
export async function getSnapshots(): Promise<Snapshot[]> {
  await ensureDataDir();

  const files = await fs.readdir(DATA_DIR);
  const snapshotFiles = files.filter(
    (f) => f.startsWith("snapshot-") && f.endsWith(".json")
  );

  const snapshots: Snapshot[] = [];

  for (const file of snapshotFiles) {
    const filePath = path.join(DATA_DIR, file);
    const content = await fs.readFile(filePath, "utf-8");
    try {
      const snapshot: Snapshot = JSON.parse(content);
      snapshots.push(snapshot);
    } catch {
      // Skip files that fail to parse
      continue;
    }
  }

  // Sort by createdAt descending (newest first)
  snapshots.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return snapshots;
}

/**
 * Retrieve a single snapshot by its ID.
 * Returns null if the snapshot does not exist.
 */
export async function getSnapshot(id: string): Promise<Snapshot | null> {
  await ensureDataDir();

  const filePath = path.join(DATA_DIR, `snapshot-${id}.json`);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as Snapshot;
  } catch {
    return null;
  }
}

/**
 * Retrieve the most recent snapshot based on creation date.
 * Returns null if no snapshots exist.
 */
export async function getLatestSnapshot(): Promise<Snapshot | null> {
  const snapshots = await getSnapshots();
  return snapshots.length > 0 ? snapshots[0] : null;
}
