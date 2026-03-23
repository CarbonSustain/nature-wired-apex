import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: [
    "hashconnect",
    "@walletconnect/core",
    "@walletconnect/utils",
    "@walletconnect/sign-client",
    "@walletconnect/types",
  ],

  env: {
    AUTH_URL: process.env.AUTH_URL,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_NATUREWIRED_API: process.env.NEXT_PUBLIC_NATUREWIRED_API,
  },

  webpack: (config, { isServer }) => {
    // Force all @walletconnect imports to resolve to root-level versions,
    // preventing duplicate bundling of nested copies (which causes "let n" collision)
    config.resolve.alias = {
      ...config.resolve.alias,
      "@walletconnect/core": require.resolve("@walletconnect/core"),
      "@walletconnect/utils": require.resolve("@walletconnect/utils"),
      "@walletconnect/heartbeat": require.resolve("@walletconnect/heartbeat"),
      "@walletconnect/jsonrpc-ws-connection": require.resolve("@walletconnect/jsonrpc-ws-connection"),
      "@walletconnect/window-metadata": require.resolve("@walletconnect/window-metadata"),
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
      };
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/api/auth/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
