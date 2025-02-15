import {
  View,
  Text,
  Pressable,
  BackHandler,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import AnimatedScreen from "../../components/global/AnimatedScreen";
import VideoPostFullScreen from "../../components/home/post/components/VideoPostForFullScreen";
import { VideoFullScreen } from "../../types/navigation";
import { AnimatedCircularProgress } from "react-native-circular-progress";

import { StatusBar } from "expo-status-bar";

import { useAppDispatch } from "../../redux/hooks/hooks";
import { closeToast, openToast } from "../../redux/slice/toast/toast";
import uuid from "react-native-uuid";
import Feather from "@expo/vector-icons/Feather";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export default function VideoFull({ navigation, route }: VideoFullScreen) {
  const dispatch = useAppDispatch();
  console.log("file url", route.params?.videoUri);
  const [progress, setProgress] = useState({ received: 0, total: 1 });
  const [done, setDone] = useState(true);
  console.log((progress?.received / progress.total) * 100);

  const handleDownload = async () => {
    try {
      setDone(false);
      setProgress({ received: 0, total: 1 });
      
      const { uri: fileUri } = await FileSystem.downloadAsync(
        route.params?.videoUri,
        FileSystem.documentDirectory + `${uuid.v4()}.mp4`,
        {
          sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
          md5: true
        }
      );

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(fileUri);
        setDone(true);
        dispatch(openToast({ text: "Saved", type: "Info" }));
        setTimeout(() => {
          dispatch(closeToast());
        }, 2000);
      }
    } catch (error) {
      setDone(true);
      dispatch(openToast({ text: "Download failed", type: "Failed" }));
      setTimeout(() => {
        dispatch(closeToast());
      }, 2000);
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

  useEffect(() => {
    const backAction = () => {
      if (!done) {
        setDone(true);
      } else {
        navigation.canGoBack() ? navigation.goBack() : null;
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [done]);

  return (
    <>
      <StatusBar animated={true} style="light" backgroundColor="transparent" />
      <AnimatedScreen>
        <VideoPostFullScreen {...route.params} />
        {!done && (
          <TouchableWithoutFeedback>
            <>
              <Animated.View
                entering={FadeIn.springify()}
                exiting={FadeOut.springify()}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#000000CA",
                }}
              >
                <AnimatedCircularProgress
                  size={80}
                  width={8}
                  fill={(progress?.received / progress.total) * 100}
                  tintColor="#FFFFFF"
                  onAnimationComplete={() => console.log("onAnimationComplete")}
                  backgroundColor="#D1D1D1"
                  dashedBackground={{ width: 2, gap: 2 }}
                />
              </Animated.View>
              <Animated.View
                entering={FadeIn.springify()}
                exiting={FadeOut.springify()}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 30,
                    color: "white",
                    fontFamily: "jakaraBold",
                  }}
                >
                  {Math.floor((progress?.received / progress.total) * 100)}
                </Text>
              </Animated.View>
            </>
          </TouchableWithoutFeedback>
        )}
      </AnimatedScreen>
    </>
  );
}
