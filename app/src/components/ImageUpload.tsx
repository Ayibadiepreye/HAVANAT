import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/api';

interface ImageUploadProps {
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  maxSizeMB?: number;
  aspectRatio?: string; // e.g., '1/1' for square
  label?: string;
}

export default function ImageUpload({
  currentUrl,
  onUploadComplete,
  onRemove,
  maxSizeMB = 5,
  aspectRatio = '1/1',
  label = 'Upload Image',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please upload an image file (JPG, PNG, WebP)';
    }

    // Check file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `Image must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFile = async (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onUploadComplete(url);
      setPreview(url);
    } catch (err: any) {
      setError(err?.message || 'Upload failed. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemoveClick = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onRemove) onRemove();
  };

  return (
    <div className="space-y-3">
      <label className="block text-[10px] uppercase tracking-[0.1em] text-gray-500">{label}</label>
      
      {/* Preview or Upload Zone */}
      {preview ? (
        <div className="relative">
          <div className={`overflow-hidden bg-gray-100 border-2 ${uploading ? 'border-gray-300' : 'border-gray-200'}`} style={{ aspectRatio }}>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
          {!uploading && onRemove && (
            <button
              type="button"
              onClick={handleRemoveClick}
              className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-300 transition-colors"
              aria-label="Remove image"
            >
              <X size={16} className="text-gray-600 hover:text-red-600" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed cursor-pointer transition-colors ${
            dragActive ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          style={{ aspectRatio }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-3" />
                <p className="text-sm text-gray-500">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-1">Drag & drop or click to upload</p>
                <p className="text-xs text-gray-400">JPG, PNG, WebP up to {maxSizeMB}MB</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
