import { View, Text, Pressable } from "react-native";
import React from "react";
import { CameraIcon } from "../icons";
import * as ImagePicker from 'expo-image-picker';
import useGetMode from "../../hooks/GetMode";
import { useAppDispatch } from "../../redux/hooks/hooks";
import { closeToast, openToast } from "../../redux/slice/toast/toast";

export default function PickImageButton({
  handleSetPhotoPost,
}: {
  handleSetPhotoPost: (mimeType: string, uri: string, size: number) => void;
}) {
  const dark = useGetMode();
  const dispatch = useAppDispatch();
  const borderColor = dark ? "white" : "black";
  const rippleColor = !dark ? "#ABABAB" : "#55555500";

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        handleSetPhotoPost(
          asset.type || 'image/jpeg',
          asset.uri,
          asset.fileSize || 0
        );
      }
    } catch (error) {
      console.log('Image picker error:', error);
      dispatch(openToast({ 
        text: "Failed to pick image", 
        type: "Failed"
      }));
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
        onPress={pickImage}
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
          <CameraIcon size={20} color={borderColor} />
          <Text style={{ fontFamily: "jakaraBold", color: borderColor }}>
            Photo
          </Text>
        </View>
      </Pressable>
    </View>
  );
}