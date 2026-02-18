import { Snapshot } from "./types";

const STORAGE_KEY = "ig_snapshots";

function readAll(): Snapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Snapshot[];
  } catch {
    return [];
  }
}

function writeAll(snapshots: Snapshot[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
}

export function saveSnapshot(snapshot: Snapshot) {
  const all = readAll();
  all.push(snapshot);
  writeAll(all);
}

export function getSnapshots(): Snapshot[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getSnapshot(id: string): Snapshot | null {
  return readAll().find((s) => s.id === id) ?? null;
}

export function getLatestSnapshot(): Snapshot | null {
  const all = getSnapshots();
  return all.length > 0 ? all[0] : null;
}

export function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
}
