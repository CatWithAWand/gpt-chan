import { Collection } from 'discord.js';
import type { Message } from 'discord.js';
import type { SlashCommand } from '../types/index.js';
import type { ChatGPTConversation } from 'chatgpt';

export interface ConversationMessage {
  authorId: string;
  abortController: AbortController;
  message: Message<boolean>;
  reply: Message<boolean>;
}

export default {
  userConversations: new Collection<string, ChatGPTConversation>(),
  commands: new Collection<string, SlashCommand>(),
  activeMessages: new Collection<string, ConversationMessage>(),
};
