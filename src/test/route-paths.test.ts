import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findDuplicateRoutes, listRouteFiles } from "../../scripts/check-routes";

describe("route full paths", () => {
  it("project routes have no duplicate full paths", () => {
    expect(findDuplicateRoutes(listRouteFiles(join(__dirname, "..", "routes")))).toEqual([]);
  });

  it("flags a childless pathless layout colliding with index", () => {
    expect(findDuplicateRoutes(["index.tsx", "_authenticated/route.tsx"])).toEqual([
      { fullPath: "/", files: ["index.tsx", "_authenticated/route.tsx"] },
    ]);
  });

  it("allows a pathless layout once it has children", () => {
    expect(findDuplicateRoutes(["index.tsx", "_authenticated/route.tsx", "_authenticated/dashboard.tsx"])).toEqual([]);
  });

  it("flags two files claiming the same page", () => {
    expect(findDuplicateRoutes(["about.tsx", "about/index.tsx"])).toHaveLength(1);
    expect(findDuplicateRoutes(["index.tsx", "_authenticated/index.tsx", "_authenticated/route.tsx"])).toHaveLength(1);
  });
});
