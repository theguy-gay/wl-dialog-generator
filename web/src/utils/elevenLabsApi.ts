import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

function makeClient(apiKey: string): ElevenLabsClient {
  return new ElevenLabsClient({ apiKey });
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    await makeClient(apiKey).user.get();
    return true;
  } catch {
    return false;
  }
}

export async function generateSpeech(
  apiKey: string,
  voiceId: string,
  text: string
): Promise<ArrayBuffer> {
  const client = makeClient(apiKey);
  const stream = await client.textToSpeech.convert(voiceId, {
    text,
    modelId: 'eleven_multilingual_v2',
    outputFormat: 'mp3_44100_128',
  });

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const buf = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.length;
  }
  return buf.buffer;
}

export interface VoiceEntry {
  voiceId: string;
  name: string;
}

export async function getVoices(apiKey: string): Promise<VoiceEntry[]> {
  const res = await makeClient(apiKey).voices.getAll();
  return res.voices
    .filter(v => v.voiceId && v.name)
    .map(v => ({ voiceId: v.voiceId!, name: v.name! }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function validateVoiceId(
  apiKey: string,
  voiceId: string
): Promise<string | null> {
  try {
    const voice = await makeClient(apiKey).voices.get(voiceId);
    return voice.name ?? null;
  } catch {
    return null;
  }
}
