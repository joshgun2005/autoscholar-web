/**
 * TypeAhead and MultiTypeAhead — reusable autocomplete input components.
 * Extracted from research-form.tsx for modularity.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Single TypeAhead ────────────────────────────────────────────

interface TypeAheadProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder: string;
  icon?: React.ReactNode;
  label: string;
}

export function TypeAhead({ value, onChange, suggestions, placeholder, icon, label }: TypeAheadProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value || value.length < 1) {
      setFiltered([]);
      return;
    }
    const lower = value.toLowerCase();
    const matches = suggestions
      .filter(s => s.toLowerCase().includes(lower))
      .sort((a, b) => {
        const aStart = a.toLowerCase().startsWith(lower) ? 0 : 1;
        const bStart = b.toLowerCase().startsWith(lower) ? 0 : 1;
        if (aStart !== bStart) return aStart - bStart;
        return a.length - b.length;
      })
      .slice(0, 12);
    setFiltered(matches);
  }, [value, suggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown = open && filtered.length > 0 && value.length >= 1;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-[11px] font-semibold text-foreground/60 mb-1.5 ml-0.5 tracking-wider uppercase">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl border px-3.5 py-3 transition-all duration-200",
          "bg-card shadow-sm",
          showDropdown
            ? "border-primary ring-2 ring-primary/20 shadow-md rounded-b-none"
            : "border-border hover:border-primary/30 hover:shadow"
        )}
      >
        {icon && <span className="text-primary/40 shrink-0">{icon}</span>}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
        />
        {value ? (
          <button
            type="button"
            onClick={() => { onChange(""); inputRef.current?.focus(); }}
            className="text-muted-foreground/40 hover:text-foreground transition-colors rounded-full p-0.5 hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Search className="h-3.5 w-3.5 text-muted-foreground/30" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full rounded-b-xl border border-t-0 border-primary bg-card shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((suggestion) => {
              const isSelected = value === suggestion;
              // Highlight matching substring
              const lower = value.toLowerCase();
              const idx = suggestion.toLowerCase().indexOf(lower);
              let parts: React.ReactNode;
              if (idx >= 0) {
                parts = (
                  <>
                    {suggestion.slice(0, idx)}
                    <span className="font-semibold text-primary">{suggestion.slice(idx, idx + value.length)}</span>
                    {suggestion.slice(idx + value.length)}
                  </>
                );
              } else {
                parts = suggestion;
              }

              return (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => { onChange(suggestion); setOpen(false); }}
                  className={cn(
                    "w-full text-left px-3.5 py-2.5 text-sm transition-colors flex items-center gap-2",
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/60 text-foreground/80"
                  )}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  <span>{parts}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Multi TypeAhead ──────────────────────────────────────────────

interface MultiTypeAheadProps {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions: string[];
  placeholder: string;
  icon?: React.ReactNode;
  label: string;
}

export function MultiTypeAhead({ values, onChange, suggestions, placeholder, icon, label }: MultiTypeAheadProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [filtered, setFiltered] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inputValue || inputValue.length < 1) {
      setFiltered([]);
      return;
    }
    const lower = inputValue.toLowerCase();
    const matches = suggestions
      .filter(s => s.toLowerCase().includes(lower) && !values.includes(s))
      .sort((a, b) => {
        const aStart = a.toLowerCase().startsWith(lower) ? 0 : 1;
        const bStart = b.toLowerCase().startsWith(lower) ? 0 : 1;
        if (aStart !== bStart) return aStart - bStart;
        return a.length - b.length;
      })
      .slice(0, 10);
    setFiltered(matches);
  }, [inputValue, suggestions, values]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addValue = useCallback((val: string) => {
    const trimmed = val.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputValue("");
  }, [values, onChange]);

  const removeValue = useCallback((val: string) => {
    onChange(values.filter(v => v !== val));
  }, [values, onChange]);

  const showDropdown = open && filtered.length > 0 && inputValue.length >= 1;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[11px] font-semibold text-foreground/60 mb-1.5 ml-0.5 tracking-wider uppercase">
        {label}
      </label>
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-xl border px-3.5 py-2.5 transition-all duration-200 min-h-[48px]",
          "bg-card shadow-sm",
          showDropdown
            ? "border-primary ring-2 ring-primary/20 shadow-md rounded-b-none"
            : "border-border hover:border-primary/30 hover:shadow"
        )}
      >
        {icon && values.length === 0 && !inputValue && <span className="text-primary/40 shrink-0">{icon}</span>}
        {values.map((val) => (
          <span
            key={val}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary border border-primary/15 px-2.5 py-1 text-xs font-medium max-w-[200px]"
          >
            <span className="truncate">{val}</span>
            <button type="button" onClick={() => removeValue(val)} className="hover:text-primary/60 transition-colors shrink-0">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && inputValue.trim()) {
              e.preventDefault();
              addValue(inputValue);
            }
            if (e.key === "Backspace" && !inputValue && values.length > 0) {
              removeValue(values[values.length - 1]);
            }
          }}
          placeholder={values.length === 0 ? placeholder : "Type to search..."}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40 py-0.5"
        />
        {!inputValue && values.length === 0 && <Search className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />}
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full rounded-b-xl border border-t-0 border-primary bg-card shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((suggestion) => {
              const lower = inputValue.toLowerCase();
              const idx = suggestion.toLowerCase().indexOf(lower);
              let parts: React.ReactNode;
              if (idx >= 0) {
                parts = (
                  <>
                    {suggestion.slice(0, idx)}
                    <span className="font-semibold text-primary">{suggestion.slice(idx, idx + inputValue.length)}</span>
                    {suggestion.slice(idx + inputValue.length)}
                  </>
                );
              } else {
                parts = suggestion;
              }

              return (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => addValue(suggestion)}
                  className="w-full text-left px-3.5 py-2.5 text-sm transition-colors hover:bg-muted/60 text-foreground/80"
                >
                  {parts}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
