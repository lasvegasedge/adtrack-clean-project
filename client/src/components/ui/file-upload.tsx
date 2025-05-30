import { useState, useRef } from "react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Check, X } from "lucide-react";

interface FileUploadProps {
  accept: string;
  maxSize?: number; // in MB
  onFileChange: (file: File | null) => void;
  defaultPreview?: string;
}

export function FileUpload({ 
  accept, 
  maxSize = 10, 
  onFileChange,
  defaultPreview 
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(defaultPreview || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    const fileTypes = accept.split(",").map(type => type.trim());
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    
    if (!fileTypes.some(type => {
      if (type.startsWith(".")) {
        return type === fileExtension;
      } else {
        return file.type.match(type);
      }
    })) {
      setError(`File type not supported. Only ${accept} files are allowed.`);
      return false;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit.`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFile(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      onFileChange(selectedFile);
      
      // Create preview URL for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type === 'application/pdf') {
        setPreview('/pdf-icon.svg'); // Use a PDF icon
      }
    } else {
      setFile(null);
      setPreview(null);
      onFileChange(null);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging ? "border-primary bg-primary/5" : "border-gray-300"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            {accept.replace(/\./g, "").toUpperCase()} (max. {maxSize}MB)
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept={accept}
            className="hidden"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleBrowseClick}
            className="mt-4"
          >
            Browse Files
          </Button>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {preview && preview.startsWith('data:image/') ? (
                <img
                  src={preview}
                  alt="File preview"
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-xs">{file.name.split('.').pop()?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-8"
                  >
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBrowseClick}
                    className="h-8"
                  >
                    Change
                  </Button>
                </div>
              </div>
              <Check className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
