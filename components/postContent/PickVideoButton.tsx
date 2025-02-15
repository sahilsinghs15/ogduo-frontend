import { View, Text, Pressable } from "react-native";
import React from "react";
import { VideoIcon } from "../icons";
import * as ImagePicker from 'expo-image-picker';
import useGetMode from "../../hooks/GetMode";
import { useAppDispatch } from "../../redux/hooks/hooks";
import { closeToast, openToast } from "../../redux/slice/toast/toast";

export default function PickVideoButton({
  handleSetPhotoPost,
  setProgress,
  setIsCompressing,
}: {
  handleSetPhotoPost: (mimeType: string, uri: string, size: number) => void;
  setProgress: (progress: number) => void;
  setIsCompressing: (compressing: boolean) => void;
}) {
  const dark = useGetMode();
  const dispatch = useAppDispatch();
  const borderColor = dark ? "white" : "black";
  const rippleColor = !dark ? "#ABABAB" : "#55555500";

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        handleSetPhotoPost(
          'video/mp4',
          asset.uri,
          asset.duration || 0
        );
      }
    } catch (error) {
      console.log('Video picker error:', error);
      dispatch(openToast({ text: "Failed to pick video", type: "Failed" }));
      setTimeout(() => {
        dispatch(closeToast());
      }, 2000);
    }
  };

  return (
    <View style={{
      borderColor,
      borderWidth: 1,
      borderStyle: "dashed",
      borderRadius: 10,
      overflow: "hidden",
      height: 50,
      justifyContent: "center",
      alignItems: "center",
    }}>
      <Pressable
        onPress={pickVideo}
        android_ripple={{ color: rippleColor, foreground: true }}
        style={{
          padding: 10,
          height: 50,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
        }}>
          <VideoIcon size={20} color={borderColor} />
          <Text style={{ fontFamily: "jakaraBold", color: borderColor }}>
            Video
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
