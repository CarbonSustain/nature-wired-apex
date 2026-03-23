import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    if (!isServer) {
      // @hashgraph/hedera-wallet-connect ships browser-esm.js which ends with
      // `export{...}`. Webpack detects this as ESM and generates `let` declarations
      // for all exported live bindings. The SWC minifier then renames two of them
      // to the same letter `n`, producing `let n,n` — an illegal duplicate binding
      // that throws SyntaxError in the browser and crashes the entire lazy chunk.
      //
      // Fix: point webpack directly at browser-cjs.js (same content, CJS format).
      // Webpack wraps CJS in a `function` scope without ESM live-binding `let`
      // declarations, so the minifier renaming collision never occurs.
      config.resolve.alias = {
        ...config.resolve.alias,
        "@hashgraph/hedera-wallet-connect": path.resolve(
          __dirname,
          "node_modules/@hashgraph/hedera-wallet-connect/dist/browser-cjs.js"
        ),
      };

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
