import fs from 'fs';
import natural from 'natural';
import { promptHandlers, fallbackMessage } from './promptHandlers.js';
import { getWhatsappClient } from '../../utils/whatsappClient.js';

const classifierData = JSON.parse(fs.readFileSync('src/learning/model/classifier.json', 'utf-8'));
const classifier = natural.BayesClassifier.restore(classifierData);
const intents = JSON.parse(fs.readFileSync('src/learning/data/intents.json', 'utf-8'));

export const handlePromptCommand = async (prompt, msg) => {
  const lowerPrompt = prompt.toLowerCase();
  const predictedHandler = classifier.classify(lowerPrompt);
  const matchedIntent = intents.find((i) => i.handler === predictedHandler);

  const client = getWhatsappClient();
  const jid = msg.key.remoteJid;

  console.log('[CMD] Prediksi:', predictedHandler);
  console.log('[CMD] Text masuk:', lowerPrompt);

  if (matchedIntent) {
    if (matchedIntent.responses && matchedIntent.responses.length > 0) {
      const reply =
        matchedIntent.responses[
          Math.floor(Math.random() * matchedIntent.responses.length)
        ];
      await client.sendMessage(jid, { text: reply });
    }

    if (
      promptHandlers[predictedHandler] &&
      matchedIntent.responses.length === 0
    ) {
      await promptHandlers[predictedHandler](prompt, msg);
    }

    console.log(`[ML] Trigger: "${lowerPrompt}" → ${predictedHandler}`);
  } else {
    await fallbackMessage(msg);
  }
};
