import fs from 'node:fs';
import path from 'node:path';
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
} from 'discord.js';
import type { ChatGPTConversation } from 'chatgpt';
import { ChatGPTAPI } from 'chatgpt';
import dotenv from 'dotenv';
import type { SlashCommand } from './types/index.js';
import { deployCommands } from './utils/commandUtils.js';
import { isEmptyString } from './utils/stringUtils.js';
import { fileURLToPath } from 'node:url';
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

const userConversations: Collection<string, ChatGPTConversation> =
  new Collection();
const commands: Collection<string, SlashCommand> = new Collection();

const __filename = fileURLToPath(import.meta.url);
const commandsPath = path.join(path.dirname(__filename), 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = (await import(filePath)).default as unknown as SlashCommand;

  if ('data' in command && 'execute' in command) {
    commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
    );
  }
}

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  c.user.setActivity(`Let's chat!`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !client.user) return;

  if (message.content === '$register_commands') {
    if (!message.guild) return;

    await message.reply('Registering commands...');
    await message.channel.sendTyping();
    const status = await deployCommands(
      client.user.id,
      message.guild.id,
      commands,
    );

    if (status === 'Success') {
      await message.reply('Successfully registered commands.');
    } else {
      await message.reply('Failed to register commands.');
    }
  }

  if (message.mentions.has(client.user)) {
    let conversation = userConversations.get(message.author.id);

    if (!conversation) {
      conversation = chatgpt.getConversation();
      userConversations.set(message.author.id, conversation);
    }

    await message.channel.sendTyping();

    try {
      const reply = await conversation.sendMessage(message.content, {
        timeoutMs: 60000,
      });
      await message.reply(reply);
    } catch (error) {
      console.error(error);
      await message.reply('ChatGPT timed out.');
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
