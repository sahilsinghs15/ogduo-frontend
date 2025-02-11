import * as MediaLibrary from 'expo-media-library';
import { useAppDispatch } from '../redux/hooks/hooks';
import { openToast } from '../redux/slice/toast/toast';
import { PermissionsAndroid, Platform } from 'react-native';

export const useMediaPermissions = () => {
  const dispatch = useAppDispatch();

  const requestMediaPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        ];

        const results = await Promise.all(
          permissions.map(permission => 
            PermissionsAndroid.request(permission).catch(() => 'denied')
          )
        );

        return results.some(result => result === PermissionsAndroid.RESULTS.GRANTED);
      }

      // For iOS
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.log('Permission error:', error);
      return false;
    }
  };

  return { requestMediaPermissions };
}; 