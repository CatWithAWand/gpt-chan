declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      DISCORD_TOKEN: string;
      CHATGPT_SESSION_TOKEN: string;
    }
  }
}

export {};
