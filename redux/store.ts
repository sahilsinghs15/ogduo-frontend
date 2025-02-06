import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import routes, { Route } from "./slice/routes";
import prefs, { Prefs } from "./slice/prefs";
import bottomSheet, { BottomSheet } from "./slice/bottomSheet";
import reduxStorage from "./storage";
import post, { postState } from "./slice/post";
import searchPost from "./slice/post/search";
import toast, { ToastState } from "./slice/toast/toast";
import { authApi } from "./api/auth";
import user, { UserState } from "./slice/user";
import {
  persistReducer,
  REHYDRATE,
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  PersistConfig,
} from "redux-persist";
import chatList, { ChatList } from "./slice/chat/chatlist";
import { userApi } from "./api/user";
import { servicesApi } from "./api/services";
import loadingModal, { LoadingModal } from "./slice/modal/loading";
import searchPeople, { personState } from "./slice/people/search";
import followers, { FollowerState } from "./slice/user/followers";
import followedPost from "./slice/post/followed";
import { chatApi } from "./api/chat";
import online from "./slice/chat/online";
import currentPage from "./slice/currentPage";
import audio from "./slice/post/audio";

// Define a base state type
type RootStateType = {
  routes: Route;
  prefs: Prefs;
  bottomSheet: BottomSheet;
  post: postState;
  toast: ToastState;
  loadingModal: LoadingModal;
  searchPost: typeof searchPost;
  followers: FollowerState;
  chatlist: ChatList;
  online: typeof online;
  audio: typeof audio;
  [chatApi.reducerPath]: typeof chatApi.reducer;
  [authApi.reducerPath]: typeof authApi.reducer;
  [userApi.reducerPath]: typeof userApi.reducer;
  [servicesApi.reducerPath]: typeof servicesApi.reducer;
  user: UserState;
  searchPeople: typeof searchPeople;
  followedPost: typeof followedPost;
  currentPage: typeof currentPage;
};

// Persist Config for Redux Persist
const persistConfig: PersistConfig<RootStateType> = {
  key: "root",
  storage: reduxStorage,
  whitelist: ["routes", "prefs", "user"],
  blacklist: [
    chatApi.reducerPath,
    authApi.reducerPath,
    userApi.reducerPath,
    servicesApi.reducerPath,
  ],
  timeout: 2000 // Increase timeout for hydration
};

// Combine Reducers
const reducer = combineReducers({
  routes,
  prefs,
  bottomSheet,
  post,
  toast,
  loadingModal,
  searchPost,
  followers,
  chatlist: chatList,
  online,
  audio,
  [chatApi.reducerPath]: chatApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [servicesApi.reducerPath]: servicesApi.reducer,
  user,
  searchPeople,
  followedPost,
  currentPage,
}) as any;

// Create Persisted Reducer
const persistedReducer = persistReducer(persistConfig, reducer);

// Configure Store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: [
          "persist",
          "routes",
          "prefs",
          "user",
          "[authApi.reducerPath]",
          "[userApi.reducerPath]",
        ],
      },
    }).concat(
      authApi.middleware,
      userApi.middleware,
      servicesApi.middleware,
      chatApi.middleware
    ) as any,
});

// Types for RootState and AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
