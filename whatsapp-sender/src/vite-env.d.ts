/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COLMEIA_SOCIAL_NETWORK_ID: string;
  readonly VITE_COLMEIA_TOKEN_ID: string;
  readonly VITE_COLMEIA_EMAIL: string;
  readonly VITE_COLMEIA_PASSWORD: string;
  readonly VITE_COLMEIA_CAMPAIGN_ACTION_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
