import type { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Clients {
  client: Client;
  chatgpt: ChatGPTAPI;
}

export interface SlashCommand {
  data: SlashCommandBuilder;
  execute(interaction: CommandInteraction, clients: Clients): Promise<void>;
}
