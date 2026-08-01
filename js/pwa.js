// PWA Service Worker 註冊與 iOS Safari 安裝提醒
let deferredPwaPrompt = null;

function setupPwaInstallBanner() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) return;

    const banner = document.getElementById('pwaInstallBanner');
    const btn = document.getElementById('pwaInstallBtn');
    const text = document.getElementById('pwaBannerText');

    if (isIOS) {
        banner.style.display = 'flex';
        text.innerText = "📲 iOS Safari 請點擊底欄 「分享 ➔ 加入主畫面」";
        btn.style.display = 'none';
    } else {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPwaPrompt = e;
            banner.style.display = 'flex';
        });

        btn?.addEventListener('click', () => {
            if (deferredPwaPrompt) {
                deferredPwaPrompt.prompt();
                deferredPwaPrompt.userChoice.then(() => {
                    deferredPwaPrompt = null;
                    banner.style.display = 'none';
                });
            }
        });
    }
}
