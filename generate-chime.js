const fs = require('fs');

const sampleRate = 44100;
const numChannels = 1;
const bitsPerSample = 16;

// Frequencies for a classic 3-tone airport chime: C5, E5, G5
const tones = [523.25, 659.25, 783.99]; 
const durationPerTone = 0.6; // seconds
const delayBetweenTones = 0.5; // seconds
const totalDuration = tones.length * delayBetweenTones + durationPerTone;
const numSamples = Math.floor(sampleRate * totalDuration);

const buffer = Buffer.alloc(44 + numSamples * 2);

// Write WAV header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + numSamples * 2, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size
buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // BlockAlign
buffer.writeUInt16LE(bitsPerSample, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(numSamples * 2, 40);

// Generate audio data
let offset = 44;
for (let i = 0; i < numSamples; i++) {
  let t = i / sampleRate;
  let sample = 0;
  
  // Mix active tones
  for (let j = 0; j < tones.length; j++) {
    const startTime = j * delayBetweenTones;
    if (t >= startTime && t < startTime + durationPerTone) {
      const localT = t - startTime;
      const freq = tones[j];
      
      // Simple envelope: quick attack, slow decay
      const envelope = Math.exp(-3 * localT); 
      
      // Sine wave with some harmonics for a "bell" or "chime" sound
      let wave = Math.sin(2 * Math.PI * freq * localT);
      wave += 0.5 * Math.sin(2 * Math.PI * freq * 2 * localT);
      wave += 0.25 * Math.sin(2 * Math.PI * freq * 3 * localT);
      
      sample += wave * envelope * 0.3; // Scale down to prevent clipping
    }
  }
  
  // Normalize and convert to 16-bit PCM
  let intSample = Math.max(-1, Math.min(1, sample)) * 32767;
  buffer.writeInt16LE(intSample, offset);
  offset += 2;
}

fs.writeFileSync('public/airport.wav', buffer);
console.log('Successfully generated public/airport.wav');
