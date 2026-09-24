import { getStore } from "@netlify/blobs";

export function store() {
  return getStore("azzy-outlast-tracker");
}

export async function readState() {
  const s = await store().get("state", { type: "json" });
  return s && typeof s === "object" ? s : { count: 183, mode: "MANUAL" };
}

export async function writeState(state) {
  await store().setJSON("state", state);
}
