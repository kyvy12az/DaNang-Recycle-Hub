const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEFAULT_LABELS = [
    "battery",
    "biological",
    "cardboard",
    "clothes",
    "glass",
    "metal",
    "paper",
    "plastic",
    "shoes",
    "trash",
];

const GEMINI_MODEL_CANDIDATES = [
    "gemini-2.5-flash",      
];

const LABEL_ALIASES = {
    battery: ["battery", "pin", "ắc quy", "ac quy", "pin/ắc quy"],
    biological: ["biological", "thực phẩm", "thuc pham", "hữu cơ", "huu co", "organic"],
    cardboard: ["cardboard", "bìa carton", "bia carton", "carton"],
    clothes: ["clothes", "quần áo", "quan ao"],
    glass: ["glass", "thủy tinh", "thuy tinh"],
    metal: ["metal", "kim loại", "kim loai"],
    paper: ["paper", "giấy", "giay"],
    plastic: ["plastic", "nhựa", "nhua"],
    shoes: ["shoes", "giày dép", "giay dep"],
    trash: ["trash", "rác còn lại", "rac con lai", "residual"],
};

let cachedGenAI = null;
let cachedModelName = null;

function getGeminiApiKey() {
    return process.env.EXPO_PUBLIC_GEMINI_API_KEY;
}

function getGeminiClient() {
    if (cachedGenAI) return cachedGenAI;
    const apiKey = getGeminiApiKey();
    if (!apiKey) throw new Error("Thiếu biến môi trường EXPO_PUBLIC_GEMINI_API_KEY.");
    cachedGenAI = new GoogleGenerativeAI(apiKey);
    return cachedGenAI;
}

function createModel(modelName) {
    return getGeminiClient().getGenerativeModel({ model: modelName });
}

// hàm kiểm tra lỗi để quyết định có nên thử model tiếp theo hay không
function shouldTryNextModel(error) {
    const message = String(error?.message || "").toLowerCase();
    const status = error?.status;

    return status === 404 || // Model không tồn tại
           status === 429 || // Hết Quota 
           message.includes("not found") ||
           message.includes("quota") ||
           message.includes("limit exceeded") ||
           message.includes("not supported");
}

function isModelNotSupportedError(error) {
    const message = String(error?.message || "").toLowerCase();
    const status = error?.status;

    return status === 404
        || message.includes("not found")
        || message.includes("not supported for generatecontent")
        || message.includes("model") && message.includes("not found");
}

function normalizeLabel(text) {
    const normalized = String(text || "")
        .trim()
        .toLowerCase()
        .replace(/```(?:json)?/g, "")
        .replace(/[\"'`.,!?;:\[\]{}()]/g, "")
        .trim();

    const directMatch = DEFAULT_LABELS.find((label) => label === normalized);
    if (directMatch) {
        return directMatch;
    }

    for (const [label, aliases] of Object.entries(LABEL_ALIASES)) {
        if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
            return label;
        }
    }

    const token = normalized.split(/\s+/)[0];
    return DEFAULT_LABELS.find((label) => token.includes(label) || label.includes(token)) || null;
}

async function classifyWithGemini(imageBuffer, mimeType = "image/jpeg") {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing Gemini API Key");

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const prompt = `Phân tích hình ảnh rác thải này. Trả về duy nhất 1 từ trong danh sách: [${DEFAULT_LABELS.join(", ")}].`;

    let lastError = null;

    for (const modelName of GEMINI_MODEL_CANDIDATES) {
        try {
            console.log(`📡 Đang gọi Google API với Model: ${modelName}`);
            
            // Cấu hình cụ thể để tránh lỗi 404/403
            const model = genAI.getGenerativeModel({ 
                model: modelName 
            });

            const result = await model.generateContent([
                {
                    inlineData: {
                        data: imageBuffer.toString("base64"),
                        mimeType: mimeType
                    }
                },
                prompt,
            ]);

            const response = await result.response;
            const text = response.text();
            const label = normalizeLabel(text);

            if (label) {
                console.log(`✅ Thành công với model: ${modelName}`);
                return { label, model: modelName };
            }
        } catch (error) {
            lastError = error;
            const status = error?.status;

            // Xử lý lỗi 403 (Quyền truy cập) hoặc 404 (Sai tên model) hoặc 429 (Hết lượt)
            if (status === 403 || status === 404 || status === 429) {
                console.warn(`⚠️ Model ${modelName} bị lỗi ${status}. Đang chuyển model...`);
                continue; 
            }
            break;
        }
    }

    throw new Error(`AI không sẵn sàng. Chi tiết: ${lastError?.message}`);
}

module.exports = { classifyWithGemini, normalizeLabel, DEFAULT_LABELS };