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
import AsyncStorage from '@react-native-async-storage/async-storage';

interface loginResult {
  msg: string;
  token: string;
  data: IUSerData;
}

// Helper function to get the auth token
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const servicesApi = createApi({
  reducerPath: "servicesApi",
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState)?.user?.token;
      console.log('Using auth token:', token);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: 'include',
  }),
  tagTypes: ["post"],
  endpoints: (builder) => ({
    uploadPost: builder.mutation<
      { msg: string },
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
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/upload-photo`,
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
    postContent: builder.mutation<
      { msg: string },
      {
        postText: string;
        audioUri?: string;
        audioTitle?: string;
        videoUri?: string;
        videoTitle?: string;
        videoThumbnail?: string;
      }
    >({
      query: (payload) => {
        console.log('Making text post request:', payload);
        return {
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/post`,
          method: "POST",
          body: payload,
          headers: {
            'Content-Type': 'application/json',
          },
        };
      },
      invalidatesTags: ["post"],
    }),

    postImage: builder.mutation<
      { msg: string; photo?: { uri: string; width: number; height: number } },
      { postText: string; photo: { uri: string; type: string; name: string } }
    >({
      query: (payload) => {
        console.log('Making image post request:', payload);
        const formData = new FormData();
        formData.append('postText', payload.postText);
        formData.append('photo', {
          uri: payload.photo.uri,
          type: payload.photo.type,
          name: payload.photo.name
        } as any);

        console.log('FormData created for image:', formData);

        return {
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/post/image`,
          method: "POST",
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
      invalidatesTags: ["post"],
    }),

    postAudio: builder.mutation<
      { msg: string },
      { postText: string; audio: { audioUri: string; type: string; name: string } }
    >({
      query: (payload) => {
        console.log('postAudio mutation called with payload:', payload);
        const formData = new FormData();
        formData.append('postText', payload.postText);
        formData.append('audio', {
          audioUri: payload.audio.audioUri,
          type: payload.audio.type,
          name: payload.audio.name
        } as any);

        return {
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/post/audio`,
          method: "POST",
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
      invalidatesTags: ["post"],
    }),

    postVideo: builder.mutation<
      { message: string; video?: { uri: string; width: number; height: number }, videoTitle?: string },
      { video: { uri: string; type: string; name: string; size?: number }; postText: string; videoTitle: string }
    >({
      query: (payload) => {
        const formData = new FormData();
        
        // Create video file object for upload
        if (payload.video) {
          // Log detailed video file information
          console.log('Video file details before FormData:', {
            uri: payload.video.uri,
            type: payload.video.type,
            name: payload.video.name,
            size: payload.video.size
          });

          formData.append('video', {
            uri: payload.video.uri,
            type: 'video/mp4',
            name: payload.video.name,
            size: payload.video.size
          } as any);
        }
        
        formData.append('postText', payload.postText);
        formData.append('videoTitle', payload.videoTitle);

        // Log complete request details
        console.log('Complete request details:', {
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/post/video`,
          videoDetails: formData.get('video'),
          postText: formData.get('postText'),
          videoTitle: formData.get('videoTitle')
        });

        return {
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/post/video`,
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
          // Increase timeout for larger files
          timeout: 120000, // 2 minutes
        };
      },
      transformErrorResponse: (response: any) => {
        // Enhanced error logging
        console.log('Video upload error full response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers,
          error: response.error
        });

        if (response.status === 500) {
          return { 
            error: 'Server error while uploading video. The video may be too large or in an unsupported format.',
            details: {
              message: response.data?.message,
              status: response.status,
              additionalInfo: response.data
            }
          };
        }
        if (response.status === 400) {
          return { 
            error: 'Invalid video upload request. Please check the video format and size.',
            details: {
              message: response.data?.message,
              status: response.status,
              additionalInfo: response.data
            }
          };
        }
        return { 
          error: 'Failed to upload video. Please try again with a different video.',
          details: {
            message: response.data?.message,
            status: response.status,
            additionalInfo: response.data
          }
        };
      },
      invalidatesTags: ['post']
    }),

    postComment: builder.mutation<
      { msg: string },
      { id: string; comment: string }
    >({
      query: (payload) => {
        console.log('Posting comment:', payload);
        return {
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/post-comment`,
          method: "POST",
          body: payload,
          headers: {
            'Content-Type': 'application/json',
          },
        };
      },
      invalidatesTags: ["post"],
    }),

    deletePostById: builder.mutation<
      { msg: string },
      {
        id: string;
      }
    >({
      query: ({ id }) => {
        console.log('Deleting post:', id);
        return {
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/services/delete-post`,
          method: "DELETE",
          body: { id },
          headers: {
            'Content-Type': 'application/json',
          },
        };
      },
      invalidatesTags: ["post"],
    }),
    getAllPosts: builder.query<
      { posts: IPost[] },
      { take: number; skip: number }
    >({
      query: ({ take, skip }) => {
        console.log('Fetching posts with take:', take, 'skip:', skip);
        return `${process.env.EXPO_PUBLIC_API_URL}/api/services/all-posts?take=${take}&skip=${skip}`;
      },
      providesTags: ["post"],
    }),

    getSinglePost: builder.query<
      { post: IPost },
      { id: string }
    >({
      query: ({ id }) => {
        console.log('Fetching single post with id:', id);
        return `${process.env.EXPO_PUBLIC_API_URL}/api/services/single-post?id=${id}`;
      },
      providesTags: ["post"],
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
    getCommentByPost: builder.query<
      { comment: IComment[] },
      { id: string }
    >({
      query: ({ id }) => {
        console.log('Fetching comments for post:', id);
        return `${process.env.EXPO_PUBLIC_API_URL}/api/services/get-postComment?id=${id}`;
      },
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
      extraOptions: { maxRetries: 2 },
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
  usePostImageMutation,
  usePostAudioMutation,
  usePostVideoMutation,
} = servicesApi;
