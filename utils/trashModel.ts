import { Image } from 'react-native';
import { Buffer } from 'buffer';
import { Asset } from 'expo-asset';
import { readAsStringAsync } from 'expo-file-system/legacy';
import Constants from 'expo-constants';

export interface TrashPrediction {
    className: string;
    classNameVi: string;
    confidence: number;
    category: string;
    pricePerKg: number;
    color: string;
    estimatedWeight?: number;
    labelIndex: number;
    group: 'recyclable' | 'organic' | 'hazardous' | 'non-recyclable';
    status: 'success' | 'low-confidence' | 'fallback' | 'needs-review';
    guidance: string;
    isSellable: boolean;
}

type TrashGroup = TrashPrediction['group'];

type LabelMetadata = {
    classNameVi: string;
    category: string;
    pricePerKg: number;
    color: string;
    group: TrashGroup;
};

const HIGH_CONFIDENCE_THRESHOLD = 0.7;
const SEGMENTATION_RETRY_ATTEMPTS = 3;
const SEGMENTATION_RETRY_DELAY_MS = 1200;
const SEGMENTATION_PENDING_COOLDOWN_MS = 60000;
const LOW_CONFIDENCE_THRESHOLD = 0.55;
const MODEL_SIZE = 224;
const NO_SUBJECT_MESSAGE = 'Không tìm thấy vật thể rõ ràng, vui lòng đưa rác vào trung tâm camera';

const LABEL_METADATA: Record<string, LabelMetadata> = {
    battery: {
        classNameVi: 'Pin',
        category: 'hazardous',
        pricePerKg: 15000,
        color: '#7E57C2',
        group: 'hazardous',
    },
    biological: {
        classNameVi: 'Rác hữu cơ',
        category: 'organic',
        pricePerKg: 0,
        color: '#66BB6A',
        group: 'organic',
    },
    cardboard: {
        classNameVi: 'Giấy carton',
        category: 'paper',
        pricePerKg: 6000,
        color: '#8D6E63',
        group: 'recyclable',
    },
    glass: {
        classNameVi: 'Thủy tinh',
        category: 'glass',
        pricePerKg: 3000,
        color: '#26A69A',
        group: 'recyclable',
    },
    metal: {
        classNameVi: 'Kim loại',
        category: 'metal',
        pricePerKg: 25000,
        color: '#78909C',
        group: 'recyclable',
    },
    paper: {
        classNameVi: 'Giấy',
        category: 'paper',
        pricePerKg: 4000,
        color: '#8D6E63',
        group: 'recyclable',
    },
    plastic: {
        classNameVi: 'Nhựa',
        category: 'plastic',
        pricePerKg: 10000,
        color: '#2196F3',
        group: 'recyclable',
    },
    trash: {
        classNameVi: 'Rác thải',
        category: 'residual',
        pricePerKg: 0,
        color: '#757575',
        group: 'non-recyclable',
    },
    clothes: {
        classNameVi: 'Quần áo cũ',
        category: 'textile',
        pricePerKg: 5000,
        color: '#8E24AA',
        group: 'recyclable',
    },
    shoes: {
        classNameVi: 'Giày dép cũ',
        category: 'textile',
        pricePerKg: 5000,
        color: '#5E35B1',
        group: 'recyclable',
    },
};

const GROUP_GUIDANCE: Record<TrashGroup, string> = {
    recyclable:
        'Có thể thu mua và tái chế. Hãy làm sạch, để khô và phân loại đúng nhóm trước khi bán.',
    organic:
        'Rác hữu cơ nên xử lý bằng ủ compost hoặc bỏ đúng thùng rác hữu cơ, không nên trộn với rác tái chế.',
    hazardous:
        'Rác nguy hại cần tách riêng, không đốt và không trộn với rác khác. Hãy xử lý theo điểm thu gom chuyên dụng.',
    'non-recyclable':
        'Không đủ điều kiện thu mua. Hãy bỏ vào luồng rác còn lại hoặc xử lý riêng theo quy định địa phương.',
};

