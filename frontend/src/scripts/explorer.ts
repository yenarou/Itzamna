import Globe from "globe.gl";
import { searchAnalogs } from "../lib/api";
import { NASA_EARTH_FALLBACK, NASA_MARS_FALLBACK, NASA_MOON_FALLBACK } from "../lib/data";
import type { BodyInfo, LocationQuery, Match, PlanetId, SearchQuery, UserLocation } from "../lib/types";

type State = "idle" | "selected" | "searching" | "results";

declare const L: any;

function el<T extends Element>(selector: string): T {
    const found = document.querySelector<T>(selector);
    if (!found) throw new Error(`Missing element ${selector}`);
    return found;
}

const root = el<HTMLElement>("#explorer");
const planetSelect = el<HTMLSelectElement>("#planet-select");
const planetPicker = el<HTMLElement>("#planet-picker");
const emptyPrompt = el<HTMLElement>("#empty-prompt");
const control = el<HTMLElement>("#control");
const toggleSearch = el<HTMLButtonElement>("#toggle-search");
const chevron = el<SVGSVGElement>("#chevron");
const percentValue = el<HTMLElement>("#percent-value");
const searchPanel = el<HTMLFormElement>("#search-panel");
const confirmBtn = el<HTMLButtonElement>("#confirm");
const searchStatus = el<HTMLElement>("#search-status");
const searchLoading = el<HTMLElement>("#search-loading");
const searchLoadingMsg = document.getElementById("search-loading-msg");
const searchLoadingBar = document.getElementById("search-loading-bar");
const searchLoadingPct = document.getElementById("search-loading-pct");
const results = el<HTMLElement>("#results");
const resultsSkeleton = document.querySelector<HTMLElement>("#results-skeleton");
const resultsClose = el<HTMLButtonElement>("#results-close");
const matchTabs = el<HTMLElement>("#match-tabs");
const matchPrev = el<HTMLButtonElement>("#match-prev");
const matchNext = el<HTMLButtonElement>("#match-next");
const resultPercent = el<HTMLElement>("#result-percent");
const general = el<HTMLElement>("#general");
const advancedToggle = el<HTMLButtonElement>("#advanced-toggle");
const advanced = el<HTMLElement>("#advanced");
const locLat = el<HTMLInputElement>("#loc-lat");
const locLng = el<HTMLInputElement>("#loc-lng");
const locRadius = el<HTMLSelectElement>("#loc-radius");
const useMyLocationBtn = el<HTMLButtonElement>("#use-my-location");
const userLocStatus = el<HTMLElement>("#user-loc-status");
const accessFilter = el<HTMLSelectElement>("#access-filter");
const earthCompare = el<HTMLImageElement>("#earth-compare");
const earthCompareWrap = el<HTMLElement>("#earth-compare-wrap");
const earthCompareCaption = el<HTMLElement>("#earth-compare-caption");
const earthGlobe = document.getElementById("earth-globe") as HTMLElement | null;
const reopenResults = document.querySelector<HTMLButtonElement>("#reopen-results");
const exportCsvBtn = document.querySelector<HTMLButtonElement>("#export-csv");
const exportPdfBtn = document.querySelector<HTMLButtonElement>("#export-pdf");
const dataViewToggle = document.querySelector<HTMLElement>("#data-view");

let planet: PlanetId | "" = "";
let matches: Match[] = [];
let active = 0;
let dataView: "earth" | "zone" = "zone";
let globeEarth: any = null;

function resizeEarthGlobe(): void {
    if (!globeEarth || !earthGlobe) return;
    const w = earthGlobe.clientWidth || 300;
    const h = earthGlobe.clientHeight || w;
    try { globeEarth.width(w); globeEarth.height(h); } catch {}
}


const planetGlobes: Record<string, any> = {};

