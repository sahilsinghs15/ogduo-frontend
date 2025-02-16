import {
  View,
  Text,
  FlatList,
  TextInput,
  ActivityIndicator,
  Pressable,
  Keyboard,
} from "react-native";
import React, { useEffect, useState } from "react";
import AnimatedScreen from "../../components/global/AnimatedScreen";
import { ViewPost } from "../../types/navigation";
import FullScreenPost from "../../components/home/post/FullScreenPost";
import {
  useLazyGetCommentByPostQuery,
  useLazyGetSinglePostQuery,
  usePostCommentMutation,
} from "../../redux/api/services";
import { IComment } from "../../types/api";
import { useAppDispatch, useAppSelector } from "../../redux/hooks/hooks";
import { closeToast, openToast } from "../../redux/slice/toast/toast";
import CommentBuilder from "../../components/home/post/comment/CommentBuilder";
import useGetMode from "../../hooks/GetMode";
import Button from "../../components/global/Buttons/Button";
import CommentButton from "../../components/home/post/comment/PostButton";
import uuid from "react-native-uuid";
import { BlurView } from "expo-blur";
import Animated, {
  FadeIn,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";

export default function PostScreen({ navigation, route }: ViewPost) {
  const { params } = route;
  const dispatch = useAppDispatch();
  const [comments, setComments] = useState<IComment[]>([]);
  const [commentText, setCommentText] = useState<string | null>(null);
  const user = useAppSelector((state) => state?.user?.data);
  const [postComment, postCommentResponse] = usePostCommentMutation();

  const keyboard = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true });
  const animatedStyles = useAnimatedStyle(() => ({
    bottom: keyboard.height.value,
  }));

  const dark = useGetMode();
  const color = dark ? "white" : "black";
  const backgroundColor = !dark ? "white" : "black";
  const [getComments, commentResponse] = useLazyGetCommentByPostQuery();
  const [getSinglePost, singlePostResponse] = useLazyGetSinglePostQuery();
  useEffect(() => {
    if (params.id) {
      console.log('Fetching comments for post ID:', params.id);
      getComments({ id: params.id })
        .unwrap()
        .then((r:any) => {
          console.log('Comments fetched:', r);
          setComments(r.comment);
        })
        .catch((e:any) => {
          console.error('Error fetching comments:', e);
          dispatch(
            openToast({ text: "Failed to get Comments", type: "Failed" })
          );
          setTimeout(() => {
            dispatch(closeToast());
          }, 2000);
        });
    } else if (singlePostResponse.data?.post) {
      console.log('Fetching comments for single post:', singlePostResponse.data.post.id);
      getComments({ id: singlePostResponse.data.post.id })
        .unwrap()
        .then((r:any) => {
          console.log('Comments fetched:', r);
          setComments(r.comment);
        })
        .catch((e:any) => {
          console.error('Error fetching comments:', e);
          dispatch(
            openToast({ text: "Failed to get Comments", type: "Failed" })
          );
          setTimeout(() => {
            dispatch(closeToast());
          }, 2000);
        });
    }
  }, [params?.id, singlePostResponse.data?.post]);

  useEffect(() => {
    if (!params?.id && params?.postId) {
      console.log('Fetching single post:', params.postId);
      getSinglePost({ id: params.postId })
        .unwrap()
        .then((response) => {
          console.log('Single post fetched:', response);
        })
        .catch((error) => {
          console.error('Error fetching single post:', error);
          dispatch(
            openToast({ text: "Failed to get post", type: "Failed" })
          );
          setTimeout(() => {
            dispatch(closeToast());
          }, 2000);
        });
    }
  }, [params?.id, params?.postId]);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true); // or some other action
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false); // or some other action
      }
    );
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleCommentPost = () => {
    Keyboard.dismiss();
    setCommentText("");
    if (commentText) {
      setComments((prev) => [
        {
          id: uuid.v4().toString(),
          User: {
            id: "0",
            imageUri: user?.imageUri || "",
            verified: false,
            userName: user?.userName as string,
            name: user?.name as string,
          },
          comment: commentText,
          createdAt: `${new Date()}`,
        },
        ...prev,
      ]);
      postComment({ id: params.id, comment: commentText });
    }
  };
  const tint = dark ? "dark" : "light";
  return (
    <View
     
      style={{ flex: 1, marginTop: 100 }}
    >
      <FlatList
        ListHeaderComponent={
          params.id ? (
            <FullScreenPost {...params} />
          ) : (
            singlePostResponse.data?.post && (
              <FullScreenPost
                  id={singlePostResponse.data?.post.id}
                  isReposted={singlePostResponse.data?.post?.repostUser?.find(
                    (repostUser:any) => repostUser?.id === user?.id
                  )
                    ? true
                    : false}
                  date={singlePostResponse.data?.post.createdAt}
                  link={singlePostResponse.data?.post.link}
                  comments={singlePostResponse.data?.post._count?.comments}
                  like={singlePostResponse.data?.post._count?.like}
                  isLiked={singlePostResponse.data?.post?.like?.find(
                    (like:any) => like?.userId === user?.id
                  )
                    ? true
                    : false}
                  photo={singlePostResponse.data?.post.photo
                    ? {
                      uri: singlePostResponse.data?.post.photo?.imageUri,
                      width: singlePostResponse.data?.post.photo?.imageWidth,
                      height: singlePostResponse.data?.post.photo?.imageHeight,
                    }
                    : undefined}
                  thumbNail={singlePostResponse.data?.post.videoThumbnail}
                  imageUri={singlePostResponse.data?.post.user?.imageUri}
                  name={singlePostResponse.data?.post.user?.name}
                  userId={singlePostResponse.data?.post.user?.id}
                  userTag={singlePostResponse.data?.post.user?.userName}
                  verified={singlePostResponse.data?.post.user?.verified}
                  audioUri={singlePostResponse.data?.post.audioUri || undefined}
                  photoUri={singlePostResponse.data?.post.photoUri}
                  videoTitle={singlePostResponse.data?.post.videoTitle || undefined}
                  videoUri={singlePostResponse.data?.post.videoUri || undefined}
                  postText={singlePostResponse.data?.post.postText}
                  videoViews={singlePostResponse.data?.post.videoViews?.toString()} idx={0}              />
            )
          )
        }
        data={comments}
        ListEmptyComponent={
          <View style={{ marginTop: 20 }}>
            {commentResponse.isLoading && (
              <ActivityIndicator size={20} color={color} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <CommentBuilder
            imageUri={item.User?.imageUri}
            name={item.User?.name}
            comment={item.comment}
            date={item.createdAt}
            userTag={item.User.userName}
            verified={item.User.verified}
            photoUri={[]}
            id={item.User.id}
          />
        )}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 0,
            zIndex: 999,
            width: "100%",
            backgroundColor,
            paddingBottom: 10,
            paddingHorizontal: 25,
          },
          animatedStyles,
        ]}
      >
        
        <TextInput
          placeholder="Post comment"
          value={commentText || ""}
          onChangeText={setCommentText}
          placeholderTextColor={"grey"}
          style={{
            borderBottomColor: "#7a868f",
            borderBottomWidth: 0.5,
            fontFamily: "jakara",
            height: 50,
            color,

            width: "100%",
            includeFontPadding: false,
            fontSize: 16,
          }}
        />
        <View style={{ alignItems: "flex-end", width: "100%", paddingTop: 10 }}>
          {isKeyboardVisible && (
            <CommentButton
              onPress={handleCommentPost}
              isDisabled={!commentText}
              isLoading={postCommentResponse.isLoading}
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
}
