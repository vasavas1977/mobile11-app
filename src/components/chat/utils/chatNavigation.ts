/**
 * Centralized chat navigation utility for consistent persistence behavior.
 * Saves chat scroll position before navigating to ensure seamless restoration.
 */

/**
 * Saves chat scroll position and navigates in the same tab.
 * This ensures the chat window persists with proper scroll restoration.
 */
export function navigateWithChatPersistence(url: string): void {
  // Save chat scroll position before navigating
  const chatContainer = document.querySelector('[data-chat-messages]');
  if (chatContainer) {
    sessionStorage.setItem('mobile11_chat_scroll', String(chatContainer.scrollTop));
  }
  
  console.log('[ChatNavigation] Navigating with persistence to:', url);
  window.location.href = url;
}

/**
 * Checks if a URL is internal (same-tab navigation appropriate)
 */
export function isInternalUrl(url: string): boolean {
  return url.startsWith('/') || 
         url.startsWith(window.location.origin) ||
         url.includes('lovable.app');
}
