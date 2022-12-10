import type { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Clients {
  client: Client;
  chatGPT: ChatGPTAPI;
}

export interface SlashCommand {
  data: SlashCommandBuilder;
  execute(interaction: CommandInteraction, clients: Clients): Promise<void>;
}
