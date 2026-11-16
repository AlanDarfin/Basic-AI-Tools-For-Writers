import { defaults, Settings } from "./settings";
import type { HashEntry } from "./duplicates/DuplicateIndex";
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function readStoredData(value: unknown): {
  settings: Settings;
  index: HashEntry[];
} {
  const settings = { ...defaults };
  const index: HashEntry[] = [];
  if (!record(value)) return { settings, index };
  if (record(value.settings)) {
    for (const key of Object.keys(defaults) as (keyof Settings)[]) {
      const candidate = value.settings[key];
      if (
        key === "htmlDefaultMode" &&
        !["visual", "source", "preview"].includes(String(candidate))
      )
        continue;
      if (
        key === "htmlExternalImages" &&
        !["download", "block"].includes(String(candidate))
      )
        continue;
      if (
        key === "copyFontSize" &&
        candidate !== "" &&
        (typeof candidate !== "string" ||
          !/^\d+$/.test(candidate) ||
          Number(candidate) < 8 ||
          Number(candidate) > 72)
      )
        continue;
      if (
        key === "copyTextColor" &&
        candidate !== "" &&
        (typeof candidate !== "string" || !/^#[0-9a-f]{6}$/i.test(candidate))
      )
        continue;
      if (typeof candidate !== typeof defaults[key]) continue;
      if (typeof candidate === "number") {
        const limits =
          key === "width"
            ? [1, 16384]
            : key === "fontSize"
              ? [8, 300]
              : [1, 100];
        if (
          !Number.isInteger(candidate) ||
          candidate < limits[0] ||
          candidate > limits[1]
        )
          continue;
      }
      if (
        typeof candidate === "number" &&
        (!Number.isFinite(candidate) || candidate < 1)
      )
        continue;
      if (
        key === "copyMode" &&
        !["smart", "dedicated", "always"].includes(String(candidate))
      )
        continue;
      if (
        key === "saveMode" &&
        !["new", "replace", "copy"].includes(String(candidate))
      )
        continue;
      if (
        key === "duplicateAction" &&
        !["reuse", "ask", "save"].includes(String(candidate))
      )
        continue;
      Object.assign(settings, { [key]: candidate });
    }
  }
  if (Array.isArray(value.index))
    for (const entry of value.index as unknown[]) {
      if (
        record(entry) &&
        typeof entry.path === "string" &&
        typeof entry.hash === "string" &&
        typeof entry.size === "number" &&
        typeof entry.modifiedAt === "number"
      ) {
        index.push({
          path: entry.path,
          hash: entry.hash,
          size: entry.size,
          modifiedAt: entry.modifiedAt,
        });
      }
    }
  return { settings, index };
}
