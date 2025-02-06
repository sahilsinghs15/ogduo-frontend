const setImmediate = global.setImmediate ?? ((fn: () => void) => setTimeout(fn, 0));

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
import Notifications from "./util/notification";
import * as Device from "expo-device";
import * as NavigationBar from "expo-navigation-bar";
import * as Sentry from "@sentry/react-native";
import useGetMode from "./hooks/GetMode";
import OnboardNavigation from "./routes/OnBoard";
import Main from "./routes/Main";
import Auth from "./routes/Auth";

enableFreeze(true);

Sentry.init({
  dsn: "https://a5db1485b6b50a45db57917521128254@o4505750037725184.ingest.sentry.io/4505750586195968",
  enabled: true,
});

const persistor = persistStore(store);
SplashScreen.preventAutoHideAsync();

export default function App() {
  console.log("App component mounting...");
  return (
    <Provider store={store}>
      <PersistGate 
        loading={<View style={{flex:1, backgroundColor: 'black'}} />} 
        persistor={persistor}
        onBeforeLift={() => {
          console.log("PersistGate before lift...");
        }}
      >
        <AppContent />
      </PersistGate>
    </Provider>
  );
}

function AppContent() {
  console.log("AppContent mounting...");
  const dispatch = useAppDispatch();
  const netInfo = useNetInfo();

  useEffect(() => {
    const notificationSubscription = Notifications.addNotificationReceivedListener((notification: any) => {
      console.log("Notification received:", notification.request.content.data);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log("Notification response:", response);
    });

    if (netInfo.isConnected === false) {
      dispatch(openToast({ text: "No Internet Connection", type: "Failed" }));
    }

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, [netInfo.isConnected]);

  return (
    <PaperProvider>
      <CustomToast />
      <LoadingModal />
      <NavigationContainer
        onStateChange={() => {
          console.log("Navigation state changed");
        }}
      >
        <Navigation />
      </NavigationContainer>
    </PaperProvider>
  );
}

const Navigation = () => {
  const [isReady, setIsReady] = useState(false);
  const dispatch = useAppDispatch();
  const darkMode = useGetMode();
  const netInfo = useNetInfo();
  const route = useAppSelector((state) => state?.routes?.route);
  const userAuthenticated = useAppSelector((state) => state?.user?.token);
  const barColor = darkMode ? "black" : "white";
  const [navBarReady, setNavBarReady] = useState(false);

  const [fontsLoaded] = useFonts({
    mulish: require("./assets/fonts/Mulish-Light.ttf"),
    mulishBold: require("./assets/fonts/Mulish-Black.ttf"),
    mulishMedium: require("./assets/fonts/Mulish-Medium.ttf"),
    uberBold: require("./assets/fonts/UberMove-Bold.ttf"),
    instaBold: require("./assets/fonts/Instagram.ttf"),
    jakaraBold: require("./assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    jakara: require("./assets/fonts/PlusJakartaSans-Medium.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      setIsReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    let mounted = true;

    const setupNavBar = async () => {
      try {
        if (Platform.OS === 'android' && mounted) {
          await NavigationBar.setBackgroundColorAsync(barColor);
          await NavigationBar.setButtonStyleAsync(darkMode ? 'light' : 'dark');
          setNavBarReady(true);
        }
      } catch (error) {
        console.log("Navigation bar setup error:", error);
      }
    };

    setTimeout(setupNavBar, 500);

    return () => {
      mounted = false;
    };
  }, [barColor, darkMode]);

  if (!isReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }} />
    );
  }

  if (route === "onBoard") return <OnboardNavigation />;
  if (userAuthenticated) return <Main />;
  return <Auth />;
};
