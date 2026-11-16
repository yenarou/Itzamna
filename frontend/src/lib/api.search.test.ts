import { describe, expect, it } from "vitest";
import { resolveCandidateMetadata } from "./api";

describe("resolveCandidateMetadata", () => {
    it("falls back quickly when external sources fail or are blocked by CORS", async () => {
        const result = await resolveCandidateMetadata({
            lat: 48.0179,
            lon: -34.1598,
            earth: { climate: "arid" },
            fetchers: {
                reverseGeocode: async () => [null, false],
                overpassInterference: async () => ["low", true, 0, false],
                nasaPower: async () => [null, false],
                openTopo: async () => [null, false],
                soilGrids: async () => [null, false],
            },
        });

        expect(result.place).toBeNull();
        expect(result.placeOk).toBe(false);
        expect(result.powerOk).toBe(false);
        expect(result.elevOk).toBe(false);
        expect(result.soilOk).toBe(false);
        expect(result.power).toBeTruthy();
        expect(result.elev).toBeGreaterThanOrEqual(0);
    });
});
