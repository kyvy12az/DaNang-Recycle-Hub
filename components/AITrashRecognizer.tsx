import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshCw, AlertCircle, Check, Scan, Brain } from 'lucide-react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { TrashPrediction } from '@/utils/trashModel';
import { wasteTypes } from '@/mocks/data';
import { WasteType } from '@/types';

interface AITrashRecognizerProps {
  imageUri: string | null;
  onRecognitionComplete: (
    predictions: TrashPrediction[],
    wasteItems: { wasteType: WasteType; quantity: number; confidence: number }[],
    analysis?: { group?: string; guidance?: string; status?: string; confidence?: number }
  ) => void;
  onRetry: () => void;
}

// cấu hình nhãn tiếng việt
const LABEL_MAP: Record<string, any> = {
  'battery': { vi: 'Pin/Ắc quy', group: 'hazardous', cat: 'hazardous', price: 0, guidance: 'Gom riêng, đưa đến điểm thu gom pin chuyên dụng.' },
  'biological': { vi: 'Thực phẩm', group: 'organic', cat: 'organic', price: 0, guidance: 'Ủ phân compost hoặc làm thức ăn gia súc.' },
  'cardboard': { vi: 'Bìa Carton', group: 'recyclable', cat: 'paper', price: 3000, guidance: 'Gấp gọn, giữ khô ráo.' },
  'clothes': { vi: 'Quần áo', group: 'non-recyclable', cat: 'residual', price: 0, guidance: 'Tái sử dụng hoặc bỏ thùng rác sinh hoạt.' },
  'glass': { vi: 'Thủy tinh', group: 'recyclable', cat: 'glass', price: 1500, guidance: 'Rửa sạch, để riêng tránh rơi vỡ.' },
  'metal': { vi: 'Kim loại', group: 'recyclable', cat: 'metal', price: 8000, guidance: 'Thu gom bán ve chai hoặc đơn vị tái chế.' },
  'paper': { vi: 'Giấy', group: 'recyclable', cat: 'paper', price: 2500, guidance: 'Loại bỏ ghim bấm, giữ sạch.' },
  'plastic': { vi: 'Nhựa', group: 'recyclable', cat: 'plastic', price: 4000, guidance: 'Ép bẹp để tiết kiệm diện tích.' },
  'shoes': { vi: 'Giày dép', group: 'non-recyclable', cat: 'residual', price: 0, guidance: 'Bỏ vào thùng rác sinh hoạt.' },
  'trash': { vi: 'Rác còn lại', group: 'non-recyclable', cat: 'residual', price: 0, guidance: 'Bỏ vào túi rác mang đi chôn lấp hoặc đốt.' },
  'not_waste': { vi: 'Không phải rác', group: 'not_waste', cat: 'not_waste', price: 0, guidance: 'Đây không phải là chất thải có thể tái chế.' },
};

type ApiClassificationResponse = {
  success?: boolean;
  label?: string;
  source?: string;
  provider?: string;
  confidence?: number | string;
  data?: {
    label?: string;
    source?: string;
    provider?: string;
    confidence?: number | string;
  };
};

const LABEL_ALIASES: Record<string, string> = {
  battery: 'battery',
  pin: 'battery',
  biological: 'biological',
  organic: 'biological',
  cardboard: 'cardboard',
  carton: 'cardboard',
  clothes: 'clothes',
  textile: 'clothes',
  glass: 'glass',
  metal: 'metal',
  paper: 'paper',
  plastic: 'plastic',
  shoes: 'shoes',
  footwear: 'shoes',
  trash: 'trash',
  residual: 'trash',
  waste: 'trash',
  not_waste: 'not_waste',
  notwaste: 'not_waste',
  not: 'not_waste',
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// chuẩn hóa nhãn
function normalizeLabel(label?: string) {
  const normalized = normalizeText(label || '');
  if (!normalized) return 'trash';
  return LABEL_ALIASES[normalized] || normalized;
}

// lấy tên model từ response
function resolveSourceLabel(response: ApiClassificationResponse) {
  const source = `${response.source || ''} ${response.provider || ''}`.toLowerCase();
  if (source.includes('gemini')) return 'Gemini AI';
  if (source.includes('azure')) return 'Azure Custom Vision';
  return response.source || response.provider || 'Unknown';
}

// chuẩn hóa confidence
function normalizeConfidence(value: number | string | undefined, sourceLabel: string) {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed === 'number' && Number.isFinite(parsed)) {
    return parsed > 1 ? parsed / 100 : Math.min(1, Math.max(0, parsed));
  }

  return sourceLabel === 'Gemini AI' ? 0.85 : 0.8;
}