function planetTexture(id: string): string {
    try {
        const c = document.createElement("canvas");
        c.width = 2048;
        c.height = 1024;
        const ctx = c.getContext("2d");
        if (!ctx) return "";
        // Seeded PRNG for stable, complete coverage (no black gaps)
        let s = id === "moon" ? 424242 : 13371337;
        const rnd = () => {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        };
        const rand = (a: number, b: number) => a + rnd() * (b - a);
        const drawWrappedEllipse = (x: number, y: number, rx: number, ry: number, rot: number, fill: string) => {
            for (const ox of [-c.width, 0, c.width]) {
                ctx.save();
                ctx.translate(ox, 0);
                ctx.fillStyle = fill;
                ctx.beginPath();
                ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };
        if (id === "moon") {
            const g = ctx.createLinearGradient(0, 0, 0, c.height);
            g.addColorStop(0, "#d9d9d9");
            g.addColorStop(0.5, "#a7a7a7");
            g.addColorStop(1, "#8c8c8c");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, c.width, c.height);
            for (let i = 0; i < 120; i++) {
                drawWrappedEllipse(rand(0, c.width), rand(60, c.height - 60), rand(30, 180), rand(18, 100), rand(0, Math.PI), `rgba(75,75,75,${rand(0.08, 0.22)})`);
            }
            for (let i = 0; i < 120; i++) {
                drawWrappedEllipse(rand(0, c.width), rand(40, c.height - 40), rand(20, 120), rand(12, 70), rand(0, Math.PI), `rgba(230,230,230,${rand(0.04, 0.12)})`);
            }
            for (let i = 0; i < 900; i++) {
                const x = rand(0, c.width), y = rand(8, c.height - 8), r = rand(1, 14);
                ctx.strokeStyle = `rgba(55,55,55,${rand(0.08, 0.28)})`;
                ctx.lineWidth = rand(0.5, 2);
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
                if (r > 5) {
                    ctx.fillStyle = `rgba(245,245,245,${rand(0.02, 0.08)})`;
                    ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.45, 0, Math.PI * 2); ctx.fill();
                }
            }
        } else {
            // Full-coverage Mars equirectangular base (no black regions)
            const g = ctx.createLinearGradient(0, 0, 0, c.height);
            g.addColorStop(0, "#e6b77a");
            g.addColorStop(0.12, "#d57a3f");
            g.addColorStop(0.35, "#b55327");
            g.addColorStop(0.55, "#8f3416");
            g.addColorStop(0.78, "#a84321");
            g.addColorStop(1, "#dca46a");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, c.width, c.height);

            for (let i = 0; i < 420; i++) {
                drawWrappedEllipse(rand(0, c.width), rand(40, c.height - 40), rand(40, 220), rand(18, 110), rand(-0.6, 0.6), `rgba(70,24,10,${rand(0.05, 0.18)})`);
            }
            for (let i = 0; i < 360; i++) {
                drawWrappedEllipse(rand(0, c.width), rand(30, c.height - 30), rand(30, 180), rand(14, 90), rand(-0.7, 0.7), `rgba(236,176,120,${rand(0.04, 0.14)})`);
            }
            drawWrappedEllipse(c.width * 0.22, c.height * 0.48, 220, 120, -0.2, "rgba(242,188,132,0.16)");
            drawWrappedEllipse(c.width * 0.62, c.height * 0.42, 260, 130, 0.15, "rgba(60,20,10,0.14)");
            drawWrappedEllipse(c.width * 0.82, c.height * 0.58, 210, 110, -0.1, "rgba(85,28,12,0.12)");

            ctx.lineCap = "round";
            for (let j = 0; j < 3; j++) {
                ctx.strokeStyle = `rgba(40,12,6,${0.14 + j * 0.04})`;
                ctx.lineWidth = 7 - j * 1.5;
                ctx.beginPath();
                const y0 = c.height * 0.52 + j * 3;
                for (let x = -50; x <= c.width + 50; x += 20) {
                    const nx = x / c.width;
                    const y = y0 + Math.sin(nx * Math.PI * 2.2) * 10 + Math.sin(nx * Math.PI * 5.1) * 4;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            for (let i = 0; i < 140; i++) {
                ctx.strokeStyle = `rgba(45,14,7,${rand(0.06, 0.16)})`;
                ctx.lineWidth = rand(0.8, 3.5);
                ctx.beginPath();
                let x = rand(0, c.width), y = rand(50, c.height - 50);
                ctx.moveTo(x, y);
                for (let k = 0; k < 4; k++) { x += rand(20, 80); y += rand(-18, 18); ctx.lineTo(x, y); }
                ctx.stroke();
            }
            for (let i = 0; i < 520; i++) {
                const x = rand(0, c.width), y = rand(14, c.height - 14), r = rand(1.5, 16);
                ctx.strokeStyle = `rgba(70,24,12,${rand(0.08, 0.22)})`;
                ctx.lineWidth = rand(0.5, 2.2);
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = `rgba(30,10,6,${rand(0.02, 0.08)})`;
                ctx.beginPath(); ctx.arc(x + r * 0.15, y + r * 0.15, r * 0.7, 0, Math.PI * 2); ctx.fill();
            }
            const north = ctx.createLinearGradient(0, 0, 0, c.height * 0.16);
            north.addColorStop(0, "rgba(248,240,232,0.98)");
            north.addColorStop(0.7, "rgba(244,232,220,0.55)");
            north.addColorStop(1, "rgba(244,232,220,0)");
            ctx.fillStyle = north; ctx.fillRect(0, 0, c.width, c.height * 0.18);
            const south = ctx.createLinearGradient(0, c.height, 0, c.height * 0.84);
            south.addColorStop(0, "rgba(245,236,226,0.96)");
            south.addColorStop(0.7, "rgba(240,228,216,0.5)");
            south.addColorStop(1, "rgba(240,228,216,0)");
            ctx.fillStyle = south; ctx.fillRect(0, c.height * 0.82, c.width, c.height * 0.18);
        }
        return c.toDataURL("image/jpeg", 0.94);
    } catch {
        return "";
    }
}

function initPlanetGlobe(id: string): void {
    if (planetGlobes[id] || typeof Globe === "undefined") return;
    const node = document.querySelector(`[data-planet-globe="${id}"]`) as HTMLElement | null;
    if (!node) return;
    if (node.clientWidth === 0) { requestAnimationFrame(() => initPlanetGlobe(id)); return; }
    try {
        const texFallback = planetTexture(id);
        // Equirectangular (2:1) Mars textures only — verified to load as direct images.
        const texUrls = id === "moon"
            ? ["https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg"]
            : [
                "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/marsmap1k.jpg"
              ];
        const g = new Globe(node)
            .backgroundColor("rgba(0,0,0,0)")
            .showAtmosphere(id === "mars")
            .atmosphereColor(id === "mars" ? "#ffb08a" : "#cfd8e3")
            .atmosphereAltitude(id === "mars" ? 0.14 : 0.02)
            .globeImageUrl(texFallback);
        if (id === "moon") {
            try { g.bumpImageUrl(texFallback); } catch {}
        }
        g.width(node.clientWidth || 300);
        g.height(node.clientHeight || node.clientWidth || 300);
        const controls = g.controls();
        controls.autoRotate = true;
        controls.autoRotateSpeed = id === "mars" ? 0.28 : 0.18;
        controls.enableRotate = true;
        controls.enablePan = false;
        controls.enableZoom = true;
        controls.minDistance = 120;
        controls.maxDistance = 450;
        g.pointOfView({ lat: id === "moon" ? 10 : 15, lng: id === "moon" ? 0 : -20, altitude: 1.8 }, 0);
        // Try remote textures; keep full procedural fallback (complete 360°) if none load or if they render badly.
        const tryTex = (i: number) => {
            if (i >= texUrls.length) return;
            const url = texUrls[i];
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => { try { g.globeImageUrl(url); } catch {} };
            img.onerror = () => tryTex(i + 1);
            img.src = url;
        };
        setTimeout(() => tryTex(0), 0);
        const stopAuto = () => { try { controls.autoRotate = false; } catch {} };
        node.addEventListener("pointerdown", stopAuto);
        node.addEventListener("wheel", stopAuto, { passive: true });
        window.addEventListener("resize", () => { try { g.width(node.clientWidth); g.height(node.clientHeight || node.clientWidth); } catch {} });
        if (typeof ResizeObserver !== "undefined") new ResizeObserver(() => { try { g.width(node.clientWidth); g.height(node.clientHeight || node.clientWidth); } catch {} }).observe(node);
        planetGlobes[id] = g;
    } catch (e) { console.error("Planet globe init failed", id, e); }
}

