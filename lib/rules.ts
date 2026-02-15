import type { Bracket } from "./types";

export function bracketFromQualPos(qualPos: number): Bracket {
  if (qualPos <= 8) return 1;
  if (qualPos <= 16) return 2;
  if (qualPos <= 24) return 3;
  return 4;
}

export function canPickDriverForPlayer(args: {
  currentPicks: { driver_name: string; bracket: Bracket | null }[];
  bracket: Bracket | null;
}): { ok: boolean; reason?: string } {
  const { currentPicks, bracket } = args;
  if (currentPicks.length >= 5) return { ok: false, reason: "Max 5 picks." };
  if (bracket == null) return { ok: false, reason: "Driver bracket unknown (qualifying not loaded yet)." };
  const bracketCount = currentPicks.filter(p => p.bracket === bracket).length;
  if (bracketCount >= 2) return { ok: false, reason: "Max 2 picks in the same bracket." };
  return { ok: true };
}
