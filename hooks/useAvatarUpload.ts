import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import axios from 'axios';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UploadState {
  isLoading: boolean;
  error: string | null;
}

export const useAvatarUpload = () => {
  const [state, setState] = useState<UploadState>({ isLoading: false, error: null });
  const { user, updateAvatarUrl, getAuthToken } = useAuth();
  const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000').replace(/\/$/, '');

  // yêu cầu quyền truy cập và chọn hình ảnh từ thư viện
  const pickImage = useCallback(async () => {
    try {
      setState({ isLoading: false, error: null });

      // yêu cầu quyền
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setState({
          isLoading: false,
          error: 'Quyền truy cập thư viện đa phương tiện đã bị từ chối',
        });
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1], 
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0];
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Không thể chọn ảnh';
      setState({ isLoading: false, error: errorMsg });
      return null;
    }
  }, []);

  // upload ảnh lên Superbase Storage và lưu URL vào MongoDB
  const uploadAvatarImage = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      if (!user?.id) {
        setState({ isLoading: false, error: 'tài khoản chưa được xác thực' });
        return false;
      }

      setState({ isLoading: true, error: null });

      try {
        const fileExtension = asset.fileName?.split('.').pop() || asset.uri.split('.').pop() || 'jpg';
        const fileName = `avatar-${user.id}-${Date.now()}.${fileExtension}`;

        // Đọc file theo dạng base64 sử dụng legacy API
        const base64 = await FileSystemLegacy.readAsStringAsync(asset.uri, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });
        
        // Chuyển base64 thành Uint8Array
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i += 1) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const contentType = asset.mimeType || 'image/jpeg';

        // upload lên Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, byteArray, {
            cacheControl: '3600',
            upsert: false,
            contentType,
          });

        if (uploadError) {
          throw new Error(`upload lên Supabase thất bại: ${uploadError.message}`);
        }

        // lấy URL công khai của ảnh đã upload
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // Get auth token
        const token = await getAuthToken();
        if (!token) {
          throw new Error('Không tìm thấy token xác thực');
        }

        // lưu avatar URL vào MongoDB thông qua API của backend
        const updateResponse = await axios.put(
          `${API_BASE_URL}/api/user/avatar`,
          { avatarUrl: publicUrl },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (updateResponse.status === 200) {
          await updateAvatarUrl(publicUrl);
          setState({ isLoading: false, error: null });
          return true;
        } else {
          throw new Error('Không thể update avatar trong DB');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Không thể upload avatar';
        console.error('Lỗi upload avatar:', errorMsg);
        setState({ isLoading: false, error: errorMsg });
        return false;
      }
    },
    [user?.id, getAuthToken, updateAvatarUrl]
  );

  // function main để xử lý toàn bộ quy trình upload avatar
  const handleAvatarUpload = useCallback(async () => {
    const asset = await pickImage();
    if (!asset) {
      return false;
    }

    return uploadAvatarImage(asset);
  }, [pickImage, uploadAvatarImage]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    pickImage,
    uploadAvatarImage,
    handleAvatarUpload,
  };
};
