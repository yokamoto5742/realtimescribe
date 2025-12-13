// app/page.tsx
'use client';

import { useScribe } from "@elevenlabs/react";
import { useState, useCallback } from "react";

export default function Home() {
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // useScribeフックの初期化
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    // 部分的な転写（話している最中のテキスト）
    onPartialTranscript: (data) => {
      // コンソールデバッグ用。UI表示にはscribe.partialTranscriptを利用。
      // console.log("Partial:", data.text);
    },
    // 確定した転写（話し終わったテキスト）
    onCommittedTranscript: (data) => {
      // 既存の履歴に追加
      setTranscripts((prev) => [...prev, data.text]);
    },
    onError: (err) => {
      console.error("Scribe error:", err);
      setError("文字起こし中にエラーが発生しました。");
    }
  });

  const handleStart = useCallback(async () => {
    setError(null);
    try {
      // 1. サーバーからトークンを取得
      const response = await fetch('/api/get-token');
      if (!response.ok) throw new Error("Token fetch failed");
      const { token } = await response.json();

      // 2. ElevenLabsへ接続開始
      await scribe.connect({
        token,
        microphone: {
            echoCancellation: true,
            noiseSuppression: true,
        }
      });
    } catch (err) {
      console.error("Connection failed:", err);
      setError("接続に失敗しました。APIキーなどを確認してください。");
    }
  }, [scribe]);

  const handleStop = useCallback(() => {
    // 接続を切断
    scribe.disconnect();
  }, [scribe]);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50 text-gray-800">
      <h1 className="text-3xl font-bold mb-8">ElevenLabs Realtime Scribe</h1>

      {/* エラー表示エリア */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 操作ボタン */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={handleStart}
          disabled={scribe.isConnected}
          className={`px-6 py-2 rounded font-semibold text-white transition ${
            scribe.isConnected
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          録音開始
        </button>
        <button
          onClick={handleStop}
          disabled={!scribe.isConnected}
          className={`px-6 py-2 rounded font-semibold text-white transition ${
            !scribe.isConnected
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          停止
        </button>
      </div>

      {/* ステータス表示 */}
      <div className="mb-4 text-sm font-mono">
        Status: <span className={scribe.isConnected ? "text-green-600" : "text-gray-500"}>
          {scribe.isConnected ? "Connected 🟢" : "Disconnected ⚪"}
        </span>
      </div>

      {/* 文字起こし結果表示エリア */}
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6 min-h-[400px] border border-gray-200">
        <div className="space-y-4">
          {/* 確定済みテキストの履歴 */}
          {transcripts.map((text, index) => (
            <p key={index} className="text-gray-800 leading-relaxed border-b border-gray-100 pb-2 last:border-0">
              {text}
            </p>
          ))}

          {/* リアルタイム変動中のテキスト（未確定） */}
          {scribe.partialTranscript && (
            <p className="text-blue-600 italic animate-pulse font-medium">
              {scribe.partialTranscript}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
