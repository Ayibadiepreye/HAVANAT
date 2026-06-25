// Reusable image upload widget for any admin form.
// Wraps uploadToCloudinary() and gives back the URL.
// Used by ProductFormModal, BannersEditor, LookbookEditor, TestimonialsEditor.

import { useRef, useState } from 'react';
import { uploadToCloudinary, cloudinaryConfig } from '@/lib/cloudinary';
import { Loader2, Upload, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  aspect?: 'square' | 'wide' | 'portrait' | 'auto';
}

export default function ImageUploader({ value, onChange, folder = 'havanat/general', label = 'Image', hint, aspect = 'auto' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspectCls = {
    square: 'aspect-square',
    wide: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: 'aspect-auto min-h-[120px]',
  }[aspect];

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded = await uploadToCloudinary(files[0], folder);
      onChange(uploaded);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-gray-600 mb-2">{label}</label>
      {!cloudinaryConfig.configured && (
        <div className="bg-yellow-50 border border-yellow-200 p-2 text-xs text-yellow-800 mb-2">
          Cloudinary not configured. Add VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET to app/.env
        </div>
      )}
      <div className={`relative ${aspectCls} w-full bg-gray-50 border ${value ? '' : 'border-dashed border-gray-300'} overflow-hidden`}>
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading || !cloudinaryConfig.configured}
                className="bg-black/80 text-white px-3 py-1.5 text-xs uppercase tracking-wider hover:bg-black disabled:opacity-50"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="bg-red-600 text-white p-1.5 hover:bg-red-700"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Uploading…
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || !cloudinaryConfig.configured}
            className="w-full h-full min-h-[120px] flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mb-2" /> Uploading…
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mb-2" />
                <span className="text-xs uppercase tracking-wider">Click to upload</span>
                {hint && <span className="text-xs text-gray-400 mt-1">{hint}</span>}
              </>
            )}
          </button>
        )}
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 p-2 text-xs text-red-700 mt-2">Upload failed: {error}</div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading || !cloudinaryConfig.configured}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}