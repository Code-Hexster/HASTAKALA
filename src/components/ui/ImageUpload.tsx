"use client";

import { useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

interface UploadedImage {
  url: string;
  publicId: string;
}

interface ImageUploadProps {
  /** Maximum number of images (1 = single mode) */
  maxImages?: number;
  /** Callback when images change */
  onImagesChange?: (images: UploadedImage[]) => void;
  /** Cloudinary folder */
  folder?: string;
  /** Custom label */
  label?: string;
}

export default function ImageUpload({
  maxImages = 1,
  onImagesChange,
  folder = "hastakala",
  label = "Upload Image",
}: ImageUploadProps) {
  const { token } = useAuthStore();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setError("");
      const fileArray = Array.from(files);
      const remaining = maxImages - images.length;

      if (remaining <= 0) {
        setError(`Maximum ${maxImages} image(s) allowed`);
        return;
      }

      const toUpload = fileArray.slice(0, remaining);
      setIsUploading(true);

      try {
        const base64Images = await Promise.all(toUpload.map(toBase64));
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const isSingle = base64Images.length === 1;

        const res = await fetch(
          `${apiUrl}/upload/${isSingle ? "single" : "multiple"}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(
              isSingle
                ? { image: base64Images[0], folder }
                : { images: base64Images, folder }
            ),
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        const newImages = isSingle ? [data.data] : data.data;
        const updated = [...images, ...newImages];
        setImages(updated);
        onImagesChange?.(updated);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [images, maxImages, token, folder, onImagesChange]
  );

  const removeImage = useCallback(
    async (publicId: string) => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/${publicId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Best-effort delete
      }
      const updated = images.filter((img) => img.publicId !== publicId);
      setImages(updated);
      onImagesChange?.(updated);
    },
    [images, token, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles]
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[var(--color-surface-700)]">
        {label}
      </label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-2 p-8
          border-2 border-dashed rounded-[var(--radius-lg)] cursor-pointer
          transition-all duration-200
          ${dragActive
            ? "border-[var(--color-saffron-500)] bg-[var(--color-saffron-50)]"
            : "border-[var(--color-surface-300)] hover:border-[var(--color-saffron-400)] bg-white"
          }
          ${isUploading ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <div className="text-4xl">📷</div>
        <p className="text-sm text-[var(--color-surface-500)]">
          {isUploading ? "Uploading…" : "Drag & drop or click to upload"}
        </p>
        <p className="text-xs text-[var(--color-surface-400)]">
          PNG, JPG, WebP up to 10MB • {maxImages - images.length} remaining
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={maxImages > 1}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.publicId} className="relative group aspect-square rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-surface-200)]">
              <img
                src={img.url}
                alt="Uploaded"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(img.publicId); }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
