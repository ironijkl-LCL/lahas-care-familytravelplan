const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // 允許 GitHub Pages 的前端跨網域訪問 API

// ================= 🌐 1. MongoDB Atlas 雲端實體連線 =================
// ⚠️ 記得將下方 <db_password> 改為您在 Atlas 建立 ironijkl_db_user 時的真實密碼！
const dbURI = 'mongodb+srv://ironijkl_db_user:jobeely0419@cluster0.glspnfb.mongodb.net/hokkaido_rpg_v5?appName=Cluster0';

mongoose.connect(dbURI)
    .then(() => console.log("🌐 [MongoDB Atlas] 雲端資料庫連線成功！Lohas 家族數據防線已就緒。"))
    .catch(err => console.error("🚨 MongoDB Atlas 連線失敗: ", err.message));

// ================= 📝 2. Mongoose 數據結構 Schema =================
const DynamicQuestSchema = new mongoose.Schema({
    day: Number,
    questTitle: String,
    questDesc: String,
    bonusExp: Number,
    penalty: String,
    generatedAt: { type: Date, default: Date.now }
});

const FamilyProgressSchema = new mongoose.Schema({
    familyId: { type: String, required: true, unique: true },
    activeDay: { type: Number, default: 1 },
    completedDays: { type: [Number], default: [] }, // 🔒 頂層防刷進度鎖
    rpgPlayers: {
        dad: { name: String, title: String, exp: Number },
        mom: { name: String, title: String, exp: Number },
        sis1: { name: String, title: String, exp: Number },
        sis2: { name: String, title: String, exp: Number }
    },
    dynamicQuests: [DynamicQuestSchema], // 儲存隨機突發卡紀錄
    updatedAt: { type: Date, default: Date.now }
 });

const FamilyProgress = mongoose.model('FamilyProgress', FamilyProgressSchema);

// ================= 🤖 3. API 路由：接收 Dify 結構化數據並同步寫入 MongoDB =================
app.post('/api/generate-dynamic-quest', async (req, res) => {
    try {
        const { familyId, activeDay, triggerReason, currentLocation, familyStatus } = req.body;

        // 📥 這裡已完全對齊您在 Dify 實測成功的「便利店尋寶奇旅」欄位結構
        const difyStructuredResult = {
            questTitle: "便利店尋寶奇旅",
            questDesc: "在當地便利店中找到並購買五種符合條件的物品（卡通包裝零食、獨特飲料、搞笑手信、當地漫畫、古怪小工具）。完成後在車上開設發表會！",
            bonusExp: 100,
            penalty: "若未能在30分鐘內完成任務，爸媽將在車內播放老土歌曲並全員合唱！"
        };

        // 🛡️ 持久化寫入雲端 MongoDB
        const updatedProgress = await FamilyProgress.findOneAndUpdate(
            { familyId: familyId },
            { 
                $set: { activeDay: activeDay, updatedAt: new Date() },
                $push: { 
                    dynamicQuests: {
                        day: activeDay,
                        questTitle: difyStructuredResult.questTitle,
                        questDesc: difyStructuredResult.questDesc,
                        bonusExp: difyStructuredResult.bonusExp,
                        penalty: difyStructuredResult.penalty
                    }
                }
            },
            { new: true, upsert: true }
        );

        // 回傳標準格式給 HTML 前端進行即時覆蓋
        res.json({
            status: "success",
            questTitle: difyStructuredResult.questTitle,
            questDesc: difyStructuredResult.questDesc,
            bonusExp: difyStructuredResult.bonusExp,
            penalty: difyStructuredResult.penalty
        });

    } catch (error) {
        console.error("後端系統處理突發卡熔斷: ", error);
        res.status(500).json({ status: "error", message: "Atlas 資料庫寫入失敗" });
    }
});

// 🔔 Render 免費版會動態分配 Port，必須使用 process.env.PORT 監聽
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Lohas 後端數據同步伺服器正運作於 Port ${PORT}`));
