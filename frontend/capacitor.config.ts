import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'in.foodhubpro.app',
  appName: 'FoodHub Pro',
  webDir: 'dist',
  server: {
    // For production, remove this and use the built dist
    // androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Geolocation: {
      permissions: ['location'],
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
  },
}

export default config
