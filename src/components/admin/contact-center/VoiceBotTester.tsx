import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GeminiLiveClient } from "@/utils/geminiLiveClient";
import { startMicCapture, AudioPlaybackQueue } from "@/utils/audioUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Loader2, RefreshCw } from "lucide-react";

type CallStatus = "idle" | "connecting" | "active" | "reconnecting" | "ending";
type TranscriptEntry = {
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: Date;
};

export function VoiceBotTester() {
  const navigate = useNavigate();
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [volume, setVolume] = useState(2.0);
  const [aiSpeaking, setAiSpeaking] = useState(false);

  const clientRef = useRef<GeminiLiveClient | null>(null);
  const micRef = useRef<{ stop: () => void; analyser: AnalyserNode } | null>(null);
  const queueRef = useRef<AudioPlaybackQueue | null>(null);
  const animFrameRef = useRef<number>(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const aiSpeakingRef = useRef(false);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    return () => { endCall(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTranscript = useCallback((role: TranscriptEntry["role"], text: string) => {
    setTranscript((prev) => [...prev, { role, text, timestamp: new Date() }]);
  }, []);

  const updateAudioLevel = useCallback(() => {
    if (!micRef.current?.analyser) return;
    const data = new Uint8Array(micRef.current.analyser.frequencyBinCount);
    micRef.current.analyser.getByteFrequencyData(data);
    const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
    setAudioLevel(avg / 255);
    animFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const handleAiPlayingChange = useCallback((playing: boolean) => {
    aiSpeakingRef.current = playing;
    setAiSpeaking(playing);
  }, []);

  const startCall = useCallback(async () => {
    setError(null);
    setCallStatus("connecting");
    setTranscript([]);
    addTranscript("system", "Connecting to voice AI...");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("gemini-live-token");
      if (fnError || !data?.wsUrl) {
        throw new Error(fnError?.message || "Failed to get session token");
      }

      const queue = new AudioPlaybackQueue(handleAiPlayingChange);
      queueRef.current = queue;

      const client = new GeminiLiveClient({
        onReady: () => {
          addTranscript("system", "Connected! Start speaking...");
          setCallStatus("active");
        },
        onAudio: (pcm16Base64) => {
          queue.enqueue(pcm16Base64);
        },
        onTranscript: () => {
          // Raw model text is not spoken output — ignore. Use spoken channel below.
        },
        onAssistantSpokenTranscript: (text) => {
          addTranscript("assistant", text);
        },
        onError: (err) => {
          setError(err);
          addTranscript("system", `Error: ${err}`);
        },
        onClose: () => {
          setCallStatus("idle");
          addTranscript("system", "Call ended.");
        },
        onInterrupted: () => {
          queue.flush();
          addTranscript("system", "(AI was interrupted)");
        },
        onTurnComplete: () => {
          // Turn complete — no action needed in admin tester
        },
        onReconnecting: (attempt) => {
          setCallStatus("reconnecting");
          queue.flush();
          addTranscript("system", `Connection lost. Reconnecting (attempt ${attempt})...`);
        },
        onReconnectFailed: () => {
          setError("Connection lost and could not reconnect.");
          addTranscript("system", "Reconnection failed. Please start a new call.");
        },
      });

      clientRef.current = client;
      await client.connect(data.wsUrl, data.setupMessage);

      const mic = await startMicCapture((pcm16Base64) => {
        if (!isMutedRef.current && client.connected) {
          client.sendAudio(pcm16Base64);
        }
      }, 100);

      micRef.current = mic;
      updateAudioLevel();
    } catch (err: any) {
      console.error("Failed to start call:", err);
      const message = err.message || "Failed to start call";
      const isAccessIssue = message.includes("1008") || message.includes("timed out");
      const hint = isAccessIssue
        ? "\n\n💡 This likely means your Google Cloud API key needs: (1) Pay-as-you-go billing enabled, (2) Generative Language API enabled, (3) No IP restrictions on the key."
        : "";
      setError(message + hint);
      setCallStatus("idle");
      addTranscript("system", `Failed: ${message}`);
    }
  }, [addTranscript, updateAudioLevel, handleAiPlayingChange]);

  const endCall = useCallback(() => {
    setCallStatus("ending");
    cancelAnimationFrame(animFrameRef.current);

    if (micRef.current) {
      micRef.current.stop();
      micRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    if (queueRef.current) {
      queueRef.current.stop();
      queueRef.current = null;
    }

    setAudioLevel(0);
    setAiSpeaking(false);
    aiSpeakingRef.current = false;
    setCallStatus("idle");
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      isMutedRef.current = !prev;
      return !prev;
    });
  }, []);

  const statusColor = {
    idle: "secondary",
    connecting: "outline",
    active: "default",
    reconnecting: "outline",
    ending: "outline",
  } as const;

  const statusLabel = {
    idle: "Ready",
    connecting: "Connecting...",
    active: aiSpeaking ? "AI Speaking" : "Live",
    reconnecting: "Reconnecting...",
    ending: "Ending...",
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/contact-center/channels")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Voice Bot Tester</h2>
          <p className="text-sm text-muted-foreground">
            Real-time conversation with Gemini Live API
          </p>
        </div>
        <Badge variant={statusColor[callStatus]} className="ml-auto">
          {callStatus === 'reconnecting' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
          {statusLabel[callStatus]}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-100 rounded-full"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            </div>

            {/* Volume slider */}
            <div className="flex items-center gap-1.5">
              <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.05}
                value={volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  queueRef.current?.setVolume(val);
                }}
                className="w-20 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                disabled={callStatus === "idle"}
              />
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {callStatus === "idle" ? (
              <Button
                size="lg"
                className="rounded-full h-16 w-16 bg-green-600 hover:bg-green-700"
                onClick={startCall}
              >
                <Phone className="h-6 w-6" />
              </Button>
            ) : callStatus === "connecting" ? (
              <Button size="lg" className="rounded-full h-16 w-16" disabled>
                <Loader2 className="h-6 w-6 animate-spin" />
              </Button>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                className="rounded-full h-16 w-16"
                onClick={endCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}

            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="icon"
              className="rounded-full"
              onClick={toggleMute}
              disabled={callStatus !== "active"}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center mt-4 whitespace-pre-line">{error}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conversation Transcript</CardTitle>
          <CardDescription>Real-time transcript of the voice conversation</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {transcript.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Click the call button to start a conversation
              </p>
            ) : (
              <div className="space-y-3">
                {transcript.map((entry, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      entry.role === "assistant"
                        ? "justify-start"
                        : entry.role === "user"
                        ? "justify-end"
                        : "justify-center"
                    }`}
                  >
                    {entry.role === "system" ? (
                      <span className="text-xs text-muted-foreground italic">
                        {entry.text}
                      </span>
                    ) : (
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          entry.role === "assistant"
                            ? "bg-muted text-foreground"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {entry.text}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
