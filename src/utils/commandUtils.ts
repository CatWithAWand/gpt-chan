import type { SlashCommand } from '../types/index.js';
import type { Collection } from 'discord.js';
import { REST, Routes } from 'discord.js';

enum DeployCommandsResult {
  Success = 'Success',
  Error = 'Error',
}

const deployCommands = async (
  clientId: string,
  guildId: string,
  commands: Collection<string, SlashCommand>,
): Promise<DeployCommandsResult> => {
  try {
    console.log(
      `Started registering ${commands.size} application (/) commands.`,
    );

    const commandsData = commands.map((command) => command.data.toJSON());

    const rest = new REST({ version: '10' }).setToken(
      process.env.DISCORD_TOKEN,
    );

    const data: any = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commandsData },
    );

    console.log(
      `Successfully registered ${data.length} application (/) commands.`,
    );

    return DeployCommandsResult.Success;
  } catch (error) {
    console.error(error);
    return DeployCommandsResult.Error;
  }
};

export { deployCommands, DeployCommandsResult };
