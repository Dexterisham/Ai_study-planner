
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  errorMessage: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, errorMessage }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File | null | undefined) => {
    if (file && (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip'))) {
      onFileUpload(file);
    } else {
      alert("Please upload a valid .zip file.");
    }
  }, [onFileUpload]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const dropzoneClasses = `flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-gray-700' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div 
        className={dropzoneClasses}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-full">
          <UploadIcon />
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">ZIP file containing PDFs of math equations</p>
          <input id="dropzone-file" type="file" className="hidden" accept=".zip,application/zip" onChange={handleFileChange}/>
        </label>
      </div>
      {errorMessage && (
        <p className="mt-4 text-sm text-red-500 dark:text-red-400">{errorMessage}</p>
      )}
      <div className="mt-8 text-left text-sm text-gray-600 dark:text-gray-400 w-full">
        <h3 className="font-semibold text-base mb-2">How it works:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Prepare a <strong className="font-medium">.zip</strong> file containing your math materials as <strong className="font-medium">.pdf</strong> files.</li>
          <li>The PDFs should contain images of typed or digital math equations.</li>
          <li>Upload the zip file above.</li>
          <li>Our AI will extract and analyze the equations.</li>
          <li>Chat with your new AI tutor to build a study plan!</li>
        </ol>
      </div>
    </div>
  );
};

export default FileUpload;
