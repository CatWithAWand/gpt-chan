import logger from './logger.js';
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

    logger.info({
      event: 'ChatGPTAuthorized',
      status: 'success',
      msg: 'Succesfully authorized ChatGPT',
    });
  } catch (error) {
    logger.error({
      event: 'ChatGPTAuthorized',
      status: 'error',
      msg: 'Failed to authorize ChatGPT',
      err: error,
    });
    throw error;
  } finally {
    setTimeout(authorizeChatGPT, REAUTHORIZE_INTERVAL);
  }
};

export { chatGPT, authorizeChatGPT };
