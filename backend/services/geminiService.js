const { GoogleGenerativeAI } = require("@google/generative-ai");

const Type = {
    OBJECT: "OBJECT",
    STRING: "STRING",
    ARRAY: "ARRAY"
};

const DEFAULT_LABELS = [
    "battery", "biological", "cardboard", "clothes", 
    "glass", "metal", "paper", "plastic", "shoes", "trash", "not_waste"
];

const GEMINI_MODEL_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-1.5-flash", 
    "gemini-1.5-pro"
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

function getGeminiClient() {
    if (cachedGenAI) return cachedGenAI;
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Thiếu biến môi trường EXPO_PUBLIC_GEMINI_API_KEY.");
    cachedGenAI = new GoogleGenerativeAI(apiKey);
    return cachedGenAI;
}

function normalizeLabel(text) {
    if (!text) return null;
    const normalized = text.trim().toLowerCase().replace(/[\"'`.,!?;:\[\]{}()]/g, "");

    const directMatch = DEFAULT_LABELS.find((label) => label === normalized);
    if (directMatch) return directMatch;

    for (const [label, aliases] of Object.entries(LABEL_ALIASES)) {
        if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
            return label;
        }
    }

    const token = normalized.split(/\s+/)[0];
    return DEFAULT_LABELS.find((label) => token.includes(label) || label.includes(token)) || null;
}

async function classifyWithGemini(imageBuffer, mimeType = "image/jpeg") {
    const genAI = getGeminiClient(); 
    
    const cleanWasteLabels = DEFAULT_LABELS.filter(l => l !== 'not_waste').join(", ");
    
    const prompt = `Bạn là hệ thống AI kiểm định và phân loại góc nhìn cho ứng dụng DaNang Recycle Hub.
Hãy phân tích kỹ bức ảnh được cung cấp dựa trên các quy tắc sau:

1. KIỂM TRA TÍNH HỢP LỆ: Nếu bức ảnh chụp con người, khuôn mặt, động vật, cây cối tự nhiên (không phải rác hữu cơ), phong cảnh, hoặc đồ vật thông thường KHÔNG PHẢI LÀ RÁC THẢI, hãy lập tức chọn nhãn 'not_waste'.
2. PHÂN LOẠI RÁC: Nếu xác định đây là rác thải, hãy chọn 1 nhãn phù hợp nhất trong danh sách: [${cleanWasteLabels}].
3. ĐỊNH NGHĨA 'trash': Chỉ chọn nhãn 'trash' cho các loại rác thải sinh hoạt còn lại, rác vô cơ không thuộc các nhóm tái chế trên.`;

    let lastError = null;

    for (const modelName of GEMINI_MODEL_CANDIDATES) {
        try {
            console.log(`📡 Đang gọi Google API với Model: ${modelName}`);
            
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            label: {
                                type: Type.STRING,
                                enum: DEFAULT_LABELS, 
                                description: "Nhãn phân loại rác thải chính xác nhất từ danh sách được cung cấp."
                            }
                        },
                        required: ["label"],
                    }
                }
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
            const responseText = response.text();
            
            let jsonResult;
            try {
                jsonResult = JSON.parse(responseText);
            } catch (parseErr) {
                console.warn(`⚠️ Model ${modelName} trả về chuỗi JSON không hợp lệ. Đang chuyển model...`);
                lastError = parseErr;
                continue;
            }

            const label = normalizeLabel(jsonResult.label);

            if (label) {
                console.log(`✅ Thành công với model: ${modelName} -> Label: ${label}`);
                return { label, model: modelName };
            }
        } catch (error) {
            lastError = error;
            const status = error?.status;
            const errorMessage = String(error?.message || "").toLowerCase();

            if (status === 403 || status === 404 || status === 429 || status === 503 || 
                errorMessage.includes("demand") || errorMessage.includes("unavailable")) {
                console.warn(`⚠️ Model ${modelName} gặp sự cố (Status: ${status || 'N/A'}). Đang thử model dự phòng tiếp theo...`);
                continue; 
            }
            break; 
        }
    }

    throw new Error(`AI không sẵn sàng. Chi tiết: ${lastError?.message}`);
}

module.exports = { classifyWithGemini, normalizeLabel, DEFAULT_LABELS };