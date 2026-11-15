import Globe from "globe.gl";
import { searchAnalogs } from "../lib/api";
import { NASA_EARTH_FALLBACK, NASA_MARS_FALLBACK, NASA_MOON_FALLBACK } from "../lib/data";
import type { BodyInfo, LocationQuery, Match, PlanetId, SearchQuery, UserLocation } from "../lib/types";

type State = "idle" | "selected" | "searching" | "results";

declare const L: any;

function el<T extends Element>(selector: string): T {
    const found = document.querySelector<T>(selector);
    if (!found) throw new Error(`Falta el elemento ${selector}`);
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
const earthGlobe = el<HTMLElement>("#earth-globe");
const reopenResults = document.querySelector<HTMLButtonElement>("#reopen-results");
const exportCsvBtn = document.querySelector<HTMLButtonElement>("#export-csv");
const exportPdfBtn = document.querySelector<HTMLButtonElement>("#export-pdf");
const dataViewToggle = document.querySelector<HTMLElement>("#data-view");

let planet: PlanetId | "" = "";
let matches: Match[] = [];
let active = 0;
let dataView: "earth" | "zone" = "zone";
let map: any;
let marker: any;
let circle: any;
let userMarker: any;
let userLocation: UserLocation | undefined;
let globeEarth: any = null;

function initEarthGlobe(): void {
    if (!earthGlobe || globeEarth) return;
    try {
        globeEarth = new Globe(earthGlobe);
        globeEarth
            .backgroundColor("rgba(0,0,0,0)")
            .showAtmosphere(true)
            .atmosphereColor("#8ec8ff")
            .atmosphereAltitude(0.16)
            .showGraticules(true)
            .graticuleColor("rgba(156, 204, 255, 0.5)")
            .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
            .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png");
        globeEarth.controls().autoRotate = true;
        globeEarth.controls().autoRotateSpeed = 0.65;
        globeEarth.controls().enablePan = false;
        globeEarth.controls().enableZoom = false;
        globeEarth.pointOfView({ lat: 18, lng: -18, altitude: 1.6 }, 0);
    } catch (error) {
        console.error("No se pudo inicializar Globe.GL", error);
    }
}

function zoneFallback(p: PlanetId | "" = planet): string {
    return p === "marte" ? NASA_MARS_FALLBACK : NASA_MOON_FALLBACK;
}

function esc(text: string): string {
    return text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

function ensureMap(): void {
    if (map || typeof L === "undefined") return;
    map = L.map("loc-map").setView([20, 0], 2);
    // Capa satelital para visualizar el lugar marcado
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    }).addTo(map);
    L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
            maxZoom: 19,
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
        userMarker.bindTooltip("Tu ubicación");
    } else {
        userMarker.setLatLng(ll);
    }
}

