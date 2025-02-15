import { View, Text, Pressable } from "react-native";
import React from "react";
import { CameraIcon } from "../icons";
import * as ImagePicker from 'expo-image-picker';
import useGetMode from "../../hooks/GetMode";
import { useAppDispatch } from "../../redux/hooks/hooks";
import { closeToast, openToast } from "../../redux/slice/toast/toast";
import { useMediaPermissions } from '../../hooks/useMediaPermissions';

export default function UploadPic({
  handleSetPhotoPost,
}: {
  handleSetPhotoPost: (mimeType: string, uri: string) => void;
}) {
  const dark = useGetMode();
  const borderColor = dark ? "white" : "black";
  const rippleColor = !dark ? "#ABABAB" : "#55555500";
  const dispatch = useAppDispatch();
  const { requestMediaPermissions } = useMediaPermissions();

  const pickImage = async () => {
    try {
      const hasPermission = await requestMediaPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        handleSetPhotoPost(
          asset.mimeType || 'image/jpeg',
          asset.uri
        );
      }
    } catch (error) {
      dispatch(openToast({ text: "Failed to select image", type: "Failed" }));
      setTimeout(() => {
        dispatch(closeToast());
      }, 2000);
    }
  };

  return (
    <View
      style={{
        borderColor,
        borderWidth: 1,
        width: 100,
        borderStyle: "dashed",
        backgroundColor: "#FFFFFF00",
        borderRadius: 10,
        overflow: "hidden",
        height: 50,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={pickImage}
        android_ripple={{ color: rippleColor, foreground: true }}
        style={{
          width: 100,
          height: 50,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 4,
          }}
        >
          <CameraIcon size={20} color={borderColor} />
          <Text style={{ fontFamily: "jakaraBold", color: borderColor }}>Upload</Text>
        </View>
      </Pressable>
    </View>
  );
}
