
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type CameraCapturedPicture,
} from "expo-camera";

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [photo, setPhoto] =
    useState<CameraCapturedPicture | null>(null);

  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || capturing) {
      return;
    }

    setCapturing(true);
    setError(null);

    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!result?.uri) {
        throw new Error("Không nhận được ảnh từ camera.");
      }

      setPhoto(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể chụp ảnh. Vui lòng thử lại."
      );
    } finally {
      setCapturing(false);
    }
  }, [cameraReady, capturing]);

  const retakePicture = useCallback(() => {
    setPhoto(null);
    setError(null);
    setCameraReady(false);
  }, []);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={styles.message}>
          Đang kiểm tra quyền camera...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permissionIcon}>📷</Text>

        <Text style={styles.permissionTitle}>
          Quyền truy cập Camera
        </Text>

        <Text style={styles.message}>
          Cho phép DaNang Recycle Hub sử dụng camera
          để chụp ảnh rác thải.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>
            Cấp quyền Camera
          </Text>
        </Pressable>

        {!permission.canAskAgain && (
          <Text style={styles.warningText}>
            Quyền camera đã bị từ chối.
            Hãy mở Cài đặt Android để cấp quyền.
          </Text>
        )}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {photo ? (
        <Image
          source={{ uri: photo.uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          mode="picture"
          onCameraReady={() => setCameraReady(true)}
          onMountError={(event) => {
            setError(event.message);
          }}
        />
      )}

      <SafeAreaView
        style={styles.overlay}
        pointerEvents="box-none"
      >
        <View style={styles.topPanel}>
          <View style={styles.titleRow}>
            <View style={styles.liveDot} />

            <Text style={styles.heading}>
              RECYCLE SCANNER
            </Text>
          </View>

          <Text style={styles.subtitle}>
            {photo
              ? "Ảnh đã được chụp thành công"
              : "Đưa rác thải vào khung hình"}
          </Text>

          <Text style={styles.subtitle}>
            Camera Android • Expo Go
          </Text>
        </View>

        {!photo && (
          <View
            style={styles.scanArea}
            pointerEvents="none"
          >
            <View style={styles.scanFrame}>
              <View
                style={[styles.corner, styles.topLeft]}
              />
              <View
                style={[styles.corner, styles.topRight]}
              />
              <View
                style={[styles.corner, styles.bottomLeft]}
              />
              <View
                style={[styles.corner, styles.bottomRight]}
              />

              <Text style={styles.scanText}>
                ĐẶT VẬT THỂ VÀO ĐÂY
              </Text>
            </View>
          </View>
        )}

        {photo && (
          <View
            style={styles.previewPanel}
            pointerEvents="none"
          >
            <Text style={styles.previewTitle}>
              ĐÃ CHỤP ẢNH
            </Text>

            <Text style={styles.previewSubtitle}>
              Ảnh sẵn sàng cho bước phân loại.
            </Text>
          </View>
        )}

        <View style={styles.bottomContainer}>
          {error && (
            <View style={styles.errorPanel}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          )}

          <View style={styles.statusPanel}>
            <View style={styles.statusDot} />

            <Text style={styles.statusText}>
              {photo
                ? "Đã lưu ảnh tạm thời"
                : cameraReady
                  ? "Camera đã sẵn sàng"
                  : "Đang khởi động camera..."}
            </Text>
          </View>

          <Text style={styles.aiNotice}>
            Nhận diện AI realtime chưa khả dụng
            trong Expo Go.
          </Text>

          {photo ? (
            <Pressable
              style={styles.retakeButton}
              onPress={retakePicture}
            >
              <Text style={styles.retakeText}>
                CHỤP LẠI
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chụp ảnh rác thải"
              style={[
                styles.captureButton,
                (!cameraReady || capturing) &&
                  styles.disabledButton,
              ]}
              onPress={takePicture}
              disabled={!cameraReady || capturing}
            >
              {capturing ? (
                <ActivityIndicator
                  color="#173922"
                  size="large"
                />
              ) : (
                <View style={styles.captureInner} />
              )}
            </Pressable>
          )}

          <Text style={styles.bottomHint}>
            {photo
              ? "Nhấn chụp lại để tiếp tục"
              : "Nhấn nút để chụp ảnh"}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  center: {
    flex: 1,
    backgroundColor: "#07130d",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },

  message: {
    color: "#d1d5db",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 23,
    marginTop: 16,
  },

  permissionIcon: {
    fontSize: 56,
    marginBottom: 15,
  },

  permissionTitle: {
    color: "#4ade80",
    fontSize: 22,
    fontWeight: "800",
  },

  primaryButton: {
    backgroundColor: "#22c55e",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 15,
    marginTop: 24,
  },

  primaryButtonText: {
    color: "#07130d",
    fontSize: 15,
    fontWeight: "800",
  },

  warningText: {
    color: "#fbbf24",
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
  },

  topPanel: {
    marginTop: 35,
    marginHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.68)",
    padding: 16,
    borderRadius: 16,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  liveDot: {
    width: 9,
    height: 9,
    backgroundColor: "#4ade80",
    borderRadius: 5,
    marginRight: 9,
  },

  heading: {
    color: "#4ade80",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1,
  },

  subtitle: {
    color: "#e5e7eb",
    fontSize: 12,
    marginTop: 7,
  },

  scanArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  scanFrame: {
    width: "100%",
    aspectRatio: 0.9,
    justifyContent: "center",
    alignItems: "center",
  },

  corner: {
    width: 38,
    height: 38,
    position: "absolute",
    borderColor: "#4ade80",
    borderWidth: 0,
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },

  scanText: {
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "700",
  },

  previewPanel: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 18,
    marginHorizontal: 16,
    borderRadius: 14,
  },

  previewTitle: {
    color: "#4ade80",
    fontSize: 18,
    fontWeight: "800",
  },

  previewSubtitle: {
    color: "#e5e7eb",
    fontSize: 13,
    marginTop: 8,
  },

  bottomContainer: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  statusPanel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: "#22c55e",
    borderRadius: 4,
    marginRight: 8,
  },

  statusText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  aiNotice: {
    color: "#fbbf24",
    fontSize: 11,
    textAlign: "center",
    marginBottom: 18,
    paddingHorizontal: 20,
  },

  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },

  captureInner: {
    width: 57,
    height: 57,
    borderRadius: 29,
    backgroundColor: "#eaffea",
  },

  disabledButton: {
    opacity: 0.5,
  },

  retakeButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    paddingHorizontal: 45,
    borderRadius: 14,
  },

  retakeText: {
    color: "#07130d",
    fontWeight: "800",
    fontSize: 15,
  },

  bottomHint: {
    color: "#d1d5db",
    fontSize: 12,
    marginTop: 12,
  },

  errorPanel: {
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "#7f1d1d",
    borderRadius: 10,
    padding: 12,
  },

  errorText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
  },
});
