import dotenv from 'dotenv';
import { Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import { ChatGPTAPI } from 'chatgpt';
import store from './store/store.js';
import { blinkingCursor } from './store/emotes.js';
import { deployCommands, loadCommands } from './utils/commandUtils.js';
import { isValidMessage } from './utils/eventUtils.js';
dotenv.config();

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
const chatgpt = new ChatGPTAPI({
  sessionToken: process.env.CHATGPT_SESSION_TOKEN,
});

store.commands = await loadCommands();

client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  c.user.setStatus('invisible');
  await deployCommands(c.user.id, store.commands);
  c.user.setStatus('online');
  c.user.setActivity(`Let's chat!`);
});

client.on(Events.MessageCreate, async (message) => {
  if (!isValidMessage(message)) return;

  let conversation = store.userConversations.get(message.author.id);

  if (!conversation) {
    conversation = chatgpt.getConversation();
    store.userConversations.set(message.author.id, conversation);
  }

  try {
    let reply = await message.reply(`ChatGPT is thinking... ${blinkingCursor}`);
    message.channel.sendTyping();

    let totalChars = 0;
    let prevPartialResponse = '';

    const fullResponse = await conversation.sendMessage(message.content, {
      timeoutMs: 60000,
      async onProgress(partialResponse) {
        const newChars = partialResponse.length - prevPartialResponse.length;
        totalChars += newChars;

        if (totalChars >= 125) {
          reply = await reply.edit(`${partialResponse}... ${blinkingCursor}`);
          totalChars = 0;
        }

        prevPartialResponse = partialResponse;
      },
    });

    await reply.edit(fullResponse);
  } catch (error) {
    console.error(error);
    message.reply('ChatGPT timed out.');
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = store.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, { client, chatgpt });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
