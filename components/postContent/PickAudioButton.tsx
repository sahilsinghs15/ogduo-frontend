import { View, Text, Pressable } from "react-native";
import React from "react";
import { AudioIcon, CameraIcon } from "../icons";
import * as DocumentPicker from 'expo-document-picker';
import useGetMode from "../../hooks/GetMode";
export default function PickAudioButton({
  handleSetAudioPost,
}: {
  handleSetAudioPost: (
    mimeType: string,
    uri: string,
    size: number,
    name: string
  ) => void;
}) {
  const dark = useGetMode();
  const backgroundColor = dark ? "white" : "black";
  const backgroundColorView = !dark ? "white" : "black";
  const rippleColor = !dark ? "#ABABAB" : "#55555500";
  return (
    <View
      style={{
        borderColor: "#B4B4B488",
        borderWidth: 1,
        width: 100,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: backgroundColorView,
        height: 100,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: "audio/*"
          });
          
          if (result.assets && result.assets[0]) {
            const file = result.assets[0];
            handleSetAudioPost(
              file.mimeType || 'audio/mpeg',
              file.uri,
              file.size || 0,
              file.name
            );
          }
        }}
        android_ripple={{ color: rippleColor, foreground: true }}
        style={{
          width: 100,
          height: 100,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <AudioIcon color={backgroundColor} size={40} />
      </Pressable>
    </View>
  );
}
