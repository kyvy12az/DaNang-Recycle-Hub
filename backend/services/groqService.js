const VALID_LABELS = [
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
    "not_waste"
];

async function classifyWithGroq(imageBuffer, mimeType = "image/jpeg") {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b";

    if (!apiKey) {
        throw new Error("Thiếu biến môi trường GROQ_API_KEY.");
    }

    const prompt = `
Bạn nhận diện rác cho ứng dụng DaNang Recycle Hub.

Chọn đúng MỘT nhãn trong danh sách:
${VALID_LABELS.join(", ")}.

Ý nghĩa:
- battery: pin, ắc quy
- biological: rác hữu cơ, thức ăn thừa
- cardboard: bìa carton
- clothes: quần áo cũ
- glass: thủy tinh
- metal: kim loại
- paper: giấy
- plastic: nhựa
- shoes: giày dép cũ
- trash: rác còn lại, không thuộc các nhóm trên
- not_waste: ảnh không phải rác hoặc không đủ rõ để nhận diện

Nếu có nhiều loại rác, chọn loại chiếm ưu thế.
Không suy đoán khi ảnh không rõ.

Chỉ trả JSON có dạng:
{"label":"plastic"}
`.trim();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: prompt
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:${mimeType};base64,${imageBuffer.toString("base64")}`
                                    }
                                }
                            ]
                        }
                    ],
                    response_format: { type: "json_object" },
                    max_completion_tokens: 256
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                `Groq HTTP ${response.status}: ${
                    data.error?.message || "Không thể nhận diện ảnh."
                }`
            );
        }

        const rawText = data.choices?.[0]?.message?.content;

        if (!rawText) {
            throw new Error("Groq không trả về kết quả.");
        }

        let parsed;

        try {
            parsed = JSON.parse(rawText);
        } catch {
            throw new Error("Groq trả về JSON không hợp lệ.");
        }

        const label = String(parsed.label || "").trim().toLowerCase();

        if (!VALID_LABELS.includes(label)) {
            throw new Error("Groq trả về nhãn không hợp lệ.");
        }

        return { label, model, rawText };
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = { classifyWithGroq };