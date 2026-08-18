export function getConfigValue(values: Record<string, unknown>, path: string): unknown {
  // Schema keys use dotted paths while the config endpoint returns nested objects.
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined
    }

    return (current as Record<string, unknown>)[segment]
  }, values)
}

export function formatConfigValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "—"
  }

  if (typeof value === "boolean") {
    return value ? "已启用" : "已关闭"
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(formatConfigValue).join("、") : "—"
  }

  if (typeof value === "object") {
    return JSON.stringify(value)
  }

  return String(value)
}

export function filterLogLines(lines: string[], filter: string): string[] {
  const keyword = filter.trim().toLocaleLowerCase("zh-CN")
  if (!keyword) {
    return lines
  }

  return lines.filter((line) => line.toLocaleLowerCase("zh-CN").includes(keyword))
}
