import { useState, useRef, useCallback, useEffect, FormEvent } from "react";
import { Loader2, Paperclip, Mic, MicOff, X, ArrowUp, FileSpreadsheet } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { UploadedFile } from "@/hooks/useChatMutation";

interface SearchBarProps {
  onSearch: (query: string, imageData?: string, imageMimeType?: string, uploadedFiles?: UploadedFile[]) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchBar({ onSearch, isLoading = false, placeholder = "Ask anything..." }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Image attachment state
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data file upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const dataFileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((query.trim() || attachedImage || uploadedFiles.length > 0)) {
      onSearch(
        query.trim() || (uploadedFiles.length > 0 ? "Analyze the uploaded dataset(s)" : "Analyze this image"),
        attachedImage || undefined,
        imageMimeType || undefined,
        uploadedFiles.length > 0 ? uploadedFiles : undefined
      );
      setQuery("");
      setAttachedImage(null);
      setImageMimeType(null);
      setImagePreviewUrl(null);
      setUploadedFiles([]);
    }
  };

  // --- Data file upload handlers ---
  const handleDataFileSelect = useCallback(() => {
    dataFileInputRef.current?.click();
  }, []);

  const handleDataFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const response = await fetch("/api/upload-data", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.files) {
        setUploadedFiles(prev => [...prev, ...data.files]);
      } else {
        console.error("[Upload] Error:", data.error);
      }
    } catch (err) {
      console.error("[Upload] Failed:", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }, []);

  const removeUploadedFile = useCallback((idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

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
      const base64 = result.split(",")[1];
      setAttachedImage(base64);
      setImageMimeType(file.type);
      setImagePreviewUrl(result);
    };
    reader.readAsDataURL(file);

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

      mediaRecorder.start(250);
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

  // Auto-resize textarea to fit content (max 5 lines)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxHeight = 120; // ~5 lines
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
  }, [query]);

  // Submit on Enter, new line on Shift+Enter
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((query.trim() || attachedImage || uploadedFiles.length > 0) && !isTranscribing && !isUploading) {
        handleSubmit(e as any);
      }
    }
  }, [query, attachedImage, uploadedFiles, isTranscribing, isUploading, handleSubmit]);

  const canSubmit = (query.trim() || attachedImage || uploadedFiles.length > 0) && !isTranscribing && !isUploading;

  return (
    <div className="w-full" data-testid="search-bar-container">
      {/* Uploaded data files preview */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 px-4"
          >
            <div className="flex items-center gap-2 flex-wrap">
              {uploadedFiles.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/8 border border-primary/20 text-xs group"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="font-medium text-foreground max-w-[140px] truncate">{f.originalName}</span>
                  <span className="text-muted-foreground/60">{(f.size / 1024).toFixed(0)} KB</span>
                  <button
                    type="button"
                    onClick={() => removeUploadedFile(idx)}
                    className="p-0.5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image preview */}
      <AnimatePresence>
        {imagePreviewUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex items-center gap-3 px-4"
          >
            <div className="relative group">
              <img
                src={imagePreviewUrl}
                alt="Attached"
                className="h-16 w-16 rounded-xl object-cover border border-border shadow-sm"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Image attached</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="relative" data-testid="form-search">
        <div
          className={`
            relative flex items-center gap-2.5 pl-4 pr-3 py-3
            bg-card/92 backdrop-blur-sm rounded-2xl transition-all duration-300
            ${isLoading
              ? "border border-primary/20 shadow-[0_0_24px_hsl(var(--primary)/0.08)]"
              : isFocused
                ? "border border-primary/25 shadow-[0_0_24px_hsl(var(--primary)/0.06)] ring-1 ring-primary/6"
                : "border border-border/50 hover:border-border/80 shadow-sm hover:shadow"
            }
          `}
          data-testid="search-input-wrapper"
        >
          {/* Data file upload button */}
          <input
            ref={dataFileInputRef}
            type="file"
            accept=".csv,.tsv,.xlsx,.xls,.parquet,.json,.txt"
            multiple
            onChange={handleDataFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleDataFileSelect}
            disabled={isLoading || isUploading}
            className={`
              flex-shrink-0 p-1.5 rounded-lg transition-all duration-200
              ${uploadedFiles.length > 0
                ? "bg-primary/8 text-primary/70"
                : isUploading
                  ? "bg-amber-500/8 text-amber-500"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/50"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={isUploading ? "Uploading..." : "Upload data files (CSV, Excel, Parquet)"}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
          </button>

          {/* Image attachment button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleFileSelect}
            disabled={isLoading}
            className={`
              flex-shrink-0 p-1.5 rounded-lg transition-all duration-200
              ${attachedImage
                ? "bg-primary/8 text-primary/70"
                : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/50"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title="Attach an image"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Microphone button */}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isLoading || isTranscribing}
            className={`
              flex-shrink-0 p-1.5 rounded-lg transition-all duration-200
              ${isRecording
                ? "bg-red-500/8 text-red-500 animate-pulse"
                : isTranscribing
                  ? "bg-amber-500/8 text-amber-500"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/50"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={isRecording ? "Stop recording" : isTranscribing ? "Transcribing..." : "Dictate your message"}
          >
            {isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : isTranscribing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Text input — auto-resizing textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isRecording ? "Speak now..." : isTranscribing ? "Transcribing..." : isLoading ? "Type to start a new generation..." : placeholder}
            data-testid="input-search-query"
            className="
              flex-1 min-w-0 bg-transparent border-none outline-none resize-none
              text-[14px] font-medium leading-[1.6]
              text-foreground placeholder:text-muted-foreground/40
              disabled:opacity-50 disabled:cursor-not-allowed
              px-2.5 py-0.5
              scrollbar-none
            "
            style={{ maxHeight: '120px' }}
          />

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`
              flex-shrink-0 p-2.5 rounded-xl transition-all duration-300
              ${isLoading
                ? "bg-primary/80 text-primary-foreground cursor-wait shadow-sm shadow-primary/10"
                : canSubmit
                  ? "bg-primary text-primary-foreground hover:brightness-105 active:scale-95 shadow-sm shadow-primary/10 hover:shadow-md hover:shadow-primary/15"
                  : "bg-muted/40 text-muted-foreground/25 cursor-not-allowed"
              }
            `}
          >
            {isLoading ? (
              <motion.div
                data-testid="icon-search-loading"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-4 h-4" />
              </motion.div>
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