export default function AITrashRecognizer({
  imageUri,
  onRecognitionComplete,
  onRetry,
}: AITrashRecognizerProps) {
  const [step, setStep] = useState<'idle' | 'loading' | 'scanning' | 'result' | 'error'>('idle');
  const [predictions, setPredictions] = useState<TrashPrediction[]>([]);
  const [error, setError] = useState<string>('');
  const [sourceLabel, setSourceLabel] = useState<string>('Unknown');

  const scanProgress = useRef(new Animated.Value(0)).current;
  const resultFade = useRef(new Animated.Value(0)).current;

  // xử lý nhận diện
  const handleRecognize = useCallback(async () => {
    if (!imageUri) return;

    setStep('scanning');
    setError('');

    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanProgress, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(scanProgress, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    );
    scanLoop.start();

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'trash.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/ai/classify`, {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as ApiClassificationResponse;

      if (!response.ok || !result.success) {
        throw new Error((result as any)?.error || `Lỗi từ máy chủ (${response.status})`);
      }

      const resolvedSourceLabel = resolveSourceLabel(result);
      setSourceLabel(resolvedSourceLabel);

      const normalizedLabel = normalizeLabel(result.label || result.data?.label);
      const label = LABEL_MAP[normalizedLabel] ? normalizedLabel : 'trash';
      const meta = LABEL_MAP[label] || LABEL_MAP['trash'];
      const confidenceNum = normalizeConfidence(result.confidence ?? result.data?.confidence, resolvedSourceLabel);
      const status = resolvedSourceLabel === 'Gemini AI'
        ? 'fallback'
        : confidenceNum >= 0.8
          ? 'success'
          : 'low-confidence';

      const finalPrediction: TrashPrediction = {
        className: label,
        classNameVi: meta.vi,
        confidence: confidenceNum,
        group: meta.group,
        status,
        guidance: meta.guidance,
        category: meta.cat,
        pricePerKg: meta.price,
        color: Colors.primary,
        isSellable: meta.price > 0,
        labelIndex: 0
      };

      setPredictions([finalPrediction]);

      // đối với không phải rác, không thêm vào danh sách
      const wasteItems = (meta.group !== 'not_waste' && meta.group === 'recyclable') ? [{
        wasteType: wasteTypes.find(wt => wt.category === meta.cat) || wasteTypes[0],
        quantity: 1,
        confidence: confidenceNum
      }] : [];

      setStep('result');
      Animated.timing(resultFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();

      onRecognitionComplete([finalPrediction], wasteItems, {
        group: meta.group,
        guidance: meta.guidance,
        status,
        confidence: confidenceNum
      });

    } catch (err: any) {
      console.error('AI Recognition Error:', err);
      setError(err.message || 'Không thể kết nối với hệ thống nhận diện.');
      setStep('error');
    } finally {
      scanLoop.stop();
    }
  }, [imageUri, onRecognitionComplete, resultFade, scanProgress]);

  useEffect(() => {
    if (imageUri && step === 'idle') {
      handleRecognize();
    }
  }, [imageUri, step, handleRecognize]);

  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />

          {/* Hiệu ứng Scanning hiện đại */}
          {step === 'scanning' && (
            <View style={StyleSheet.absoluteFill}>
              {/* 4 Góc khung hình AI */}
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />

              {/* Tia Laser quét */}
              <Animated.View
                style={[
                  styles.laserLine,
                  {
                    top: scanProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['10%', '90%'],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={['transparent', Colors.primary, 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.laserGradient}
                />
              </Animated.View>

              <View style={styles.scanStatusOverlay}>
                <ActivityIndicator size="small" color={Colors.white} />
                <Text style={styles.scanStatusText}>Đang nhận diện vật thể...</Text>
              </View>
            </View>
          )}

          {step === 'result' && (
            <View style={styles.successOverlay}>
              <Animated.View style={{ opacity: resultFade }}>
                <View style={styles.checkCircle}>
                  <Check size={24} color={Colors.white} />
                </View>
              </Animated.View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Scan size={48} color={Colors.textLight} />
          <Text style={styles.noImageText}>Chưa có dữ liệu hình ảnh</Text>
        </View>
      )}

      <View style={styles.controls}>
        {/* Header Status */}
        <View style={styles.headerInfo}>
          <View style={styles.aiBadge}>
            <Brain size={12} color={Colors.primary} />
            <Text style={styles.aiBadgeText}>AI ENGINE ACTIVE</Text>
          </View>
          <Text style={styles.modelText}>Hybrid Mode: Azure & Gemini</Text>
        </View>

        {step === 'result' && predictions[0] && (
          <Animated.View style={[styles.resultCard, { opacity: resultFade }]}>
            <View style={styles.resultMainRow}>
              <View>
                <Text style={styles.predictionLabel}>Kết quả phân tích:</Text>
                <Text style={styles.predictionValue}>{predictions[0].classNameVi}</Text>
              </View>
              <View style={[styles.confidenceBadge, { backgroundColor: predictions[0].confidence > 0.7 ? '#E8F5E9' : '#FFF3E0' }]}>
                <Text style={[styles.confidenceText, { color: predictions[0].confidence > 0.7 ? '#2E7D32' : '#EF6C00' }]}>
                  {(predictions[0].confidence * 100).toFixed(0)}%
                </Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Phân loại</Text>
                <Text style={styles.infoValue}>
                  {predictions[0].group === 'recyclable' ? '♻️ Tái chế' :
                    predictions[0].group === 'organic' ? '🍎 Hữu cơ' : '🗑️ Rác thải'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Xử lý</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{predictions[0].guidance}</Text>
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.secondaryButton} onPress={onRetry}>
                <RefreshCw size={18} color={Colors.text} />
                <Text style={styles.secondaryButtonText}>Chụp lại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => onRecognitionComplete(predictions, [], {})}
              >
                <Check size={18} color={Colors.white} />
                <Text style={styles.primaryButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {step === 'error' && (
          <View style={styles.errorBox}>
            <AlertCircle size={24} color={Colors.error} />
            <Text style={styles.errorTitle}>Không thể nhận diện</Text>
            <Text style={styles.errorDesc}>{error}</Text>
            <TouchableOpacity style={styles.retryAction} onPress={onRetry}>
              <Text style={styles.retryActionText}>Thử lại ngay</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46, 125, 50, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentPreview: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
    transform: [{ translateY: -24 }],
  },
  scanLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: Colors.primaryLight,
    top: '50%',
    left: 0,
  },
  noImageText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    padding: 20,
  },
  controls: {
    marginTop: 16,
    gap: 12,
  },
  modelStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  modelStatusText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  recognizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  recognizeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  hintText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 13,
  },
  scanningContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  scanningText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  scanSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  resultContainer: {
    marginTop: 16,
    gap: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    gap: 4,
  },
  summaryLine: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '500' as const,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  predictionRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionRankFirst: {
    backgroundColor: Colors.primary,
  },
  predictionRankText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  predictionInfo: {
    flex: 1,
  },
  predictionName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  predictionCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'capitalize' as const,
  },
  predictionStats: {
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  weightText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  confirmButtonSecondary: {
    backgroundColor: Colors.textSecondary,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  errorContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  cornerTopLeft: { position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderLeftWidth: 4, borderTopWidth: 4, borderColor: Colors.primary, borderTopLeftRadius: 12 },
  cornerTopRight: { position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRightWidth: 4, borderTopWidth: 4, borderColor: Colors.primary, borderTopRightRadius: 12 },
  cornerBottomLeft: { position: 'absolute', bottom: 20, left: 20, width: 40, height: 40, borderLeftWidth: 4, borderBottomWidth: 4, borderColor: Colors.primary, borderBottomLeftRadius: 12 },
  cornerBottomRight: { position: 'absolute', bottom: 20, right: 20, width: 40, height: 40, borderRightWidth: 4, borderBottomWidth: 4, borderColor: Colors.primary, borderBottomRightRadius: 12 },

  laserLine: { position: 'absolute', left: '10%', right: '10%', height: 2, zIndex: 10 },
  laserGradient: { height: '100%', width: '100%', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 },

  scanStatusOverlay: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  scanStatusText: { color: Colors.white, fontSize: 14, fontWeight: '500' },

  // Card kết quả
  resultCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  resultMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  predictionLabel: { fontSize: 12, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  predictionValue: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginTop: 4 },
  
  confidenceBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },

  infoGrid: { flexDirection: 'row', backgroundColor: '#F8F9FA', borderRadius: 16, padding: 15, marginBottom: 20 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  divider: { width: 1, backgroundColor: '#DDD', marginHorizontal: 15 },

  buttonGroup: { flexDirection: 'row', gap: 12 },
  primaryButton: { flex: 2, backgroundColor: Colors.primary, flexDirection: 'row', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: '#DDD', flexDirection: 'row', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryButtonText: { color: Colors.text, fontWeight: '600' },
  
  successOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(46, 125, 50, 0.2)', // Màu xanh lá trong suốt
  justifyContent: 'center',
  alignItems: 'center',
},
checkCircle: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: Colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: Colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
},

// Trạng thái trống
emptyContainer: {
  flex: 1,
  height: 300,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#F5F5F5',
  borderRadius: 20,
  borderWidth: 2,
  borderColor: '#E0E0E0',
  borderStyle: 'dashed',
},

// Thông tin Header (AI Status)
headerInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 15,
},
modelText: {
  fontSize: 12,
  color: Colors.textSecondary,
  fontStyle: 'italic',
},

// Thông báo lỗi (Error Box)
errorBox: {
  backgroundColor: '#FFEBEE',
  padding: 20,
  borderRadius: 20,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#FFCDD2',
},
errorTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#C62828',
  marginTop: 10,
},
errorDesc: {
  fontSize: 14,
  color: '#D32F2F',
  textAlign: 'center',
  marginTop: 8,
  marginBottom: 15,
},
retryAction: {
  paddingHorizontal: 20,
  paddingVertical: 10,
  backgroundColor: '#C62828',
  borderRadius: 10,
},
retryActionText: {
  color: Colors.white,
  fontWeight: '600',
  fontSize: 14,
},

// Style phụ trợ cho Badge
aiBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: '#E8F5E9',
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 8,
},
aiBadgeText: {
  fontSize: 11,
  fontWeight: '800',
  color: Colors.primary,
},
});
