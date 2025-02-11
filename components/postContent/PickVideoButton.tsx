import { View, Pressable } from "react-native";
import React from "react";
import { VideoIcon } from "../icons";
import * as ImagePicker from 'expo-image-picker';
import useGetMode from "../../hooks/GetMode";
import { useDispatch } from "react-redux";
import { openToast } from "../../redux/slice/toast/toast";
import { useMediaPermissions } from '../../hooks/useMediaPermissions';

export default function PickVideoButton({
  handleSetPhotoPost,
  setProgress,
  setIsCompressing,
}: {
  handleSetPhotoPost: (mimeType: string, uri: string, size: number) => void;
  setProgress: any;
  setIsCompressing: any;
}) {
  const dark = useGetMode();
  const backgroundColor = dark ? "white" : "black";
  const backgroundColorView = !dark ? "white" : "black";
  const dispatch = useDispatch();
  const rippleColor = !dark ? "#ABABAB" : "#55555500";
  const { requestMediaPermissions } = useMediaPermissions();

  const pickVideo = async () => {
    try {
      const hasPermission = await requestMediaPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        handleSetPhotoPost(
          result.assets[0].mimeType || 'video/mp4',
          result.assets[0].uri,
          result.assets[0].fileSize || 0
        );
      }
    } catch (error) {
      dispatch(openToast({ text: "Failed to select video", type: "Failed" }));
    }
  };

  return (
    <View
      style={{
        borderColor: "#B4B4B488",
        borderWidth: 1,
        width: 100,
        backgroundColor: backgroundColorView,
        borderRadius: 10,
        overflow: "hidden",
        height: 100,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={pickVideo}
        android_ripple={{ color: rippleColor, foreground: true }}
        style={{
          width: 100,
          height: 100,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <VideoIcon color={backgroundColor} size={40} />
      </Pressable>
    </View>
  );
}