function initEarthGlobe(): void {
    if (!earthGlobe || globeEarth || typeof Globe === "undefined") return;
    if (earthGlobe.clientWidth === 0) { requestAnimationFrame(initEarthGlobe); return; }
    try {
        globeEarth = new Globe(earthGlobe)
            .backgroundColor("rgba(0,0,0,0)")
            .showAtmosphere(true)
            .atmosphereColor("#7fdcff")
            .atmosphereAltitude(0.18)
            .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
            .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png");
        resizeEarthGlobe();
        const controls = globeEarth.controls();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.35;
        controls.enableRotate = true;
        controls.enablePan = false;
        controls.enableZoom = true;
        controls.minDistance = 120;
        controls.maxDistance = 450;
        globeEarth.pointOfView({ lat: 20, lng: 0, altitude: 1.8 }, 0);
        const stopAuto = () => { try { controls.autoRotate = false; } catch {} };
        earthGlobe.addEventListener("pointerdown", stopAuto);
        earthGlobe.addEventListener("wheel", stopAuto, { passive: true });
        window.addEventListener("resize", resizeEarthGlobe);
        if (typeof ResizeObserver !== "undefined") new ResizeObserver(resizeEarthGlobe).observe(earthGlobe);
    } catch (e) { console.error("Globe init failed", e); }
}

let map: any;
let marker: any;
let circle: any;
let userMarker: any;
let userLocation: UserLocation | undefined;
let candidateMaps: { map: any; lat: number; lon: number }[] = [];

function zoneFallback(p: PlanetId | "" = planet): string {
    return p === "mars" ? NASA_MARS_FALLBACK : NASA_MOON_FALLBACK;
}

function esc(text: string): string {
    return text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

function ensureMap(): void {
    if (map || typeof L === "undefined") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map = L.map("loc-map", {
        preferCanvas: true,
        fadeAnimation: false,
        zoomAnimation: !reduceMotion,
        markerZoomAnimation: false,
    }).setView([20, 0], 2);
    // Satellite layer to visualize the selected location
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 18,
        updateWhenIdle: true,
        keepBuffer: 1,
        attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    }).addTo(map);
    L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
            maxZoom: 18,
            updateWhenIdle: true,
            keepBuffer: 1,
            attribution: "",
        },
    ).addTo(map);
    map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        locLat.value = lat.toFixed(5);
        locLng.value = lng.toFixed(5);
        updateMapMarker();
    });
    setTimeout(() => map.invalidateSize(), 0);
}

function updateMapMarker(): void {
    if (!map || typeof L === "undefined") return;
    const lat = Number(locLat.value);
    const lng = Number(locLng.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        if (marker) {
            map.removeLayer(marker);
            marker = null;
        }
        if (circle) {
            map.removeLayer(circle);
            circle = null;
        }
    } else {
        const ll: [number, number] = [lat, lng];
        if (!marker) marker = L.marker(ll).addTo(map);
        else marker.setLatLng(ll);

        const r = Number(locRadius.value || "100");
        if (Number.isFinite(r) && r > 0) {
            if (!circle)
                circle = L.circle(ll, {
                    radius: r * 1000,
                    color: "#e0a84a",
                    fillColor: "#e0a84a",
                    fillOpacity: 0.12,
                }).addTo(map);
            else {
                circle.setLatLng(ll);
                circle.setRadius(r * 1000);
            }
        } else if (circle) {
            map.removeLayer(circle);
            circle = null;
        }
    }
    updateUserMarker();
}

function updateUserMarker(): void {
    if (!map || typeof L === "undefined") return;
    if (!userLocation) {
        if (userMarker) {
            map.removeLayer(userMarker);
            userMarker = null;
        }
        return;
    }
    const ll: [number, number] = [userLocation.lat, userLocation.lng];
    if (!userMarker) {
        userMarker = L.circleMarker(ll, {
            radius: 7,
            color: "#2b7de9",
            fillColor: "#2b7de9",
            fillOpacity: 0.9,
            weight: 2,
        }).addTo(map);
        userMarker.bindTooltip("Your location");
    } else {
        userMarker.setLatLng(ll);
    }
}

