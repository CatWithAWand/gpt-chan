import { ChatGPTAPI } from 'chatgpt';
import { getSessionToken } from './utils/sessionUtils.js';

const REAUTHORIZE_INTERVAL = 2700000;

let chatGPT: ChatGPTAPI;

const authorizeChatGPT = async () => {
  try {
    const sessionToken = await getSessionToken(
      process.env.OPENAI_EMAIL,
      process.env.OPENAI_PASSWORD,
    );

    if (!sessionToken) return;

    chatGPT = new ChatGPTAPI({
      sessionToken: sessionToken,
    });

    await chatGPT.ensureAuth();

    console.log('Successfully authorized ChatGPT!');
  } catch (error) {
    console.error('Failed to authorize ChatGPT!');
    throw error;
  } finally {
    setTimeout(authorizeChatGPT, REAUTHORIZE_INTERVAL);
  }
};

export { chatGPT, authorizeChatGPT };
