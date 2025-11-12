import prisma from '../../config/prisma.db.js';
import { getWhatsappClient } from '../../utils/whatsappClient.js';
import { handlePromptCommand } from '../handler/promptCommandHandler.js';
import ApprovalService from '../../core/approval/approval.service.js';
import fs from 'fs';

const intents = JSON.parse(
  fs.readFileSync('src/learning/data/intents.json', 'utf-8')
);
const approvalService = new ApprovalService();
const messageApprovalMap = new Map();

const getIntentByTag = (tag) => intents.find((i) => i.tag === tag);

const getText = (tag, lang, random = false) => {
  const intent = getIntentByTag(tag);
  if (!intent) return '';
  const responses = intent.responses?.[lang] || [];
  if (!responses.length) return '';
  if (random) return responses[Math.floor(Math.random() * responses.length)];
  return responses[0];
};

const matchIntent = (text, lang) => {
  return intents.find((intent) => {
    const patterns = intent.patterns?.[lang] || [];
    return patterns.some((p) => text.includes(p.toLowerCase()));
  });
};

const translate = (lang, idText, enText) => (lang === 'en' ? enText : idText);

const extractMessageText = (msg) => {
  if (!msg?.message) return '';
  const m = msg.message;
  const inner = m.ephemeralMessage?.message ?? m;
  return (
    inner.conversation ||
    inner.extendedTextMessage?.text ||
    inner.imageMessage?.caption ||
    inner.videoMessage?.caption ||
    inner.documentMessage?.caption ||
    inner.buttonsResponseMessage?.selectedButtonId ||
    inner.templateButtonReplyMessage?.selectedId ||
    inner.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  );
};

