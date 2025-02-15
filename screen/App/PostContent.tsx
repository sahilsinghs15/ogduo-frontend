import {
  View,
  Text,
  Pressable,
  Platform,
  PermissionsAndroid,
  FlatList,
  Dimensions,
  Keyboard,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import AnimatedScreen from "../../components/global/AnimatedScreen";
import { CameraIcon, CloseCircleIcon } from "../../components/icons";
import PostButton from "../../components/postContent/PostButton";
import useGetMode from "../../hooks/GetMode";
import TextArea from "../../components/postContent/TextArea";
import { PostContentProp } from "../../types/navigation";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";

import PickImageButton from "../../components/postContent/PickImageButton";
import VideoTextArea from "../../components/postContent/VideoTextArea";
import RingAudio from "../../components/home/post/components/RingAudio";
import Lottie from "lottie-react-native";
import PickAudioButton from "../../components/postContent/PickAudioButton";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "../../redux/hooks/hooks";
import { ActivityIndicator } from "react-native-paper";
import {
  usePostContentMutation,
  useUploadAudioMutation,
  useUploadVideoMutation,
  useUploadPostMutation,
} from "../../redux/api/services";
import { closeToast, openToast } from "../../redux/slice/toast/toast";
import {
  closeLoadingModal,
  openLoadingModal,
} from "../../redux/slice/modal/loading";
import PickVideoButton from "../../components/postContent/PickVideoButton";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { AnimatedCircularProgress } from "react-native-circular-progress";

import * as Progress from "react-native-progress";
import * as MediaLibrary from 'expo-media-library';
import Constants from 'expo-constants';
import { IPostContent } from "../../types/api";
import uuid from 'react-native-uuid';


const width = Dimensions.get("window").width;
export default function PostContent({ navigation }: PostContentProp) {
  const dark = useGetMode();
  const dispatch = useAppDispatch();
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [postPhoto, setPostPhoto] = useState<{
    mimeType: string;
    uri: string;
    size: number;
  } | null>(null);
  const [postAudio, setPostAudio] = useState<{
    mimeType: string;
    uri: string;
    name: string;
    size: number;
  } | null>(null);
  const backgroundColor = dark ? "white" : "black";
  const animationRef = useRef<Lottie>(null);

  function handleSetPhotoPost(mimeType: string, uri: string, size: number) {
    setPostPhoto({
      mimeType,
      uri,
      size,
    });
    setPostAudio(null);
  }
  const keyboard = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true });
  const animatedStyles = useAnimatedStyle(() => ({
    bottom: keyboard.height.value,
  }));

  const [fileToServer, setFTServer] = useState<string | undefined>(undefined);
  const [photoServer, setPhotoServer] = useState<
    { uri: string; width: number; height: number } | undefined
  >(undefined);
  const [videoThumbnail, setVideoThumbnail] = useState<string | undefined>(
    undefined
  );
  const [postText, setPostText] = useState<string | undefined>(undefined);
  const [done, setDone] = useState(true);
  const [videoTitle, setVideoTitle] = useState<string | undefined>(undefined);
  const { width } = useWindowDimensions();
  function handleSetAudioPost(
    mimeType: string,
    uri: string,
    size: number,
    name: string
  ) {
    setPostAudio({
      mimeType,
      uri,
      size,
      name: name,
    });
    setPostPhoto(null);
  }
  async function hasAndroidPermission() {
    const getCheckPermissionPromise = () => {
      if (Number(Platform.Version) >= 33) {
        return Promise.all([
          PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          ),
          PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
          ),
        ]).then(
          ([hasReadMediaImagesPermission, hasReadMediaVideoPermission]) =>
            hasReadMediaImagesPermission && hasReadMediaVideoPermission
        );
      } else {
        return PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
      }
    };

    const hasPermission = await getCheckPermissionPromise();
    if (hasPermission) {
      return true;
    }
    const getRequestPermissionPromise = () => {
      if (Number(Platform.Version) >= 33) {
        return PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ]).then(
          (statuses) =>
            statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
              PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        return PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        ).then((status) => status === PermissionsAndroid.RESULTS.GRANTED);
      }
    };

    return await getRequestPermissionPromise();
  }

  useEffect(() => {
    let mounted = true;

    async function getPicture() {
      try {
        // Skip media library access in Expo Go
        if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
          console.log('Media library access limited in Expo Go');
          return;
        }

        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted' || !mounted) return;

        const { assets } = await MediaLibrary.getAssetsAsync({
          first: 20,
          mediaType: MediaLibrary.MediaType.photo,
          sortBy: [MediaLibrary.SortBy.creationTime]
        });

        if (mounted) {
          setPhotos(assets);
        }
      } catch (error) {
        console.log('Error accessing media library:', error);
        // Only show error if not in Expo Go
        if (!(Platform.OS === 'android' && Constants.appOwnership === 'expo')) {
          dispatch(openToast({ 
            text: "Unable to access media library", 
            type: "Failed" 
          }));
          setTimeout(() => {
            dispatch(closeToast());
          }, 2000);
        }
      }
    }

    getPicture();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (postAudio) {
      animationRef.current?.play();
    }

    return () => {
      animationRef.current?.pause;
    };
  }, [postAudio]);

  const [uploadPost] = useUploadPostMutation();
  const [audio] = useUploadAudioMutation();
  const [video] = useUploadVideoMutation();
  const [postContent] = usePostContentMutation();
  useEffect(() => {
    if (postPhoto?.mimeType.startsWith("image/")) {
      console.log("Starting image upload...");
      setIsLoading(true);
      setDone(false);
      uploadPost({
        type: 'image',
        content: postPhoto,
        caption: postText
      })
        .unwrap()
        .then((r:any) => {
          console.log("Image upload success:", r);
          setDone(true);
          setIsLoading(false);
          setPhotoServer(r.photo);
        })
        .catch((e:any) => {
          console.log("Image upload failed:", e);
          setDone(true);
          setIsLoading(false);
          dispatch(openToast({ 
            text: e.error || "Photo upload failed", 
            type: "Failed"
          }));
          setTimeout(() => {
            dispatch(closeToast());
          }, 2000);
        });
    }
    if (postAudio) {
      console.log(
        "🚀 ~ file: PostContent.tsx:206 ~ useEffect ~ postAudio:",
        postAudio
      );
      setDone(false);
      audio({
        audio: postAudio,
        caption: postText
      })
        .unwrap()
        .then((r:any) => {
          setDone(true);
          setFTServer(r.audio);
        })
        .catch((e:any) => {
          console.log("🚀 ~ file: PostContent.tsx:206 ~ useEffect ~ e:", e);
          setDone(true);

          dispatch(openToast({ text: "Audio didn't upload", type: "Failed" }));
          setTimeout(() => {
            dispatch(closeToast());
          }, 2000);
        });
    }
    if (postPhoto?.mimeType.startsWith("video/")) {
      setDone(false);
      video(postPhoto)
        .unwrap()
        .then((r:any) => {
          console.log("🚀 ~ file: PostContent.tsx:229 ~ .then ~ r:", r)

          setDone(true);
          setFTServer(r.video);
          setVideoThumbnail(r.thumbNail);
        })
        .catch((e:any) => {
          console.log("🚀 ~ file: PostContent.tsx:236 ~ useEffect ~ e:", e)

          setDone(true);

          dispatch(openToast({ text: "video didn't upload", type: "Failed" }));
          setTimeout(() => {
            dispatch(closeToast());
          }, 2000);
        }); 
    }
  }, [postPhoto, postAudio]);

  const handlePostText = (text: string) => {
    setPostText(text);
  };

  const handlePostContent = async () => {
    try {
      setIsLoading(true);
      console.log("Post button clicked");
      
      // Check if we have a photo to upload
      if (postPhoto?.mimeType?.startsWith("image/")) {
        console.log("Handling image post");
        if (!photoServer?.uri) {
          // Wait for photo upload to complete
          console.log("Uploading photo first...");
          const uploadResult = await uploadPost({
            type: 'image',
            content: postPhoto,
            caption: postText
          }).unwrap();
          
          console.log("Upload result:", uploadResult);
          setPhotoServer(uploadResult.photo);
          
          // Now create the post with the uploaded photo
          const payload: IPostContent = {
            type: "image",
            caption: postText,
            photo: {
              id: uuid.v4() as string,
              uri: uploadResult.photo.uri,
              height: uploadResult.photo.height,
              width: uploadResult.photo.width,
            } 
          };

          console.log("Sending image payload:", payload);
          const response = await postContent(payload).unwrap();
          console.log("Post response:", response);
        }
      } else if (postText) {
        // Handle text-only post
        console.log("Handling text post");
        const payload: IPostContent = {
          type: "text",
          caption: postText
        };

        console.log("Sending text payload:", payload);
        const response = await postContent(payload).unwrap();
        console.log("Post response:", response);
      }

      dispatch(openToast({ text: "Posted successfully!", type: "Success" }));
      setTimeout(() => {
        dispatch(closeToast());
      }, 2000);
      navigation.goBack();

    } catch (error) {
      console.log('Post error:', error);
      dispatch(openToast({ text: "Failed to create post", type: "Failed" }));
      setTimeout(() => {
        dispatch(closeToast());
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };
  const [progress, setProgress] = useState(0);
  console.log(
    "🚀 ~ file: PostContent.tsx:348 ~ PostContent ~ progress:",
    progress
  );

  const [compressing, setCompressing] = useState(false);
  console.log(
    "🚀 ~ file: PostContent.tsx:338 ~ PostContent ~ compressing:",
    compressing
  );

  useEffect(() => {
    if (progress > 0.9) {
      setProgress(0);
    }
  }, [progress]);

  const [uploadProgress, setUploadProgress] = useState(0);

  return (
    <AnimatedScreen>
      <View style={{ flex: 1, padding: 20, marginTop: 30 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View
            style={{
              height: 30,
              width: 30,
              borderRadius: 9999,
              overflow: "hidden",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={() => {
                navigation.pop();
              }}
              style={{
                flex: 1,
                borderRadius: 9999,
                justifyContent: "center",
                alignItems: "center",
              }}
              android_ripple={{ color: backgroundColor, foreground: true }}
            >
              <CloseCircleIcon size={30} color={backgroundColor} />
            </Pressable>
          </View>
          {postPhoto || postAudio ? (
            <PostButton
              isDisabled={!done}
              isLoading={!done}
              onPress={handlePostContent}
            />
          ) : (
            <PostButton
              isDisabled={!postText}
              isLoading={!postText}
              onPress={handlePostContent}
            />
          )}
        </View>
        <TextArea handlePostText={handlePostText} />
        {(postAudio || postPhoto) && (
          <View
            style={{
              padding: 20,
              borderRadius: 9999,
              overflow: "hidden",
              justifyContent: "center",
              alignItems: "flex-end",
            }}
          >
            <Pressable
              onPress={() => {
                setFTServer(undefined);
                setPostAudio(null);
                setPostPhoto(null);
              }}
              style={{
                flex: 1,
                borderRadius: 9999,
                backgroundColor: "red",
                justifyContent: "center",
                alignItems: "center",
              }}
              android_ripple={{ color: "white", foreground: true }}
            >
              <CloseCircleIcon size={30} color={"red"} />
            </Pressable>
          </View>
        )}
        <View
          style={{
            height: 200,
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!done ? (
            <View
              key={"portal"}
              style={{
                position: "absolute",
                zIndex: 9,
                left: 0,
                right: 0,
                top: 0,
                justifyContent: "center",
                alignItems: "center",
                bottom: 0,
              }}
            >
              {<ActivityIndicator size={40} color="white" />}
            </View>
          ) : (
            <></>
          )}
          {postPhoto && (
            <Image
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 20,
                paddingHorizontal: 20,
              }}
              source={{ uri: postPhoto?.uri }}
              contentFit="contain"
            />
          )}
          {postAudio && <RingAudio animationRef={animationRef} />}
        </View>

        {postPhoto?.mimeType === "video/mp4" && (
          <VideoTextArea
            value={videoTitle}
            onChangeText={(text) => {
              setVideoTitle(text);
            }}
          />
        )}
        {!postPhoto && !postAudio && (
          <Animated.View
            entering={FadeInDown.springify()}
            exiting={FadeOutDown.springify()}
            style={[{
              position: "absolute",
              bottom: 0,

              gap: 10,
              width,
              marginBottom: 20,
            },animatedStyles]}
          >
            {(progress > 0 || compressing) && (
              <Animated.View
                entering={FadeIn.springify()}
                exiting={FadeOut.springify()}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Progress.Bar
                  progress={progress}
                  animated
                  indeterminate={compressing}
                  color={dark ? "white" : "black"}
                  width={width * 0.95}
                />
              </Animated.View>
            )}

            <FlatList
              horizontal
              ListHeaderComponent={
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <PickImageButton handleSetPhotoPost={handleSetPhotoPost} />
                  <PickVideoButton
                    handleSetPhotoPost={handleSetPhotoPost}
                    setProgress={setProgress}
                    setIsCompressing={setCompressing}
                  />
                  <PickAudioButton handleSetAudioPost={handleSetAudioPost} />
                </View>
              }
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingLeft: 10 }}
              data={photos}
              renderItem={({ item }) => {
                return (
                  <View
                    style={{
                      height: 100,
                      width: 100,
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <Pressable
                      android_ripple={{ color: "#FFFFFF", foreground: true }}
                      style={{ borderRadius: 10 }}
                      onPress={() => {
                        setPostPhoto({
                          uri: item.uri,
                          mimeType: item.mediaType === 'photo' ? 'image/jpeg' : 'video/mp4',
                          size: item.duration || 0,
                        });
                      }}
                    >
                      <Image
                        style={{ height: 100, width: 100, borderRadius: 10 }}
                        source={{ uri: item.uri }}
                      />
                    </Pressable>
                  </View>
                );
              }}
            />
          </Animated.View>
        )}
        {isLoading && (
          <View style={styles.progressContainer}>
            <Progress.Circle 
              size={50} 
              indeterminate={uploadProgress === 0}
              progress={uploadProgress} 
              color={dark ? "white" : "black"}
            />
            <Text style={[styles.progressText, {color: dark ? "white" : "black"}]}>
              {uploadProgress === 0 ? 'Preparing...' : `${Math.round(uploadProgress * 100)}%`}
            </Text>
          </View>
        )}
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
});