let tfliteModule: any = null;
let tfliteModel: any = null;
let modelLabels: string[] = [];
let isModelLoading = false;
let modelAvailable = false;
let segmentationModuleCache: any = undefined;
let segmentationModuleName: string | null = null;
let segmentationInitLogged = false;
let segmentationSupportChecked = false;
let segmentationSupportAvailable = true;
let segmentationPendingUntil = 0;
let segmentationPendingWarned = false;

class NoSubjectDetectedError extends Error {
    constructor() {
        super(NO_SUBJECT_MESSAGE);
        this.name = 'NoSubjectDetectedError';
    }
}

function isNoSubjectDetectedError(error: unknown): boolean {
    return error instanceof Error && error.message === NO_SUBJECT_MESSAGE;
}

function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        Image.getSize(
            uri,
            (width, height) => resolve({ width, height }),
            (error) => reject(error)
        );
    });
}

function parseLabelsText(text: string): string[] {
    return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const numbered = line.match(/^\d+\s+(.+)$/);
            if (numbered) return numbered[1].trim().toLowerCase();
            return line.toLowerCase();
        });
}

function resolveStatus(confidence: number, isFallback = false): TrashPrediction['status'] {
    if (isFallback) return 'fallback';
    if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return 'success';
    if (confidence >= LOW_CONFIDENCE_THRESHOLD) return 'low-confidence';
    return 'needs-review';
}

function buildPrediction(
    className: string,
    confidence: number,
    labelIndex: number,
    isFallback = false,
    guidanceOverride?: string
): TrashPrediction {
    const normalizedClass = className.toLowerCase();
    const meta =
        LABEL_METADATA[normalizedClass] || {
            classNameVi: normalizedClass,
            category: 'residual',
            pricePerKg: 0,
            color: '#757575',
            group: 'non-recyclable' as const,
        };

    return {
        className: normalizedClass,
        classNameVi: meta.classNameVi,
        confidence,
        category: meta.category,
        pricePerKg: meta.pricePerKg,
        color: meta.color,
        labelIndex,
        group: meta.group,
        status: resolveStatus(confidence, isFallback),
        guidance: guidanceOverride || GROUP_GUIDANCE[meta.group],
        isSellable: meta.group === 'recyclable',
    };
}

function extractOutputScores(rawOutput: any): number[] {
    if (rawOutput == null) return [];

    const output = Array.isArray(rawOutput)
        ? rawOutput[0]
        : typeof rawOutput === 'object'
            ? Object.values(rawOutput)[0]
            : rawOutput;

    if (ArrayBuffer.isView(output)) {
        return Array.from(output as unknown as Iterable<number>);
    }

    if (Array.isArray(output)) {
        return output.map((v) => Number(v));
    }

    return [];
}

function normalizeProbabilities(scores: number[]): number[] {
    if (!scores.length) return [];

    // 1. Kiểm tra xem có phải là Logits (số thô) hay không
    // Nếu có số âm hoặc có số > 1.1, chắc chắn là Logits
    const isLogits = scores.some(v => v < 0 || v > 1.1);

    if (isLogits) {
        // Áp dụng công thức Softmax chuẩn
        const maxLogit = Math.max(...scores);
        const exps = scores.map((v) => Math.exp(v - maxLogit));
        const expSum = exps.reduce((acc, v) => acc + v, 0);
        return exps.map((v) => v / expSum);
    }

    // 2. Nếu đã là xác suất (0-1), đảm bảo tổng bằng 1
    const sum = scores.reduce((acc, v) => acc + v, 0);
    if (sum > 0) {
        return scores.map(v => v / sum);
    }

    return scores;
}

