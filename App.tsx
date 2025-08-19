
import React, { useState, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { AppState, Message } from './types';
import FileUpload from './components/FileUpload';
import ProcessingView from './components/ProcessingView';
import ChatView from './components/ChatView';
import { processZipFile } from './services/fileProcessor';
import { extractEquationsFromImages, startChatSession } from './services/geminiService';

export default function App(): React.ReactNode {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);

  const handleFileProcess = useCallback(async (file: File) => {
    setAppState(AppState.PROCESSING);
    setErrorMessage('');
    setChatHistory([]);

    try {
      const updateProgress = (message: string) => {
        setProcessingMessage(message);
      };

      updateProgress('Extracting images from PDFs...');
      const images = await processZipFile(file, updateProgress);
      if (images.length === 0) {
        throw new Error("No images found in the PDFs within the ZIP file.");
      }

      updateProgress(`Found ${images.length} images. Analyzing with AI...`);
      const equations = await extractEquationsFromImages(images, updateProgress);
      if (equations.length === 0) {
        throw new Error("Could not extract any math equations from the images.");
      }
      
      updateProgress('Initializing study assistant...');
      const { chatInstance, initialResponse } = await startChatSession(equations);
      
      setChat(chatInstance);
      setChatHistory([
        {
          id: Date.now(),
          text: `I've analyzed your documents and found ${equations.length} mathematical concepts. Here's a summary:\n\n` + equations.map(e => `> ${e}`).join('\n') + `\n\n${initialResponse}`,
          sender: 'bot'
        }
      ]);
      setAppState(AppState.CHATTING);

    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      setErrorMessage(`Failed to process file: ${message}`);
      setAppState(AppState.IDLE);
    }
  }, []);
  
  const handleSendMessage = useCallback(async (userMessage: string) => {
    if (!chat || isBotTyping) return;

    const newUserMessage: Message = { id: Date.now(), text: userMessage, sender: 'user' };
    setChatHistory(prev => [...prev, newUserMessage]);
    setIsBotTyping(true);

    try {
      let fullBotResponse = "";
      const stream = await chat.sendMessageStream({ message: userMessage });

      for await (const chunk of stream) {
        fullBotResponse += chunk.text;
        setChatHistory(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.sender === 'bot') {
                return [...prev.slice(0, -1), { ...lastMessage, text: fullBotResponse }];
            } else {
                return [...prev, { id: Date.now() + 1, text: fullBotResponse, sender: 'bot' }];
            }
        });
      }

    } catch (error) {
      console.error("Error sending message:", error);
      const errorBotMessage: Message = { id: Date.now() + 1, text: "Sorry, I encountered an error. Please try again.", sender: 'bot' };
      setChatHistory(prev => [...prev, errorBotMessage]);
    } finally {
      setIsBotTyping(false);
    }
  }, [chat, isBotTyping]);
  
  const renderContent = (): React.ReactNode => {
    switch (appState) {
      case AppState.PROCESSING:
        return <ProcessingView message={processingMessage} />;
      case AppState.CHATTING:
        return <ChatView
                  messages={chatHistory}
                  onSendMessage={handleSendMessage}
                  isBotTyping={isBotTyping}
                />;
      case AppState.IDLE:
      default:
        return <FileUpload onFileUpload={handleFileProcess} errorMessage={errorMessage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 transition-colors duration-300">
      <div className="w-full max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        <header className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
            Math Study Planner AI
          </h1>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">Your personal math equation study assistant</p>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}