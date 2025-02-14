import { io, Socket } from 'socket.io-client';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../redux/store";

let socket: Socket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

const getUserId = async (): Promise<string | undefined> => {
  try {
    const persistRoot = await AsyncStorage.getItem("persist:root");

    if (!persistRoot) {
      console.warn("Persisted storage not found.");
      return undefined;
    }

    const routes = JSON.parse(persistRoot);
    if (!routes?.user) {
      console.warn("User data not found in storage.");
      return undefined;
    }

    const user = JSON.parse(routes.user);
    return user?.token;
  } catch (error) {
    console.error("Error retrieving user token:", error);
    return undefined;
  }
};

// Fetch the token asynchronously and initialize the socket connection
const initializeSocket = async () => {
  const token = await getUserId();

  if (!socket) {
    socket = io(process.env.EXPO_PUBLIC_API_URL as string, {
      autoConnect: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      socket?.emit('online');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      // Clear any existing timer
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      // Set a new reconnect timer
      reconnectTimer = setTimeout(() => {
        socket?.connect();
      }, 1000);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default initializeSocket;