function estimateWeight(className: string, confidence: number): number {
    // Deterministic weight estimate to keep pricing stable between scans.
    const profiles: Record<string, { min: number; base: number; max: number }> = {
        battery: { min: 0.2, base: 0.6, max: 1.5 },
        biological: { min: 0.5, base: 1.8, max: 6 },
        plastic: { min: 0.2, base: 1.2, max: 4 },
        paper: { min: 0.2, base: 0.9, max: 3.5 },
        cardboard: { min: 0.4, base: 1.5, max: 5 },
        metal: { min: 0.3, base: 1.4, max: 6 },
        glass: { min: 0.4, base: 1.7, max: 7 },
        trash: { min: 0.2, base: 0.8, max: 3 },
        clothes: { min: 0.3, base: 1.1, max: 4.5 },
        shoes: { min: 0.4, base: 1.2, max: 5 },
    };

    const profile = profiles[className] || { min: 0.3, base: 1.0, max: 4.0 };
    const safeConfidence = Math.max(0, Math.min(1, confidence));
    const confidenceBoost = 0.85 + safeConfidence * 0.3;
    const estimatedWeight = profile.base * confidenceBoost;
    const clamped = Math.max(profile.min, Math.min(profile.max, estimatedWeight));

    return Math.round(clamped * 10) / 10;
}

function loadSubjectSegmentationModule(): any | null {
    if (segmentationModuleCache !== undefined) {
        return segmentationModuleCache;
    }

    const isExpoGo =
        Constants.executionEnvironment === 'storeClient' ||
        Constants.appOwnership === 'expo';

    if (isExpoGo) {
        segmentationModuleCache = null;
        if (!segmentationInitLogged) {
            segmentationInitLogged = true;
            console.warn('ML Kit segmentation is disabled in Expo Go. Use a development build to enable it.');
        }
        return null;
    }

    try {
        const module = require('@six33/react-native-bg-removal');
        if (typeof module?.removeBackground === 'function') {
            segmentationModuleCache = module;
            segmentationModuleName = '@six33/react-native-bg-removal';
            if (!segmentationInitLogged) {
                segmentationInitLogged = true;
                console.log(`ML Kit segmentation enabled via ${segmentationModuleName}.`);
            }
            return segmentationModuleCache;
        }
    } catch {
        // No-op: try next package candidate.
    }

    try {
        const module = require('react-native-mlkit-subject-segmentation');
        segmentationModuleCache = module;
        segmentationModuleName = 'react-native-mlkit-subject-segmentation';
        if (!segmentationInitLogged) {
            segmentationInitLogged = true;
            console.log(`ML Kit segmentation enabled via ${segmentationModuleName}.`);
        }
        return segmentationModuleCache;
    } catch {
        segmentationModuleCache = null;
        if (!segmentationInitLogged) {
            segmentationInitLogged = true;
            console.warn(
                'ML Kit segmentation module not found. Install @six33/react-native-bg-removal and rebuild the app.'
            );
        }
        return null;
    }
}

function isMlKitDownloadPendingError(error: unknown): boolean {
    const message =
        error instanceof Error
            ? error.message
            : typeof error === 'string'
                ? error
                : '';

    return message.includes('Waiting for the subject segmentation optional module to be downloaded');
}

