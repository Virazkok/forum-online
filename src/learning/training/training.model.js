import fs from 'fs';
import natural from 'natural';

const intents = JSON.parse(
  fs.readFileSync('src/learning/data/intents.json', 'utf-8')
);
const classifier = new natural.BayesClassifier();

intents.forEach((intent) => {
  intent.patterns.forEach((pattern) => {
    classifier.addDocument(pattern.toLowerCase(), intent.handler);
  });
});

classifier.train();
fs.writeFileSync(
  'src/learning/model/classifier.json',
  JSON.stringify(classifier)
);

console.log(
  '✅ Model berhasil dilatih dan disimpan di src/learning/model/classifier.json'
);
