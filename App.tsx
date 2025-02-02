import { setImmediate } from 'timers';
import "react-native-gesture-handler";
import 'react-native-polyfill-globals/auto';
import "react-native-get-random-values";
import { StatusBar } from "expo-status-bar";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import { PaperProvider } from "react-native-paper";
import { enableFreeze } from "react-native-screens";
import { useNetInfo } from "@react-native-community/netinfo";
import { useAppDispatch, useAppSelector } from "./redux/hooks/hooks";
import { openToast } from "./redux/slice/toast/toast";
import CustomToast from "./components/global/Toast";
import { LoadingModal } from "./components/global/Modal/LoadingOverlay";
// import Navigation from "./Navigation";
import SystemNavigationBar from "react-native-system-navigation-bar";
import Notifications from "./util/notification";
import DeviceInfo from "react-native-device-info";
import * as Device from "expo-device";
import * as NavigationBar from "expo-navigation-bar";
import * as Sentry from "@sentry/react-native";
import useGetMode from "./hooks/GetMode";
import { setHighEnd } from "./redux/slice/prefs";
import OnboardNavigation from "./routes/OnBoard";
import Main from "./routes/Main";
import Auth from "./routes/Auth";

if (typeof globalThis.setImmediate === "undefined") {
  globalThis.setImmediate = setImmediate;
}
enableFreeze(true);

Sentry.init({
  dsn: "https://a5db1485b6b50a45db57917521128254@o4505750037725184.ingest.sentry.io/4505750586195968",
  enabled: true,
});

const persistor = persistStore(store);
SplashScreen.preventAutoHideAsync();

SystemNavigationBar.setNavigationColor("transparent");
SystemNavigationBar.setNavigationBarContrastEnforced(true);

export default function App() {
  const dispatch = useAppDispatch();
  const netInfo = useNetInfo();
  const darkMode = useGetMode();
  const barColor = darkMode ? "black" : "white";

  useEffect(() => {
    // Notification Listener
    const notificationSubscription = Notifications.addNotificationReceivedListener((notification: any) => {
      console.log("Notification received:", notification.request.content.data);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log("Notification response:", response);
    });

    // Device Info and Environment Settings
    const setNavigationBarColor = async () => {
      if (Platform.OS !== "ios") {
        await NavigationBar.setBackgroundColorAsync(barColor);
      }
    };
    setNavigationBarColor();

    // Check High-End Device
    const isHighEndDevice = () => {
      const ram = DeviceInfo.getTotalMemorySync();
      const isHighEnd =
        (DeviceInfo.getApiLevelSync() >= 33 && ram >= 6_442_450_944) || Platform.OS === "ios";
      dispatch(setHighEnd({ isHighEnd }));
    };
    isHighEndDevice();

    // Handle Connectivity
    if (netInfo.isConnected === false) {
      dispatch(openToast({ text: "No Internet Connection", type: "Failed" }));
    }

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, [barColor, netInfo.isConnected]);

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <PaperProvider>
          <CustomToast />
          <LoadingModal />
          <Navigation />
        </PaperProvider>
      </PersistGate>
    </Provider>
  );
}

const Navigation = () => {
  const dispatch = useAppDispatch();
  const darkMode = useGetMode();
  const route = useAppSelector((state) => state?.routes?.route);
  const userAuthenticated = useAppSelector((state) => state?.user?.token);

  const [fontsLoaded] = useFonts({
    mulish: require("./assets/fonts/Mulish-Light.ttf"),
    mulishBold: require("./assets/fonts/Mulish-Black.ttf"),
    mulishMedium: require("./assets/fonts/Mulish-Medium.ttf"),
    uberBold: require("./assets/fonts/UberMove-Bold.ttf"),
    instaBold: require("./assets/fonts/Instagram.ttf"),
    jakaraBold: require("./assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    jakara: require("./assets/fonts/PlusJakartaSans-Medium.ttf"),
  });

  if (!fontsLoaded) return null;

  if (route === "onBoard") return <OnboardNavigation />;
  if (userAuthenticated) return <Main />;
  return <Auth />;
};
