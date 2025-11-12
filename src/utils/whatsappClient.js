import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

const LOG_DIR = path.resolve('logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

const UPLOADS_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const qrImagePath = path.join(UPLOADS_DIR, 'qr.png');
const disconnectLog = path.join(LOG_DIR, 'baileys-disconnect.log');
const updateLog = path.join(LOG_DIR, 'baileys-update.log');

let whatsappClient = null;
let whatsappQR = null;
let qrGeneratedAt = null;
let isReady = false; 

const logger = pino({ level: 'silent' }); 

export const startWhatsApp = async (io) => {
  try {
    const { version } = await fetchLatestBaileysVersion();
    console.log('🧩 Using WhatsApp Web version:', version.join('.'));

    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    const sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['IFAST-Gateway', 'Chrome', '1.0.0'],
    });

    whatsappClient = sock;
    isReady = false;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      fs.appendFileSync(updateLog, `${new Date().toISOString()} ${JSON.stringify(update)}\n`);
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        whatsappQR = qr;
        qrGeneratedAt = Date.now();

        await QRCode.toFile(qrImagePath, qr, { width: 400 });
        console.log(`📂 QR disimpan di: ${qrImagePath}`);
        if (io) io.emit('qr', { qr });
      }

      if (connection === 'open') {
        console.log('✅ WhatsApp connected!');
        whatsappQR = null;
        isReady = true;
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = code !== DisconnectReason.loggedOut;

        fs.appendFileSync(
          disconnectLog,
          `${new Date().toISOString()} ${JSON.stringify(lastDisconnect)}\n`
        );

        if (code === DisconnectReason.loggedOut) {
          console.warn('🧹 Session expired — hapus auth_info agar QR baru dibuat.');
          fs.rmSync('./auth_info', { recursive: true, force: true });
        }

        whatsappQR = null;
        whatsappClient = null;
        isReady = false;

        if (shouldReconnect) {
          console.log('🔁 Koneksi terputus. Reconnect dalam 5 detik...');
          setTimeout(() => startWhatsApp(io), 5000);
        } else {
          console.log('🛑 Tidak reconnect karena session logout.');
        }
      }
    });

    sock.ev.on('messages.upsert', async (m) => {
      if (!isReady) return; 
      console.log('💬 Pesan masuk terdeteksi.');

      if (!whatsappClient) {
        console.error('❌ WhatsApp client null, pesan tidak diproses.');
        return;
      }

      try {
        const possiblePaths = [
          '../learning/agregator/agregatorWhatsapp.service.js',
          '../learning/aggregator/agregatorWhatsapp.service.js',
          '../learning/agregator/aggregatorWhatsapp.service.js',
        ];

        let module = null;
        for (const file of possiblePaths) {
          const fullPath = path.resolve('src', file.replace('../', ''));
          if (fs.existsSync(fullPath)) {
            module = await import(file);
            break;
          }
        }

        if (module?.IncomingMessages) {
          await module.IncomingMessages(m);
          console.log('📨 Pesan diteruskan ke aggregator.');
        } else {
          console.warn('⚠️ Fungsi IncomingMessages tidak ditemukan di aggregator.');
        }
      } catch (err) {
        console.error('⚠️ Gagal memanggil aggregator:', err.message);
      }
    });

    return sock;
  } catch (err) {
    console.error('🔥 startWhatsApp error:', err);
    setTimeout(() => startWhatsApp(io), 5000);
  }
};

export const getWhatsappClient = () => whatsappClient;

export const getWhatsappQR = () => {
  if (!whatsappQR) return null;
  if (qrGeneratedAt && Date.now() - qrGeneratedAt > 60000) {
    console.log('⌛ QR expired, tunggu QR baru...');
    whatsappQR = null;
    return null;
  }
  return whatsappQR;
};

export const getWhatsappQRImage = () => {
  try {
    if (fs.existsSync(qrImagePath)) {
      const image = fs.readFileSync(qrImagePath);
      return `data:image/png;base64,${image.toString('base64')}`;
    }
  } catch (err) {
    console.error('getWhatsappQRImage error:', err.message);
  }
  return null;
};
