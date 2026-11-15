import { searchAnalogs } from "../lib/api";
import { NASA_EARTH_FALLBACK } from "../lib/data";
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
const emptyPrompt = el<HTMLElement>("#empty-prompt");
const control = el<HTMLElement>("#control");
const toggleSearch = el<HTMLButtonElement>("#toggle-search");
const chevron = el<SVGSVGElement>("#chevron");
const percentValue = el<HTMLElement>("#percent-value");
const searchPanel = el<HTMLFormElement>("#search-panel");
const confirmBtn = el<HTMLButtonElement>("#confirm");
const searchStatus = el<HTMLElement>("#search-status");
const results = el<HTMLElement>("#results");
const resultsClose = el<HTMLButtonElement>("#results-close");
const matchTabs = el<HTMLElement>("#match-tabs");
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

let planet: PlanetId | "" = "";
let matches: Match[] = [];
let active = 0;
let map: any;
let marker: any;
let circle: any;
let userMarker: any;
let userLocation: UserLocation | undefined;

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

function bodyColumn(b: BodyInfo, withImage: boolean, longText: boolean, extra?: string): string {
    const fields = b.fields
        .map(f => {
            if (longText) {
                return `<div class="border-t border-line py-4">
             <dt class="text-sm text-mist">${esc(f.label)}</dt>
             <dd class="mt-1 font-medium">${esc(f.value)}</dd>
             <dd class="mt-2 max-w-[60ch] leading-relaxed text-mist">${esc(f.detail)}</dd>
           </div>`;
            }
            const corr = typeof f.correlation === "number" ? Math.max(0, Math.min(100, Math.round(f.correlation))) : null;
            const bar = corr !== null
                ? `<div class="mt-2">
                     <div class="mb-1 flex items-center justify-between text-xs text-mist"><span>Correlación</span><span class="font-medium text-ochre">${corr}%</span></div>
                     <div class="h-2 w-full overflow-hidden rounded bg-line/60" role="img" aria-label="Correlación ${corr}%"><div class="h-full rounded bg-ochre" style="width:${corr}%"></div></div>
                   </div>`
                : "";
            const detail = f.detail
                ? `<dd class="mt-2 text-sm leading-relaxed text-mist">${esc(f.detail)}</dd>`
                : "";
            return `<div class="rounded-md border border-line bg-panel px-4 py-3">
             <dt class="text-sm text-mist">${esc(f.label)}</dt>
             <dd class="mt-0.5 font-medium">${esc(f.value)}</dd>
             ${bar}
             ${detail}
           </div>`;
        })
        .join("");
    const isEarthCoordImage = withImage && !!b.imageUrl && /Tierra|calculad/i.test(b.kicker + " " + b.title);
    const pin = isEarthCoordImage
        ? `<span aria-hidden="true" class="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full"><span class="block h-4 w-4 -rotate-45 rounded-full rounded-bl-none border-2 border-white bg-ochre shadow-lg"></span><span class="mx-auto -mt-0.5 block h-2 w-2 rounded-full bg-white/90 shadow"></span></span>`
        : "";
    const image = withImage
        ? b.imageUrl
            ? `<div class="${isEarthCoordImage ? "relative" : ""}">${pin}<img class="img-slot w-full object-cover" src="${esc(b.imageUrl)}" alt="Imagen satelital: ${esc(b.title)}" loading="lazy" referrerpolicy="no-referrer" style="background:${b.tone}" onerror="this.onerror=null;this.src='${NASA_EARTH_FALLBACK}';this.alt='Imagen de referencia: ${esc(b.title)}';" /></div>`
            : `<div class="img-slot" style="background:${b.tone}" role="img" aria-label="Imagen de referencia: ${esc(b.title)}"></div>`
        : "";
    return `<article class="space-y-4">
      <header>
        <p class="text-sm text-mist">${esc(b.kicker)}</p>
        <h3 class="font-display text-2xl font-medium">${esc(b.title)}</h3>
        ${extra ?? ""}
      </header>
      ${image}
      <dl class="${longText ? "" : "space-y-3"}">${fields}</dl>
    </article>`;
}

function renderResults(): void {
    const m = matches[active];
    if (!m) return;

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
    const parts: string[] = [];
    if (typeof m.distanceKm === "number") parts.push(`A ~${m.distanceKm.toFixed(1)} km del punto de búsqueda`);
    if (typeof m.fromUserKm === "number") parts.push(`a ${m.fromUserKm.toFixed(1)} km de ti`);
    if (typeof m.routeKm === "number" && typeof m.routeMin === "number") parts.push(`ruta ~${m.routeKm.toFixed(1)} km (${Math.round(m.routeMin)} min)`);
    if (m.humanInterference) parts.push(`interferencia humana ${m.humanInterference}${m.isolated ? " (aislada)" : ""}`);
    const dist = parts.length ? `<p class="mt-1 text-sm text-mist">${esc(parts.join(" · "))}</p>` : "";
    general.innerHTML = bodyColumn(m.earth, true, false, dist) + bodyColumn(m.zone, true, false);
    advanced.innerHTML = bodyColumn(m.earth, false, true, dist) + bodyColumn(m.zone, false, true);
    setCompareImages(m);
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
    searchStatus.textContent = "Buscando zonas similares…";

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
        advancedToggle.textContent = "Ver información avanzada";
        renderResults();
        setState("results");
    } catch {
        searchStatus.textContent = "No se pudo completar la búsqueda. Inténtalo de nuevo.";
    } finally {
        confirmBtn.disabled = false;
    }
});

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
    advancedToggle.textContent = open ? "Ocultar información avanzada" : "Ver información avanzada";
});

resultsClose.addEventListener("click", () => setState("selected"));

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    const state = root.dataset.state;
    if (state === "searching" || state === "results") setState("selected");
});

setState("idle");
