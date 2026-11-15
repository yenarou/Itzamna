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
const earthCompare = el<HTMLImageElement>("#earth-compare");
const earthCompareWrap = el<HTMLElement>("#earth-compare-wrap");
const earthCompareCaption = el<HTMLElement>("#earth-compare-caption");
const reopenResults = document.querySelector<HTMLButtonElement>("#reopen-results");
const exportCsvBtn = document.querySelector<HTMLButtonElement>("#export-csv");
const exportPdfBtn = document.querySelector<HTMLButtonElement>("#export-pdf");
const dataViewSelect = document.querySelector<HTMLSelectElement>("#data-view");

let planet: PlanetId | "" = "";
let matches: Match[] = [];
let active = 0;
let dataView: "both" | "earth" | "zone" = "both";
let map: any;
let marker: any;
let circle: any;
let userMarker: any;
let userLocation: UserLocation | undefined;

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
    L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "",
    }).addTo(map);
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
    const earthPlanet = document.querySelector("#earth-visual .planet") as HTMLElement | null;
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
    if (next === "results") results.scrollTo({ top: 0 });
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
    const wrap = (re: RegExp) => { out = out.replace(re, (m) => `<code class="formula">${m}</code>`); };
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

function bodyColumn(b: BodyInfo, withImage: boolean, longText: boolean, extra?: string, opts?: { showDescription?: boolean; compact?: boolean }): string {
    void longText;
    const showDescription = opts?.showDescription ?? true;
    const compact = opts?.compact ?? false;
    const rows = b.fields
        .map(f => {
            const isGeo = f.label === "Georreferenciación";
            const geoCoords = isGeo ? (f.value.match(/-?\d+(?:\.\d+)?/g) || []) : [];
            const geoLink = isGeo && geoCoords.length >= 2 ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(geoCoords[0] + "," + geoCoords[1])}` : null;
            const rawVal = fmtFormulas(esc(f.value));
            const valueHtml = isGeo && geoLink
                ? `<a class="text-base font-semibold text-sky-300 underline decoration-sky-400/40 underline-offset-2 hover:text-sky-200 md:text-lg" href="${esc(geoLink)}" target="_blank" rel="noopener noreferrer">${rawVal} ↗</a>`
                : `<span class="${isGeo ? "text-base md:text-lg" : ""}">${rawVal}</span>`;
            const corr = typeof f.correlation === "number" ? Math.max(0, Math.min(100, Math.round(f.correlation))) : null;
            const barColor = corr === null ? "bg-ochre" : corr >= 75 ? "bg-emerald-500" : corr >= 50 ? "bg-sky-500" : corr >= 25 ? "bg-amber-500" : "bg-rose-500";
            const corrHtml = corr !== null
                ? `<div class="${compact ? "min-w-[7rem]" : "min-w-[9rem]"}"><div class="mb-1 flex items-center justify-between text-xs text-mist"><span>Correlación</span><span class="font-medium text-chalk">${corr} %</span></div><div class="h-2.5 w-full overflow-hidden rounded-full bg-line/60" role="img" aria-label="Correlación ${corr} por ciento"><div class="h-full rounded-full ${barColor}" style="width:${corr}%"></div></div></div>`
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
            ? `<div class="${isEarthCoordImage ? "relative" : ""}">${pin}<img class="img-slot w-full object-cover" src="${esc(b.imageUrl)}" alt="${esc(imgAlt)}" loading="lazy" referrerpolicy="no-referrer" style="background:${b.tone}" onerror="this.onerror=null;this.src='${fallback}';this.alt='Imagen de referencia: ${esc(b.title)}';" /></div>`
            : `<div class="img-slot" style="background:${b.tone}" role="img" aria-label="Imagen de referencia: ${esc(b.title)}"></div>`
        : "";
    const thead = showDescription
        ? `<thead><tr><th>Campo</th><th>Valor</th><th>Correlación</th><th>Descripción</th></tr></thead>`
        : `<thead><tr><th>Campo</th><th>Valor</th><th>Correlación</th></tr></thead>`;
    const colgroup = showDescription
        ? `<colgroup><col class="col-label" /><col class="col-value" /><col class="col-corr" /><col class="col-detail" /></colgroup>`
        : `<colgroup><col class="col-label" /><col class="col-value" /><col class="col-corr" /></colgroup>`;
    const tableClass = compact ? "data-table data-table-compact" : "data-table";
    return `<article class="space-y-4 min-w-0">
      <header>
        <p class="text-sm text-mist">${esc(b.kicker)}</p>
        <h3 class="font-display text-2xl font-medium">${esc(b.title)}</h3>
        ${extra ?? ""}
      </header>
      ${image}
      <div class="data-table-wrap">
        <table class="${tableClass}">
          ${colgroup}
          ${thead}
          <tbody>${rows}</tbody>
        </table>
      </div>
    </article>`;
}

function candidateCoords(m: Match): { lat: number; lon: number } | null {
    const f = m.earth.fields.find((x) => x.label === "Georreferenciación");
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
        : (locLat.value && locLng.value ? `${Number(locLat.value)},${Number(locLng.value)}` : null);
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
    const pctClass = pct >= 75 ? "text-emerald-400" : pct >= 55 ? "text-sky-400" : pct >= 35 ? "text-amber-400" : "text-rose-400";
    resultPercent.className = `font-display text-5xl font-semibold ${pctClass}`;
    const parts: string[] = [];
    if (typeof m.distanceKm === "number") parts.push(`A ~${m.distanceKm.toFixed(1)} km del punto de búsqueda`);
    if (typeof m.fromUserKm === "number") parts.push(`a ${m.fromUserKm.toFixed(1)} km de ti`);
    if (typeof m.routeKm === "number" && typeof m.routeMin === "number") parts.push(`ruta ~${m.routeKm.toFixed(1)} km (${Math.round(m.routeMin)} min en vehículo)`);
    if (m.humanInterference) parts.push(`interferencia humana ${m.humanInterference}${m.isolated ? " (aislada)" : ""}`);
    const coords = candidateCoords(m);
    const mapsUrl = coords ? googleMapsRouteUrl(coords) : null;
    const mapsLink = mapsUrl
        ? `<a class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sky-300 underline decoration-sky-400/40 underline-offset-2 hover:text-sky-200" href="${esc(mapsUrl)}" target="_blank" rel="noopener noreferrer">Abrir ruta en Google Maps ↗</a>`
        : "";
    const dist = parts.length || mapsLink ? `<div class="mt-1">${parts.length ? `<p class="text-sm text-mist">${esc(parts.join(" · "))}</p>` : ""}${mapsLink}</div>` : "";
    // vistas diferenciadas: sencilla (resumen) vs avanzada (detalle/descripciones)
    const showEarth = dataView !== "zone";
    const showZone = dataView !== "earth";
    const single = dataView !== "both";
    const generalLayout = single ? "grid gap-8" : "grid gap-8 xl:grid-cols-2";
    const advancedLayout = "grid gap-8"; // avanzada: ancho completo para legibilidad de descripciones

    const earthGeneral = showEarth ? bodyColumn(m.earth, true, false, dist, { showDescription: false, compact: !single }) : "";
    const zoneGeneral = showZone ? bodyColumn(m.zone, true, false, "", { showDescription: false, compact: !single }) : "";
    const earthAdvanced = showEarth ? bodyColumn(m.earth, true, true, dist, { showDescription: true, compact: false }) : "";
    const zoneAdvanced = showZone ? bodyColumn(m.zone, true, true, "", { showDescription: true, compact: false }) : "";

    general.className = generalLayout;
    advanced.className = advancedLayout;
    general.innerHTML = earthGeneral + zoneGeneral;
    advanced.innerHTML = earthAdvanced + zoneAdvanced;
    setCompareImages(m);
}

function exportResultsCsv(): void {
    if (!matches.length) return;
    const rows: string[][] = [["candidato","similitud_%","distancia_km","desde_usuario_km","ruta_km","ruta_min","interferencia","seccion","campo","valor","correlacion_%","descripcion"]];
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
            b.fields.forEach(f => rows.push([label, ...meta, section, f.label, f.value, f.correlation != null ? String(f.correlation) : "", f.detail]));
        };
        pushBody("Tierra", m.earth);
        pushBody("Zona", m.zone);
    });
    const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g,'""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff"+csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "itzamna_resultados.csv"; a.click();
    URL.revokeObjectURL(url);
}

