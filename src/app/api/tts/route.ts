import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

async function getGoogleAccessToken(serviceAccountJson: string) {
  const credentials = JSON.parse(serviceAccountJson);
  
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64Encode = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signatureInput = `${base64Encode(header)}.${base64Encode(payload)}`;
  
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  
  const privateKey = credentials.private_key.replace(/\\n/g, '\n');
  const signature = signer.sign(privateKey, 'base64url');
  const jwt = `${signatureInput}.${signature}`;
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error('OAuth Error: ' + text);
  }
  
  const data = await response.json();
  return data.access_token;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get("text");

  if (!text) {
    return new NextResponse("Missing text", { status: 400 });
  }

  try {
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // Default Sarah/Bella voice

    if (elevenLabsApiKey) {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs Error ${response.status}: ${errText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }

    const googleTtsApiKey = process.env.GOOGLE_TTS_API_KEY;
    const googleServiceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (googleTtsApiKey || googleServiceAccount) {
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      let url = 'https://texttospeech.googleapis.com/v1/text:synthesize';
      
      if (googleServiceAccount) {
        const accessToken = await getGoogleAccessToken(googleServiceAccount);
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else if (googleTtsApiKey) {
        url += `?key=${googleTtsApiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          input: { text: text },
          voice: { languageCode: "id-ID", name: "id-ID-Wavenet-D" },
          audioConfig: { audioEncoding: "MP3" }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Google Cloud TTS Error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const audioBuffer = Buffer.from(data.audioContent, 'base64');
      
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }

    // Fallback to Google Translate TTS
    const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=id-ID&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Google TTS returned ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error: any) {
    console.error("TTS Error:", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
