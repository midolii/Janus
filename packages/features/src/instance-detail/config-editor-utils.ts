import type { ConfigPatchRequest } from "@janus/api-client/contracts"

export function buildConfigPatchRequest(
  expectedRevision: string,
  changes: Record<string, unknown>,
): ConfigPatchRequest {
  return {
    expectedRevision,
    changes: Object.entries(changes).map(([path, value]) => ({ path, value })),
  }
}

export function getEffectiveConfigValue(
  changes: Record<string, unknown>,
  path: string,
  originalValue: unknown,
): unknown {
  return Object.hasOwn(changes, path) ? changes[path] : originalValue
}

export function updateConfigChanges(
  changes: Record<string, unknown>,
  path: string,
  value: unknown,
  originalValue: unknown,
): Record<string, unknown> {
  const next = { ...changes }
  if (isSameConfigValue(value, originalValue)) {
    delete next[path]
  } else {
    next[path] = value
  }
  return next
}

export function isSameConfigOptionValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true
  }
  const primitiveTypes = new Set(["string", "number"])
  return (
    primitiveTypes.has(typeof left) &&
    primitiveTypes.has(typeof right) &&
    String(left) === String(right)
  )
}

export function formatConfigDateTimeInput(value: unknown): string {
  if (value === undefined || value === null) {
    return ""
  }
  return String(value).replace(/^(\d{4}-\d{2}-\d{2})T/, "$1 ")
}

export function normalizeConfigDateTimeInput(value: string): string {
  return value.trim().replace(/^(\d{4}-\d{2}-\d{2})\s+/, "$1T")
}

function isSameConfigValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true
  }
  if (typeof left !== "object" || left === null || typeof right !== "object" || right === null) {
    return false
  }
  return JSON.stringify(left) === JSON.stringify(right)
}
