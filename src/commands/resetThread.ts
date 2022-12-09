import { SlashCommandBuilder } from 'discord.js';
import store from '../store/store.js';
import type { SlashCommand } from '../types/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('reset-thread')
    .setDescription('Resets the converstion thread between you and the bot.'),
  async execute(interaction, clients) {
    store.userConversations.set(
      interaction.user.id,
      clients.chatgpt.getConversation(),
    );

    interaction.reply({
      content: 'Conversation thread reset.',
      ephemeral: true,
    });
  },
} as SlashCommand;
