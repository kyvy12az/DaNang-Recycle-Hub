const azureService = require('../services/azureService');
const geminiService = require('../services/geminiService');

const VALID_LABELS = ['battery', 'biological', 'cardboard', 'clothes', 'glass', 'metal', 'paper', 'plastic', 'shoes', 'trash', 'not_waste'];
const AZURE_CONFIDENCE_THRESHOLD = 0.6;

function buildSuccessResponse({ label, source, provider, confidence, fallbackFrom, raw }) {
    const normalizedLabel = VALID_LABELS.includes(String(label).toLowerCase())
        ? String(label).toLowerCase()
        : 'trash';

    const response = {
        success: true,
        source,
        provider,
        label: normalizedLabel,
        confidence,
        data: {
            label: normalizedLabel,
            source,
            provider,
            confidence,
        },
    };

    if (fallbackFrom) {
        response.fallbackFrom = fallbackFrom;
        response.data.fallbackFrom = fallbackFrom;
    }

    if (raw) {
        response.data.raw = raw;
    }

    return response;
}

const handleClassification = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ success: false, error: "Vui lòng upload ảnh." });
        }

        const imageBuffer = req.file.buffer;
        let azureResult = null;

        try {
            azureResult = await azureService.classifyWithAzure(imageBuffer);
        } catch (azureError) {
            console.warn("Azure Custom Vision thất bại, chuyển sang Gemini:", azureError.message);
        }

        // Nếu Azure chạy tốt và độ tự tin cao => Trả kết quả ngay
        if (azureResult && azureResult.topPrediction && azureResult.topPrediction.probability >= AZURE_CONFIDENCE_THRESHOLD) {
            const confidencePercent = Number((azureResult.topPrediction.probability * 100).toFixed(2));

            return res.status(200).json(
                buildSuccessResponse({
                    label: azureResult.topPrediction.tagName,
                    source: "Azure Custom Vision",
                    provider: "azure",
                    confidence: confidencePercent,
                    raw: azureResult.rawResult,
                })
            );
        }

        // fallback sang gemini AI
        console.log("Azure không đủ tự tin hoặc bị lỗi, đang chuyển sang Gemini AI...");
        const geminiResult = await geminiService.classifyWithGemini(imageBuffer, req.file.mimetype);
        
        // Nếu là not_waste từ Gemini => Trả về phản hồi thành công
        return res.status(200).json(
            buildSuccessResponse({
                label: geminiResult.label,
                source: "Gemini AI",
                provider: "gemini",
                confidence: null,
                fallbackFrom: azureResult ? "azure-low-confidence" : "azure-error",
                raw: {
                    model: geminiResult.model,
                    rawText: geminiResult.rawText || geminiResult.label, 
                },
            })
        );

    } catch (error) {
        console.error("Controller Error:", error);
        res.status(500).json({ 
            success: false, 
            error: "Lỗi xử lý nhận diện rác thải.",
            details: error.message 
        });
    }
};

module.exports = { handleClassification };