
import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import ChatMessage from './ChatMessage';
import { SendIcon } from './icons/SendIcon';

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isBotTyping: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({ messages, onSendMessage, isBotTyping }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isBotTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isBotTyping) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isBotTyping && messages[messages.length - 1]?.sender !== 'bot' && (
           <div className="flex justify-start">
             <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 max-w-lg">
               <div className="flex items-center justify-center space-x-1">
                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
               </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            className="flex-1 p-3 border rounded-lg bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            disabled={isBotTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isBotTyping}
            className="p-3 bg-indigo-600 text-white rounded-lg disabled:bg-indigo-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;