import { Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import type { ChatGPTConversation } from 'chatgpt';
import { chatGPT, authorizeChatGPT } from './chatgpt.js';
import type { ConversationMessage } from './store/store.js';
import store from './store/store.js';
import { blinkingCursor } from './store/emotes.js';
import { deployCommands, loadCommands } from './utils/commandUtils.js';
import { isValidMessage } from './utils/eventUtils.js';

enum ChatGPTResponseStatus {
  Done = 'done',
  InProgress = 'in_progress',
  Error = 'error',
}

const client = new Client({
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
  ],
});

console.log(`Environment: ${process.env.NODE_ENV}`);

await authorizeChatGPT();
store.commands = await loadCommands();

client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  c.user.setStatus('invisible');
  await deployCommands(c.user.id, store.commands);
  c.user.setStatus('online');
  c.user.setActivity(`Let's chat!`);
});

const handleMessageReply = async (
  conversationMessage: ConversationMessage,
  conversation: ChatGPTConversation,
  onProgressCallBack: (
    partialResponse: string,
    done: ChatGPTResponseStatus,
  ) => void,
) => {
  const { message, abortController } = conversationMessage;
  let totalChars = 0;
  let prevPartialResponse = '';

  conversation
    .sendMessage(message.cleanContent, {
      abortSignal: abortController.signal,
      timeoutMs: 60000,
      onProgress(partialResponse) {
        const newChars = partialResponse.length - prevPartialResponse.length;
        totalChars += newChars;

        if (totalChars >= 125) {
          onProgressCallBack(partialResponse, ChatGPTResponseStatus.InProgress);
          totalChars = 0;
        }

        prevPartialResponse = partialResponse;
      },
    })
    .then((response) => {
      onProgressCallBack(response, ChatGPTResponseStatus.Done);
    })
    .catch((error) => {
      if (error instanceof DOMException && error.name == 'AbortError') return;

      console.error(error);
      onProgressCallBack(
        'ChatGPT timed out. Please try again later.',
        ChatGPTResponseStatus.Error,
      );
    });
};

client.on(Events.MessageCreate, async (message) => {
  if (!isValidMessage(message)) return;

  let conversation = store.userConversations.get(message.author.id);

  if (!conversation) {
    conversation = chatGPT.getConversation();
    store.userConversations.set(message.author.id, conversation);
  }

  const reply = await message.reply(`ChatGPT is thinking... ${blinkingCursor}`);
  const conversationMessage = {
    authorId: message.author.id,
    abortController: new AbortController(),
    message,
    reply,
  };

  store.activeMessages.set(message.id, conversationMessage);

  handleMessageReply(
    conversationMessage,
    conversation,
    async (partialResponse, done) => {
      await reply.edit(
        `${
          partialResponse +
          (done === ChatGPTResponseStatus.InProgress ? blinkingCursor : '')
        }`,
      );

      if (done === ChatGPTResponseStatus.Done) {
        store.activeMessages.delete(message.id);
      }
    },
  );
});

client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  if (newMessage.partial || oldMessage.partial || !isValidMessage(newMessage))
    return;
  const conversationMessage = store.activeMessages.get(newMessage.id);

  if (!conversationMessage) return;

  const { abortController, reply } = conversationMessage;

  abortController.abort();

  conversationMessage.message = newMessage;
  conversationMessage.abortController = new AbortController();

  let conversation = store.userConversations.get(newMessage.author.id);

  if (!conversation) {
    conversation = chatGPT.getConversation();
    store.userConversations.set(newMessage.author.id, conversation);
  }

  store.activeMessages.set(newMessage.id, conversationMessage);
  await reply.edit(`ChatGPT is thinking... ${blinkingCursor}`);

  handleMessageReply(
    conversationMessage,
    conversation,
    async (partialResponse, done) => {
      await reply.edit(
        `${
          partialResponse +
          (done === ChatGPTResponseStatus.InProgress ? blinkingCursor : '')
        }`,
      );

      if (done === ChatGPTResponseStatus.Done) {
        store.activeMessages.delete(newMessage.id);
      }
    },
  );
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = store.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, { client, chatGPT });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
