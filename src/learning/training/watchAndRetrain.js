import fs from 'fs';
import { exec } from 'child_process';

const filePath = './data/intents.json';

console.log('👀 Watcher aktif... menunggu perubahan intents.json');

fs.watchFile(filePath, { interval: 1000 }, () => {
  console.log('🔄 intents.json berubah, mulai retrain...');
  exec('node scripts/trainModel.js', (err, stdout, stderr) => {
    if (err) return console.error('❌ Gagal retrain:', err);
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
});
