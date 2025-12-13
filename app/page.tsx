// app/page.tsx
'use client';

import { useScribe } from "@elevenlabs/react";
import { useState, useCallback } from "react";

export default function Home() {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // useScribeフックの初期化
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onError: (err) => {
      console.error("Scribe error:", err);
      setConnectionError("文字起こし中にエラーが発生しました。");
    }
  });

  const handleStart = useCallback(async () => {
    setConnectionError(null);
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
      setConnectionError("接続に失敗しました。APIキーなどを確認してください。");
    }
  }, [scribe]);

  const handleStop = useCallback(() => {
    // 接続を切断
    scribe.disconnect();
  }, [scribe]);

  const handleClear = useCallback(() => {
    // 文字起こし履歴をクリア
    scribe.clearTranscripts();
  }, [scribe]);

  const handleCopy = useCallback(async () => {
    // 確定済みテキストを結合
    const committedText = scribe.committedTranscripts.map(t => t.text).join('\n');

    // 未確定テキストも含める
    const parts = [];
    if (committedText) parts.push(committedText);
    if (scribe.partialTranscript) parts.push(scribe.partialTranscript);

    const allText = parts.join('\n');

    console.log('Copying text:', allText);
    console.log('committedTranscripts count:', scribe.committedTranscripts.length);
    console.log('partialTranscript:', scribe.partialTranscript);

    try {
      await navigator.clipboard.writeText(allText);
      setCopySuccess(true);
      // 2秒後にメッセージを消す
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  }, [scribe]);

  // エラー表示（接続エラーまたはSDKエラー）
  const displayError = connectionError || scribe.error;

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50 text-gray-800">
      <h1 className="text-3xl font-bold mb-8">ElevenLabs Realtime Scribe</h1>

      {/* エラー表示エリア */}
      {displayError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {displayError}
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
        <button
          onClick={handleCopy}
          className="px-6 py-2 rounded font-semibold text-white transition bg-green-600 hover:bg-green-700"
        >
          {copySuccess ? 'コピー完了!' : 'コピー'}
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-2 rounded font-semibold text-white transition bg-yellow-600 hover:bg-yellow-700"
        >
          クリア
        </button>
      </div>

      {/* ステータス表示 */}
      <div className="mb-4 text-sm font-mono">
        Status: <span className={scribe.isConnected ? "text-green-600" : "text-gray-500"}>
          {scribe.status === "transcribing" ? "Transcribing 🎤" :
           scribe.isConnected ? "Connected 🟢" : "Disconnected ⚪"}
        </span>
      </div>

      {/* 文字起こし結果表示エリア */}
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6 min-h-[400px] border border-gray-200">
        <div className="space-y-4">
          {/* 確定済みテキストの履歴（SDKのcommittedTranscriptsを使用） */}
          {scribe.committedTranscripts.map((segment) => (
            <p key={segment.id} className="text-gray-800 leading-relaxed border-b border-gray-100 pb-2 last:border-0">
              {segment.text}
            </p>
          ))}

          {/* リアルタイム変動中のテキスト（未確定） */}
          {scribe.partialTranscript && (
            <p className="text-blue-600 italic animate-pulse font-medium">
              {scribe.partialTranscript}
            </p>
          )}

          {/* 何も表示がない場合のプレースホルダー */}
          {scribe.committedTranscripts.length === 0 && !scribe.partialTranscript && (
            <p className="text-gray-400 italic text-center">
              {scribe.isConnected ? "話し始めてください..." : "「録音開始」を押してください"}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
