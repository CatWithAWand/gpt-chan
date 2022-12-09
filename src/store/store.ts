import { Collection } from 'discord.js';
import type { SlashCommand } from '../types/index.js';
import type { ChatGPTConversation } from 'chatgpt';

export default {
  userConversations: new Collection<string, ChatGPTConversation>(),
  commands: new Collection<string, SlashCommand>(),
};
