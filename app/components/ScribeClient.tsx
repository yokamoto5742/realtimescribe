// app/components/ScribeClient.tsx
'use client';

import { useScribe } from "@elevenlabs/react";
import { useState, useCallback, useEffect } from "react";

export default function ScribeClient() {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState<boolean>(true);

  // ブラウザサポートチェック
  useEffect(() => {
    const isSecureContext = window.isSecureContext;
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    if (!isSecureContext) {
      setIsBrowserSupported(false);
      setConnectionError("セキュアな接続（HTTPS または localhost）が必要です。");
    } else if (!hasMediaDevices) {
      setIsBrowserSupported(false);
      setConnectionError("このブラウザはマイクへのアクセスをサポートしていません。");
    }
  }, []);

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

    // ブラウザサポートの再チェック
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setConnectionError("このブラウザはマイクへのアクセスをサポートしていません。Chrome、Firefox、またはEdgeを使用してください。");
      return;
    }

    try {
      // マイクの許可を事前にリクエスト
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // 許可を得たらストリームを停止（useScribeが再度取得する）
        stream.getTracks().forEach(track => track.stop());
      } catch (micError) {
        console.error("Microphone access error:", micError);
        setConnectionError("マイクへのアクセスが拒否されました。ブラウザの設定でマイクを許可してください。");
        return;
      }

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
    scribe.disconnect();
  }, [scribe]);

  const handleClear = useCallback(() => {
    scribe.clearTranscripts();
  }, [scribe]);

  // エラー表示（接続エラーまたはSDKエラー）
  const displayError = connectionError || scribe.error;

  return (
    <>
      {/* エラー表示エリア */}
      {displayError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-2xl">
          {displayError}
        </div>
      )}

      {/* 操作ボタン */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={handleStart}
          disabled={scribe.isConnected || !isBrowserSupported}
          className={`px-6 py-2 rounded font-semibold text-white transition ${
            scribe.isConnected || !isBrowserSupported
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
          onClick={handleClear}
          disabled={scribe.committedTranscripts.length === 0}
          className={`px-6 py-2 rounded font-semibold text-white transition ${
            scribe.committedTranscripts.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-yellow-600 hover:bg-yellow-700'
          }`}
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
          {/* 確定済みテキストの履歴 */}
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
    </>
  );
}
