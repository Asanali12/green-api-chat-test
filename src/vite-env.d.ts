/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GREEN_API_ID_INSTANCE?: string;
  readonly VITE_GREEN_API_API_TOKEN_INSTANCE?: string;
  readonly VITE_GREEN_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