function isNoForegroundDetectedError(error: unknown): boolean {
    const message =
        error instanceof Error
            ? error.message
            : typeof error === 'string'
                ? error
                : '';

    return (
        message.includes('No foreground detected') ||
        message.includes('No subject detected') ||
        message.includes('Failed to create mask')
    );
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isSegmentationSupported(mlkitModule: any): Promise<boolean> {
    if (typeof mlkitModule?.isNativeBackgroundRemovalSupported !== 'function') {
        return true;
    }

    if (segmentationSupportChecked) {
        return segmentationSupportAvailable;
    }

    try {
        segmentationSupportAvailable = Boolean(await mlkitModule.isNativeBackgroundRemovalSupported());
    } catch {
        segmentationSupportAvailable = true;
    }

    segmentationSupportChecked = true;

    if (!segmentationSupportAvailable) {
        console.warn('ML Kit segmentation is not supported on this device/runtime.');
    }

    return segmentationSupportAvailable;
}

async function applySubjectSegmentation(imageUri: string): Promise<{ uri: string; used: boolean }> {
    type SegmentationResult = {
        uri: string;
        used: boolean;
        subjectDetected: boolean | null;
    };

    const mlkitModule = loadSubjectSegmentationModule();
    if (!mlkitModule) {
        return { uri: imageUri, used: false, subjectDetected: null } as SegmentationResult;
    }

    const now = Date.now();
    if (segmentationPendingUntil > now) {
        return { uri: imageUri, used: false, subjectDetected: null } as SegmentationResult;
    }

    if (segmentationPendingUntil !== 0 && now >= segmentationPendingUntil) {
        segmentationPendingUntil = 0;
        segmentationPendingWarned = false;
        console.log('Retrying ML Kit segmentation after waiting for optional module download.');
    }

    if (!(await isSegmentationSupported(mlkitModule))) {
        return { uri: imageUri, used: false, subjectDetected: null } as SegmentationResult;
    }

    if (typeof mlkitModule?.removeBackground === 'function') {
        for (let attempt = 1; attempt <= SEGMENTATION_RETRY_ATTEMPTS; attempt += 1) {
            try {
                const segmentedUri = await mlkitModule.removeBackground(imageUri, { trim: false });
                if (typeof segmentedUri === 'string' && segmentedUri.length > 0) {
                    segmentationPendingUntil = 0;
                    segmentationPendingWarned = false;
                    return { uri: segmentedUri, used: true, subjectDetected: true } as SegmentationResult;
                }
            } catch (error) {
                if (isNoSubjectDetectedError(error) || isNoForegroundDetectedError(error)) {
                    return { uri: imageUri, used: false, subjectDetected: false } as SegmentationResult;
                }

                if (isMlKitDownloadPendingError(error)) {
                    if (!segmentationPendingWarned) {
                        console.warn(
                            'ML Kit subject segmentation module is downloading. Segmentation will resume automatically when download completes.'
                        );
                        segmentationPendingWarned = true;
                    }

                    if (attempt < SEGMENTATION_RETRY_ATTEMPTS) {
                        await delay(SEGMENTATION_RETRY_DELAY_MS * attempt);
                        continue;
                    }

                    segmentationPendingUntil = Date.now() + SEGMENTATION_PENDING_COOLDOWN_MS;
                    return { uri: imageUri, used: false };
                }

                console.warn('ML Kit background removal failed:', error);
                if (attempt < SEGMENTATION_RETRY_ATTEMPTS) {
                    await delay(SEGMENTATION_RETRY_DELAY_MS * attempt);
                    continue;
                }

                return { uri: imageUri, used: false, subjectDetected: null } as SegmentationResult;
            }
        }
    }

    const methods = [
        mlkitModule?.segmentSubject,
        mlkitModule?.segment,
        mlkitModule?.segmentImage,
        mlkitModule?.processImage,
    ].filter((fn) => typeof fn === 'function');

    for (const method of methods) {
        let result: any;
        try {
            result = await method(imageUri);
        } catch {
            continue;
        }

        if (typeof result === 'string' && result.length > 0) {
            return { uri: result, used: true, subjectDetected: true } as SegmentationResult;
        }

        if (result && typeof result === 'object') {
            const segmentedUri =
                result.segmentedUri || result.subjectUri || result.croppedUri || result.uri;
            if (typeof segmentedUri === 'string' && segmentedUri.length > 0) {
                return { uri: segmentedUri, used: true, subjectDetected: true } as SegmentationResult;
            }
        }
    }

    return { uri: imageUri, used: false, subjectDetected: null } as SegmentationResult;
}

export async function getSubjectSegmentationPreview(
    imageUri: string
): Promise<{ uri: string; used: boolean }> {
    try {
        const result = (await applySubjectSegmentation(imageUri)) as {
            uri: string;
            used: boolean;
            subjectDetected?: boolean | null;
        };

        return { uri: result.uri, used: Boolean(result.used) };
    } catch {
        return { uri: imageUri, used: false };
    }
}

async function preprocessForTFLite(imageUri: string): Promise<{
    inputTensor: Float32Array;
    base64: string;
    segmentationUsed: boolean;
}> {
    const segmented = (await applySubjectSegmentation(imageUri)) as {
        uri: string;
        used: boolean;
        subjectDetected?: boolean | null;
    };

    if (segmented.subjectDetected === false) {
        throw new NoSubjectDetectedError();
    }

    const imageManipulator = require('expo-image-manipulator');

    const manipulated = await imageManipulator.manipulateAsync(
        segmented.uri,
        [{ resize: { width: MODEL_SIZE, height: MODEL_SIZE } }],
        { compress: 1, format: imageManipulator.SaveFormat.JPEG, base64: true }
    );

    const jpegJs = require('jpeg-js');
    const buffer = Buffer.from(manipulated.base64, 'base64');
    const decoded = jpegJs.decode(buffer, { useTArray: true });

    const { data, width, height } = decoded;
    const float32Array = new Float32Array(width * height * 3);

    // Quan trọng: KHÔNG chia 255 ở đây
    for (let i = 0; i < width * height; i++) {
        float32Array[i * 3 + 0] = data[i * 4 + 0]; // Red
        float32Array[i * 3 + 1] = data[i * 4 + 1]; // Green
        float32Array[i * 3 + 2] = data[i * 4 + 2]; // Blue
    }

    return {
        inputTensor: float32Array,
        base64: manipulated.base64,
        segmentationUsed: segmented.used,
    };
}

function parseGeminiJson(text: string): any | null {
    if (!text) return null;

    const fencedMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
    const payload = fencedMatch ? fencedMatch[1] : text;

    try {
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

async function requestGeminiFallback(
    imageBase64: string,
    topPredictions: TrashPrediction[]
): Promise<TrashPrediction | null> {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
        const hint = topPredictions
            .map((p) => `${p.className} (${(p.confidence * 100).toFixed(1)}%)`)
            .join(', ');

        const prompt = [
            'Bạn là hệ thống phân loại rác.',
            'Hãy trả về JSON với các khóa: className, confidence, guidance.',
            'className phải nằm trong 10 nhãn: battery, biological, cardboard, glass, metal, paper, plastic, trash, clothes, shoes.',
            `Gợi ý từ model hiện tại: ${hint || 'không có'}.`,
            'confidence là số 0..1.',
            'guidance là hướng dẫn xử lý ngắn gọn bằng tiếng Việt.',
        ].join(' ');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType: 'image/jpeg',
                                        data: imageBase64,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.2,
                    },
                }),
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = parseGeminiJson(text);

        const className = String(parsed?.className || '').toLowerCase();
        if (!className) return null;

        const confidence =
            typeof parsed?.confidence === 'number'
                ? Math.max(0, Math.min(1, parsed.confidence))
                : LOW_CONFIDENCE_THRESHOLD;

        const guidance =
            typeof parsed?.guidance === 'string' && parsed.guidance.trim().length > 0
                ? parsed.guidance.trim()
                : undefined;

        return buildPrediction(className, confidence, -1, true, guidance);
    } catch (error) {
        console.warn('Gemini fallback failed:', error);
        return null;
    }
}

