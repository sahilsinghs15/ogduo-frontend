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
npm install expo@^52.0.28 \
            expo-av@^15.0.1 \
            expo-constants@^17.0.1 \
            expo-device@^7.0.1 \
            expo-router@^3.4.10
```

## 🩺 Step 5: Check for Issues
Run Expo Doctor to verify everything is correctly installed:

```sh
expo doctor
```

## 🔁 Step 6: Restart Metro Bundler with Cache Clearing
Finally, restart Expo with cache clearing:

```sh
expo r -c
```

## ✅ Done!
Your project is now updated and ready to run with Expo SDK 52! 🚀

