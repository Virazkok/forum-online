import { getWhatsappClient } from '../../utils/whatsappClient.js';
import { handleIfast } from './ifastHandler.js';
import { loadPromptData } from '../../prompts/index.js';

const promptData = loadPromptData();

export const promptHandlers = {
  handleHelp: async (prompt, msg) => {
    const client = getWhatsappClient();
    const jid = msg.key.remoteJid;
    const reply = promptData.general.help;
    await client.sendMessage(jid, { text: reply });
  },

  handleIntroduce: async (prompt, msg) => {
    const client = getWhatsappClient();
    const jid = msg.key.remoteJid;
    await client.sendMessage(jid, { text: promptData.general.introduce });
  },

  handleThankyou: async (prompt, msg) => {
    const client = getWhatsappClient();
    const jid = msg.key.remoteJid;
    await client.sendMessage(jid, { text: promptData.general.thankyou });
  },

  handleOfficeLocation: async (prompt, msg) => {
    const client = getWhatsappClient();
    const jid = msg.key.remoteJid;
    await client.sendMessage(jid, { text: promptData.general.officeLocation });
  },
  handleContact: async (prompt, msg) => {
    const client = getWhatsappClient();
    const jid = msg.key.remoteJid;
    await client.sendMessage(jid, { text: promptData.general.contact });
  },
  handleIfast: handleIfast,
};

export const fallbackMessage = async (msg) => {
const client = getWhatsappClient();
if (!client) return;

const jid = msg.key.remoteJid;
const text = promptData?.fallback || 'Maaf, saya tidak mengerti maksud kamu 😅 Ketik *tolong* untuk bantuan.';
await client.sendMessage(jid, { text });
};
