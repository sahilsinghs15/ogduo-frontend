import { View, Text, Pressable } from "react-native";
import React from "react";
import { CameraIcon } from "../icons";
import * as ImagePicker from 'expo-image-picker';
import useGetMode from "../../hooks/GetMode";
import { useDispatch } from "react-redux";
import { closeToast, openToast } from "../../redux/slice/toast/toast";

export default function PickImageButton({
  handleSetPhotoPost,
}: {
  handleSetPhotoPost: (mimeType: string, uri: string, size: number) => void;
}) {
  const dark = useGetMode();
  const backgroundColor = dark ? "white" : "black";
  const backgroundColorView =  "#FD5E02" ;
  const rippleColor = !dark ? "#ABABAB" : "#55555500";
  const dispatch = useDispatch();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      dispatch(openToast({ text: "Permission denied", type: "Failed" }));
      setTimeout(() => {
        dispatch(closeToast());
      }, 2000);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      handleSetPhotoPost(
        asset.mimeType || 'image/jpeg',
        asset.uri,
        asset.fileSize || 0
      );
    }
  };

  return (
    <View
      style={{
        width: 40,
        backgroundColor: backgroundColorView,
        borderRadius: 999,
        overflow: "hidden",
        height: 40,
        marginLeft: 10,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={pickImage}
        android_ripple={{ color: rippleColor, foreground: true }}
        style={{
          width: 30,
          height: 30,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CameraIcon color={"white"} size={25} />
      </Pressable>
    </View>
  );
}
