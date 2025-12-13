// app/api/get-token/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
  }

  try {
    // ElevenLabsのサーバーサイドAPIを叩いて、リアルタイム接続用のトークンを取得
    const response = await fetch(
      "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token fetch error:", errorText);
      throw new Error('Failed to fetch token from ElevenLabs');
    }

    const data = await response.json();
    // トークンをフロントエンドに返す
    return NextResponse.json({ token: data.token });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