const extractApprovalInfo = (text) => {
  const patterns = [
    /Nomor\s*\*?([A-Za-z0-9\-_\/]+)\*?/i,
    /No\.?\s*:?\s*([A-Za-z0-9\-_\/]+)/i,
    /Submission\s*(?:Number|No)?\s*:?\s*([A-Za-z0-9\-_\/]+)/i,
    /([A-Z]{2,}\-\d+\/\d+\/\d+)/,
    /([A-Z]{2,}\d+)/,
    /(\d+\/\w+\/\d+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};

const findApprovalIdFromText = async (text, userId) => {
  try {
    const nomor = extractApprovalInfo(text);

    if (nomor) {
      const submission = await prisma.submission.findFirst({
        where: {
          OR: [{ number: { contains: nomor } }],
        },
        include: {
          approval: {
            where: {
              status: 'PENDING',
              approverId: userId,
            },
            orderBy: { sequence: 'asc' },
          },
        },
      });

      if (submission && submission.approval.length > 0) {
        return submission.approval[0].id;
      }
    }

    const currentLevelApproval = await prisma.approval.findFirst({
      where: {
        status: 'PENDING',
        approverId: userId,
      },
      orderBy: { sequence: 'asc' },
    });

    return currentLevelApproval?.id || null;
  } catch (error) {
    return null;
  }
};

const setupMappingSystem = (client) => {
  if (client._mappingSetup) return;
  client._mappingSetup = true;

  client.ev.on('messages.upsert', async ({ messages }) => {
    try {
      for (const msg of messages || []) {
        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          '';

        if (!text) continue;
        if (text.includes('⚠') || text.includes('✅') || text.includes('❌'))
          continue;
        if (!msg.key?.fromMe) continue;

        const nomor = extractApprovalInfo(text);
        if (!nomor) continue;

        const submission = await prisma.submission.findFirst({
          where: {
            OR: [{ number: { contains: nomor } }],
          },
          include: {
            approval: {
              where: { status: 'PENDING' },
              include: {
                approver: true,
              },
              orderBy: { sequence: 'asc' },
            },
          },
        });

        if (!submission || submission.approval.length === 0) continue;

        const currentLevelApproval = submission.approval[0];

        if (
          currentLevelApproval.approver &&
          currentLevelApproval.approver.phoneWA
        ) {
          messageApprovalMap.set(msg.key.id, currentLevelApproval.id);
        }
      }
    } catch (error) {
      // Silent error handling
    }
  });
};

const handleApprovalAction = async (user, client, msg, text, lang) => {
  try {
    const jid = msg.key.remoteJid;
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedId = contextInfo?.stanzaId;
    const quotedText =
      contextInfo?.quotedMessage?.conversation ||
      contextInfo?.quotedMessage?.extendedTextMessage?.text;

    let approvalId;

    if (quotedId) {
      approvalId = messageApprovalMap.get(quotedId);
    }

    if (!approvalId && quotedText) {
      approvalId = await findApprovalIdFromText(quotedText, user.id);
    }

    if (!approvalId) {
      const userApprovals = await prisma.approval.findMany({
        where: {
          status: 'PENDING',
          approverId: user.id,
        },
        include: {
          submission: true,
        },
        orderBy: { sequence: 'asc' },
      });

      if (userApprovals.length === 1) {
        approvalId = userApprovals[0].id;
      } else if (userApprovals.length > 1) {
        const currentLevelApprovals = userApprovals.filter((approval) => {
          const minSequence = Math.min(...userApprovals.map((a) => a.sequence));
          return approval.sequence === minSequence;
        });

        if (currentLevelApprovals.length === 1) {
          approvalId = currentLevelApprovals[0].id;
        } else {
          let listText = translate(
            lang,
            `📋 Anda memiliki ${currentLevelApprovals.length} approval pending (Level ${currentLevelApprovals[0]?.sequence}):${err.message} \n\n> automatic message created by MIRA © curaweda.com`,
            `📋 You have ${currentLevelApprovals.length} pending approvals (Level ${currentLevelApprovals[0]?.sequence}):${err.message} \n\n> automatic message created by MIRA © curaweda.com`
          );

          currentLevelApprovals.forEach((approval, index) => {
            listText += `${index + 1}. ${ approval.submission?.number || 'Unknown'} - ${approval.requiredRole}\n`;
          });

          listText += t(
            lang,
            `\nBalas dengan angka 1-${currentLevelApprovals.length} untuk memilih.`,
            `\nReply with number 1-${currentLevelApprovals.length} to select.`
          );

          await client.sendMessage(jid, { text: listText });
          return;
        }
      }
    }

    if (!approvalId) {
      await client.sendMessage(jid, {
        text: translate(
          lang,
          `❌ Tidak ada approval pending yang ditugaskan kepada Anda.\n\nStatus: Anda bukan approver untuk submission ini.\n\n> automatic message created by MIRA © curaweda.com`,
          `❌ No pending approvals assigned to you.\n\nStatus: You are not the approver for this submission.\n\n> automatic message created by MIRA © curaweda.com`
        ),
      });
      return;
    }

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        submission: true,
        approver: true,
      },
    });

    if ( !approval || approval.status !== 'PENDING' || approval.approverId !== user.id) {
      const correctApprover = await prisma.user.findUnique({
        where: { id: approval?.approverId },
      });
      await client.sendMessage(jid, {
        text: translate(
          lang,
          `❌ Anda bukan approver yang ditugaskan.\n\nApprover yang benar: ${
            correctApprover?.fullName || 'Unknown'
          }\nNomor WA: ${
            correctApprover?.phoneWA || 'Tidak ada'
          }\n\n> automatic message created by MIRA © curaweda.com`,
          `❌ You are not the assigned approver.\n\nCorrect approver: ${
            correctApprover?.fullName || 'Unknown'
          }\nWA Number: ${
            correctApprover?.phoneWA || 'None'
          }\n\n> automatic message created by MIRA © curaweda.com`
        ),
      });
      return;
    }

    const isApprove = text.trim().toLowerCase().startsWith('approve');
    const comment = isApprove ? null : text.replace(/^reject\s*/i, '').trim() || translate(lang, 'Tidak ada alasan', 'No reason');

    await approvalService.updateApprovalStatus(
      approvalId,
      isApprove ? 'APPROVED' : 'REJECTED',
      comment,
      user.id
    );

    const submissionCode = approval.submission?.number || '-';

    await client.sendMessage(jid, {
      text: isApprove
        ? translate(
            lang,
            `✅ Approval ${submissionCode} berhasil disetujui.\n\n> automatic message created by MIRA © curaweda.com`,
            `✅ Approval ${submissionCode} successfully approved.\n\n> automatic message created by MIRA © curaweda.com`
          )
        : translate(
            lang,
            `❌ Approval ${submissionCode} ditolak.${
              comment ? ` Alasan: ${comment}` : ''
            }\n\n> automatic message created by MIRA © curaweda.com`,
            `❌ Approval ${submissionCode} rejected.${
              comment ? ` Reason: ${comment}` : ''
            }\n\n> automatic message created by MIRA © curaweda.com`
          ),
    });

    if (quotedId) {
      messageApprovalMap.delete(quotedId);
    }
  } catch (err) {
    await client.sendMessage(msg.key.remoteJid, {
      text: `⚠️ ${translate( lang, 'Gagal memproses approval:', 'Failed to process approval:')} ${err.message}\n> automatic message created by MIRA © curaweda.com`,
    });
 
  }
};