function exportResultsPdf(): void {
    if (!matches.length) return;
    // asegurar datos completos visibles para impresión/PDF
    if (resultsSkeleton) resultsSkeleton.hidden = true;
    advanced.hidden = false;
    advancedToggle.setAttribute("aria-expanded", "true");
    advancedToggle.textContent = "Ocultar información avanzada";
    el<HTMLElement>("#advanced-panel").classList.add("is-open");
    setTimeout(() => window.print(), 50);
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
            const msg = err && err.code === 1
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
    const query: SearchQuery = {
        planet,
        earth: readGroup("earth"),
        zone: readGroup("zone"),
        ...(location ? { location } : {}),
        ...(uLoc ? { userLocation: uLoc, preferIsolated: true, preferAccessible: true } : {}),
    };
    confirmBtn.disabled = true;
    searchLoading.hidden = false;
    searchStatus.textContent = "";

    try {
        matches = await searchAnalogs(query);
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
        searchStatus.textContent = "No se pudo completar la búsqueda. Inténtalo de nuevo.";
    } finally {
        confirmBtn.disabled = false;
        searchLoading.hidden = true;
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
if (exportPdfBtn) exportPdfBtn.addEventListener("click", exportResultsPdf);
if (dataViewSelect) dataViewSelect.addEventListener("change", () => {
    dataView = (dataViewSelect.value as "both" | "earth" | "zone") || "both";
    if (matches.length) renderResults();
});

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

setState("idle");
