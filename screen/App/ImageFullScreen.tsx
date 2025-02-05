import { Pressable, View, StyleSheet } from "react-native";
import { ImageFullScreenProp } from "../../types/navigation";

import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SharedTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useLayoutEffect } from "react";
import axios from "axios";

import { useAppDispatch } from "../../redux/hooks/hooks";
import { openToast } from "../../redux/slice/toast/toast";
import { Image, ImageBackground } from "expo-image";
import uuid from "react-native-uuid";
import * as FileSystem from "expo-file-system";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Feather from '@expo/vector-icons/Feather';

export default function ImageFullScreen({
  route,
  navigation,
}: ImageFullScreenProp) {
  const { photoUri, id, width, height } = route.params;

  const dispatch = useAppDispatch();

  const handleDownload = async () => {
    try {
      const fileUri = `${FileSystem.documentDirectory}${uuid.v4()}.jpg`;
      const downloadResumable = FileSystem.createDownloadResumable(
        photoUri,
        fileUri
      );
      const { uri } = await downloadResumable.downloadAsync() as any;
      dispatch(openToast({ text: "Image saved successfully", type: "Info" }));
      console.log("File saved to", uri);
    } catch (error) {
      console.error("Download error:", error);
      dispatch(openToast({ text: "Download failed", type: "Error" } as any));
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          android_ripple={{ color: "black" }}
          onPress={handleDownload}
          style={{
            height: 50,
            bottom: 0,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            width: 50,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Feather name="download" size={24} color="white" />
          </View>
        </Pressable>
      ),
    });
  });

  const scaleContext = useSharedValue(1);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateContext = useSharedValue({ x: 0, y: 0 });
  const animImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      scaleContext.value = scale.value - 1;
    })
    .onUpdate((event) => {
      if (scaleContext.value + event.scale < 0.5) return;
      if (scaleContext.value + event.scale > 4) return;
      scale.value = scaleContext.value + event.scale;
    });

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      translateContext.value = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((event) => {
      translateX.value = translateContext.value.x + event.translationX / 4;
      translateY.value = translateContext.value.y + event.translationY / 4;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  return (
    <>
      <StatusBar animated={true} style="light" backgroundColor="transparent" />
      <GestureDetector gesture={composed}>
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(250)}
          style={{ flex: 1, backgroundColor: "black", alignItems: "center", justifyContent: "center" }}
        >
          <ImageBackground
            source={{ uri: photoUri }}
            blurRadius={20}
            imageStyle={{ opacity: 0.5 }}
            style={{ height: "100%", width: "100%", justifyContent: "center" }}
            contentFit="cover"
          >
            <View style={{ alignItems: "center", justifyContent: "center", width: "100%", height: "100%", paddingHorizontal: 30 }}>
              <Animated.View
                style={{
                  borderRadius: 20,
                  overflow: "hidden",
                  maxHeight: "80%",
                  width: "100%",
                  aspectRatio: width && height && typeof width == "number" && typeof height === "number" ? `${width}/${height}` : undefined,
                  ...animImageStyle,
                }}
              >
                <Image transition={1000} source={{ uri: photoUri }} style={{ width: "100%", height: "100%" }} />
              </Animated.View>
            </View>
          </ImageBackground>
        </Animated.View>
      </GestureDetector>
    </>
  );
}
