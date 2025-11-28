require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// CWA API 設定
const CWA_API_BASE_URL = "https://opendata.cwa.gov.tw/api";
const CWA_API_KEY = process.env.CWA_API_KEY;

// 城市 ID 對應 CWA locationName 映射表
// 參考 CWA API 文件: https://opendata.cwa.gov.tw/dist/opendata-swagger.html
const CITY_MAP = {
  taipei: "臺北市",
  "new-taipei": "新北市",
  taoyuan: "桃園市",
  taichung: "臺中市",
  tainan: "臺南市",
  kaohsiung: "高雄市",
  keelung: "基隆市",
  hsinchu: "新竹市",
  "hsinchu-county": "新竹縣",
  chiayi: "嘉義市",
  "chiayi-county": "嘉義縣",
  miaoli: "苗栗縣",
  changhua: "彰化縣",
  nantou: "南投縣",
  yunlin: "雲林縣",
  pingtung: "屏東縣",
  yilan: "宜蘭縣",
  hualien: "花蓮縣",
  taitung: "臺東縣",
  penghu: "澎湖縣",
  kinmen: "金門縣",
  lienchiang: "連江縣",
};

// 取得所有支援的城市列表
const getSupportedCities = () => {
  return Object.entries(CITY_MAP).map(([id, name]) => ({
    id,
    name,
  }));
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 取得城市天氣預報
 * CWA 氣象資料開放平臺 API
 * 使用「一般天氣預報-今明 36 小時天氣預報」資料集
 * @param {string} cityId - 城市 ID 或 locationName
 */
const getCityWeather = async (req, res) => {
  try {
    const cityId = req.params.id;
    
    // 驗證輸入參數：只允許英文字母、數字、連字符、中文字元
    const validPattern = /^[\u4e00-\u9fa5a-zA-Z0-9-]+$/;
    if (!cityId || !validPattern.test(cityId)) {
      return res.status(400).json({
        error: "無效的城市參數",
        message: "城市 ID 只能包含英文字母、數字、連字符或中文字元",
        supportedCities: getSupportedCities(),
      });
    }
    
    // 檢查是否有設定 API Key
    if (!CWA_API_KEY) {
      return res.status(500).json({
        error: "伺服器設定錯誤",
        message: "請在 .env 檔案中設定 CWA_API_KEY",
      });
    }
    
    // 嘗試從映射表取得 locationName，若找不到則直接使用參數值
    // 支援兩種方式: 1. 使用英文 ID (如 kaohsiung) 2. 直接使用中文城市名稱 (如 高雄市)
    const locationName = CITY_MAP[cityId.toLowerCase()] || cityId;

    // 呼叫 CWA API - 一般天氣預報（36小時）
    // API 文件: https://opendata.cwa.gov.tw/dist/opendata-swagger.html
    const response = await axios.get(
      `${CWA_API_BASE_URL}/v1/rest/datastore/F-C0032-001`,
      {
        params: {
          Authorization: CWA_API_KEY,
          locationName,
        },
      }
    );

    // 取得該城市的天氣資料
    const locationData = response.data.records.location[0];

    if (!locationData) {
      return res.status(404).json({
        error: "查無資料",
        message: `無法取得 ${locationName} 天氣資料，請確認城市名稱是否正確`,
        supportedCities: getSupportedCities(),
      });
    }

    // 整理天氣資料
    const weatherData = {
      city: locationData.locationName,
      updateTime: response.data.records.datasetDescription,
      forecasts: [],
    };

    // 解析天氣要素
    const weatherElements = locationData.weatherElement;
    const timeCount = weatherElements[0].time.length;

    for (let i = 0; i < timeCount; i++) {
      const forecast = {
        startTime: weatherElements[0].time[i].startTime,
        endTime: weatherElements[0].time[i].endTime,
        weather: "",
        rain: "",
        minTemp: "",
        maxTemp: "",
        comfort: "",
        windSpeed: "",
      };

      weatherElements.forEach((element) => {
        const value = element.time[i].parameter;
        switch (element.elementName) {
          case "Wx":
            forecast.weather = value.parameterName;
            break;
          case "PoP":
            forecast.rain = value.parameterName + "%";
            break;
          case "MinT":
            forecast.minTemp = value.parameterName + "°C";
            break;
          case "MaxT":
            forecast.maxTemp = value.parameterName + "°C";
            break;
          case "CI":
            forecast.comfort = value.parameterName;
            break;
          case "WS":
            forecast.windSpeed = value.parameterName;
            break;
        }
      });

      weatherData.forecasts.push(forecast);
    }

    res.json({
      success: true,
      data: weatherData,
    });
  } catch (error) {
    console.error("取得天氣資料失敗:", error.message);

    if (error.response) {
      // API 回應錯誤
      return res.status(error.response.status).json({
        error: "CWA API 錯誤",
        message: error.response.data.message || "無法取得天氣資料",
        details: error.response.data,
      });
    }

    // 其他錯誤
    res.status(500).json({
      error: "伺服器錯誤",
      message: "無法取得天氣資料，請稍後再試",
    });
  }
};

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "歡迎使用 CWA 天氣預報 API",
    endpoints: {
      weatherById: "/api/weather/:id",
      cities: "/api/cities",
      health: "/api/health",
    },
    usage: {
      description: "使用城市 ID 或中文名稱取得天氣預報",
      examples: [
        "/api/weather/taipei",
        "/api/weather/kaohsiung",
        "/api/weather/臺北市",
      ],
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 取得所有支援的城市列表
app.get("/api/cities", (req, res) => {
  res.json({
    success: true,
    data: getSupportedCities(),
  });
});

// 取得指定城市天氣預報 (使用城市 ID 或中文名稱)
app.get("/api/weather/:id", getCityWeather);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "伺服器錯誤",
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "找不到此路徑",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 伺服器運行已運作`);
  console.log(`📍 環境: ${process.env.NODE_ENV || "development"}`);
});
