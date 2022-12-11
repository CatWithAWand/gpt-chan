import logger from '../logger.js';
import { executablePath } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { randomFromRange } from './randomUtils.js';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 60000;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36';
const OPENAI_LOGIN_URL = 'https://chat.openai.com/auth/login';
const SELECTORS = {
  loginButton:
    '#__next > div > div > div.flex.flex-row.gap-3 > button:nth-child(1)',
  emailInput: '#username',
  idLoginButton: '._button-login-id',
  passwordInput: '#password',
  passwordLoginButton: '._button-login-password',
  sessionToken: '__Secure-next-auth.session-token',
};

const puppeteerOptions = {
  headless: true,
  executablePath: executablePath(),
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
  ],
};

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

let retries = 0;

const getSessionToken = async (
  email: string,
  password: string,
): Promise<string> => {
  return new Promise(async (resolve) => {
    logger.info({
      event: 'AcquireSessionToken',
      msg: 'Attempting to acquire session token...',
    });

    const browser = await puppeteer.launch(puppeteerOptions);

    try {
      const page = await browser.newPage();

      await page.setUserAgent(USER_AGENT);
      await page.goto(OPENAI_LOGIN_URL, { waitUntil: 'networkidle0' });

      await page.waitForSelector(SELECTORS.loginButton);
      await page.click(SELECTORS.loginButton);

      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      await page.waitForSelector(SELECTORS.idLoginButton);
      await page.type(SELECTORS.emailInput, email, {
        delay: randomFromRange(200, 500),
      });
      await page.click(SELECTORS.idLoginButton);

      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      await page.waitForSelector(SELECTORS.passwordInput);
      await page.type(SELECTORS.passwordInput, password, {
        delay: randomFromRange(200, 500),
      });
      await page.click(SELECTORS.passwordLoginButton);

      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      const cookies = await page.cookies();
      const sessionToken = cookies.find(
        (cookie) => cookie.name === SELECTORS.sessionToken,
      )?.value;

      if (!sessionToken) {
        throw new Error('No session token found!');
      }

      logger.info({
        event: 'AcquireSessionToken',
        msg: 'Successfully acquired session token',
      });
      retries = 0;
      resolve(sessionToken);
    } catch (error) {
      if (retries >= MAX_RETRIES) {
        logger.fatal({
          event: 'AcquireSessionToken',
          msg: 'Max retries reached. Exiting...',
          err: error,
        });
        process.exit(1);
      }

      retries += 1;
      const retryDelay = INITIAL_RETRY_DELAY * retries ** 2;
      logger.warn({
        event: 'AcquireSessionToken',
        msg: `Retrying in ${retryDelay / 1000} seconds...`,
        err: error,
      });
      setTimeout(() => getSessionToken(email, password), retryDelay);
    } finally {
      await browser.close();
    }
  });
};

export { getSessionToken };
