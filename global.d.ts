// polyfills.ts
import 'react-native-polyfill-globals/auto';

// Extend the global interface if needed
declare global {
  // This will add setImmediate to the global scope if it doesn't already exist.
  var setImmediate: typeof setTimeout;
}

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn: (...args: any[]) => void, ...args: any[]): number => {
    return setTimeout(fn, 0, ...args);
  };
}

export {}; // Ensure this file is a module