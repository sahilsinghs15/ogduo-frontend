import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { UserState } from "../slice/user";
import { IUSerData } from "../../types/api";
import storage from "../storage";

interface loginResult {
  msg: string;
  token: string;
  data: IUSerData;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.EXPO_PUBLIC_BASE_URL}`,
  }),
  tagTypes: ["user"],
  endpoints: (builder) => ({
    login: builder.mutation<
      loginResult,
      {
        userName: string;
        password: string;
      }
    >({
      query: (payload) => ({
        url: `${process.env.EXPO_PUBLIC_API_URL}/api/auth/login`,
        method: "POST",
        body: payload,
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      }),

      transformErrorResponse: (response: { status: number, data: any }) => {
        return response.data?.message || 'An error occurred';
      },
    }),
    register: builder.mutation<
      loginResult,
      {
        userName: string;
        password: string;
        email: string;
        name: string;
      }
    >({
      query: (payload) => ({
        url: `${process.env.EXPO_PUBLIC_API_URL}/api/auth/signup`,
        method: "POST",
        body: payload,
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      }),
    }),
  }),
});

export const { useLoginMutation ,useRegisterMutation} = authApi;
