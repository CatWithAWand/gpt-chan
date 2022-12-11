import logger from '../logger.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Collection } from 'discord.js';
import { REST, Routes } from 'discord.js';
import type { SlashCommand } from '../types/index.js';

enum DeployCommandsResult {
  Success = 'Success',
  Error = 'Error',
}

const loadCommands = async (): Promise<Collection<string, SlashCommand>> => {
  const commands = new Collection<string, SlashCommand>();
  const __filename = fileURLToPath(import.meta.url);
  const commandsPath = path.join(path.dirname(__filename), '../commands');
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(filePath)).default as unknown as SlashCommand;

    if ('data' in command && 'execute' in command) {
      commands.set(command.data.name, command);
    } else {
      logger.warn({
        event: 'CommandLoadError',
        msg: `The command at ${filePath} is missing a required "data" or "execute" property`,
      });
    }
  }

  return commands;
};

const deployCommands = async (
  clientId: string,
  commands: Collection<string, SlashCommand>,
): Promise<DeployCommandsResult> => {
  try {
    logger.info({
      event: 'DeployCommands',
      msg: `Started reloading ${commands.size} application slash commands`,
    });

    const commandsData = commands.map((command) => command.data.toJSON());

    const rest = new REST({ version: '10' }).setToken(
      process.env.DISCORD_TOKEN,
    );

    const data: any = await rest.put(Routes.applicationCommands(clientId), {
      body: commandsData,
    });

    logger.info({
      event: 'DeployCommands',
      msg: `Successfully reloaded ${data.length}/${commands.size} application slash commands`,
    });

    return DeployCommandsResult.Success;
  } catch (error) {
    logger.error({
      event: 'DeployCommands',
      msg: 'Failed to reload application slash commands',
      err: error,
    });
    return DeployCommandsResult.Error;
  }
};

export { loadCommands, deployCommands, DeployCommandsResult };
