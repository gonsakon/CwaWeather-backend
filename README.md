# CWA 天氣預報 API 服務

這是一個使用 Node.js + Express 開發的天氣預報 API 服務，串接中央氣象署（CWA）開放資料平台，提供台灣各縣市天氣預報資料。

## 功能特色

- ✅ 串接 CWA 氣象資料開放平台
- ✅ 取得台灣各縣市 36 小時天氣預報
- ✅ 支援英文 ID 或中文城市名稱查詢
- ✅ 環境變數管理
- ✅ RESTful API 設計
- ✅ CORS 支援

## 安裝步驟

### 1. 安裝相依套件

```bash
npm install
```

### 2. 設定環境變數

在專案根目錄建立 `.env` 檔案：

```bash
touch .env
```

編輯 `.env` 檔案，填入你的 CWA API Key：

```env
CWA_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
```

### 3. 取得 CWA API Key

1. 前往 [氣象資料開放平臺](https://opendata.cwa.gov.tw/)
2. 註冊/登入帳號
3. 前往「會員專區」→「取得授權碼」
4. 複製 API 授權碼
5. 將授權碼填入 `.env` 檔案的 `CWA_API_KEY`

## 啟動服務

### 開發模式（自動重啟）

```bash
npm run dev
```

### 正式模式

```bash
npm start
```

伺服器會在 `http://localhost:3000` 啟動

## API 端點

### 1. 首頁

```
GET /
```

回應：

```json
{
  "message": "歡迎使用 CWA 天氣預報 API",
  "endpoints": {
    "weatherById": "/api/weather/:id",
    "cities": "/api/cities",
    "health": "/api/health"
  },
  "usage": {
    "description": "使用城市 ID 或中文名稱取得天氣預報",
    "examples": [
      "/api/weather/taipei",
      "/api/weather/kaohsiung",
      "/api/weather/臺北市"
    ]
  }
}
```

### 2. 健康檢查

```
GET /api/health
```

回應：

```json
{
  "status": "OK",
  "timestamp": "2025-09-30T12:00:00.000Z"
}
```

### 3. 取得支援的城市列表

```
GET /api/cities
```

回應範例：

```json
{
  "success": true,
  "data": [
    { "id": "taipei", "name": "臺北市" },
    { "id": "new-taipei", "name": "新北市" },
    { "id": "taoyuan", "name": "桃園市" },
    { "id": "taichung", "name": "臺中市" },
    { "id": "tainan", "name": "臺南市" },
    { "id": "kaohsiung", "name": "高雄市" }
  ]
}
```

### 4. 取得指定城市天氣預報

```
GET /api/weather/:id
```

支援使用英文 ID 或中文城市名稱：

- `/api/weather/taipei` - 使用英文 ID
- `/api/weather/kaohsiung` - 使用英文 ID
- `/api/weather/臺北市` - 使用中文名稱

```
GET /api/weather/kaohsiung
```

回應範例：

```json
{
  "success": true,
  "data": {
    "city": "臺北市",
    "updateTime": "資料更新時間說明",
    "forecasts": [
      {
        "startTime": "2025-09-30 18:00:00",
        "endTime": "2025-10-01 06:00:00",
        "weather": "多雲時晴",
        "rain": "10%",
        "minTemp": "25°C",
        "maxTemp": "32°C",
        "comfort": "悶熱",
        "windSpeed": "偏南風 3-4 級"
      }
    ]
  }
}
```

#### 支援的城市 ID

| 英文 ID | 中文名稱 |
|---------|----------|
| taipei | 臺北市 |
| new-taipei | 新北市 |
| taoyuan | 桃園市 |
| taichung | 臺中市 |
| tainan | 臺南市 |
| kaohsiung | 高雄市 |
| keelung | 基隆市 |
| hsinchu | 新竹市 |
| hsinchu-county | 新竹縣 |
| chiayi | 嘉義市 |
| chiayi-county | 嘉義縣 |
| miaoli | 苗栗縣 |
| changhua | 彰化縣 |
| nantou | 南投縣 |
| yunlin | 雲林縣 |
| pingtung | 屏東縣 |
| yilan | 宜蘭縣 |
| hualien | 花蓮縣 |
| taitung | 臺東縣 |
| penghu | 澎湖縣 |
| kinmen | 金門縣 |
| lienchiang | 連江縣 |

## 專案結構

```
CwaWeather-backend/
├── server.js              # Express 伺服器主檔案（包含路由與控制器邏輯）
├── .env                   # 環境變數（不納入版控）
├── .gitignore            # Git 忽略檔案
├── package.json          # 專案設定與相依套件
├── package-lock.json     # 套件版本鎖定檔案
└── README.md            # 說明文件
```

## 使用的套件

- **express**: Web 框架
- **axios**: HTTP 客戶端
- **dotenv**: 環境變數管理
- **cors**: 跨域資源共享
- **nodemon**: 開發時自動重啟（開發環境）

## 注意事項

1. 請確保已申請 CWA API Key 並正確設定在 `.env` 檔案中
2. API Key 有每日呼叫次數限制，請參考 CWA 平台說明
3. 不要將 `.env` 檔案上傳到 Git 版本控制（已包含在 `.gitignore` 中）
4. 所有路由與業務邏輯都在 `server.js` 檔案中，適合小型專案使用

## 錯誤處理

API 會回傳適當的 HTTP 狀態碼和錯誤訊息：

- `200`: 成功
- `404`: 找不到資料
- `500`: 伺服器錯誤

錯誤回應格式：

```json
{
  "error": "錯誤類型",
  "message": "錯誤訊息"
}
```

## 授權

MIT
