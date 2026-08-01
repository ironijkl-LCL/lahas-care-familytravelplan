// Leaflet 地圖、貝修弧線繪製與地標 Marker 處理
let lfMap = null;
let currentPolyline = null, currentGlowLine = null;
let currentMarkers = [];

function initLeafletMapSystem() {
    try {
        if (!document.getElementById('leafletMap')) return;
        if (lfMap) lfMap.remove();
        
        lfMap = L.map('leafletMap', { zoomControl: false, attributionControl: false }).setView([25.064, 121.526], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(lfMap);
    } catch(e) {}
}

function getCurvedPoint(p1, p2) {
    let latlng1 = L.latLng(p1), latlng2 = L.latLng(p2);
    let offsetX = latlng2.lng - latlng1.lng, offsetY = latlng2.lat - latlng1.lat;
    let r = Math.sqrt(Math.pow(offsetX, 2) + Math.pow(offsetY, 2)), theta = Math.atan2(offsetY, offsetX);
    let thetaOffset = 3.14159 / 6;
    let r2 = (r / 2) / Math.cos(thetaOffset), theta2 = theta + thetaOffset;
    return [latlng1.lat + r2 * Math.sin(theta2), latlng1.lng + r2 * Math.cos(theta2)];
}

function drawDailyRouteOnMap() {
    if (!lfMap || !masterData.length) return;
    
    try {
        if (currentPolyline) lfMap.removeLayer(currentPolyline);
        if (currentGlowLine) lfMap.removeLayer(currentGlowLine);
        currentMarkers.forEach(m => lfMap.removeLayer(m));
        currentMarkers = [];

        const data = masterData[activeDay - 1];
        if (!data || !data.waypoints) return;

        data.waypoints.forEach((wp, idx) => {
            const markerIcon = L.divIcon({
                className: 'custom-rpg-pin',
                html: `<div class="rpg-marker-pin"><span class="rpg-marker-num">${idx + 1}</span></div>`,
                iconSize: [28, 38], iconAnchor: [14, 38]
            });

            const marker = L.marker([wp.lat, wp.lng], { icon: markerIcon })
                .addTo(lfMap).bindPopup(`<div style="font-weight:bold; font-size:12px;">📍 第 ${idx + 1} 站：${wp.name}</div>`);
            currentMarkers.push(marker);
        });

        if (data.waypoints.length > 1) {
            let curvePath = [];
            for (let i = 0; i < data.waypoints.length - 1; i++) {
                let p1 = [data.waypoints[i].lat, data.waypoints[i].lng];
                let p2 = [data.waypoints[i+1].lat, data.waypoints[i+1].lng];
                let mid = getCurvedPoint(p1, p2);
                for (let t = 0; t <= 1; t += 0.05) {
                    let lat = (1 - t) * (1 - t) * p1[0] + 2 * (1 - t) * t * mid[0] + t * t * p2[0];
                    let lng = (1 - t) * (1 - t) * p1[1] + 2 * (1 - t) * t * mid[1] + t * t * p2[1];
                    curvePath.push([lat, lng]);
                }
            }
            currentGlowLine = L.polyline(curvePath, { color: '#38BDF8', weight: 8, opacity: 0.4 }).addTo(lfMap);
            currentPolyline = L.polyline(curvePath, { color: '#0284C7', weight: 4, className: 'rpg-route-line' }).addTo(lfMap);
            lfMap.fitBounds(currentPolyline.getBounds(), { padding: [40, 40] });
        } else if (data.waypoints.length === 1) {
            lfMap.setView([data.waypoints[0].lat, data.waypoints[0].lng], 11);
        }
    } catch(e) {}
}

async function prefetchOfflineMapTiles() {
    if (!('caches' in window)) { alert("瀏覽器不支援 Cache API"); return; }
    alert("📥 開始為全旅程預下載離線地圖切片 (a/b/c 三子網域)，請稍候...");
    try {
        const cache = await caches.open('map-tiles-v13');
        let count = 0;
        const subdomains = ['a', 'b', 'c'];
        for (let d of masterData) {
            if (d.waypoints) {
                for (let wp of d.waypoints) {
                    for (let z = 10; z <= 14; z++) {
                        const x = Math.floor((wp.lng + 180) / 360 * Math.pow(2, z));
                        const y = Math.floor((1 - Math.log(Math.tan(wp.lat * Math.PI / 180) + 1 / Math.cos(wp.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
                        for (let s of subdomains) {
                            const tileUrl = `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
                            try { await cache.add(tileUrl); count++; } catch(e){}
                        }
                    }
                }
            }
        }
        alert(`✅ 離線地圖預載完成！已覆蓋全子網域，成功快取 ${count} 個切片！`);
    } catch(e) { alert("❌ 預載過程受阻"); }
}
