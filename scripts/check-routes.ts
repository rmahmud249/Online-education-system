// Detects route files that resolve to the same full URL path (e.g. two claimants of "/").
// Mirrors TanStack Router's file conventions: dots/folders = segments, `_x` = pathless,
// `index`/`route` = the parent path, trailing `_` un-nests, `[.]` escapes a dot.
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export type RouteEntry = { file: string; fullPath: string; pathlessLayout: boolean; id: string };

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

export function toEntry(relFile: string): RouteEntry | null {
  const noExt = relFile.replace(/\.(tsx|ts|jsx|js)$/, "");
  if (noExt === relFile) return null;
  const base = noExt.split("/").pop()!;
  if (base === "__root" || base.startsWith("-") || /\.(test|spec)$/.test(noExt)) return null;
  const segs = noExt
    .split("/")
    .flatMap((part) =>
      part
        .replace(/\[\.\]/g, "\uE000")
        .split(".")
        .map((s) => s.replace(/\uE000/g, ".")),
    )
    .filter((s) => !/^\(.*\)$/.test(s));
  const last = segs[segs.length - 1];
  const isLayoutFile = last === "route";
  const idSegs = last === "index" || last === "route" ? segs.slice(0, -1) : segs;
  const urlSegs = idSegs.filter((s) => !s.startsWith("_")).map((s) => s.replace(/_$/, ""));
  const lastId = idSegs[idSegs.length - 1];
  const pathlessLayout = !!lastId && lastId.startsWith("_") && (isLayoutFile || last === lastId);
  return { file: relFile, fullPath: "/" + urlSegs.join("/"), pathlessLayout, id: idSegs.join("/") };
}

export function findDuplicateRoutes(files: string[]): { fullPath: string; files: string[] }[] {
  const entries = files.map(toEntry).filter((e): e is RouteEntry => !!e);
  // A pathless layout only owns a URL when nothing is nested under it.
  const claimants = entries.filter((e) => {
    if (!e.pathlessLayout) return true;
    return !entries.some((o) => o !== e && o.id.startsWith(e.id + "/"));
  });
  const byPath = new Map<string, string[]>();
  for (const e of claimants) byPath.set(e.fullPath, [...(byPath.get(e.fullPath) ?? []), e.file]);
  return [...byPath.entries()]
    .filter(([, f]) => f.length > 1)
    .map(([fullPath, files]) => ({ fullPath, files }));
}

export function listRouteFiles(routesDir: string): string[] {
  return walk(routesDir).map((f) => relative(routesDir, f).split(sep).join("/"));
}

if ((import.meta as unknown as { main?: boolean }).main) {
  const dir = join(process.cwd(), "src", "routes");
  const dups = findDuplicateRoutes(listRouteFiles(dir));
  if (dups.length) {
    for (const d of dups)
      console.error(`Duplicate route path "${d.fullPath}":\n  ${d.files.join("\n  ")}`);
    process.exit(1);
  }
  console.log("Route paths OK");
}
