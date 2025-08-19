
import React, { useMemo } from 'react';
import type { Message } from '../types';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';

// This is loaded from CDN, so we declare it to satisfy TypeScript
declare const katex: any;

interface ChatMessageProps {
  message: Message;
}

function renderMessageContent(text: string): { __html: string } {
    if (typeof katex === 'undefined') {
        return { __html: text };
    }
    // Process markdown-style code blocks first to prevent them from being parsed for LaTeX
    const codeBlockProcessed = text.replace(/```([\s\S]*?)```/g, (match, code) => {
        const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<pre class="bg-gray-100 dark:bg-gray-900 rounded-md p-2 text-sm overflow-x-auto"><code>${escapedCode}</code></pre>`;
    });

    const processedText = codeBlockProcessed.replace(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g, (match) => {
        const isBlock = match.startsWith('$$');
        const latex = isBlock ? match.slice(2, -2) : match.slice(1, -1);
        try {
            return katex.renderToString(latex.trim(), {
                displayMode: isBlock,
                throwOnError: false,
            });
        } catch (e) {
            console.error(e);
            return match; // Fallback to original text on error
        }
    });

    return { __html: processedText.replace(/\n/g, '<br />') };
}


const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';
  const renderedContent = useMemo(() => renderMessageContent(message.text), [message.text]);

  const messageContainerClasses = `flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`;
  const bubbleClasses = `rounded-2xl px-4 py-3 max-w-lg shadow-md ${isBot ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none' : 'bg-indigo-600 text-white rounded-br-none'}`;
  const textClasses = 'prose prose-sm dark:prose-invert prose-p:my-1';

  return (
    <div className={messageContainerClasses}>
      {isBot && <div className="w-8 h-8 flex-shrink-0 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center"><BotIcon /></div>}
      <div className={bubbleClasses}>
        <div className={textClasses} dangerouslySetInnerHTML={renderedContent} />
      </div>
       {!isBot && <div className="w-8 h-8 flex-shrink-0 bg-indigo-200 dark:bg-indigo-800 rounded-full flex items-center justify-center"><UserIcon /></div>}
    </div>
  );
};

export default ChatMessage;