import { View, Text, Pressable } from "react-native";
import React from "react";
import { AudioIcon } from "../icons";
import * as DocumentPicker from 'expo-document-picker';
import useGetMode from "../../hooks/GetMode";
import { useAppDispatch } from "../../redux/hooks/hooks";
import { openToast } from "../../redux/slice/toast/toast";

export default function PickAudioButton({
  handleSetAudioPost,
}: {
  handleSetAudioPost: (mimeType: string, uri: string, size: number, name: string) => void;
}) {
  const dark = useGetMode();
  const dispatch = useAppDispatch();
  const borderColor = dark ? "white" : "black";
  const rippleColor = !dark ? "#ABABAB" : "#55555500";

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        handleSetAudioPost(
          asset.mimeType || 'audio/mpeg',
          asset.uri,
          asset.size || 0,
          asset.name
        );
      }
    } catch (error) {
      console.log('Audio picker error:', error);
      dispatch(openToast({ 
        text: "Failed to pick audio", 
        type: "Failed" 
      }));
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
        onPress={pickAudio}
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
          <AudioIcon size={20} color={borderColor} />
          <Text style={{ fontFamily: "jakaraBold", color: borderColor }}>
            Audio
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