const handleLanguageSelection = async (user, client, jid, text) => {
  let lang = null;

  if (['1', 'indonesia', 'id'].includes(text)) {
    lang = 'id';
    await prisma.user.update({
      where: { id: user.id },
      data: { language: false },
    });

    await client.sendMessage(jid, { text: getText('kenalan', lang) });
    return true;
  } else if (['2', 'english', 'en'].includes(text)) {
    lang = 'en';
    await prisma.user.update({
      where: { id: user.id },
      data: { language: true },
    });

    await client.sendMessage(jid, { text: getText('kenalan', lang) });
    return true;
  } else {
    await client.sendMessage(jid, {
      text: getText('invalidChoice', user.language ? 'en' : 'id'),
    });
    return false;
  }
};



export const IncomingMessages = async (messageUpdate) => {

  try {
    const messages = messageUpdate?.messages ?? [];
    if (!Array.isArray(messages) || messages.length === 0)
      return { processed: 0 };

    const client = getWhatsappClient();
    if (!client) return { processed: 0 };

    setupMappingSystem(client);

    for (const msg of messages) {
      if (msg.key.fromMe || msg.broadcast) continue;
      const jid = msg.key.remoteJid;
      if (!jid || jid.endsWith('@g.us') || jid.endsWith('@broadcast')) continue;

      const phone = jid.split('@')[0];
      const user = await prisma.user.findFirst({ where: { phoneWA: phone } });
      if (!user) continue;

      const textRaw = extractMessageText(msg);
      const text = textRaw.trim().toLowerCase();

      if (!user.isVerified) {
        if (['verifikasi', 'verification', 'verify'].includes(text)) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, language: null },
          });
          await client.sendMessage(jid, {
            text:
              getText('verified', 'id') +
              '\nSilakan pilih bahasa:\n1. Indonesia\n2. English \n\n Please select language:\n1. Indonesia\n2. English \n\n> automatic message created by MIRA © curaweda.com',
          });
        } else {
          await client.sendMessage(jid, { text: getText('notVerified', 'id') });
        }
        continue;
      }

      if (
        [
          '3',
          'ubah bahasa',
          'ganti bahasa',
          'bahasa',
          'language',
          'change language',
          'reset language',
          'set language',
        ].includes(text)
      ) {
        await client.sendMessage(jid, {
          text: getText('chooseLanguage', user.language === true ? 'en' : 'id'),
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { language: null },
        });
        continue;
      }

      if (user.language === null || user.language === undefined) {
        const success = await handleLanguageSelection(user, client, jid, text);
        if (success) continue;
        await client.sendMessage(jid, {
          text: getText('chooseLanguage', 'id'),
        });
        continue;
      }

      const lang = user.language === true ? 'en' : 'id';
      const intent = matchIntent(text, lang);
      if (intent) {
        await client.sendMessage(jid, {
          text: getText(intent.tag, lang, true),
        });
        continue;
      }
      if (text.startsWith('approve') || text.startsWith('reject')) {
        await handleApprovalAction(user, client, msg, text, lang);
        continue;
      } else {
        await handlePromptCommand(textRaw, msg, lang);
      }

      await client.readMessages([msg.key]);
    }

    return { processed: 1 };
  } catch (err) {
    return { processed: 0, error: err.message };
  }
};