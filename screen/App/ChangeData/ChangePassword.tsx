import {
  View,
  Text,
  useColorScheme,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Vibration,
  Pressable,
} from "react-native";
import AnimatedScreen from "../../../components/global/AnimatedScreen";

import Button from "../../../components/global/Buttons/Button";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks/hooks";
import { setRoute } from "../../../redux/slice/routes";
import useGetMode from "../../../hooks/GetMode";
import {
  LegacyRef,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { openToast } from "../../../redux/slice/toast/toast";
import { useLoginMutation } from "../../../redux/api/auth";
import { clearUserData, signOut } from "../../../redux/slice/user";
import { useForm, Controller } from "react-hook-form";
import {
  ChangeDataNavigationProp,
  LoginScreen,
} from "../../../types/navigation";
import { servicesApi } from "../../../redux/api/services";
import { useUpdateDataMutation, userApi } from "../../../redux/api/user";
import { Image } from "expo-image";
import InputText from "../../Auth/components/InputText";
import InputPassword from "../../Auth/components/InputPassword";
import { useNavigation } from "@react-navigation/native";

const width = Dimensions.get("window").width;
export default function ChangeUserName() {
  const dark = useGetMode();
  const isDark = dark;
  const navigation = useNavigation<ChangeDataNavigationProp>();
  const color = isDark ? "white" : "black";
  const buttonColor = !isDark ? "white" : "black";
  const dispatch = useAppDispatch();
  const borderColor = isDark ? "white" : "black";
  const [updateData, updateResponse] = useUpdateDataMutation();
  const user = useAppSelector((state) => state?.user?.data);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      oldPassword: "",
      password: "",
    },
  });
  //
  const animUser = useRef(new Animated.Value(0));
  const animPass = useRef(new Animated.Value(0));
  const scrollViewRef = useRef<ScrollView | null>(null);
  const shakeUserName = useCallback(() => {
    vibrateAnimation(animUser);
  }, []);
  const shakePassword = useCallback(() => {
    vibrateAnimation(animPass);
  }, []);

  const onSubmit = (data: { oldPassword: string; password: string }) => {
    updateData({ password: data.oldPassword, newPassword: data.password })
      .unwrap()
      .then((r:any) => {
        dispatch(openToast({ text: r.msg, type: "Success" }));
      })
      .catch((e: any) => {
        console.log("🚀 ~ file: ChangeName.tsx:82 ~ onSubmit ~ e:", e.data);
        if (e.data?.message === "userName already exists") {
          dispatch(openToast({ text: "Username exists", type: "Failed" }));
          return;
        }
        dispatch(openToast({ text: e.data?.msg, type: "Failed" }));
      });
  };
  useEffect(() => {
    if (errors.oldPassword) {
      shakeUserName();
    }
    if (errors.password) {
      shakePassword();
    }
  }, [errors.oldPassword, errors.password]);

  const vibrateAnimation = (name: React.MutableRefObject<Animated.Value>) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(name.current, {
          useNativeDriver: true,
          toValue: -2,
          duration: 50,
        }),

        Animated.timing(name.current, {
          useNativeDriver: true,
          toValue: 2,
          duration: 50,
        }),

        Animated.timing(name.current, {
          useNativeDriver: true,
          toValue: 0,
          duration: 50,
        }),
      ]),
      { iterations: 2 }
    ).start();
  };

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        scrollViewRef.current?.scrollTo({ x: 300, y: 0 });
        setKeyboardVisible(true); // or some other action
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false); // or some other action
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <AnimatedScreen>
      <TouchableWithoutFeedback style={{ flex: 1 }} onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps={"always"}
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              alignItems: "center",
              paddingHorizontal: 25,
              paddingBottom: 50,
            }}
          >
            <Text style={{ fontFamily: "jakaraBold", fontSize: 20, color }}>
              Change Password
            </Text>
            <View style={{ alignItems: "center" }}>
              <View style={{ gap: 30, marginTop: 70 }}>
                <Animated.View
                  style={{ transform: [{ translateX: animUser.current }] }}
                >
                  <Text
                    style={{ paddingVertical: 5, fontFamily: "jakara", color }}
                  >
                    Old Password
                  </Text>
                  <Controller
                    control={control}
                    rules={{
                      maxLength: 100,
                      minLength: 3,
                      required: true,
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <InputPassword
                        style={{
                          borderColor: errors.oldPassword ? "red" : "",
                          borderWidth: errors.oldPassword ? 1 : 0,
                        }}
                        props={{
                          value,
                          onChangeText: onChange,
                          onBlur,
                        }}
                      />
                    )}
                    name="oldPassword"
                  />
                </Animated.View>
                <Animated.View
                  style={{ transform: [{ translateX: animPass.current }] }}
                >
                  <Text
                    style={{ paddingVertical: 5, fontFamily: "jakara", color }}
                  >
                    New Password
                  </Text>
                  <Controller
                    control={control}
                    rules={{
                      maxLength: 100,
                      minLength: 6,
                      required: true,
                      pattern:
                        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <InputPassword
                        style={{
                          borderColor: errors.password ? "red" : "",
                          borderWidth: errors.password ? 1 : 0,
                        }}
                        props={{
                          value,
                          onChangeText: onChange,
                          onBlur,
                        }}
                      />
                    )}
                    name="password"
                  />
                  <View
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                      paddingBottom: 40,
                      marginTop: 20,
                    }}
                  >
                    <Button
                      loading={updateResponse.isLoading}
                      onPress={() => {
                        Keyboard.dismiss();
                        handleSubmit(onSubmit)();
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "jakaraBold",
                          fontSize: 15,
                          color: buttonColor,
                        }}
                      >
                        Change
                      </Text>
                    </Button>
                  </View>
                </Animated.View>
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </AnimatedScreen>
  );
}