function setUserLocation(lat: number, lng: number): void {
    userLocation = { lat, lng };
    userLocStatus.textContent = `Tu ubicación: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
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
    (document.querySelector("#earth-visual .planet") as HTMLElement | null)?.style.removeProperty("display");
}

function setCompareImages(m: Match | undefined): void {
    clearCompareImages();
    if (!m) return;
    if (m.earth.imageUrl) {
        earthCompare.referrerPolicy = "no-referrer";
        earthCompare.onerror = () => {
            earthCompare.onerror = null;
            earthCompare.src = NASA_EARTH_FALLBACK;
            earthCompare.alt = `Imagen satelital: ${m.earth.title}`;
        };
        earthCompare.src = m.earth.imageUrl;
        earthCompare.alt = `Imagen satelital: ${m.earth.title}`;
        earthCompare.hidden = false;
        earthCompareWrap.classList.remove("hidden");
        earthCompareCaption.textContent = m.earth.title;
        earthCompareCaption.hidden = false;
        if (earthGlobe) earthGlobe.style.display = "none";
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
            zImg.alt = `Imagen real: ${m.zone.title}`;
            zImg.hidden = false;
            if (zCap) {
                zCap.textContent = m.zone.title;
                zCap.hidden = false;
            }
            if (zPlanet) zPlanet.style.display = "none";
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
    // aplica formato a expresiones/fórmulas comunes sin romper HTML ya escapado
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
    const visibleFields = b.fields.filter(f => f.label !== "Georreferenciación");
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
                    ? `<div class="w-full min-w-0"><div class="mb-1 flex items-center justify-between text-xs text-mist"><span>Correlación</span><span class="font-medium text-chalk">${corr} %</span></div><div class="h-2.5 w-full overflow-hidden rounded-full bg-line/60" role="img" aria-label="Correlación ${corr} por ciento"><div class="h-full rounded-full ${barColor}" style="width:${corr}%"></div></div></div>`
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
    const isEarthCoordImage = withImage && !!b.imageUrl && /Tierra|calculad/i.test(b.kicker + " " + b.title);
    const isPlanetZone = /^Marte\b|^Luna\b/i.test(b.kicker);
    const fallback = isPlanetZone ? zoneFallback(/^Marte\b/i.test(b.kicker) ? "marte" : "luna") : NASA_EARTH_FALLBACK;
    const pin = isEarthCoordImage
        ? `<span aria-hidden="true" class="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full"><span class="block h-4 w-4 -rotate-45 rounded-full rounded-bl-none border-2 border-white bg-ochre shadow-lg"></span><span class="mx-auto -mt-0.5 block h-2 w-2 rounded-full bg-white/90 shadow"></span></span>`
        : "";
    const imgAlt = isEarthCoordImage ? `Imagen satelital: ${b.title}` : `Imagen: ${b.title}`;
    const image = withImage
        ? b.imageUrl
            ? `<div class="${isEarthCoordImage ? "relative " : ""}img-frame mb-0 overflow-hidden rounded-xl border border-line/50" style="aspect-ratio:16/9">${pin}<img class="img-slot block h-full w-full object-cover" src="${esc(b.imageUrl)}" alt="${esc(imgAlt)}" loading="lazy" referrerpolicy="no-referrer" style="background:${b.tone}" onerror="this.onerror=null;this.src='${fallback}';this.alt='Imagen de referencia: ${esc(b.title)}';" /></div>`
            : `<div class="img-slot img-slot-empty mb-0" style="background:${b.tone};aspect-ratio:16/9" role="img" aria-label="Imagen de referencia: ${esc(b.title)}"></div>`
        : "";
    const thead = showDescription
        ? `<thead><tr><th>Campo</th><th>Valor</th><th>Correlación</th><th>Descripción</th></tr></thead>`
        : `<thead><tr><th>Campo</th><th>Valor</th><th>Correlación</th></tr></thead>`;
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
    const f = m.earth.fields.find(x => x.label === "Georreferenciación");
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

function renderResults(): void {
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
    if (typeof m.distanceKm === "number") parts.push(`A ~${m.distanceKm.toFixed(1)} km del punto de búsqueda`);
    if (typeof m.fromUserKm === "number") parts.push(`a ${m.fromUserKm.toFixed(1)} km de ti`);
    if (typeof m.routeKm === "number" && typeof m.routeMin === "number")
        parts.push(`ruta ~${m.routeKm.toFixed(1)} km (${Math.round(m.routeMin)} min en vehículo)`);
    if (m.humanInterference) parts.push(`interferencia humana ${m.humanInterference}${m.isolated ? " (aislada)" : ""}`);
    const coords = candidateCoords(m);
    const mapsUrl = coords ? googleMapsRouteUrl(coords) : null;
    const mapsLink = mapsUrl
        ? `<a class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sky-300 underline decoration-sky-400/40 underline-offset-2 hover:text-sky-200" href="${esc(mapsUrl)}" target="_blank" rel="noopener noreferrer">Abrir ruta en Google Maps ↗</a>`
        : "";
    const dist =
        parts.length || mapsLink
            ? `<div class="mt-1">${parts.length ? `<p class="text-sm text-mist">${esc(parts.join(" · "))}</p>` : ""}${mapsLink}</div>`
            : "";
    const showEarth = dataView === "earth";
    const geoField =
        m.earth.fields.find(field => field.label === "Georreferenciación") ??
        m.zone.fields.find(field => field.label === "Georreferenciación");
    const geoCard = geoField
        ? `<div class="geo-span-card"><div class="geo-span-label">Georreferenciación</div><div class="geo-span-value">${formatValueBlock(geoField.value)}</div></div>`
        : "";

    // Vista básica: seleccionar entre Tierra y Luna/Marte
    const earthBody = bodyColumn(m.earth, true, true, dist, { showDescription: true, compact: false });
    const zoneBody = bodyColumn(m.zone, true, true, "", { showDescription: true, compact: false });
    general.className = "grid gap-8 items-start";
    general.innerHTML = `${showEarth ? earthBody : zoneBody}${geoCard}`;

    // Información avanzada: ambos (Tierra y Luna/Marte)
    advanced.className = "mt-6 grid gap-8 xl:grid-cols-2 items-start";
    advanced.innerHTML = `${earthBody}${zoneBody}${geoCard}`;
    setCompareImages(m);
}

