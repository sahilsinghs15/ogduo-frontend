import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { authApi } from "../../api/auth";
import { IUSerData } from "../../../types/api";
import { userApi } from "../../api/user";
import { disconnectSocket } from '../../../util/socket';

export interface UserState {
  data: IUSerData | null;
  error: any;
  token: string | null;
  loading: boolean;
}

const initialState: UserState = {
  data: null,
  error: null,
  loading: false,
  token: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    signOut: (state) => {
      console.log('Signing out...');
      state.data = null;
      state.error = null;
      state.loading = false;
      state.token = null;
      // Clear any cached API data
      userApi.util.resetApiState();
      authApi.util.resetApiState();
      disconnectSocket();
    },
    clearUserData: (state) => {
      state.data = null;
      state.error = null;
      state.loading = false;
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      userApi.endpoints.getUser.matchFulfilled,
      (state, { payload }) => {
        state.data = payload.data;
        state.error = null;
        state.loading = false;
      }
    );
    builder.addMatcher(userApi.endpoints.getUser.matchPending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addMatcher(
      userApi.endpoints.getUser.matchRejected,
      (state, { error }) => {
        state.data = null;
        state.error = error;
        state.loading = true;
      }
    );
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.data = payload.data;
        state.token = payload.token;
        state.error = null;
        state.loading = false;
      }
    );
    builder.addMatcher(authApi.endpoints.login.matchPending, (state) => {
      state.data = null;
      state.error = null;
      state.loading = true;
      state.token = null;
    });
    builder.addMatcher(
      authApi.endpoints.login.matchRejected,
      (state, { error }) => {
        state.data = null;
        state.error = error;
        state.loading = true;
        state.token = null;
      }
    );
    builder.addMatcher(
      userApi.endpoints.tokenValid.matchRejected,
      (state) => {
        state.data = null;
        state.token = null;
        state.error = null;
        state.loading = false;
      }
    );
  },
});

export default userSlice.reducer;

export const { signOut, clearUserData } = userSlice.actions;
