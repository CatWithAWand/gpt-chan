import type { Message } from 'discord.js';
import { ChannelType } from 'discord.js';

const isValidMessage = (message: Message<boolean>): boolean => {
  return (
    !message.author.bot &&
    (message.mentions.has(message.client.user) ||
      message.channel.type === ChannelType.DM)
  );
};

export { isValidMessage };
