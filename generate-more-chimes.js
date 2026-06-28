const fs = require('fs');

const sampleRate = 44100;
const numChannels = 1;
const bitsPerSample = 16;

function generateWav(filename, tones, durationPerTone, delayBetweenTones, decay, waveformFn) {
  const totalDuration = tones.length * delayBetweenTones + durationPerTone;
  const numSamples = Math.floor(sampleRate * totalDuration);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // Write WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    let t = i / sampleRate;
    let sample = 0;
    
    for (let j = 0; j < tones.length; j++) {
      const startTime = j * delayBetweenTones;
      if (t >= startTime && t < startTime + durationPerTone) {
        const localT = t - startTime;
        const freq = tones[j];
        const envelope = Math.exp(-decay * localT); 
        sample += waveformFn(freq, localT) * envelope * 0.3;
      }
    }
    
    let intSample = Math.max(-1, Math.min(1, sample)) * 32767;
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  fs.writeFileSync(filename, buffer);
  console.log('Successfully generated ' + filename);
}

// 1. Hospital (Classic Intercom 2-Tone: C5, A4)
generateWav('public/hospital.wav', [523.25, 440.00], 1.2, 0.6, 2, (freq, t) => {
  let wave = Math.sin(2 * Math.PI * freq * t);
  wave += 0.3 * Math.sin(2 * Math.PI * freq * 2 * t);
  return wave;
});

// 2. Modern (Fast Double Ping: A5, C6)
generateWav('public/modern.wav', [880.00, 1046.50], 0.4, 0.15, 8, (freq, t) => {
  let wave = Math.sin(2 * Math.PI * freq * t);
  wave += 0.5 * Math.sin(2 * Math.PI * freq * 2 * t);
  return wave;
});

// 3. Xylophone (Warm, Percussive: E5, G5)
generateWav('public/xylophone.wav', [659.25, 783.99], 0.8, 0.3, 5, (freq, t) => {
  // FM Synthesis for a bell/wood sound
  const fm = Math.sin(2 * Math.PI * freq * 2.5 * t);
  return Math.sin(2 * Math.PI * freq * t + 0.5 * fm);
});
