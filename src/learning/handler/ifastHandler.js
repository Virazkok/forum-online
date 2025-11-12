import { getWhatsappClient } from '../../utils/whatsappClient.js';
import { ifastModule } from '../../core/modul/ifast/ifast.agregator.js';

export const handleIfast = async (prompt, msg) => {
  const client = getWhatsappClient();
  const jid = msg.key.remoteJid;
  const lowerPrompt = prompt.toLowerCase();
  const phoneNumber = jid.split('@')[0];

  const lang = userLanguage[phoneNumber] || 'id';

  const ifastSubHandlers = {
    permohonan: ifastModule.permohonan,

    language: async (prompt, jid) => {
      if (prompt.includes('en')) userLanguage[phoneNumber] = 'en';
      if (prompt.includes('id')) userLanguage[phoneNumber] = 'id';

      const selectedLang = userLanguage[phoneNumber];
      await client.sendMessage(jid, {
        text: selectedLang === 'en'
            ? 'Language set to English ✅'
            : 'Bahasa telah diubah ke Indonesia ✅',
      });
    },
  };

  let found = false;
  for (const [keyword, handler] of Object.entries(ifastSubHandlers)) {
    if (lowerPrompt.includes(keyword.toLowerCase())) {
      await handler(prompt, jid, lang);
      found = true;
      break;
    }
  }

  if (!found) {
    await client.sendMessage(jid, {
      text: lang === 'en'
          ? `Command not recognized. Please check your input.`
          : `Perintah tidak dikenali. Silakan periksa perintah Anda.`,
    });
  }
};