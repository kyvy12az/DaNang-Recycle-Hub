import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';

// 10 class labels from your dataset
const CLASS_NAMES = [
  'battery',
  'biological',
  'cardboard',
  'glass',
  'metal',
  'paper',
  'plastic',
  'trash',
  'clothes',
  'shoes',
];

export default function App() {
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [tfReady, setTfReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [model, setModel] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const [result, setResult] = useState(null);

  useEffect(() => {
    let mounted = true;

    // Initialize TensorFlow and load bundled model from assets/model
    const init = async () => {
      try {
        await tf.ready();

        // IMPORTANT:
        // Keep these shard names in sync with files inside assets/model.
        const modelJson = require('./assets/model/model.json');
        const modelWeights = [
          require('./assets/model/group1-shard1of3.bin'),
          require('./assets/model/group1-shard2of3.bin'),
          require('./assets/model/group1-shard3of3.bin'),
        ];

        // Load graph model from local bundled assets
        const loadedModel = await tf.loadGraphModel(
          bundleResourceIO(modelJson, modelWeights)
        );

        if (!mounted) return;
        setModel(loadedModel);
        setTfReady(true);
        setModelReady(true);
      } catch (error) {
        console.error('TensorFlow init/load error:', error);
        if (!mounted) return;
        Alert.alert(
          'Model load error',
          'Khong the load model. Kiem tra model.json va file .bin trong assets/model.'
        );
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Convert captured camera image to tensor [1, 224, 224, 3] and normalize to 0..1
  const preprocessImageToTensor = async (photoUri) => {
    // Read captured file as base64
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Decode base64 to bytes then decode JPEG to tensor [H, W, 3]
    const imageBuffer = tf.util.encodeString(base64, 'base64').buffer;
    const raw = new Uint8Array(imageBuffer);
    const imageTensor = decodeJpeg(raw);

    // Resize to model input shape, cast float, normalize 0..1, add batch dimension
    const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
    const normalized = resized.toFloat().div(tf.scalar(255.0));
    const batched = normalized.expandDims(0);

    // Dispose intermediates to avoid memory leaks
    imageTensor.dispose();
    resized.dispose();
    normalized.dispose();

    return batched;
  };

  const runPrediction = async () => {
    if (!cameraRef.current) return;
    if (!model) {
      Alert.alert('Model chua san sang', 'Vui long doi model load xong.');
      return;
    }

    setIsPredicting(true);

    try {
      // 1) Capture image from Expo Camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });

      // 2) Preprocess image to [1,224,224,3], normalized 0..1
      const inputTensor = await preprocessImageToTensor(photo.uri);

      // 3) model.predict
      const output = model.predict(inputTensor);
      const outputTensor = Array.isArray(output) ? output[0] : output;

      // 4) Read prediction scores
      const scores = await outputTensor.data();

      // Find top-1 class
      let bestIndex = 0;
      let bestScore = scores[0];
      for (let i = 1; i < scores.length; i += 1) {
        if (scores[i] > bestScore) {
          bestScore = scores[i];
          bestIndex = i;
        }
      }

      setResult({
        className: CLASS_NAMES[bestIndex] || `class_${bestIndex}`,
        confidence: Number(bestScore),
      });

      // Cleanup
      inputTensor.dispose();
      outputTensor.dispose();
    } catch (error) {
      console.error('Predict error:', error);
      Alert.alert('Predict error', 'Khong the classify anh. Vui long thu lai.');
    } finally {
      setIsPredicting(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.infoText}>Dang kiem tra quyen camera...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.infoText}>Ung dung can quyen camera de nhan dien rac.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Cap quyen camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>AI Waste Classifier</Text>

      <View style={styles.cameraWrapper}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>
          TF: {tfReady ? 'Ready' : 'Loading...'} | Model: {modelReady ? 'Ready' : 'Loading...'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, (isPredicting || !modelReady) && styles.buttonDisabled]}
        onPress={runPrediction}
        disabled={isPredicting || !modelReady}
      >
        <Text style={styles.buttonText}>
          {isPredicting ? 'Dang phan loai...' : 'Chup anh va classify'}
        </Text>
      </TouchableOpacity>

      <View style={styles.resultBox}>
        <Text style={styles.resultTitle}>Ket qua:</Text>
        {result ? (
          <>
            <Text style={styles.resultText}>Class: {result.className}</Text>
            <Text style={styles.resultText}>
              Confidence: {(result.confidence * 100).toFixed(2)}%
            </Text>
          </>
        ) : (
          <Text style={styles.resultPlaceholder}>Chua co ket qua.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F5F7',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F5F7',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 12,
  },
  cameraWrapper: {
    height: 360,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#DDE3E8',
  },
  camera: {
    flex: 1,
  },
  statusRow: {
    marginTop: 10,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#37474F',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#90A4AE',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resultBox: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#263238',
  },
  resultText: {
    fontSize: 15,
    color: '#263238',
    marginBottom: 4,
  },
  resultPlaceholder: {
    fontSize: 14,
    color: '#607D8B',
  },
  infoText: {
    fontSize: 16,
    color: '#263238',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
});
