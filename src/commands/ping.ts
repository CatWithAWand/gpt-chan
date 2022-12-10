import type { SlashCommand } from '../types/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('Pong!'),
  async execute(interaction, { client }) {
    const reply = await interaction.reply({
      content: `Pong! (ws: ${client.ws.ping}ms, roundtrip: -ms)`,
      fetchReply: true,
    });
    interaction.editReply(
      `Pong! (ws: ${client.ws.ping}ms, roundtrip: ${
        reply.createdTimestamp - interaction.createdTimestamp
      }ms)`,
    );
  },
} as SlashCommand;
