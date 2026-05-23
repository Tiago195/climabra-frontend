import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  photos: string[];
  onFilesSelected: (files: File[]) => void;
  onRemove: (index: number) => void;
  max?: number;
  uploading?: boolean;
}

export function PhotoUploadGrid({ photos, onFilesSelected, onRemove, max = 5, uploading = false }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (photos.length + files.length > max) {
      toast.error(`Máximo de ${max} fotos`);
      return;
    }
    onFilesSelected(files);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((url, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(idx)}
              disabled={uploading}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center disabled:opacity-50"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <label className={`aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center transition-colors ${
            uploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-blue-400 hover:bg-blue-50"
          }`}>
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 text-gray-400 mb-1 animate-spin" />
                <span className="text-xs text-gray-400">Enviando...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-xs text-gray-400">Adicionar</span>
              </>
            )}
            <input type="file" accept="image/*" multiple onChange={handleChange} disabled={uploading} className="hidden" />
          </label>
        )}
      </div>
      <p className="text-xs text-gray-400">Até {max} fotos do equipamento e do local</p>
    </div>
  );
}