function setUserLocation(lat: number, lng: number): void {
    userLocation = { lat, lng };
    userLocStatus.textContent = `Your location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    if (!locLat.value && !locLng.value) {
        locLat.value = lat.toFixed(5);
        locLng.value = lng.toFixed(5);
        if (!locRadius.value) locRadius.value = "50";
    }
    if (map) {
        updateMapMarker();
        map.setView([lat, lng], Math.max(map.getZoom(), 10));
    } else {
        syncMapToInputs();
    }
}

function readUserLocation(): UserLocation | undefined {
    return userLocation;
}

function syncMapToInputs(): void {
    updateMapMarker();
    const lat = Number(locLat.value);
    const lng = Number(locLng.value);
    if (map && Number.isFinite(lat) && Number.isFinite(lng)) {
        map.panTo([lat, lng]);
    }
}

function clearCompareImages(): void {
    earthCompare.hidden = true;
    earthCompareWrap.classList.add("hidden");
    earthCompare.removeAttribute("src");
    earthCompareCaption.hidden = true;
    earthCompareCaption.textContent = "";
    if (earthGlobe) earthGlobe.style.display = "";
    document.querySelectorAll<HTMLImageElement>("[data-zone-compare]").forEach(img => {
        img.hidden = true;
        img.removeAttribute("src");
    });
    document.querySelectorAll<HTMLElement>("[data-zone-caption]").forEach(c => {
        c.hidden = true;
        c.textContent = "";
    });
    document
        .querySelectorAll<HTMLElement>("[data-planet-view] .planet")
        .forEach(p => ((p as HTMLElement).style.display = ""));
    document.querySelectorAll<HTMLElement>(".planet-globe").forEach(g => (g.style.display = ""));
    (document.querySelector("#earth-visual .planet") as HTMLElement | null)?.style.removeProperty("display");
}

function setCompareImages(m: Match | undefined): void {
    clearCompareImages();
    if (!m) return;
    const earthPlanet = document.querySelector("#earth-visual .planet") as HTMLElement | null;
    if (m.earth.imageUrl) {
        earthCompare.referrerPolicy = "no-referrer";
        earthCompare.onerror = () => {
            earthCompare.onerror = null;
            earthCompare.hidden = true;
            earthCompare.removeAttribute("src");
            earthCompareWrap.classList.add("hidden");
            earthCompareCaption.hidden = true;
            if (earthPlanet) earthPlanet.style.display = "";
        };
        earthCompare.src = m.earth.imageUrl;
        earthCompare.alt = `Satellite image: ${m.earth.title}`;
        earthCompare.hidden = false;
        earthCompareWrap.classList.remove("hidden");
        earthCompareCaption.textContent = m.earth.title;
        earthCompareCaption.hidden = false;
        if (earthGlobe) earthGlobe.style.display = "none";
        if (earthPlanet) earthPlanet.style.display = "none";
    }
    if (planet) {
        const zImg = document.querySelector<HTMLImageElement>(`[data-zone-compare="${planet}"]`);
        const zCap = document.querySelector<HTMLElement>(`[data-zone-caption="${planet}"]`);
        const zPlanet = document.querySelector<HTMLElement>(`[data-planet-view="${planet}"] .planet`);
        if (zImg && m.zone.imageUrl) {
            zImg.referrerPolicy = "no-referrer";
            zImg.onerror = () => {
                zImg.hidden = true;
                if (zCap) zCap.hidden = true;
                if (zPlanet) zPlanet.style.display = "";
            };
            zImg.src = m.zone.imageUrl;
            zImg.alt = `Real image: ${m.zone.title}`;
            zImg.hidden = false;
            if (zCap) {
                zCap.textContent = m.zone.title;
                zCap.hidden = false;
            }
            if (zPlanet) zPlanet.style.display = "none";
            const zGlobe = document.querySelector<HTMLElement>(`[data-planet-globe="${planet}"]`);
            if (zGlobe) zGlobe.style.display = "none";
        }
    }
}

function setState(next: State): void {
    root.dataset.state = next;
    searchPanel.hidden = next !== "searching";
    results.hidden = next !== "results";
    control.hidden = next === "results";
    toggleSearch.disabled = next === "idle";
    toggleSearch.setAttribute("aria-expanded", String(next === "searching"));
    chevron.style.transform = next === "searching" ? "rotate(180deg)" : "";
    emptyPrompt.hidden = next !== "idle";
    if (planetPicker) {
        planetPicker.classList.toggle("picker-centered", next === "idle");
        planetPicker.classList.toggle("picker-corner", next !== "idle");
    }
    if (reopenResults) reopenResults.hidden = !((next === "selected" || next === "searching") && matches.length > 0);
    if (next === "searching") {
        ensureMap();
        setTimeout(() => {
            if (map) map.invalidateSize();
            updateMapMarker();
        }, 50);
    }
    if (next === "selected") clearCompareImages();
    if (next === "results") {
        results.scrollTop = 0;
        root.scrollIntoView({ block: "start", behavior: "auto" });
    }
}

function showPlanet(id: PlanetId | ""): void {
    document.querySelectorAll<HTMLElement>("[data-planet-view]").forEach(n => {
        n.hidden = n.dataset.planetView !== id;
    });
    if (id) initPlanetGlobe(id);
    document.querySelectorAll<HTMLElement>("[data-planet-fields]").forEach(n => {
        n.hidden = n.dataset.planetFields !== id;
    });
}

function readGroup(group: "earth" | "zone"): Record<string, string> {
    const out: Record<string, string> = {};
    const fieldsets = searchPanel.querySelectorAll<HTMLFieldSetElement>(`fieldset[data-group="${group}"]`);
    fieldsets.forEach(fs => {
        if (fs.hidden) return;
        fs.querySelectorAll<HTMLSelectElement>("select").forEach(s => {
            if (s.name.startsWith("loc-")) return;
            if (s.value) out[s.name] = s.value;
        });
    });
    return out;
}

function readLocation(): LocationQuery | undefined {
    const lat = locLat.value.trim();
    const lng = locLng.value.trim();
    if (!lat || !lng) return undefined;

    const latN = Number(lat);
    const lngN = Number(lng);
    if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return undefined;
    if (latN < -90 || latN > 90 || lngN < -180 || lngN > 180) return undefined;

    const radiusValue = locRadius.value.trim();
    const radiusN = Number(radiusValue || 100);
    if (!Number.isFinite(radiusN) || radiusN <= 0) return undefined;

    return { lat: latN, lng: lngN, radiusKm: radiusN };
}

function fmtFormulas(text: string): string {
    // format common expressions/formulas without breaking already-escaped HTML
    let out = text;
    const wrap = (re: RegExp) => {
        out = out.replace(re, m => `<code class="formula">${m}</code>`);
    };
    wrap(/P\/\(T\+10\)/g);
    wrap(/\bALLSKY_SFC_SW_DWN\b/g);
    wrap(/\bPRECTOTCORR\b/g);
    wrap(/\bT2M_(?:MIN|MAX)\b/g);
    wrap(/\bT2M\b/g);
    wrap(/\bRH2M\b/g);
    wrap(/\bWS2M\b/g);
    wrap(/\bFeO\/TiO₂\b/g);
    wrap(/\bCO₂\b/g);
    wrap(/\b~?\d+(?:\.\d+)?\s*mbar\b/g);
    wrap(/\bg\s*≈\s*0\.165\s*g\b/g);
    return out;
}

function formatValueBlock(raw: string): string {
    const text = raw.trim();
    if (!text) return "";
    const parts = text
        .split(/;\s*/)
        .map(part => part.trim())
        .filter(Boolean);

    if (parts.length <= 1) {
        return fmtFormulas(esc(text));
    }

    return `<div class="metric-stack">${parts
        .map(part => `<span class="metric-item">${fmtFormulas(esc(part))}</span>`)
        .join("")}</div>`;
}

function bodyColumn(
    b: BodyInfo,
    withImage: boolean,
    longText: boolean,
    extra?: string,
    opts?: { showDescription?: boolean; compact?: boolean },
): string {
    void longText;
    const showDescription = opts?.showDescription ?? true;
    const compact = opts?.compact ?? false;
    const visibleFields = b.fields.filter(f => f.label !== "Georeferencing");
    const rows = visibleFields
        .map(f => {
            const rawVal = formatValueBlock(f.value);
            const valueHtml = `<span>${rawVal}</span>`;
            const corr =
                typeof f.correlation === "number" ? Math.max(0, Math.min(100, Math.round(f.correlation))) : null;
            const barColor =
                corr === null
                    ? "bg-ochre"
                    : corr >= 75
                      ? "bg-emerald-500"
                      : corr >= 50
                        ? "bg-sky-500"
                        : corr >= 25
                          ? "bg-amber-500"
                          : "bg-rose-500";
            const corrHtml =
                corr !== null
                    ? `<div class="w-full min-w-0"><div class="mb-1 flex items-center justify-between text-xs text-mist"><span>Correlation</span><span class="font-medium text-chalk">${corr} %</span></div><div class="h-2.5 w-full overflow-hidden rounded-full bg-line/60" role="img" aria-label="Correlation ${corr} percent"><div class="h-full rounded-full ${barColor}" style="width:${corr}%"></div></div></div>`
                    : `<span class="text-mist">—</span>`;
            const detailCell = showDescription
                ? `<td class="cell-detail">${f.detail ? fmtFormulas(esc(f.detail)) : `<span class="text-mist">—</span>`}</td>`
                : "";
            return `<tr>
              <th scope="row" class="cell-label">${esc(f.label)}</th>
              <td class="cell-value">${valueHtml}</td>
              <td class="cell-corr">${corrHtml}</td>
              ${detailCell}
            </tr>`;
        })
        .join("");
    const isEarthLike = withImage && /Earth|calculat|candidate/i.test(b.kicker + " " + b.title);
    const isPlanetZone = /^Mars\b|^Moon\b/i.test(b.kicker);
    const fallback = isPlanetZone ? zoneFallback(/^Mars\b/i.test(b.kicker) ? "mars" : "moon") : NASA_EARTH_FALLBACK;
    const mapCoords = isEarthLike ? coordsFromBody(b) : null;
    const pin = isEarthLike && b.imageUrl && !mapCoords
        ? `<span aria-hidden="true" class="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full"><span class="block h-4 w-4 -rotate-45 rounded-full rounded-bl-none border-2 border-white bg-ochre shadow-lg"></span><span class="mx-auto -mt-0.5 block h-2 w-2 rounded-full bg-white/90 shadow"></span></span>`
        : "";
    const imgAlt = isEarthLike ? `Satellite image: ${b.title}` : `Image: ${b.title}`;
    const image = withImage
        ? mapCoords
            ? `<div class="candidate-map-wrap relative overflow-hidden rounded-xl border border-line/50" style="aspect-ratio:16/9"><div class="candidate-map h-full w-full" data-lat="${mapCoords.lat}" data-lon="${mapCoords.lon}" role="img" aria-label="Aerial map: ${esc(b.title)}"></div></div>`
            : b.imageUrl
            ? `<div class="${isEarthLike ? "relative " : ""}img-frame mb-0 overflow-hidden rounded-xl border border-line/50" style="aspect-ratio:16/9">${pin}<img class="img-slot block h-full w-full object-cover" src="${esc(b.imageUrl)}" alt="${esc(imgAlt)}" loading="lazy" referrerpolicy="no-referrer" style="background:${b.tone}" onerror="this.onerror=null;this.src='${fallback}';this.alt='Reference image: ${esc(b.title)}';" /></div>`
            : `<div class="img-slot img-slot-empty mb-0" style="background:${b.tone};aspect-ratio:16/9" role="img" aria-label="Reference image: ${esc(b.title)}"></div>`
        : "";
    const thead = showDescription
        ? `<thead><tr><th>Field</th><th>Value</th><th>Correlation</th><th>Description</th></tr></thead>`
        : `<thead><tr><th>Field</th><th>Value</th><th>Correlation</th></tr></thead>`;
    const colgroup = showDescription
        ? `<colgroup><col class="col-label" /><col class="col-value" /><col class="col-corr" /><col class="col-detail" /></colgroup>`
        : `<colgroup><col class="col-label" /><col class="col-value" /><col class="col-corr" /></colgroup>`;
    const tableClass = compact ? "data-table data-table-compact" : "data-table";
    return `<article class="body-card grid min-w-0 gap-4 content-start" style="grid-template-rows:auto auto 1fr">
      <header class="min-h-[8.5rem]">
        <p class="text-sm text-mist">${esc(b.kicker)}</p>
        <h3 class="font-display text-2xl font-medium">${esc(b.title)}</h3>
        <div class="mt-1 min-h-[3.25rem]">${extra ?? ""}</div>
      </header>
      ${image}
      <div class="data-table-wrap self-start">
        <table class="${tableClass}">
          ${colgroup}
          ${thead}
          <tbody>${rows}</tbody>
        </table>
      </div>
    </article>`;
}

function candidateCoords(m: Match): { lat: number; lon: number } | null {
    const f = m.earth.fields.find(x => x.label === "Georeferencing");
    if (!f) return null;
    const nums = f.value.match(/-?\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 2) return null;
    const lat = Number(nums[0]);
    const lon = Number(nums[1]);
    return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

function googleMapsRouteUrl(dest: { lat: number; lon: number }): string {
    const d = `${dest.lat},${dest.lon}`;
    const origin = userLocation
        ? `${userLocation.lat},${userLocation.lng}`
        : locLat.value && locLng.value
          ? `${Number(locLat.value)},${Number(locLng.value)}`
          : null;
    if (origin) {
        return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(d)}&travelmode=driving`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d)}`;
}

function coordsFromBody(b: BodyInfo): { lat: number; lon: number } | null {
    const f = b.fields.find(x => x.label === "Georeferencing");
    if (!f) return null;
    const nums = f.value.match(/-?\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 2) return null;
    const lat = Number(nums[0]);
    const lon = Number(nums[1]);
    return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

function destroyCandidateMaps(): void {
    candidateMaps.forEach(({ map }) => {
        try {
            map.remove();
        } catch {
            /* ignore */
        }
    });
    candidateMaps = [];
}

/** Leaflet + Esri map preview centered on the candidate. */
function mountCandidateMaps(): void {
    if (typeof L === "undefined") return;
    document.querySelectorAll<HTMLElement>(".candidate-map[data-lat]").forEach(node => {
        const lat = Number(node.dataset.lat);
        const lon = Number(node.dataset.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        const m = L.map(node, {
            preferCanvas: true,
            fadeAnimation: false,
            zoomAnimation: false,
            markerZoomAnimation: false,
            scrollWheelZoom: false,
        }).setView([lat, lon], 11);
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            maxZoom: 18,
            attribution: "Tiles &copy; Esri",
        }).addTo(m);
        L.tileLayer(
            "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 18, attribution: "" },
        ).addTo(m);
        L.marker([lat, lon]).addTo(m);
        candidateMaps.push({ map: m, lat, lon });
        setTimeout(() => m.invalidateSize(), 60);
    });
}

/** Recalculate maps mounted in a hidden container (advanced view) when they become visible. */
function refreshCandidateMaps(): void {
    candidateMaps.forEach(({ map, lat, lon }) => {
        map.invalidateSize();
        map.setView([lat, lon], map.getZoom(), { animate: false });
    });
}

function renderResults(): void {
    destroyCandidateMaps();
    const m = matches[active];
    if (!m) return;
    if (resultsSkeleton) resultsSkeleton.hidden = true;
    general.hidden = false;

    matchTabs.innerHTML = matches
        .map((x, i) => {
            const label = x.placeName || x.earth.title;
            return `<button type="button" role="tab" data-i="${i}" aria-selected="${i === active}"
           class="rounded-md border px-3 py-1.5 text-sm ${
               i === active ? "border-ochre bg-deep text-chalk" : "border-line text-mist hover:text-chalk"
           }">${esc(label)} <span class="text-ochre">${x.percentage}%</span></button>`;
        })
        .join("");

    resultPercent.textContent = `${m.percentage}%`;
    const pct = m.percentage;
    const pctClass =
        pct >= 75 ? "text-emerald-400" : pct >= 55 ? "text-sky-400" : pct >= 35 ? "text-amber-400" : "text-rose-400";
    resultPercent.className = `font-display text-5xl font-semibold ${pctClass}`;
    const parts: string[] = [];
    if (typeof m.distanceKm === "number") parts.push(`~${m.distanceKm.toFixed(1)} km from search point`);
    if (typeof m.fromUserKm === "number") parts.push(`${m.fromUserKm.toFixed(1)} km from you`);
    if (typeof m.routeKm === "number" && typeof m.routeMin === "number")
        parts.push(`route ~${m.routeKm.toFixed(1)} km (${Math.round(m.routeMin)} min by car)`);
    if (m.humanInterference) parts.push(`human interference ${m.humanInterference}${m.isolated ? " (isolated)" : ""}`);
    const coords = candidateCoords(m);
    const mapsUrl = coords ? googleMapsRouteUrl(coords) : null;
    const mapsLink = mapsUrl
        ? `<a class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sky-300 underline decoration-sky-400/40 underline-offset-2 hover:text-sky-200" href="${esc(mapsUrl)}" target="_blank" rel="noopener noreferrer">Open route in Google Maps ↗</a>`
        : "";
    const dist =
        parts.length || mapsLink
            ? `<div class="mt-1">${parts.length ? `<p class="text-sm text-mist">${esc(parts.join(" · "))}</p>` : ""}${mapsLink}</div>`
            : "";
    const showEarth = dataView === "earth";
    const geoField =
        m.earth.fields.find(field => field.label === "Georeferencing") ??
        m.zone.fields.find(field => field.label === "Georeferencing");
    const geoCard = geoField
        ? `<div class="geo-span-card"><div class="geo-span-label">Georeferencing</div><div class="geo-span-value">${formatValueBlock(geoField.value)}</div></div>`
        : "";

    // Basic view: select between Earth and Moon/Mars
    const earthBody = bodyColumn(m.earth, true, true, dist, { showDescription: true, compact: false });
    const zoneBody = bodyColumn(m.zone, true, true, "", { showDescription: true, compact: false });
    destroyCandidateMaps();
    general.className = "grid gap-8 items-start";
    general.innerHTML = `${showEarth ? earthBody : zoneBody}${geoCard}`;

    // Advanced information: both (Earth and Moon/Mars)
    advanced.className = "mt-6 grid gap-8 xl:grid-cols-2 items-start content-start pb-8";
    advanced.innerHTML = `${geoCard ? `<div class=\"xl:col-span-2\">${geoCard}</div>` : ""}${earthBody}${zoneBody}`;
    mountCandidateMaps();
    setCompareImages(m);
}

