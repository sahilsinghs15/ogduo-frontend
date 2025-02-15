import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { UserState } from "../slice/user";
import {
  IComment,
  IPerson,
  IPost,
  IPostContent,
  IUSerData,
} from "../../types/api";
import storage from "../storage";
import { RootState } from "../store";
import { Platform } from "react-native";
import { chatData } from '../../data/chatDummyData';

interface loginResult {
  msg: string;
  token: string;
  data: IUSerData;
}

export const servicesApi = createApi({
  reducerPath: "servicesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.EXPO_PUBLIC_BASE_URL}/api/services`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState)?.user?.token;
      // If we have a token, set it in the header
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["post"],
  endpoints: (builder) => ({
    uploadPost: builder.mutation<
      { msg: string; photo: { uri: string; height: number; width: number } },
      { type: string; content: any; caption?: string }
    >({
      query: (payload) => {
        const formData = new FormData();
        
        if (payload.content) {
          const blob: any = {
            name: payload.content.uri.split("/").pop() || 'image.jpg',
            type: payload.content.mimeType,
            uri: Platform.OS === 'android' ? payload.content.uri : payload.content.uri.replace('file://', ''),
          };
          formData.append("photo", blob);
        }
        
        if (payload.caption) {
          formData.append("caption", payload.caption);
        }
        formData.append("type", payload.type);

        return {
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/upload-post-photo`,
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 10000,
        };
      },
      // Add proper error handling
      transformErrorResponse: (error: any) => {
        console.log('Upload error details:', error);
        if (error.status === 'FETCH_ERROR') {
          return { error: 'Network connection failed' };
        }
        return {
          error: error?.data?.message || 'Upload failed'
        };
      },
      // Add retry logic
      extraOptions: {
        maxRetries: 2
      }
    }),

    uploadAudio: builder.mutation<
      { msg: string },
      { audio: any; caption?: string }
    >({
      query: (payload) => {
        const formData = new FormData();
        
        if (payload.audio) {
          const blob: any = {
            name: payload.audio.uri.split("/").pop(),
            type: payload.audio.mimeType,
            uri: payload.audio.uri,
          };
          formData.append("audio", blob);
        }
        
        if (payload.caption) {
          formData.append("caption", payload.caption);
        }

        return {
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/upload-audio`,
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        };
      },
      // Add proper error handling
      transformErrorResponse: (error: any) => {
        console.log('Audio upload error:', error);
        return {
          error: error?.data?.message || 'Audio upload failed'
        };
      },
      // Add retry logic
      extraOptions: {
        maxRetries: 2
      }
    }),
    uploadVideo: builder.mutation<
      { video: string; thumbNail: string },
      { mimeType: string; uri: string }
    >({
      query: (payload) => {
        const blob: any = {
          name: `${payload.uri.split("/").splice(-1)}`,
          type: payload.mimeType,
          uri: payload.uri,
        };
        const formData = new FormData();

        formData.append("video", blob);
        return {
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/upload-video`,
          method: "POST",
          body: formData,
          headers: {
            "Content-type": "multipart/form-data",
          },
        };
      },
    }),
    postContent: builder.mutation<{ msg: string }, IPostContent>({
      query: (payload) => {
        // Prepare the request body with required fields
        const requestBody = {
          postText: payload.caption,
          type: payload.type,
          // Add media fields based on type
          ...(payload.type === 'image' && { 
            photo: {
              id: payload.photo?.id || '',
              uri: payload.photo?.uri || '',
              height: payload.photo?.height || 0,
              width: payload.photo?.width || 0
            }
          }),
          ...(payload.type === 'audio' && { 
            audio: {
              id: payload.audio?.id || '',
              audioUri: payload.audio?.audioUri || '',
              audioTitle: payload.audio?.audioTitle || ''
            }
          }),
          ...(payload.type === 'video' && { 
            video: {
              id: payload.video?.id || '',
              videoUri: payload.video?.videoUri || '',
              videoTitle: payload.video?.videoTitle || '',
              videoThumbnail: payload.video?.videoThumbnail || ''
            }
          })
        };

        return {
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/post/`,
          method: "POST",
          body: requestBody,
          headers: {
            "Content-type": "application/json",
          },
        };
      },
      transformErrorResponse: (error: any) => {
        console.log('Post content error:', error);
        return {
          error: error?.data?.message || 'Failed to create post'
        };
      },
      invalidatesTags: ["post"]
    }),

    getAllPosts: builder.query<
      { posts: IPost[] },
      { take: number; skip: number }
    >({
      query: ({ take, skip }) => `${process.env.EXPO_PUBLIC_API_URL}/api/services/all-posts?take=${take}&skip=${skip}`,
      providesTags: ["post"],
      extraOptions: { maxRetries: 2 },
    }),
    getSinglePost: builder.query<{ posts: IPost }, { id: string }>({
      query: ({ id }) => `${process.env.EXPO_PUBLIC_API_URL}/api/services/single-post?id=${id}`,
      extraOptions: { maxRetries: 2 },
    }),
    getRandomPosts: builder.query<{ posts: IPost[] }, null>({
      query: () => `${process.env.EXPO_PUBLIC_API_URL}/api/services/random-posts`,
      extraOptions: { maxRetries: 2 },
    }),
    getRandomPeople: builder.query<{ people: IPerson[] }, null>({
      query: () => `${process.env.EXPO_PUBLIC_API_URL}/api/services/random-people`,
      extraOptions: { maxRetries: 2 },
    }),
    searchPosts: builder.query<{ posts: IPost[] }, { q: string }>({
      query: ({ q }) => `${process.env.EXPO_PUBLIC_API_URL}/api/services/search-posts?q=${q}`,
      extraOptions: { maxRetries: 0 },
    }),
    searchPeople: builder.query<{ people: IPerson[] }, { q: string }>({
      query: ({ q }) => `${process.env.EXPO_PUBLIC_API_URL}/api/services/search-people?q=${q}`,
      extraOptions: { maxRetries: 0 },
    }),
    followUser: builder.query<{ msg: string }, { id: string }>({
      query: ({ id }) => `${process.env.EXPO_PUBLIC_API_URL}/api/services/follow?id=${id}`,
      extraOptions: { maxRetries: 0 },
    }),

    likePost: builder.query<{ msg: string }, { id: string }>({
      query: ({ id }) => `${process.env.EXPO_PUBLIC_API_URL}/api/services/like-post?id=${id}`,
      extraOptions: { maxRetries: 2 },
    }),
    postComment: builder.mutation<
      { msg: string },
      { id: string; comment: string }
    >({
      query: (payload) => ({
        url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/post-comment`,
        method: "POST",

        body: payload,
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      }),
    }),
    getCommentByPost: builder.query<{ comment: IComment[] }, { id: string }>({
      query: ({ id }) => `${process.env.EXPO_PUBLIC_API_URL}/api/services/get-postComment?id=${id}`,
      extraOptions: { maxRetries: 2 },
    }),
    getFollowedPosts: builder.query<
      { posts: IPost[] },
      { take: number; skip: number }
    >({
      query: ({ take, skip }) => `${process.env.EXPO_PUBLIC_API_URL}/api/services/followed-posts?take=${take}&skip=${skip}`,

      extraOptions: { maxRetries: 2 },
    }),
    getMyPosts: builder.query<
      { posts: IPost[] },
      { take: number; skip: number }
    >({
      query: ({ take, skip }) => `${process.env.EXPO_PUBLIC_API_URL}/api/services/my-posts?take=${take}&skip=${skip}`,

      extraOptions: { maxRetries: 2 },
    }),
    getGuestPosts: builder.query<
      { posts: IPost[] },
      { take: number; skip: number; id: string }
    >({
      query: ({ take, skip, id }) =>
        `${process.env.EXPO_PUBLIC_API_URL}/api/services/guest-posts?id=${id}&take=${take}&skip=${skip}`,

      extraOptions: { maxRetries: 2 },
    }),
    repost: builder.query<{ msg: string }, { id: string }>({
      query: ({ id }) => `${process.env.EXPO_PUBLIC_API_URL}/api/services/re-post?id=${id}`,
    }),
    deletePostById: builder.mutation<
      { msg: string },
      {
        id: string;
      }
    >({
      query: ({ id }) => {
        return {
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/delete-post`,
          method: "DELETE",
          body: { id },
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        };
      },
    }),
    getAllChats: builder.query<any, null>({
      queryFn: () => {
        if (__DEV__) {
          return { data: chatData };
        }
        return { data: [] }; // Return empty data for production
      }
    }),
  }),
});

export const {
  useUploadPostMutation,
  usePostContentMutation,
  useUploadAudioMutation,
  useUploadVideoMutation,
  useLazySearchPeopleQuery,
  useLazyGetGuestPostsQuery,
  useGetRandomPostsQuery,
  useLazyGetRandomPostsQuery,
  useGetAllPostsQuery,
  useLazyGetFollowedPostsQuery,
  useGetRandomPeopleQuery,
  useLazyFollowUserQuery,
  useGetMyPostsQuery,
  useLazyGetMyPostsQuery,
  useLazyLikePostQuery,
  useLazyGetSinglePostQuery,
  usePostCommentMutation,
  useLazySearchPostsQuery,
  useGetCommentByPostQuery,
  useLazyRepostQuery,
  useLazyGetCommentByPostQuery,
  useLazyGetAllPostsQuery,
  useDeletePostByIdMutation,
  useGetAllChatsQuery,
} = servicesApi;

