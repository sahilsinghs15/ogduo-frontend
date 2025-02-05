import { View, Text, Pressable } from "react-native";
import React from "react";
import { CameraIcon } from "../icons";
import * as ImagePicker from 'expo-image-picker';
import useGetMode from "../../hooks/GetMode";
import { useAppDispatch } from "../../redux/hooks/hooks";
import { openToast } from "../../redux/slice/toast/toast";

export default function PickGifButton({
  handleSetPhotoPost,
}: {
  handleSetPhotoPost: (mimeType: string, uri: string, size: number) => void;
}) {
  const dark = useGetMode();
  const borderColor = dark ? "white" : "black";
  const backgroundColorView = !dark ? "white" : "black";
  const dispatch = useAppDispatch();
  const rippleColor = !dark ? "#ABABAB" : "#55555500";

  const pickGif = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        dispatch(openToast({ text: "Permission denied", type: "Failed" }));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check if it's a GIF and under 1MB
        if (asset.fileSize && asset.fileSize > 1200000 || 
            asset.mimeType !== "image/gif") {
          dispatch(openToast({ text: "Gif of 1MB only!", type: "Failed" }));
          return;
        }

        handleSetPhotoPost(
          asset.mimeType || 'image/gif',
          asset.uri,
          asset.fileSize || 0
        );
      }
    } catch (error) {
      dispatch(openToast({ text: "Failed to select GIF", type: "Failed" }));
    }
  };

  return (
    <View
      style={{
        borderColor,
        borderWidth: 1,
        borderStyle: "dashed",
        borderRadius: 10,
        overflow: "hidden",
        height: 50,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={pickGif}
        android_ripple={{ color: rippleColor, foreground: true }}
        style={{
          padding: 10,
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
          <Text style={{ fontFamily: "jakaraBold", color: borderColor }}>
            Animated{" "}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
