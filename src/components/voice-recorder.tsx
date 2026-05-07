import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2 } from "lucide-react";

type Props = {
  onRecorded: (blob: Blob) => void;
};

export function VoiceRecorder({ onRecorded }: Props) {
  const [recording, setRecording] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setBlobUrl(URL.createObjectURL(blob));
      onRecorded(blob);
      stream.getTracks().forEach((t) => t.stop());
    };
    rec.start();
    recRef.current = rec;
    setRecording(true);
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
  };

  const reset = () => {
    setBlobUrl(null);
    chunksRef.current = [];
  };

  return (
    <div className="flex flex-col items-start gap-3">
      {!blobUrl ? (
        <Button type="button" onClick={recording ? stop : start} variant={recording ? "destructive" : "default"}>
          {recording ? <><Square className="mr-2 h-4 w-4" /> Stop</> : <><Mic className="mr-2 h-4 w-4" /> Record</>}
        </Button>
      ) : (
        <div className="flex items-center gap-3">
          <audio src={blobUrl} controls className="h-10" />
          <Button variant="ghost" size="sm" onClick={reset}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}
