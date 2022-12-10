declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      DISCORD_TOKEN: string;
      OPENAI_EMAIL: string;
      OPENAI_PASSWORD: string;
    }
  }
}

export {};