function exportResultsCsv(): void {
    if (!matches.length) return;
    const rows: string[][] = [
        [
            "candidate",
            "similarity_%", 
            "distance_km",
            "from_user_km",
            "route_km",
            "route_min",
            "interference",
            "section",
            "field",
            "value",
            "correlation_%",
            "description",
        ],
    ];
    matches.forEach((m, i) => {
        const label = m.placeName || m.earth.title || `Candidate ${i + 1}`;
        const meta = [
            String(m.percentage),
            m.distanceKm != null ? String(m.distanceKm) : "",
            m.fromUserKm != null ? String(m.fromUserKm) : "",
            m.routeKm != null ? String(m.routeKm) : "",
            m.routeMin != null ? String(m.routeMin) : "",
            m.humanInterference ?? "",
        ];
        const pushBody = (section: string, b: BodyInfo) => {
            b.fields.forEach(f =>
                rows.push([
                    label,
                    ...meta,
                    section,
                    f.label,
                    f.value,
                    f.correlation != null ? String(f.correlation) : "",
                    f.detail,
                ]),
            );
        };
        pushBody("Earth", m.earth);
        pushBody("Zone", m.zone);
    });
    const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "itzamna_results.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function readFormLabel(id: string): string {
    const node = document.getElementById(id) as HTMLSelectElement | HTMLInputElement | null;
    if (!node) return "";
    if (node instanceof HTMLSelectElement) {
        const opt = node.selectedOptions[0];
        return opt && opt.value ? (opt.textContent || opt.value).trim() : "";
    }
    return (node.value || "").trim();
}

