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
    baseUrl: `${process.env.EXPO_PUBLIC_API_URL}/api/auth`,
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
        url: "http://192.168.0.104:80/api/auth/login",
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
      query: (payload) => {
        console.log('Making register request with:', payload);
        return {
          url: "http://192.168.0.104:80/api/auth/signup",
          method: "POST",
          body: payload,
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          console.log('Register success:', data);
        } catch (error) {
          console.log('Register query error:', error);
        }
      },
    }),
  }),
});

export const { useLoginMutation ,useRegisterMutation} = authApi;
