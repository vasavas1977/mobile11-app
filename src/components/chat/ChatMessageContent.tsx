import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

interface ChatMessageContentProps {
  content: string;
  senderType: string;
}

// Convert bare URLs (e.g. "mobile11.com/esim/japan") into proper links for ReactMarkdown
function linkifyBareUrls(text: string): string {
  // Match domain-like patterns not already preceded by ]( or https:// or http://
  return text.replace(
    /(?<!\]\()(?<!\/)(?<!:\/\/)(?<![a-zA-Z0-9])((?:mobile11\.com|www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/[^\s),]*)?)/gi,
    (match) => `[${match}](https://${match})`
  );
}

const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ content, senderType }) => {
  const isCustomer = senderType === 'customer';
  const processedContent = linkifyBareUrls(content);
  
  return (
    <div className={`p-3 pb-1 text-sm leading-relaxed font-sans ${isCustomer ? 'text-white' : 'text-gray-900'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Links - clickable, styled, with same-tab navigation for internal links
          a: ({ href, children }) => {
            // Validate and fix legacy/invalid URL patterns on the client side
            let finalHref = href;
            
            // Fix /cart?id= invalid format → show toast warning
            if (href && /\/cart\?id=/i.test(href)) {
              finalHref = undefined; // Will be blocked
              console.warn('ChatMessageContent: Blocked invalid /cart?id= link', href);
            }

            // Check if link is internal (same origin, relative path, or lovable domains)
            const isInternal = finalHref?.startsWith('/') || 
                               finalHref?.startsWith(window.location.origin) ||
                               finalHref?.includes('lovable.app') ||
                               finalHref?.includes('lovableproject.com') ||
                               finalHref?.includes('/packages') ||
                               finalHref?.includes('/cart');
            
            const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
              if (!finalHref || finalHref === '#') {
                e.preventDefault();
                toast.error('This link is outdated. Please ask the chatbot again for an updated link.');
                console.warn('ChatMessageContent: Invalid/outdated href blocked', href);
                return;
              }
              
              if (isInternal) {
                e.preventDefault();
                
                // Save chat scroll position before navigating
                const chatContainer = document.querySelector('[data-chat-messages]');
                if (chatContainer) {
                  sessionStorage.setItem('mobile11_chat_scroll', String(chatContainer.scrollTop));
                }
                
                console.log('ChatMessageContent: Same-tab navigation to', finalHref);
                // Navigate in same tab - chat will persist due to localStorage state
                window.location.href = finalHref;
              } else {
                console.log('ChatMessageContent: Opening external link in new tab', finalHref);
              }
            };
            
            return (
              <a
                href={finalHref || '#'}
                target={isInternal ? '_self' : '_blank'}
                rel={isInternal ? undefined : 'noopener noreferrer'}
                onClick={handleClick}
                className={`underline font-medium break-all hover:opacity-80 transition-opacity cursor-pointer ${
                  isCustomer 
                    ? 'text-primary-foreground/90 hover:text-primary-foreground' 
                    : 'text-primary hover:text-primary/80'
                }`}
              >
                {children}
              </a>
            );
          },
          // Bold text
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          // Paragraphs with proper spacing
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          // Unordered lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-0.5 pl-1">{children}</ul>
          ),
          // Ordered lists
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-0.5 pl-1">{children}</ol>
          ),
          // List items
          li: ({ children }) => (
            <li className="text-sm">{children}</li>
          ),
          // Code inline
          code: ({ children }) => (
            <code className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
          ),
          // Headings (rarely used in chat but good to have)
          h1: ({ children }) => (
            <h1 className="font-bold text-base mb-1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-bold text-sm mb-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-semibold text-sm mb-1">{children}</h3>
          ),
          // Table components for loyalty tiers and other tabular data
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-gray-200 rounded-lg text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-100">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1.5 text-left font-semibold border-b border-gray-200 whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1.5 border-b border-gray-200">{children}</td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default ChatMessageContent;
