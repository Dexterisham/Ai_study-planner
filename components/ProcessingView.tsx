
import React from 'react';

interface ProcessingViewProps {
  message: string;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
      <h2 className="mt-6 text-xl font-semibold text-gray-700 dark:text-gray-200">Processing your file...</h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
};

export default ProcessingView;