function getMockPredictions(): TrashPrediction[] {
    return [
        buildPrediction('plastic', 0.92, 6, true),
        buildPrediction('cardboard', 0.74, 2, true),
        buildPrediction('metal', 0.42, 4, true),
    ].map((prediction) => ({
        ...prediction,
        estimatedWeight: estimateWeight(prediction.className, prediction.confidence),
    }));
}

export async function loadTrashModel(): Promise<boolean> {
    if (tfliteModel) return true;
    if (isModelLoading) {
        while (isModelLoading) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return modelAvailable;
    }

    isModelLoading = true;

    try {
        const isExpoGo =
            Constants.executionEnvironment === 'storeClient' ||
            Constants.appOwnership === 'expo';

        if (isExpoGo) {
            console.log('ℹ️ Expo Go detected - TFLite requires development build');
            modelAvailable = false;
            isModelLoading = false;
            return false;
        }

        tfliteModule = require('react-native-fast-tflite');
        const loadTensorflowModel = tfliteModule?.loadTensorflowModel;
        if (typeof loadTensorflowModel !== 'function') {
            throw new Error('react-native-fast-tflite not available');
        }

        const modelModule = require('../assets/model/model_unquant.tflite');

        try {
            tfliteModel = await loadTensorflowModel(modelModule);
        } catch {
            const asset = Asset.fromModule(modelModule);
            await asset.downloadAsync();
            const modelPath = asset.localUri || asset.uri;
            tfliteModel = await loadTensorflowModel(modelPath);
        }

        const labelsModule = require('../assets/model/labels.txt');
        const labelsAsset = Asset.fromModule(labelsModule);
        await labelsAsset.downloadAsync();
        const labelsUri = labelsAsset.localUri || labelsAsset.uri;
        const labelsText = await readAsStringAsync(labelsUri, { encoding: 'utf8' as any });
        modelLabels = parseLabelsText(labelsText);

        modelAvailable = true;
        console.log(`✅ TFLite model loaded successfully (${modelLabels.length} labels)`);
        isModelLoading = false;
        return true;
    } catch (error) {
        console.error('Failed to load TFLite model:', error);
        modelAvailable = false;
        isModelLoading = false;
        return false;
    }
}

