import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// TensorFlow dependencies - loaded only in development builds, not in Expo Go
let tf: any = null;
let decodeJpeg: any = null;
let bundleResourceIO: any = null;
let dependenciesLoaded = false;
let dependenciesAvailable = false;

// Lazy load dependencies - only works in development/production builds
// Will fail gracefully in Expo Go
const loadDependencies = async () => {
  if (dependenciesLoaded) {
    return dependenciesAvailable ? { tf, decodeJpeg } : null;
  }

  dependenciesLoaded = true;

  // Expo Go cannot provide ExpoGL native module required by tfjs-react-native.
  const isExpoGo =
    Constants.executionEnvironment === 'storeClient' ||
    Constants.appOwnership === 'expo';

  if (isExpoGo) {
    dependenciesAvailable = false;
    console.log('ℹ️  Expo Go detected - using mock predictions');
    console.log('ℹ️  Build dev app for real AI: npx expo run:android or npx expo run:ios');
    return null;
  }

  try {
    const tfModule = await import('@tensorflow/tfjs');
    const tfReactNative = await import('@tensorflow/tfjs-react-native');

    tf = tfModule;
    decodeJpeg = tfReactNative.decodeJpeg;
    bundleResourceIO = tfReactNative.bundleResourceIO;

    dependenciesAvailable = true;
    console.log('✅ TensorFlow.js loaded successfully');
    return { tf, decodeJpeg };
  } catch (error) {
    dependenciesAvailable = false;
    console.log('ℹ️  TensorFlow unavailable - using mock predictions');
    return null;
  }
};

// Các lớp rác từ TrashNet dataset
const TRASH_CLASSES = [
  { en: 'battery', vi: 'Pin', category: 'electronics', pricePerKg: 15000, color: '#7E57C2' },
  { en: 'biological', vi: 'Rác hữu cơ', category: 'organic', pricePerKg: 1000, color: '#66BB6A' },
  { en: 'cardboard', vi: 'Giấy carton', category: 'paper', pricePerKg: 6000, color: '#8D6E63' },
  { en: 'glass', vi: 'Thủy tinh', category: 'glass', pricePerKg: 3000, color: '#26A69A' },
  { en: 'metal', vi: 'Kim loại', category: 'metal', pricePerKg: 25000, color: '#78909C' },
  { en: 'paper', vi: 'Giấy', category: 'paper', pricePerKg: 4000, color: '#8D6E63' },
  { en: 'plastic', vi: 'Nhựa', category: 'plastic', pricePerKg: 10000, color: '#2196F3' },
  { en: 'trash', vi: 'Rác thải', category: 'other', pricePerKg: 0, color: '#757575' },
  { en: 'clothes', vi: 'Quần áo cũ', category: 'textile', pricePerKg: 5000, color: '#8E24AA' },
  { en: 'shoes', vi: 'Giày dép cũ', category: 'textile', pricePerKg: 5000, color: '#5E35B1' },
];

export interface TrashPrediction {
  className: string;
  classNameVi: string;
  confidence: number;
  category: string;
  pricePerKg: number;
  color: string;
  estimatedWeight?: number;
}

let tfjsModel: any = null;
let isModelLoading = false;

// Ước lượng khối lượng dựa trên confidence và loại rác
function estimateWeight(className: string, confidence: number): number {
  const baseWeights: Record<string, number> = {
    'battery': 0.8,
    'biological': 4,
    'plastic': 5,
    'paper': 3,
    'cardboard': 4,
    'metal': 2,
    'glass': 6,
    'trash': 1,
    'clothes': 2,
    'shoes': 1.5,
  };

  const baseWeight = baseWeights[className] || 3;
  // Confidence càng cao, ước lượng càng chính xác
  const variance = (1 - confidence) * 2;
  const estimatedWeight = baseWeight + (Math.random() * variance - variance / 2);

  return Math.max(0.5, Math.round(estimatedWeight * 2) / 2);
}

