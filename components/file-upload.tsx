"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileJson, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FileUploadProps {
  onSuccess?: () => void;
}

export function FileUpload({ onSuccess }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const jsonFiles = Array.from(incoming).filter((f) =>
      f.name.endsWith(".json")
    );
    if (jsonFiles.length === 0) {
      toast.error("Please select .json files only");
      return;
    }
    setFiles((prev) => [...prev, ...jsonFiles]);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("No files selected");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Upload failed");
      }

      toast.success(`Successfully uploaded ${files.length} file(s)`);
      setFiles([]);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <Upload className="text-muted-foreground size-10" />
        <div>
          <p className="text-sm font-medium">
            Drag &amp; drop your JSON files here
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            or click to browse
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="bg-muted/50 flex items-center gap-3 rounded-md px-3 py-2"
              >
                <FileJson className="text-muted-foreground size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <Button onClick={handleUpload} disabled={isUploading} className="w-full">
            {isUploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="size-4" />
                Upload {files.length} file{files.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
