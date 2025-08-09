import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a0716200216944cc8f6b5c8da53b5778',
  appName: 'beoyouncam',
  webDir: 'dist',
  server: {
    url: "https://a0716200-2169-44cc-8f6b-5c8da53b5778.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;