function exportResultsPdf(): void {
    if (!matches.length) return;
    const planetName = planet ? (planet === "moon" ? "Moon" : "Mars") : "—";
    const now = new Date();
    const fecha = now.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
    const lat = readFormLabel("loc-lat");
    const lng = readFormLabel("loc-lng");
    const radius = readFormLabel("loc-radius");
    const zone = readFormLabel("zone-zone") || readFormLabel("moon-zone") || readFormLabel("mars-zone");
    const temp = readFormLabel("zone-temperature") || readFormLabel("moon-temperature") || readFormLabel("mars-temperature");
    const comp = readFormLabel("zone-composition") || readFormLabel("moon-composition") || readFormLabel("mars-composition");
    const rel = readFormLabel("zone-terrain") || readFormLabel("moon-terrain") || readFormLabel("mars-terrain");
    const climate = readFormLabel("earth-climate");
    const alt = readFormLabel("earth-elevation");
    const soil = readFormLabel("earth-soil");
    const hum = readFormLabel("earth-humidity");
    const filtros =
        [
            zone && `Zone: ${zone}`,
            temp && `Temperature: ${temp}`,
            comp && `Composition: ${comp}`,
            rel && `Terrain: ${rel}`,
            climate && `Climate: ${climate}`,
            alt && `Elevation: ${alt}`,
            soil && `Soil: ${soil}`,
            hum && `Humidity: ${hum}`,
        ]
            .filter(Boolean)
            .join(" · ") || "No specific filters";
    const ubic = lat && lng ? `Point: ${lat}, ${lng} · Radius: ${radius || "—"} km` : "No point selected";
    const user = userLocation ? ` · Your location: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` : "";

    const renderBody = (b: BodyInfo) => `
      <section class="body-block">
        <h4>${esc(b.kicker)} — ${esc(b.title)}</h4>
        ${b.imageUrl ? `<p><img class="body-img" src="${esc(b.imageUrl)}" alt="${esc(b.title)}" referrerpolicy="no-referrer" crossorigin="anonymous" /></p>` : ""}
        <table class="fields">
          <thead><tr><th>Field</th><th>Value</th><th>Correlation</th><th>Description</th></tr></thead>
          <tbody>
            ${b.fields
                .map(
                    f => `<tr>
              <td class="f-label">${esc(f.label)}</td>
              <td>${formatValueBlock(f.value)}</td>
              <td>${typeof f.correlation === "number" ? `${Math.round(f.correlation)}%` : "—"}</td>
              <td>${fmtFormulas(esc(f.detail || ""))}</td>
            </tr>`,
                )
                .join("")}
          </tbody>
        </table>
      </section>`;

    const candidatesHtml = matches
        .map((m, i) => {
            const label = m.placeName || m.earth.title || `Candidate ${i + 1}`;
            const meta = [
                `Similarity: ${m.percentage}%`,
                m.distanceKm != null ? `Distance: ${m.distanceKm} km` : null,
                m.fromUserKm != null ? `From your location: ${m.fromUserKm} km` : null,
                m.routeKm != null ? `Route: ${m.routeKm} km` : null,
                m.routeMin != null ? `${m.routeMin} min` : null,
                m.humanInterference ? `Interference: ${m.humanInterference}` : null,
            ]
                .filter(Boolean)
                .join(" · ");
            const coords = candidateCoords(m);
            const maps = coords
                ? ` · Map: https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`
                : "";
            return `<section class="candidate">
          <h3>Candidate ${i + 1}: ${esc(label)} — Similarity ${m.percentage}%</h3>
          <p class="meta">${esc(meta)}${esc(maps)}</p>
          ${renderBody(m.earth)}
          ${renderBody(m.zone)}
        </section>`;
        })
        .join("");

    const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>Itzamná - Analog report</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;line-height:1.5;font-size:11pt}
  .page{max-width:900px;margin:0 auto;padding:16mm 12mm}
  h1{font-size:20pt;margin:0 0 3mm}
  h3{font-size:12.5pt;margin:6mm 0 2mm;page-break-after:avoid}
  h4{font-size:11pt;margin:4mm 0 2mm;page-break-after:avoid}
  p{margin:0 0 2.5mm}
  .meta,.small{color:#333;font-size:10pt}
  .cover{margin-bottom:5mm;padding-bottom:4mm;border-bottom:1px solid #bbb}
  .kv{margin:0 0 1.5mm}
  .candidate{margin:0 0 7mm;page-break-inside:avoid}
  .body-block{margin:0 0 4mm;page-break-inside:avoid}
  .body-img{max-width:100%;width:300px;height:auto;display:block;margin:1mm 0 3mm;border:1px solid #ccc}
  table{width:100%;border-collapse:collapse;margin:1mm 0 3mm;font-size:10pt}
  th,td{border:1px solid #999;padding:2mm 2.5mm;vertical-align:top;text-align:left;word-break:break-word}
  th{background:#f3f3f3;font-weight:700}
  .f-label{width:22%;font-weight:600}
  code.formula{font-family:ui-monospace,Consolas,monospace;font-size:.95em}
  .footer{margin-top:5mm;padding-top:3mm;border-top:1px solid #bbb;font-size:9.5pt;color:#444}
  @media print{.page{padding:10mm 8mm;max-width:none} @page{margin:12mm} tr,img{break-inside:avoid}}
</style></head><body>
  <main class="page">
    <header class="cover">
      <h1>Itzamná — Terrestrial analog report</h1>
      <p class="kv"><strong>Date:</strong> ${esc(fecha)}</p>
      <p class="kv"><strong>Target planet/zone:</strong> ${esc(planetName)}</p>
      <p class="kv"><strong>Search location:</strong> ${esc(ubic + user)}</p>
      <p class="kv"><strong>Applied filters:</strong> ${esc(filtros)}</p>
      <p class="small">Structured text report with images and tables (indicative values based on available sources or local calculations).</p>
    </header>
    ${candidatesHtml}
    <footer class="footer">Generated by Itzamná. Similarities and correlations are indicative.</footer>
  </main>
</body></html>`;

    const printInFrame = () => {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        iframe.setAttribute("aria-hidden", "true");
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document;
        if (!doc) {
            document.body.removeChild(iframe);
            searchStatus.textContent = "Could not generate the PDF in this browser.";
            return;
        }
        doc.open();
        doc.write(html);
        doc.close();
        const win = iframe.contentWindow;
        setTimeout(() => {
            try {
                win?.focus();
                win?.print();
            } catch {
                /* ignore */
            }
            setTimeout(() => {
                iframe.remove();
            }, 1500);
        }, 350);
    };

    try {
        printInFrame();
    } catch {
        const w = window.open("", "_blank");
        if (w) {
            w.document.open();
            w.document.write(html);
            w.document.close();
        } else {
            searchStatus.textContent =
                "Allow pop-ups or use the browser's print option to export the PDF.";
        }
    }
}

/* ----- Events ----- */

planetSelect.addEventListener("change", () => {
    planet = planetSelect.value as PlanetId | "";
    matches = [];
    percentValue.textContent = "—";
    searchStatus.textContent = "";
    showPlanet(planet);
    clearCompareImages();
    setState(planet ? "selected" : "idle");
});

toggleSearch.addEventListener("click", () => {
    setState(root.dataset.state === "searching" ? "selected" : "searching");
});

locLat.addEventListener("change", syncMapToInputs);
locLng.addEventListener("change", syncMapToInputs);
locRadius.addEventListener("change", updateMapMarker);

useMyLocationBtn.addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
        userLocStatus.textContent = "Geolocation is not available in this browser.";
        return;
    }
    userLocStatus.textContent = "Detecting your location…";
    useMyLocationBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
        pos => {
            const { latitude, longitude } = pos.coords;
            setUserLocation(latitude, longitude);
            useMyLocationBtn.disabled = false;
        },
        err => {
            const msg =
                err && err.code === 1
                    ? "Location permission denied."
                    : "Could not get your location (requires HTTPS or localhost and permission).";
            userLocStatus.textContent = msg;
            useMyLocationBtn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
});

searchPanel.addEventListener("submit", async event => {
    event.preventDefault();
    if (!planet) return;

    const location = readLocation();
    const uLoc = readUserLocation();
    const includePrivatePlaces = accessFilter.value === "include-private";
    const query: SearchQuery = {
        planet,
        earth: readGroup("earth"),
        zone: readGroup("zone"),
        ...(location ? { location } : {}),
        ...(uLoc ? { userLocation: uLoc } : {}),
        preferIsolated: true,
        preferAccessible: !includePrivatePlaces,
    };
    confirmBtn.disabled = true;
    // ensure overlay is not clipped by form containers/transforms
    if (searchLoading.parentElement !== document.body) document.body.appendChild(searchLoading);
    searchLoading.hidden = false;
    if (resultsSkeleton) resultsSkeleton.hidden = true;
    if (searchLoadingMsg) searchLoadingMsg.textContent = "Connecting to the API";
    if (searchLoadingBar) (searchLoadingBar as HTMLElement).style.width = "22%";
    if (searchLoadingPct) searchLoadingPct.textContent = "Starting…";
    searchStatus.textContent = "";
    const t1 = setTimeout(() => {
        if (searchLoadingMsg) searchLoadingMsg.textContent = "Connection established";
        if (searchLoadingBar) (searchLoadingBar as HTMLElement).style.width = "62%";
        if (searchLoadingPct) searchLoadingPct.textContent = "Querying sources and calculating…";
    }, 450);
    const t2 = setTimeout(() => {
        if (searchLoadingMsg) searchLoadingMsg.textContent = "Processing results";
        if (searchLoadingBar) (searchLoadingBar as HTMLElement).style.width = "86%";
        if (searchLoadingPct) searchLoadingPct.textContent = "Preparing information…";
    }, 1300);

    try {
        matches = await searchAnalogs(query);
        clearTimeout(t1);
        clearTimeout(t2);
        if (searchLoadingMsg) searchLoadingMsg.textContent = "Ready";
        if (searchLoadingBar) (searchLoadingBar as HTMLElement).style.width = "100%";
        if (searchLoadingPct) searchLoadingPct.textContent = "Completed";
        active = 0;
        if (matches.length === 0) {
            searchStatus.textContent = "No areas match these characteristics. Try fewer filters.";
            clearCompareImages();
            return;
        }
        searchStatus.textContent = "";
        percentValue.textContent = `${matches[0].percentage}%`;
        advanced.hidden = true;
        advancedToggle.setAttribute("aria-expanded", "false");
        const advSpan = advancedToggle.querySelector("[data-i18n='explorer.showAdvanced']");
        if (advSpan) advSpan.textContent = "Show advanced information";
        else advancedToggle.textContent = "Show advanced information";
        el<HTMLElement>("#advanced-panel").classList.remove("is-open");
        renderResults();
        setState("results");
    } catch {
        clearTimeout(t1);
        clearTimeout(t2);
        if (searchLoadingMsg) searchLoadingMsg.textContent = "Could not connect";
        searchStatus.textContent = "Could not complete the search. Please try again.";
    } finally {
        confirmBtn.disabled = false;
        setTimeout(() => {
            searchLoading.hidden = true;
        }, 350);
    }
});

if (reopenResults) {
    reopenResults.addEventListener("click", () => {
        if (matches.length > 0) {
            renderResults();
            setState("results");
        }
    });
}

if (exportCsvBtn) exportCsvBtn.addEventListener("click", exportResultsCsv);

if (dataViewToggle) {
    const setDataView = (view: "earth" | "zone") => {
        dataView = view;
        dataViewToggle.querySelectorAll<HTMLElement>("[data-view-btn]").forEach(btn => {
            const activeBtn = btn.dataset.viewBtn === view;
            btn.classList.toggle("is-active", activeBtn);
            btn.setAttribute("aria-pressed", activeBtn ? "true" : "false");
        });
        if (matches.length) renderResults();
    };
    dataViewToggle.querySelectorAll<HTMLElement>("[data-view-btn]").forEach(btn => {
        btn.addEventListener("click", () => {
            const v = btn.dataset.viewBtn === "earth" ? "earth" : "zone";
            setDataView(v);
        });
    });
}
if (exportPdfBtn) exportPdfBtn.addEventListener("click", exportResultsPdf);

if (matchPrev) {
    matchPrev.addEventListener("click", () => {
        if (!matches.length) return;
        active = (active - 1 + matches.length) % matches.length;
        renderResults();
    });
}
if (matchNext) {
    matchNext.addEventListener("click", () => {
        if (!matches.length) return;
        active = (active + 1) % matches.length;
        renderResults();
    });
}

matchTabs.addEventListener("click", event => {
    const tab = (event.target as HTMLElement).closest<HTMLElement>("[data-i]");
    if (!tab) return;
    active = Number(tab.dataset.i);
    renderResults();
});

advancedToggle.addEventListener("click", () => {
    const open = advanced.hidden;
    advanced.hidden = !open;
    advancedToggle.setAttribute("aria-expanded", String(open));
    const advSpan = advancedToggle.querySelector("[data-i18n='explorer.showAdvanced']");
    if (advSpan) advSpan.textContent = open ? "Hide advanced information" : "Show advanced information";
    else advancedToggle.textContent = open ? "Hide advanced information" : "Show advanced information";
    const panel = el<HTMLElement>("#advanced-panel");
    panel.classList.toggle("is-open", open);
    if (open) setTimeout(refreshCandidateMaps, 60);
});

resultsClose.addEventListener("click", () => setState("selected"));

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    const state = root.dataset.state;
    if (state === "searching" || state === "results") setState("selected");
});

initEarthGlobe();
if (planet) initPlanetGlobe(planet);
setState("idle");