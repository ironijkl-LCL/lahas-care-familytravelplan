// IndexedDB 相簿資料庫與存取邏輯
function openImageDB() {
    return new Promise((resolve, reject) => {
        try {
            const request = indexedDB.open("TravelAppPhotosDB_v13", 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("photos")) {
                    db.createObjectStore("photos", { keyPath: "id", autoIncrement: true });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("IndexedDB 開啟失敗");
        } catch(e) { reject(e); }
    });
}

async function savePhotoToIndexedDB(base64Data, day, name) {
    try {
        const db = await openImageDB();
        const tx = db.transaction("photos", "readwrite");
        tx.objectStore("photos").add({ url: base64Data, day: day, name: name, timestamp: Date.now() });
        return tx.complete;
    } catch(e) { console.error("IndexedDB Save Fallback:", e); }
}

async function getAllPhotosFromIndexedDB() {
    try {
        const db = await openImageDB();
        return new Promise((resolve) => {
            const tx = db.transaction("photos", "readonly");
            const req = tx.objectStore("photos").getAll();
            req.onsuccess = () => resolve(req.result.reverse());
            req.onerror = () => resolve([]);
        });
    } catch(e) { return []; }
}

async function deleteSinglePhotoFromIndexedDB(id) {
    try {
        const db = await openImageDB();
        const tx = db.transaction("photos", "readwrite");
        tx.objectStore("photos").delete(id);
        tx.oncomplete = () => {
            closeModal();
            updateAllInterfaces();
        };
    } catch(e) {}
}

async function silentClearPhotosIndexedDB() {
    try {
        const db = await openImageDB();
        const tx = db.transaction("photos", "readwrite");
        tx.objectStore("photos").clear();
    } catch(e) {}
}

async function clearPhotosIndexedDBAndReload() {
    if (confirm("確定要清空相簿中的照片釋放手機空間嗎？")) {
        await silentClearPhotosIndexedDB();
        window.location.reload();
    }
}