export async function predictTrash(imageUri: string): Promise<TrashPrediction[]> {
    try {
        const loaded = await loadTrashModel();
        if (!loaded || !tfliteModel) {
            return getMockPredictions();
        }

        const preprocessed = await preprocessForTFLite(imageUri);
        const runner =
            typeof tfliteModel.runSync === 'function'
                ? tfliteModel.runSync.bind(tfliteModel)
                : tfliteModel.run.bind(tfliteModel);

        const rawOutput = await Promise.resolve(runner([preprocessed.inputTensor]));
        const scores = extractOutputScores(rawOutput);

        if (!scores.length) {
            throw new Error('TFLite model output is empty');
        }

        const probs = normalizeProbabilities(scores);

        const ranked = probs
            .map((probability, index) => ({ probability, index }))
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 3);

        let predictions = ranked.map(({ probability, index }) => {
            const className = modelLabels[index] || `class_${index}`;
            return buildPrediction(className, Number(probability), index, false);
        });

        if (predictions[0] && predictions[0].confidence < LOW_CONFIDENCE_THRESHOLD) {
            const geminiPrediction = await requestGeminiFallback(preprocessed.base64, predictions);
            if (geminiPrediction) {
                predictions = [geminiPrediction, ...predictions.slice(1)];
            }
        }

        const finalized = predictions.map((prediction) => ({
            ...prediction,
            estimatedWeight: estimateWeight(prediction.className, prediction.confidence),
        }));

        if (finalized[0]) {
            console.log(
                `AI nhận diện: ${finalized[0].classNameVi} (${finalized[0].className}) | group=${finalized[0].group} | confidence=${(finalized[0].confidence * 100).toFixed(2)}% | status=${finalized[0].status}`
            );
            console.log(`Segmentation used: ${preprocessed.segmentationUsed ? 'yes' : 'no'}`);
            const probs = normalizeProbabilities(scores);
            console.log('--- PROBABILITY MAP ---');
            probs.forEach((p, i) => console.log(`${modelLabels[i] || i}: ${(p * 100).toFixed(2)}%`));
        }

        return finalized;
    } catch (error) {
        if (isNoSubjectDetectedError(error)) {
            throw error;
        }

        console.error('Prediction error:', error);
        return getMockPredictions();
    }
}

export async function getTopPrediction(imageUri: string): Promise<TrashPrediction | null> {
    const predictions = await predictTrash(imageUri);
    return predictions.length > 0 ? predictions[0] : null;
}

export function isConfidenceAcceptable(
    confidence: number,
    threshold = HIGH_CONFIDENCE_THRESHOLD
): boolean {
    return confidence >= threshold;
}

export function disposeModel() {
    try {
        if (tfliteModel?.close) {
            tfliteModel.close();
        }
        if (tfliteModel?.dispose) {
            tfliteModel.dispose();
        }
    } catch {
        // Ignore model disposal errors.
    }

    tfliteModel = null;
    modelAvailable = false;
}
