// 主控邏輯 Controller 與全域狀態管理
window.onload = function() {
    registerRealOfflineServiceWorker();
    setupPwaInstallBanner();
    
    const loadedFromURL = checkAndLoadURLHashData();
    const hasData = loadGame();

    if ((hasData || loadedFromURL) && masterData.length > 0) {
        document.getElementById('wizardOverlay').style.display = 'none';
        initLeafletMapSystem();
        buildTimeline();
        updateAllInterfaces();
        drawDailyRouteOnMap();
    } else {
        openWizardOverlay();
    }
};
