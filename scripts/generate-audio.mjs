import fs from 'fs';
import path from 'path';

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Beispiel-Voice-ID oder deine eigene

if (!API_KEY) {
  console.error("Fehler: ELEVENLABS_API_KEY ist nicht gesetzt.");
  process.exit(1);
}

const csvPath = path.resolve('verbs.csv');
const audioDir = path.resolve('audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

async function generateAudio() {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.trim().split('\n').slice(1);

  for (const line of lines) {
    const [infinitive, past, participle] = line.split(',').map(s => s.trim());
    const textToSpeak = `${infinitive}, ${past}, ${participle}`;
    const fileName = `${infinitive.toLowerCase().replace(/[^a-z]/g, '')}.mp3`;
    const filePath = path.join(audioDir, fileName);

    // Überspringen, falls Datei schon existiert
    if (fs.existsSync(filePath)) {
      console.log(`Audio existiert bereits: ${fileName}`);
      continue;
    }

    console.log(`Generiere Audio für: ${textToSpeak}...`);

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': API_KEY
        },
        body: JSON.stringify({
          text: textToSpeak,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs API Fehler (${response.status}): ${errText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
      console.log(`Gespeichert: ${filePath}`);
    } catch (err) {
      console.error(`Fehler bei '${infinitive}':`, err.message);
    }
  }
}

generateAudio();
