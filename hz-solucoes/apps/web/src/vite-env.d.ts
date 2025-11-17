/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRPC_URL?: string;
  readonly VITE_LOGIN_HERO?: string;
  readonly VITE_LOGIN_HERO_IMAGE?: string;
  readonly VITE_LOGIN_ACCENT?: string;
  readonly DEV?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}