function exportResultsCsv(): void {
    if (!matches.length) return;
    const rows: string[][] = [
        [
            "candidato",
            "similitud_%",
            "distancia_km",
            "desde_usuario_km",
            "ruta_km",
            "ruta_min",
            "interferencia",
            "seccion",
            "campo",
            "valor",
            "correlacion_%",
            "descripcion",
        ],
    ];
    matches.forEach((m, i) => {
        const label = m.placeName || m.earth.title || `Candidato ${i + 1}`;
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
        pushBody("Tierra", m.earth);
        pushBody("Zona", m.zone);
    });
    const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "itzamna_resultados.csv";
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
    const planetName = planet ? (planet === "luna" ? "Luna" : "Marte") : "—";
    const now = new Date();
    const fecha = now.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" });
    const lat = readFormLabel("loc-lat");
    const lng = readFormLabel("loc-lng");
    const radius = readFormLabel("loc-radius");
    const zona = readFormLabel("zone-zona");
    const temp = readFormLabel("zone-temperatura");
    const comp = readFormLabel("zone-composicion");
    const rel = readFormLabel("zone-relieve");
    const clima = readFormLabel("earth-clima");
    const alt = readFormLabel("earth-altitud");
    const suelo = readFormLabel("earth-suelo");
    const hum = readFormLabel("earth-humedad");
    const filtros =
        [
            zona && `Zona: ${zona}`,
            temp && `Temperatura: ${temp}`,
            comp && `Composición: ${comp}`,
            rel && `Relieve: ${rel}`,
            clima && `Clima: ${clima}`,
            alt && `Altitud: ${alt}`,
            suelo && `Suelo: ${suelo}`,
            hum && `Humedad: ${hum}`,
        ]
            .filter(Boolean)
            .join(" · ") || "Sin filtros específicos";
    const ubic = lat && lng ? `Punto: ${lat}, ${lng} · Radio: ${radius || "—"} km` : "Sin punto seleccionado";
    const user = userLocation ? ` · Tu ubicación: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` : "";

    const renderBody = (b: BodyInfo) => `
      <section class="body-block">
        <h4>${esc(b.kicker)} — ${esc(b.title)}</h4>
        ${b.imageUrl ? `<p><img class="body-img" src="${esc(b.imageUrl)}" alt="${esc(b.title)}" referrerpolicy="no-referrer" crossorigin="anonymous" /></p>` : ""}
        <table class="fields">
          <thead><tr><th>Campo</th><th>Valor</th><th>Correlación</th><th>Descripción</th></tr></thead>
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
            const label = m.placeName || m.earth.title || `Candidato ${i + 1}`;
            const meta = [
                `Similitud: ${m.percentage}%`,
                m.distanceKm != null ? `Distancia: ${m.distanceKm} km` : null,
                m.fromUserKm != null ? `Desde tu ubicación: ${m.fromUserKm} km` : null,
                m.routeKm != null ? `Ruta: ${m.routeKm} km` : null,
                m.routeMin != null ? `${m.routeMin} min` : null,
                m.humanInterference ? `Interferencia: ${m.humanInterference}` : null,
            ]
                .filter(Boolean)
                .join(" · ");
            const coords = candidateCoords(m);
            const maps = coords
                ? ` · Mapa: https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`
                : "";
            return `<section class="candidate">
          <h3>Candidato ${i + 1}: ${esc(label)} — Similitud ${m.percentage}%</h3>
          <p class="meta">${esc(meta)}${esc(maps)}</p>
          ${renderBody(m.earth)}
          ${renderBody(m.zone)}
        </section>`;
        })
        .join("");

    const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" />
<title>Itzamná - Reporte de análogos</title>
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
      <h1>Itzamná — Reporte de análogos terrestres</h1>
      <p class="kv"><strong>Fecha:</strong> ${esc(fecha)}</p>
      <p class="kv"><strong>Planeta/zona objetivo:</strong> ${esc(planetName)}</p>
      <p class="kv"><strong>Ubicación de búsqueda:</strong> ${esc(ubic + user)}</p>
      <p class="kv"><strong>Filtros aplicados:</strong> ${esc(filtros)}</p>
      <p class="small">Reporte en texto estructurado con imágenes y tablas (valores orientativos según fuentes o cálculos locales disponibles).</p>
    </header>
    ${candidatesHtml}
    <footer class="footer">Generado por Itzamná. Las similitudes y correlaciones son orientativas.</footer>
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
            searchStatus.textContent = "No se pudo generar el PDF en este navegador.";
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
                "Permite ventanas emergentes o usa la opción de imprimir del navegador para exportar el PDF.";
        }
    }
}

/* ----- Eventos ----- */

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
        userLocStatus.textContent = "Geolocalización no disponible en este navegador.";
        return;
    }
    userLocStatus.textContent = "Detectando tu ubicación…";
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
                    ? "Permiso de ubicación denegado."
                    : "No se pudo obtener tu ubicación (requiere HTTPS o localhost y permiso).";
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
    // asegurar que el overlay no quede recortado por contenedores/transform del form
    if (searchLoading.parentElement !== document.body) document.body.appendChild(searchLoading);
    searchLoading.hidden = false;
    if (resultsSkeleton) resultsSkeleton.hidden = true;
    if (searchLoadingMsg) searchLoadingMsg.textContent = "Conectando con la API";
    if (searchLoadingBar) (searchLoadingBar as HTMLElement).style.width = "22%";
    if (searchLoadingPct) searchLoadingPct.textContent = "Iniciando…";
    searchStatus.textContent = "";
    const t1 = setTimeout(() => {
        if (searchLoadingMsg) searchLoadingMsg.textContent = "Conexión establecida";
        if (searchLoadingBar) (searchLoadingBar as HTMLElement).style.width = "62%";
        if (searchLoadingPct) searchLoadingPct.textContent = "Consultando fuentes y calculando…";
    }, 450);
    const t2 = setTimeout(() => {
        if (searchLoadingMsg) searchLoadingMsg.textContent = "Procesando resultados";
        if (searchLoadingBar) (searchLoadingBar as HTMLElement).style.width = "86%";
        if (searchLoadingPct) searchLoadingPct.textContent = "Preparando información…";
    }, 1300);

    try {
        matches = await searchAnalogs(query);
        clearTimeout(t1);
        clearTimeout(t2);
        if (searchLoadingMsg) searchLoadingMsg.textContent = "Listo";
        if (searchLoadingBar) (searchLoadingBar as HTMLElement).style.width = "100%";
        if (searchLoadingPct) searchLoadingPct.textContent = "Completado";
        active = 0;
        if (matches.length === 0) {
            searchStatus.textContent = "No hay zonas con esas características. Prueba con menos filtros.";
            clearCompareImages();
            return;
        }
        searchStatus.textContent = "";
        percentValue.textContent = `${matches[0].percentage}%`;
        advanced.hidden = true;
        advancedToggle.setAttribute("aria-expanded", "false");
        advancedToggle.textContent = "Mostrar información avanzada";
        el<HTMLElement>("#advanced-panel").classList.remove("is-open");
        renderResults();
        setState("results");
    } catch {
        clearTimeout(t1);
        clearTimeout(t2);
        if (searchLoadingMsg) searchLoadingMsg.textContent = "No se pudo conectar";
        searchStatus.textContent = "No se pudo completar la búsqueda. Inténtalo de nuevo.";
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
            const active = btn.dataset.viewBtn === view;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", active ? "true" : "false");
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
/* data-view toggle handled above */

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
    advancedToggle.textContent = open ? "Ocultar información avanzada" : "Mostrar información avanzada";
    const panel = el<HTMLElement>("#advanced-panel");
    panel.classList.toggle("is-open", open);
});

resultsClose.addEventListener("click", () => setState("selected"));

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    const state = root.dataset.state;
    if (state === "searching" || state === "results") setState("selected");
});

initEarthGlobe();
setState("idle");
