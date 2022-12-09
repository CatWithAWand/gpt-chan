import type { CommandInteraction } from 'discord.js';
import type { SlashCommand } from '../types/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction: CommandInteraction) {
    await interaction.reply('Pong!');
  },
} as SlashCommand;
