// 任務提交、圖片高壓縮與被動 GPS 打卡邏輯
function handlePhotoUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600; 
                let width = img.width, height = img.height;
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressed = canvas.toDataURL('image/jpeg', 0.5);

                const preview = document.getElementById('photo-preview-img');
                preview.src = compressed; preview.style.display = 'block';
                currentUploadedPhotoUrl = compressed;
                document.getElementById('btn-submit-quest').style.display = 'block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function validateQuestCompletion() {
    if (completedDays.includes(activeDay)) {
        alert("⚠️ 此日任務已通關！"); switchTab('home'); return;
    }
    if (!currentUploadedPhotoUrl) {
        alert("📷 請先上傳現場打卡照片以完成任務！");
        return;
    }

    const data = masterData[activeDay - 1];
    for (let k in rpgPlayers) { rpgPlayers[k].exp += 200; }
    completedDays.push(activeDay);
    
    await savePhotoToIndexedDB(currentUploadedPhotoUrl, data.day, data.title);
    currentUploadedPhotoUrl = "";
    saveGame();
    alert(`✅ Day ${data.day} 任務完成！全體 +200 EXP！`);
    updateAllInterfaces();
    switchTab('home');
}

function manualForceCheckin() {
    if (!manualCheckinDays.includes(activeDay)) {
        manualCheckinDays.push(activeDay);
        saveGame();
    }
    document.getElementById('gps-proximity-alert').style.display = 'block';
    document.getElementById('gps-proximity-alert').style.background = '#16A34A';
    document.getElementById('gps-proximity-alert').innerHTML = `📍 已解鎖手動座標打卡！`;
    document.getElementById('btn-submit-quest').style.display = 'block';
    alert("📍 已解鎖座標打卡！請上傳相片後點擊上方按鈕提交任務。");
}

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function triggerPassiveGpsCheck() {
    if (!navigator.geolocation) { alert("瀏覽器不支援 GPS"); return; }
    
    document.getElementById('gps-proximity-alert').style.display = 'block';
    document.getElementById('gps-proximity-alert').innerText = "📡 正在單次獲取精準 GPS 位置...";

    navigator.geolocation.getCurrentPosition((pos) => {
        const userLat = pos.coords.latitude, userLng = pos.coords.longitude;
        const currentData = masterData[activeDay - 1];
        if (!currentData) return;

        const targetWp = (currentData.waypoints && currentData.waypoints.length > 0) 
                       ? currentData.waypoints[currentData.waypoints.length - 1] 
                       : { lat: 25.064, lng: 121.526, name: "目的地" };

        const dist = calculateDistanceMeters(userLat, userLng, targetWp.lat, targetWp.lng);
        const alertBanner = document.getElementById('gps-proximity-alert');

        if (dist <= 300) {
            alertBanner.style.background = '#16A34A';
            alertBanner.innerHTML = `🎉 已成功到達！距離 ${targetWp.name} 僅 ${Math.round(dist)} 米！`;
            document.getElementById('btn-submit-quest').style.display = 'block';
        } else {
            alertBanner.style.background = '#0284C7';
            alertBanner.innerHTML = `📍 單次定位完成：距離 ${targetWp.name} 約 ${Math.round(dist/1000)} km (${Math.round(dist)} 米)`;
        }
    }, (err) => {
        alert("⚠️ 單次 GPS 獲取失敗，請確認權限或嘗試手動打卡。");
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 });
}
