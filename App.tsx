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
import { useTokenValidQuery } from "./redux/api/user";
import { signOut } from "./redux/slice/user";
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

enableFreeze(true);

Sentry.init({
  dsn: "https://a5db1485b6b50a45db57917521128254@o4505750037725184.ingest.sentry.io/4505750586195968",
  enabled: true,
});

const persistor = persistStore(store);
SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <Provider store={store}>
        <PersistGate 
          loading={<View style={{flex:1, backgroundColor: 'black'}} />} 
          persistor={persistor}
        >
          <AppContent />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

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

  // Add global error handler
  useEffect(() => {
    const handleError = (error: any) => {
      console.log('Global error:', error);
      dispatch(openToast({ 
        text: 'An error occurred', 
        type: 'Failed' 
      }));
    };

    // Set up error handler
    const errorHandler = (error: ErrorEvent) => {
      handleError(error.error);
    };

    // Set up promise rejection handler
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      handleError(new Error(event.reason));
    };

    if (global.addEventListener) {
      global.addEventListener('error', errorHandler);
      global.addEventListener('unhandledrejection', rejectionHandler);
    }

    return () => {
      if (global.removeEventListener) {
        global.removeEventListener('error', errorHandler);
        global.removeEventListener('unhandledrejection', rejectionHandler);
      }
    };
  }, [dispatch]);

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

  const { data: tokenValid, error: tokenError } = useTokenValidQuery(null, {
    skip: !userAuthenticated,
    pollingInterval: 600000,
  });

  // Log token validation status
  useEffect(() => {
    if (userAuthenticated) {
      console.log('Token validation status:', {
        tokenValid,
        tokenError,
        userAuthenticated: !!userAuthenticated
      });
    }
  }, [tokenValid, tokenError, userAuthenticated]);

  // Only logout on explicit 401 errors
  useEffect(() => {
    if (!userAuthenticated) return;

    // Only logout on explicit 401 errors
    if (tokenError && 'status' in tokenError && tokenError.status === 401) {
      console.log('Token invalid - auth error');
      dispatch(signOut());
      return;
    }

    // Only logout if token is explicitly invalid
    if (tokenValid?.valid === false) {
      console.log('Token explicitly invalidated');
      dispatch(signOut());
    }
  }, [tokenValid?.valid, tokenError]);

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
