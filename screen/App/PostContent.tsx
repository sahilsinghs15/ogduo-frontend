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
// import PickAudioButton from "../../components/postContent/PickAudioButton";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "../../redux/hooks/hooks";
import { ActivityIndicator } from "react-native-paper";
import {
  usePostContentMutation,
  usePostImageMutation,
  usePostAudioMutation,
  usePostVideoMutation,
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
  const [photos, setPhotos] = useState<any>([]);
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

  const [postVideo, setPostVideo] = useState<{
    mimeType: string;
    uri: string;
    name: string;
    size : number
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

  const [postContent] = usePostContentMutation();
  const [postImage] = usePostImageMutation();
  const [postAudioContent] = usePostAudioMutation();
  const [postVideoContent] = usePostVideoMutation();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (postPhoto?.mimeType === 'video/mp4') {
      setIsVideoReady(false);
      // Create a video element to check if the video is loaded
      const checkVideo = async () => {
        try {
          if (!postPhoto?.uri) return;
          
          dispatch(openLoadingModal("Preparing video..."));
          // Wait for a short time to ensure the video file is ready
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const response = await fetch(postPhoto.uri);
          const blob = await response.blob();
          
          if (blob.size > 0) {
            setIsVideoReady(true);
            dispatch(closeLoadingModal());
          } else {
            throw new Error('Video file is empty');
          }
        } catch (error) {
          console.error('Error preparing video:', error);
          dispatch(closeLoadingModal());
          dispatch(openToast({ 
            text: "Error preparing video. Please try again.", 
            type: "Failed" 
          }));
          setIsVideoReady(false);
        }
      };
      
      checkVideo();
    }
  }, [postPhoto]);

  function handleSetAudioPost(mimeType: string, uri: string, size: number, name: string) {
    setPostAudio({
      mimeType,
      uri,
      size,
      name,
    });
    setPostPhoto(null);
  }

  useEffect(() => {
    if (postAudio) {
      animationRef.current?.play();
    }
    return () => {
      if (animationRef.current) {
        animationRef.current.pause();
      }
    };
  }, [postAudio]);

  useEffect(() => {
    if (progress > 0.9) {
      setProgress(0);
    }
  }, [progress]);

  const prepareVideoForUpload = async (uri: string): Promise<Blob | null> => {
    try {
      dispatch(openLoadingModal("Preparing video..."));
      const response = await fetch(uri);
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Video file is empty');
      }
      
      return blob;
    } catch (error) {
      console.error('Error preparing video:', error);
      dispatch(openToast({ 
        text: "Error preparing video. Please try again.", 
        type: "Failed" 
      }));
      return null;
    } finally {
      dispatch(closeLoadingModal());
    }
  };

  const handlePostContent = async () => {
    try {
      // Validate required postText field
      if (!postText?.trim()) {
        dispatch(openToast({ 
          text: "Post text content is required", 
          type: "Failed" 
        }));
        setTimeout(() => {
          dispatch(closeToast());
        }, 2000);
        return;
      }

      setIsLoading(true);
      setUploadProgress(0);
      
      // Determine the content type based on the presence of content
      let type = "text";
      if (postPhoto?.mimeType === 'video/mp4') {
        type = "video";
      } else if (postPhoto?.mimeType.startsWith('image')) {
        type = "image";
      } else if (postAudio?.mimeType.startsWith('audio')) {
        type = "audio";
      }

      console.log('Content type:', type);
      console.log('Post Content:', postVideo || postPhoto || postAudio);

      let response;

      try {
        // Handle video posts
        if (type === "video") {
          console.log('Preparing video upload...');
          if (!videoTitle?.trim()) {
            dispatch(openToast({ 
              text: "Video title is required", 
              type: "Failed" 
            }));
            setTimeout(() => {
              dispatch(closeToast());
            }, 2000);
            return;
          }

          if (!postPhoto?.uri) {
            dispatch(openToast({ 
              text: "Video file not found", 
              type: "Failed" 
            }));
            setIsLoading(false);
            return;
          }

          // Prepare the video file
          const videoBlob = await prepareVideoForUpload(postPhoto.uri);
          if (!videoBlob) {
            setIsLoading(false);
            return;
          }

          // Create video file object in the exact format backend expects
          const videoFile = {
            uri: Platform.OS === 'android' ? postPhoto.uri : postPhoto.uri.replace('file://', ''),
            type: 'video/mp4',
            name: postPhoto.uri.split("/").pop() || 'video.mp4',
            size: videoBlob.size
          };

          console.log('Prepared video file:', JSON.stringify(videoFile, null, 2));

          try {
            response = await postVideoContent({
              postText: postText.trim(),
              videoTitle: videoTitle.trim(),
              video: videoFile
            }).unwrap();

            console.log('Video upload success:', response);
          } catch (error: any) {
            console.error('Video upload error details:', {
              status: error?.status,
              data: error?.data,
              message: error?.message
            });
            throw error;
          }

          dispatch(closeLoadingModal());
        } else if (type === "image" && postPhoto) {
          console.log('Preparing image upload...');
          const photoBlob = {
            uri: Platform.OS === 'android' ? postPhoto.uri : postPhoto.uri.replace('file://', ''),
            type: 'image/jpeg',
            name: postPhoto.uri.split("/").pop() || 'image.jpg',
          };

          response = await postImage({
            postText: postText.trim(),
            photo: photoBlob
          }).unwrap();

          console.log('Image upload response:', response);

        } else if (type === "audio" && postAudio) {
          console.log('Preparing audio upload...');
          const audioBlob = {
            uri: Platform.OS === 'android' ? postAudio.uri : postAudio.uri.replace('file://', ''),
            type: postAudio.mimeType,
            name: postAudio.name,
          };

          response = await postAudioContent({
            postText: postText.trim(),
            audio: {
              audioUri: audioBlob.uri,
              type: audioBlob.type,
              name: audioBlob.name
            }
          }).unwrap();

          console.log('Audio upload response:', response);

        } else {
          // Text-only post
          console.log('Preparing text-only post...');
          response = await postContent({
            postText: postText.trim()
          }).unwrap();

          console.log('Text post response:', response);
        }

        dispatch(openToast({ text: "Posted successfully!", type: "Success" }));
        setTimeout(() => {
          dispatch(closeToast());
        }, 2000);

        // Reset form state
        setPostText(undefined);
        setPostPhoto(null);
        setPostAudio(null);
        setPostVideo(null);
        setVideoTitle(undefined);
        setPhotoServer(undefined);
        setVideoThumbnail(undefined);
        setFTServer(undefined);
        
        navigation.goBack();

      } catch (error: any) {
        console.log('Post error:', error);
        
        // Handle validation errors from API
        if (error.status === 400 && error.data?.errors) {
          const firstError = error.data.errors[0];
          dispatch(openToast({ 
            text: firstError.msg || "Failed to create post", 
            type: "Failed" 
          }));
        } else {
          dispatch(openToast({ 
            text: "Failed to create post", 
            type: "Failed" 
          }));
        }
        
        setTimeout(() => {
          dispatch(closeToast());
        }, 2000);
      } finally {
        setIsLoading(false);
        setUploadProgress(0);
      }

    } catch (error: any) {
      console.log('Post error:', error);
      
      // Handle validation errors from API
      if (error.status === 400 && error.data?.errors) {
        const firstError = error.data.errors[0];
        dispatch(openToast({ 
          text: firstError.msg || "Failed to create post", 
          type: "Failed" 
        }));
      } else {
        dispatch(openToast({ 
          text: "Failed to create post", 
          type: "Failed" 
        }));
      }
      
      setTimeout(() => {
        dispatch(closeToast());
      }, 2000);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handlePostText = (text: string) => {
    setPostText(text);
  };

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
        }
      }
    }

    getPicture();

    return () => {
      mounted = false;
    };
  }, []);

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
                <View style={{ flexDirection: "row", gap: 40 , marginLeft : 55 }}>
                  <PickImageButton handleSetPhotoPost={handleSetPhotoPost} />
                  <PickVideoButton
                    handleSetPhotoPost={handleSetPhotoPost}
                    setProgress={setProgress}
                    setIsCompressing={setCompressing}
                  />
                  {/* <PickAudioButton handleSetAudioPost={handleSetAudioPost} /> */}
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