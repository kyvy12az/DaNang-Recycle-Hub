const { PredictionAPIClient } = require("@azure/cognitiveservices-customvision-prediction");
const { ApiKeyCredentials } = require("@azure/ms-rest-js");

const DEFAULT_AZURE_TIMEOUT_MESSAGE = "Azure Custom Vision không thể nhận diện ảnh này.";

function normalizeAzureEndpoint(endpoint) {
    if (!endpoint) {
        throw new Error("Thiếu biến môi trường AZURE_CUSTOM_VISION_ENDPOINT.");
    }

    try {
        return new URL(endpoint).origin;
    } catch {
        return endpoint.replace(/\/customvision\/v3\.0\/Prediction\/.*$/i, "");
    }
}

function createAzureClient() {
    const predictionKey = process.env.AZURE_CUSTOM_VISION_KEY;
    const endpoint = normalizeAzureEndpoint(process.env.AZURE_CUSTOM_VISION_ENDPOINT);

    if (!predictionKey) {
        throw new Error("Thiếu biến môi trường AZURE_CUSTOM_VISION_KEY.");
    }

    const credentials = new ApiKeyCredentials({
        inHeader: { "Prediction-key": predictionKey },
    });

    return new PredictionAPIClient(credentials, endpoint);
}

function pickTopPrediction(predictions) {
    if (!Array.isArray(predictions) || predictions.length === 0) {
        return null;
    }

    return [...predictions]
        .filter((prediction) => prediction && typeof prediction === "object")
        .sort((left, right) => (right.probability || 0) - (left.probability || 0))[0] || null;
}

async function classifyWithAzure(imageBuffer) {
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
        throw new Error("Dữ liệu ảnh không hợp lệ.");
    }

    const projectId = process.env.AZURE_PROJECT_ID;
    const iterationName = process.env.AZURE_ITERATION_NAME;

    if (!projectId) {
        throw new Error("Thiếu biến môi trường AZURE_PROJECT_ID.");
    }

    if (!iterationName) {
        throw new Error("Thiếu biến môi trường AZURE_ITERATION_NAME.");
    }

    try {
        const client = createAzureClient();
        const result = await client.classifyImage(projectId, iterationName, imageBuffer);
        const topPrediction = pickTopPrediction(result && result.predictions);

        if (!topPrediction) {
            throw new Error(DEFAULT_AZURE_TIMEOUT_MESSAGE);
        }

        return {
            rawResult: result,
            topPrediction: {
                tagName: String(topPrediction.tagName || topPrediction.tag || "trash").toLowerCase(),
                probability: Number(topPrediction.probability || 0),
            },
        };
    } catch (error) {
        console.error("Lỗi Azure Custom Vision:", error);
        throw new Error(DEFAULT_AZURE_TIMEOUT_MESSAGE);
    }
}

module.exports = { classifyWithAzure, pickTopPrediction };