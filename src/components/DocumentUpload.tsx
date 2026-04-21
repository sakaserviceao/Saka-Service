import { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

interface Props {
  label: string;
  description?: string;
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // In MB
}

export const DocumentUpload = ({ 
  label, 
  description, 
  onFileSelect, 
  accept = "image/*,application/pdf",
  maxSize = 5 
}: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      if (selectedFile.size > maxSize * 1024 * 1024) {
        toast.error(`O ficheiro é demasiado grande. O limite máximo é ${maxSize}MB.`);
        return;
      }
      setFile(selectedFile);
      onFileSelect(selectedFile);

      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4 rounded-xl border-2 border-dashed border-muted p-6 transition-colors hover:border-primary/50">
      <div className="flex flex-col gap-1">
        <Label className="text-base font-semibold">{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>

      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 py-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">Clique para fazer upload ou arraste o ficheiro</p>
          <p className="text-xs text-muted-foreground">Suporta imagens (PNG, JPG) ou PDF</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept={accept}
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative flex items-center gap-4 rounded-lg bg-secondary/30 p-4">
          {preview ? (
            <img src={preview} alt="Document preview" className="h-16 w-16 rounded object-cover shadow-sm" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded bg-primary/10 text-primary">
              <FileText className="h-8 w-8" />
            </div>
          )}
          
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>

          <button 
            type="button" 
            onClick={removeFile}
            className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};
