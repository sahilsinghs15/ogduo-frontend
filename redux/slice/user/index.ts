import { PayloadAction, createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "../../api/auth";
import { IUSerData } from "../../../types/api";
import { userApi } from "../../api/user";
import { disconnectSocket } from '../../../util/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      // Clear API cache
      userApi.util.resetApiState();
      authApi.util.resetApiState();
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
      (state, action) => {
        // Only clear token on explicit 401 errors
        if (action.error.status === 401) {
          state.token = null;
        }
        // Ignore other errors
      }
    );
  },
});

export default userSlice.reducer;

export const { signOut, clearUserData } = userSlice.actions;

export const signOutAsync = createAsyncThunk('user/signOut', async (_, { dispatch }) => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error during sign out:', error);
    return false;
  }
});
