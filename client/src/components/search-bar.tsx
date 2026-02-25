import { useState, useRef, useCallback, FormEvent } from "react";
import { Send, Loader2, Paperclip, Mic, MicOff, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  onSearch: (query: string, imageData?: string, imageMimeType?: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchBar({ onSearch, isLoading = false, placeholder = "Ask anything..." }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Image attachment state
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((query.trim() || attachedImage) && !isLoading) {
      onSearch(
        query.trim() || "Analyse cette image",
        attachedImage || undefined,
        imageMimeType || undefined
      );
      setQuery("");
      setAttachedImage(null);
      setImageMimeType(null);
      setImagePreviewUrl(null);
    }
  };

  // --- Image attachment handlers ---
  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 data (remove "data:image/png;base64," prefix)
      const base64 = result.split(",")[1];
      setAttachedImage(base64);
      setImageMimeType(file.type);
      setImagePreviewUrl(result);
    };
    reader.readAsDataURL(file);

    // Reset the input so the same file can be selected again
    e.target.value = "";
  }, []);

  const removeImage = useCallback(() => {
    setAttachedImage(null);
    setImageMimeType(null);
    setImagePreviewUrl(null);
  }, []);

  // --- Voice recording handlers ---
  const getSupportedMimeType = useCallback(() => {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", "audio/mpeg"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  }, []);

  const getFileExtension = useCallback((mimeType: string) => {
    if (mimeType.includes("webm")) return "webm";
    if (mimeType.includes("ogg")) return "ogg";
    if (mimeType.includes("mp4")) return "mp4";
    if (mimeType.includes("mpeg")) return "mp3";
    return "webm";
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      const actualMime = mediaRecorder.mimeType || mimeType || "audio/webm";

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        console.log("[STT] Audio blob:", audioBlob.size, "bytes, type:", actualMime);

        if (audioBlob.size < 100) {
          console.warn("[STT] Audio blob too small, skipping");
          return;
        }

        setIsTranscribing(true);
        try {
          const ext = getFileExtension(actualMime);
          const formData = new FormData();
          formData.append("audio", audioBlob, `recording.${ext}`);

          console.log("[STT] Sending to /api/speech-to-text...");
          const response = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();
          console.log("[STT] Response:", response.status, data);

          if (response.ok && data.text) {
            setQuery((prev) => (prev ? prev + " " + data.text : data.text));
          }
        } catch (err) {
          console.error("[STT] Error:", err);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start(250); // collect chunks every 250ms
      setIsRecording(true);
      console.log("[STT] Recording started, mimeType:", actualMime);
    } catch (err) {
      console.error("[STT] Microphone access denied:", err);
    }
  }, [getSupportedMimeType, getFileExtension]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const canSubmit = (query.trim() || attachedImage) && !isLoading && !isTranscribing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="w-full"
      data-testid="search-bar-container"
    >
      {/* Image preview */}
      <AnimatePresence>
        {imagePreviewUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex items-center gap-2 px-4"
          >
            <div className="relative group">
              <img
                src={imagePreviewUrl}
                alt="Attached"
                className="h-16 w-16 rounded-xl object-cover border-2 border-primary/40 shadow-md"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">Image attached</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="relative" data-testid="form-search">
        <motion.div
          animate={isFocused ? {
            scale: 1.01,
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.2), 0 20px 40px -12px rgba(59, 130, 246, 0.3)"
          } : {
            scale: 1,
            boxShadow: "0 8px 16px -4px rgba(59, 130, 246, 0.15), 0 4px 8px -2px rgba(0, 0, 0, 0.1)"
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={`
            relative flex items-center gap-3 px-6 py-4
            bg-background/80 backdrop-blur-xl
            border-[3px] transition-all duration-300 overflow-hidden
            ${isFocused
              ? "border-primary shadow-2xl shadow-primary/30 ring-4 ring-primary/20"
              : "border-primary/80 hover:border-primary shadow-lg shadow-primary/20"
            }
            rounded-3xl
          `}
          data-testid="search-input-wrapper"
        >
          {/* Attachment button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <motion.button
            type="button"
            onClick={handleFileSelect}
            disabled={isLoading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`
              flex-shrink-0 p-2 rounded-xl transition-all duration-200
              ${attachedImage
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title="Joindre une image"
          >
            <Paperclip className="w-4 h-4" />
          </motion.button>

          {/* Microphone button */}
          <motion.button
            type="button"
            onClick={toggleRecording}
            disabled={isLoading || isTranscribing}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`
              flex-shrink-0 p-2 rounded-xl transition-all duration-200
              ${isRecording
                ? "bg-red-500/20 text-red-500 animate-pulse"
                : isTranscribing
                  ? "bg-amber-500/20 text-amber-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={isRecording ? "Arrêter l'enregistrement" : isTranscribing ? "Transcription en cours..." : "Dicter votre message"}
          >
            {isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : isTranscribing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </motion.button>

          {/* Text input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isRecording ? "Parlez maintenant..." : isTranscribing ? "Transcription en cours..." : placeholder}
            disabled={isLoading}
            data-testid="input-search-query"
            className="
              flex-1 min-w-0 bg-transparent border-none outline-none
              text-base font-normal
              text-foreground placeholder:text-muted-foreground
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={!canSubmit}
            whileHover={canSubmit ? { scale: 1.08 } : {}}
            whileTap={canSubmit ? { scale: 0.95 } : {}}
            className={`
              flex-shrink-0 p-3 rounded-2xl transition-all duration-300 relative overflow-hidden
              ${canSubmit
                ? "bg-gradient-to-r from-primary to-blue-600 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                : "bg-muted/50 text-muted-foreground cursor-not-allowed"
              }
            `}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" data-testid="icon-search-loading" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}
