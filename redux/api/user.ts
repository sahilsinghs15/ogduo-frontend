import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { UserState } from "../slice/user";
import {
  FollowData,
  FollowingData,
  IGuestData,
  IUSerData,
  Notifications,
} from "../../types/api";
import storage from "../storage";
import { RootState } from "../store";

interface loginResult {
  msg: string;
  token: string;
  data: IUSerData;
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://192.168.0.100:8080",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["user", "guest"],
  endpoints: (builder) => ({
    getUser: builder.query<{ data: IUSerData }, null>({
      query: () => "http://192.168.0.100:8080/api/user/get-user",
      providesTags: ["user"],
      extraOptions: { maxRetries: 2 },
    }),
    logout: builder.query<{ msg: string }, null>({
      query: () => "http://192.168.0.100:8080/api/user/logout",
      providesTags: ["user"],
      extraOptions: { maxRetries: 2 },
    }),
    getGuest: builder.query<{ data: IGuestData }, { id: string }>({
      query: ({ id }) => `http://192.168.0.100:8080/api/user/get-guest?id=${id}`,
      providesTags: ["guest"],
      keepUnusedDataFor: 10,
    }),
    getNotifications: builder.query<{ notifications: Notifications[] }, null>({
      query: () => `http://192.168.0.100:8080/api/user/get-notifications`,
      keepUnusedDataFor: 10,
    }),
    getFollowDetails: builder.query<
      { following: string; followers: string },
      null
    >({
      query: () => "http://192.168.0.100:8080/api/user/get-follows",
      providesTags: ["user"],
      extraOptions: { maxRetries: 2 },
    }),
    tokenValid: builder.query<{ valid: boolean }, null>({
      query: () => ({
        url: 'http://192.168.0.100:8080/api/user/get-user',
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        console.log('Token validation response:', response);
        if (response?.data) {
          return { valid: true };
        }
        return { valid: false };
      },
      transformErrorResponse: (error: any) => {
        console.log('Token validation error:', error);
        if (error.status === 401 || error.status === 403) {
          return { valid: false };
        }
        return { valid: true };
      },
      keepUnusedDataFor: 300,
    }),
    uploadProfilePicture: builder.mutation<
      { photo: string },
      { mimeType: string; uri: string }
    >({
      query: (payload) => {
        const blob: any = {
          name: `${payload.uri.split("/").splice(-1)}`,
          type: payload.mimeType,
          uri: payload.uri,
        };
        const formData = new FormData();

        formData.append("photo", blob);
        return {
          url: "http://192.168.0.100:8080/api/user/update-photo",
          method: "POST",
          body: formData,
          headers: {
            "Content-type": "multipart/form-data",
          },
        };
      },
      invalidatesTags: ["user"],
    }),
    updateNotificationId: builder.mutation<
      { success: boolean },
      { notificationId: string }
    >({
      query: (payload) => ({
        url: 'http://192.168.0.100:8080/api/user/update-notification-id',
        method: 'PUT',
        body: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      transformResponse: (response: any) => ({
        success: true,
        ...response
      }),
      transformErrorResponse: (error: any) => ({
        success: false,
        error: error?.data?.message || 'Failed to update notification token'
      }),
      extraOptions: {
        maxRetries: 2
      }
    }),
    getFollowingList: builder.query<
      FollowingData[],
      { take: number; skip: number }
    >({
      query: ({ take, skip }) => `http://192.168.0.100:8080/api/user/get-following?take=${take}&skip=${skip}`,
      providesTags: ["user"],
    }),
    getFollowersList: builder.query<
      FollowData[],
      { take: number; skip: number }
    >({
      query: ({ take, skip }) => `http://192.168.0.100:8080/api/user/get-followers?take=${take}&skip=${skip}`,
      providesTags: ["user"],
    }),
    updateData: builder.mutation<
      { msg: string },
      {
        userName?: string;
        password: string;
        newPassword?: string;
        name?: string;
      }
    >({
      query: ({ userName, password, newPassword, name }) => {
        return {
          url: "http://192.168.0.100:8080/api/user/update-data",
          method: "PUT",
          body: { userName, password, newPassword, name },
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        };
      },
      invalidatesTags: ["user"],
    }),
    deleteAccount: builder.mutation<
      { msg: string },
      {
        userName?: string;
        password: string;
        newPassword?: string;
        name?: string;
      }
    >({
      query: ({ password }) => {
        return {
          url: "http://192.168.0.100:8080/api/user/delete-account",
          method: "DELETE",
          body: { password },
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        };
      },
      invalidatesTags: ["user"],
    }),
  }),
});

export const {
  useGetUserQuery,
  useTokenValidQuery,
  useLazyGetUserQuery,
  useGetGuestQuery,
  useLazyGetNotificationsQuery,
  useLazyGetGuestQuery,
  useGetNotificationsQuery,
  useUpdateNotificationIdMutation,
  useUploadProfilePictureMutation,
  useLazyGetFollowersListQuery,
  useLazyGetFollowingListQuery,
  useLazyLogoutQuery,
  useDeleteAccountMutation,
  useUpdateDataMutation,
  useGetFollowDetailsQuery,
  useLazyGetFollowDetailsQuery,
} = userApi;
