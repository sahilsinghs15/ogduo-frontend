# 📌 Install & Update Dependencies for Expo SDK 52

## 🚀 Step 1: Upgrade Expo SDK
Run the following command to upgrade your project to Expo SDK 52:

```sh
expo upgrade 52
```

## 🛠 Step 2: Remove Old Dependencies
Clear previous installations to avoid conflicts:

```sh
rm -rf node_modules package-lock.json yarn.lock
```

## 📦 Step 3: Install Dependencies
Reinstall all dependencies:

```sh
npm install  # or yarn install
```

## 🔄 Step 4: Update Expo Dependencies
Manually update specific dependencies for better compatibility:

```sh
npm install expo@^52.0.0 \
            expo-av@^13.10.0 \
            expo-constants@^15.4.5 \
            expo-device@^5.9.3 \
            expo-router@^3.4.8 \
            react@18.2.0 \
            react-native@0.73.4 \
            react-dom@18.2.0 \
            @types/react@~18.2.45 \
            typescript@^5.3.0 \
            @babel/core@^7.20.0
```

## 🎯 Step 5: Install Additional Required Dependencies
Install peer dependencies and essential packages:

```sh
npm install expo-status-bar@~1.11.1 \
            @expo/vector-icons@^14.0.0 \
            @react-navigation/native@^6.1.9 \
            @react-navigation/stack@^6.3.20
```

## 🩺 Step 6: Check for Issues
Run Expo Doctor to verify everything is correctly installed:

```sh
npx expo-doctor
```

## 🔁 Step 7: Restart Metro Bundler with Cache Clearing
Clear cache and restart Expo:

```sh
npx expo start --clear
```

## ✅ Done!
Your project is now updated and ready to run with Expo SDK 52! 🚀

### 📝 Notes:
- These versions are compatible with Expo SDK 52 and the latest Android SDK
- If you encounter any TypeScript errors, you may need to update your tsconfig.json
- Make sure your Android SDK is up to date in Android Studio
- For iOS development, ensure you have the latest Xcode installed