// Load model từ assets hoặc URL
export async function loadTrashModel(): Promise<boolean> {
  if (tfjsModel) return true;
  if (isModelLoading) {
    // Đợi model đang load
    while (isModelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return tfjsModel !== null;
  }

  isModelLoading = true;

  try {
    // Load TensorFlow dependencies
    const deps = await loadDependencies();
    if (!deps) {
      console.log('📱 Running in Expo Go - AI features disabled, using mock predictions');
      isModelLoading = false;
      return false;
    }

    const { tf } = deps;

    // Khởi tạo TensorFlow.js backend
    await tf.ready();
    console.log('TensorFlow.js backend ready:', tf.getBackend());

    // Load TFJS model from bundled assets/model
    try {
      const modelJson = require('../assets/model/model.json');
      const modelWeights = [
        require('../assets/model/group1-shard1of3.bin'),
        require('../assets/model/group1-shard2of3.bin'),
        require('../assets/model/group1-shard3of3.bin'),
      ];

      const modelIOHandler = bundleResourceIO(modelJson, modelWeights);

      // Support both GraphModel and LayersModel exports.
      try {
        tfjsModel = await tf.loadGraphModel(modelIOHandler);
        console.log('✅ TFJS GraphModel loaded successfully');
      } catch {
        tfjsModel = await tf.loadLayersModel(modelIOHandler);
        console.log('✅ TFJS LayersModel loaded successfully');
      }
    } catch (tfjsError) {
      console.warn('⚠️  TFJS model not found, using mock predictions:', tfjsError);
      // Will use mock predictions
    }

    isModelLoading = false;
    return tfjsModel !== null;
  } catch (error) {
    console.error('Failed to load model:', error);
    isModelLoading = false;
    return false;
  }
}

// Chuyển đổi ảnh thành tensor
async function imageToTensor(imageUri: string, tf: any, decodeJpeg: any): Promise<any> {
  if (Platform.OS === 'web') {
    // Web: sử dụng HTMLImageElement
    const image = new Image();
    image.src = imageUri;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
    });

    const imageTensor = tf.browser.fromPixels(image);
    const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
    const normalized = resized.div(255.0);
    const batched = normalized.expandDims(0);

    // Cleanup
    imageTensor.dispose();
    resized.dispose();
    normalized.dispose();

    return batched;
  } else {
    // Native: Sử dụng FileSystem để đọc file và xử lý
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Decode base64 thành Uint8Array (works in React Native without atob)
    const imageBuffer = tf.util.encodeString(base64, 'base64').buffer;
    const bytes = new Uint8Array(imageBuffer);

    // Sử dụng decodeJpeg từ @tensorflow/tfjs-react-native
    const imageTensor = decodeJpeg(bytes, 3);
    const resized = tf.image.resizeBilinear(imageTensor, [224, 224], true);
    const normalized = resized.toFloat().div(tf.scalar(255.0));
    const batched = normalized.expandDims(0);

    // Cleanup
    imageTensor.dispose();
    resized.dispose();
    normalized.dispose();

    return batched;
  }
}

// Xử lý ảnh và predict
export async function predictTrash(imageUri: string): Promise<TrashPrediction[]> {
  const loaded = await loadTrashModel();
  if (!loaded || !tfjsModel) {
    // Nếu không load được model, trả về mock predictions
    return getMockPredictions();
  }

  try {
    // Load dependencies
    const deps = await loadDependencies();
    if (!deps) {
      return getMockPredictions();
    }

    const { tf, decodeJpeg } = deps;

    // Chuyển đổi ảnh thành tensor
    const inputTensor = await imageToTensor(imageUri, tf, decodeJpeg);

    // Dự đoán
    // Support GraphModel.executeAsync / GraphModel.predict / LayersModel.predict
    const rawOutput =
      typeof tfjsModel.executeAsync === 'function'
        ? await tfjsModel.executeAsync(inputTensor)
        : tfjsModel.predict(inputTensor);

    const predictionTensor = Array.isArray(rawOutput) ? rawOutput[0] : rawOutput;
    const probabilities = await predictionTensor.data();

    const predictions: TrashPrediction[] = Array.from(probabilities)
      .map((prob, idx) => ({
        className: TRASH_CLASSES[idx]?.en || `class_${idx}`,
        classNameVi: TRASH_CLASSES[idx]?.vi || 'Không xác định',
        confidence: Number(prob),
        category: TRASH_CLASSES[idx]?.category || 'other',
        pricePerKg: TRASH_CLASSES[idx]?.pricePerKg || 0,
        color: TRASH_CLASSES[idx]?.color || '#757575',
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    predictionTensor.dispose();
    if (Array.isArray(rawOutput)) {
      rawOutput.forEach((tensor) => {
        if (tensor !== predictionTensor && typeof tensor?.dispose === 'function') {
          tensor.dispose();
        }
      });
    }

    // Cleanup
    inputTensor.dispose();

    // Thêm ước lượng khối lượng
    return predictions.map(p => ({
      ...p,
      estimatedWeight: estimateWeight(p.className, p.confidence),
    }));

  } catch (error) {
    console.error('Prediction error:', error);
    // Fallback sang mock
    return getMockPredictions();
  }
}

// Mock predictions khi không có model
function getMockPredictions(): TrashPrediction[] {
  const mockResults: TrashPrediction[] = [
    { className: 'plastic', classNameVi: 'Nhựa', confidence: 0.92, category: 'plastic', pricePerKg: 10000, color: '#2196F3' },
    { className: 'cardboard', classNameVi: 'Giấy carton', confidence: 0.74, category: 'paper', pricePerKg: 6000, color: '#8D6E63' },
    { className: 'metal', classNameVi: 'Kim loại', confidence: 0.42, category: 'metal', pricePerKg: 25000, color: '#78909C' },
  ];

  return mockResults.map(p => ({
    ...p,
    estimatedWeight: estimateWeight(p.className, p.confidence),
  }));
}

// Lấy top prediction
export async function getTopPrediction(imageUri: string): Promise<TrashPrediction | null> {
  const predictions = await predictTrash(imageUri);
  return predictions.length > 0 ? predictions[0] : null;
}

// Kiểm tra confidence có đủ cao không
export function isConfidenceAcceptable(confidence: number, threshold = 0.7): boolean {
  return confidence >= threshold;
}

// Giải phóng model
export function disposeModel() {
  if (tfjsModel) {
    tfjsModel.dispose();
    tfjsModel = null;
  }
}
