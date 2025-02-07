import { View, Text, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeOut,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { postState } from "../../../redux/slice/post";
import { FlashList } from "@shopify/flash-list";
import { ActivityIndicator } from "react-native-paper";
import useGetMode from "../../../hooks/GetMode";
import { PostSearchSkeleton } from "../../../components/discover/Skeleton/PostSearchSkeleton";
import PostsContainer from "../../../components/discover/PostsContainer";
import { useLazySearchPostsQuery } from "../../../redux/api/services";
import { useAppSelector } from "../../../redux/hooks/hooks";

interface Post {
  id: string;
  createdAt: string;
  _count: {
    comments: number;
    like: number;
  };
  repostUser: Array<{ id: string }>;
  like: Array<{ userId: string }>;
  link: {
    id: string;
    imageHeight?: number;
    imageUri?: string;
    imageWidth?: number;
    title: string;
  } | null;
  videoThumbnail?: string;
  user?: {
    imageUri?: string;
    name: string;
    userName: string;
    verified: boolean;
  };
  audioUri?: string;
  photoUri?: string;
  videoTitle?: string;
  videoUri?: string;
  postText: string;
  videoViews?: string;
}

export default function Posts() {
  // Fix the selector to properly access the data
  const posts = useAppSelector((state: any) => state.searchPost);
  const authId = useAppSelector((state: any) => state.user?.data?.id);
  const [showLoading, setShowLoading] = useState((posts?.length ?? 0) > 8);
  const dark = useGetMode();
  const color = dark ? "white" : "black";
  const acolor = !dark ? "white" : "black";

  const handleStopLoading = () => {
    setShowLoading(false);
  };

  function callback() {
    "worklet";
    runOnJS(handleStopLoading)();
  }

  useEffect(() => {
    if (posts?.length <= 8) {
      setShowLoading(false);
    }
  }, [posts]);

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        entering={FadeInLeft.withCallback(callback)
          .springify()
          .delay((posts?.length ?? 0) > 8 ? 400 : 0)}
        style={{ flex: 1 }}
      >
        {posts?.loading && (
          <Animated.View style={{ gap: 5, padding: 10 }}>
            {[0, 1, 2].map((idx) => (
              <PostSearchSkeleton key={idx} />
            ))}
          </Animated.View>
        )}
        <FlashList
          data={posts}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={100}
          contentContainerStyle={{
            paddingTop: 20,
            paddingBottom: 100,
            paddingHorizontal: 10,
          }}
          renderItem={({ item }: { item: Post }) => (
            <PostsContainer
              {...item}
              isReposted={!!item?.repostUser?.find(
                (repostUser) => repostUser?.id === authId
              )}
              isLiked={!!item?.like?.find((like) => like?.userId === authId)}
              idx={0}
              imageUri={item.user?.imageUri ?? ""}
              name={item.user?.name ?? ""}
              date={new Date(item.createdAt)}
              userTag={item.user?.userName ?? ""}
              verified={item.user?.verified ?? false}
              thumbNail={item.videoThumbnail ?? ""}
              photoUri={item.photoUri ? [item.photoUri] : []}
              like={item.like.length}
            />
          )}
          keyExtractor={(item: Post) => item.id.toString()}
        />
      </Animated.View>
      {showLoading && (
        <Animated.View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <ActivityIndicator color={acolor} size={40} />
        </Animated.View>
      )}
    </View>
  );
}