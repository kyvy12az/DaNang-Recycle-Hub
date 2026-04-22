import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { RefreshCw, AlertCircle, Check, Scan, Brain } from 'lucide-react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import {
  loadTrashModel,
  predictTrash,
  getSubjectSegmentationPreview,
  isConfidenceAcceptable,
  TrashPrediction,
} from '@/utils/trashModel';
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

export default function AITrashRecognizer({
  imageUri,
  onRecognitionComplete,
  onRetry,
}: AITrashRecognizerProps) {
  const [step, setStep] = useState<'idle' | 'loading' | 'scanning' | 'result' | 'error'>('idle');
  const [predictions, setPredictions] = useState<TrashPrediction[]>([]);
  const [error, setError] = useState<string>('');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [segmentationPreviewUri, setSegmentationPreviewUri] = useState<string | null>(null);
  const [segmentationUsed, setSegmentationUsed] = useState(false);

  const scanProgress = useState(new Animated.Value(0))[0];
  const resultFade = useState(new Animated.Value(0))[0];

  // Load model khi component mount
  useEffect(() => {
    let isMounted = true;

    const initModel = async () => {
      try {
        const loaded = await loadTrashModel();
        if (isMounted) {
          setModelLoaded(loaded);
        }
      } catch (err) {
        console.error('Model init error:', err);
        if (isMounted) {
          setModelLoaded(false);
        }
      }
    };

    void initModel();

    return () => {
      isMounted = false;
    };
  }, []);

  // Xử lý nhận diện khi có ảnh
  const handleRecognize = useCallback(async () => {
    if (!imageUri) return;

    setStep('scanning');
    setError('');

    // Animation scanning
    Animated.timing(scanProgress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    try {
      const segmentationPreview = await getSubjectSegmentationPreview(imageUri);
      setSegmentationPreviewUri(segmentationPreview.uri);
      setSegmentationUsed(segmentationPreview.used);

      // Chạy AI prediction
      const results = await predictTrash(imageUri);
      setPredictions(results);
      const currentTopPrediction = results[0];

      // Chuyển đổi prediction thành WasteItems
      const wasteItems = results
        .filter((p) => p.isSellable && isConfidenceAcceptable(p.confidence, 0.5))
        .map((p) => {
          const matchedType = mapPredictionToWasteType(p);

          return {
            wasteType: matchedType,
            quantity: p.estimatedWeight || 1,
            confidence: p.confidence,
          };
        });

      setStep('result');

      // Fade in kết quả
      Animated.timing(resultFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Gọi callback với kết quả
      onRecognitionComplete(results, wasteItems, {
        group: currentTopPrediction?.group,
        guidance: currentTopPrediction?.guidance,
        status: currentTopPrediction?.status,
        confidence: currentTopPrediction?.confidence,
      });

    } catch (err) {
      console.error('Recognition error:', err);
      setError(err instanceof Error && err.message ? err.message : 'Không thể nhận diện rác. Vui lòng thử lại.');
      setStep('error');
    }
  }, [imageUri, onRecognitionComplete, scanProgress, resultFade]);

  const getStatusText = (status?: TrashPrediction['status']) => {
    switch (status) {
      case 'success':
        return 'Đã phân loại tốt';
      case 'low-confidence':
        return 'Độ tin cậy trung bình';
      case 'fallback':
        return 'Đã dùng AI dự phòng';
      case 'needs-review':
        return 'Cần kiểm tra lại';
      default:
        return 'Đang chờ phân loại';
    }
  };

  const getGroupText = (group?: TrashPrediction['group']) => {
    switch (group) {
      case 'recyclable':
        return 'Tái chế';
      case 'organic':
        return 'Hữu cơ';
      case 'hazardous':
        return 'Nguy hại';
      case 'non-recyclable':
        return 'Không tái chế';
      default:
        return 'Chưa xác định';
    }
  };

  // Kiểm tra confidence đủ cao không
  const topPrediction = predictions[0];
  const isConfidenceLow = topPrediction && !isConfidenceAcceptable(topPrediction.confidence, 0.7);

  const scanWidth = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Map model output classes to categories available in current wasteTypes list.
  const mapPredictionToWasteType = (prediction: TrashPrediction): WasteType => {
    const className = prediction.className.toLowerCase();
    const category = prediction.category.toLowerCase();

    const directTypeByClass: Record<string, string> = {
      shoes: 'Giày dép cũ',
      battery: 'Pin đã qua sử dụng',
      biological: 'Rác hữu cơ',
    };

    const exactTypeName = directTypeByClass[className];
    if (exactTypeName) {
      const exactMatch = wasteTypes.find((wt) => wt.name === exactTypeName);
      if (exactMatch) {
        return exactMatch;
      }
    }

    const mappedCategoryByClass: Record<string, string> = {
      battery: 'hazardous',
      biological: 'organic',
      cardboard: 'paper',
      glass: 'glass',
      metal: 'metal',
      paper: 'paper',
      plastic: 'plastic',
      trash: 'residual',
      clothes: 'textile',
      shoes: 'textile',
    };

    const mappedCategory =
      mappedCategoryByClass[className] ||
      mappedCategoryByClass[category] ||
      category;

    const matched = wasteTypes.find((wt) => wt.category === mappedCategory);
    return matched || wasteTypes[0];
  };

  if (!imageUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.noImageText}>Chưa có ảnh nào được chọn</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Preview ảnh */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />

        {step === 'scanning' && (
          <View style={styles.scanOverlay}>
            {segmentationUsed && segmentationPreviewUri && (
              <Image source={{ uri: segmentationPreviewUri }} style={styles.segmentPreview} contentFit="contain" />
            )}
            <Scan size={64} color={Colors.primaryLight} />
            <Animated.View style={[styles.scanLine, { width: scanWidth }]} />
          </View>
        )}
      </View>

      {/* Controls */}
      {step === 'idle' && (
        <View style={styles.controls}>
          <View style={styles.modelStatus}>
            <Brain size={20} color={modelLoaded ? Colors.success : Colors.warning} />
            <Text style={[styles.modelStatusText, { color: modelLoaded ? Colors.success : Colors.warning }]}>
              {modelLoaded ? 'AI Model sẵn sàng' : 'Sử dụng AI dự phòng'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.recognizeButton}
            onPress={handleRecognize}
            activeOpacity={0.8}
          >
            <Brain size={22} color={Colors.white} />
            <Text style={styles.recognizeButtonText}>Nhận diện bằng AI</Text>
          </TouchableOpacity>

          <Text style={styles.hintText}>
            AI sẽ tự động phân loại và ước tính khối lượng rác
          </Text>
        </View>
      )}

      {step === 'scanning' && (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.scanningText}>🤖 AI đang phân tích...</Text>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: scanWidth }]} />
          </View>
          <Text style={styles.scanSubtext}>Nhận diện loại rác, ước lượng khối lượng</Text>
        </View>
      )}

      {step === 'result' && (
        <Animated.View style={[styles.resultContainer, { opacity: resultFade }]}>
          <View style={styles.resultHeader}>
            <View style={styles.aiIcon}>
              <Check size={20} color={Colors.white} />
            </View>
            <Text style={styles.resultTitle}>Kết quả nhận diện</Text>
          </View>

          {isConfidenceLow && (
            <View style={styles.warningBox}>
              <AlertCircle size={18} color={Colors.warning} />
              <Text style={styles.warningText}>
                Độ tin cậy thấp ({(topPrediction.confidence * 100).toFixed(0)}%).
                Vui lòng chụp lại ảnh rõ hơn.
              </Text>
            </View>
          )}

          {topPrediction?.guidance && (
            <View style={styles.warningBox}>
              <Brain size={18} color={Colors.primary} />
              <Text style={styles.warningText}>{topPrediction.guidance}</Text>
            </View>
          )}

          {topPrediction && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLine}>Tình trạng phân loại: {getStatusText(topPrediction.status)}</Text>
              <Text style={styles.summaryLine}>Loại rác: {topPrediction.classNameVi} ({topPrediction.className})</Text>
              <Text style={styles.summaryLine}>Nhóm phân loại: {getGroupText(topPrediction.group)}</Text>
              <Text style={styles.summaryLine}>Hướng dẫn xử lý: {topPrediction.guidance}</Text>
            </View>
          )}

          {predictions.slice(0, 3).map((pred, _index) => (
            <View key={_index} style={styles.predictionItem}>
              <View style={[styles.predictionRank, _index === 0 && styles.predictionRankFirst]}>
                <Text style={styles.predictionRankText}>{_index + 1}</Text>
              </View>
              <View style={styles.predictionInfo}>
                <Text style={styles.predictionName}>{pred.classNameVi}</Text>
                <Text style={styles.predictionCategory}>{pred.category}</Text>
                <Text style={styles.predictionCategory}>Nhóm: {pred.group}</Text>
              </View>
              <View style={styles.predictionStats}>
                <Text style={[styles.confidenceText, { color: pred.confidence >= 0.7 ? Colors.success : pred.confidence >= 0.5 ? Colors.warning : Colors.error }]}>
                  {(pred.confidence * 100).toFixed(0)}%
                </Text>
                {pred.estimatedWeight && (
                  <Text style={styles.weightText}>~{pred.estimatedWeight}kg</Text>
                )}
              </View>
            </View>
          ))}

          <View style={styles.actionButtons}>
            {isConfidenceLow && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={onRetry}
                activeOpacity={0.8}
              >
                <RefreshCw size={18} color={Colors.primary} />
                <Text style={styles.retryButtonText}>Chụp lại</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.confirmButton, isConfidenceLow && styles.confirmButtonSecondary]}
              onPress={() => {
                // Chuyển sang form xác nhận
                const wasteItems = predictions
                  .filter(p => p.isSellable && isConfidenceAcceptable(p.confidence, 0.5))
                  .map((p) => {
                    const matchedType = mapPredictionToWasteType(p);
                    return {
                      wasteType: matchedType,
                      quantity: p.estimatedWeight || 1,
                      confidence: p.confidence,
                    };
                  });
                onRecognitionComplete(predictions, wasteItems, {
                  group: topPrediction?.group,
                  guidance: topPrediction?.guidance,
                  status: topPrediction?.status,
                  confidence: topPrediction?.confidence,
                });
              }}
              activeOpacity={0.8}
            >
              <Check size={18} color={Colors.white} />
              <Text style={styles.confirmButtonText}>
                {isConfidenceLow ? 'Tiếp tục vẫn chấp nhận' : 'Xác nhận'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {step === 'error' && (
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => void handleRecognize()}
            activeOpacity={0.8}
          >
            <RefreshCw size={18} color={Colors.primary} />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}
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
});
