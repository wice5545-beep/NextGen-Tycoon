import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nextgen.tycoon",
  appName: "NextGen Tycoon",
  webDir: "out",
  backgroundColor: "#070a12",
  android: {
    allowMixedContent: false,
    orientation: 'landscape',
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
