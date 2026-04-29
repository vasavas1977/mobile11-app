import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, Headphones, Globe, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { POPULAR_DESTINATIONS } from './types';
import { supabase } from '@/integrations/supabase/client';
import { searchCountries, countryToSlug, getCountryCarriers, getCountryBestNetwork } from '@/lib/countryDestinations';
import { getCarrierRating } from '@/lib/carrierRatings';

export const CONVO_CHAT_STORAGE_KEY = 'mobile11_convo_chat_state';

interface ConversationalChatProps {
  onTalkToSupport: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

type ConvoStep = 'welcome' | 'purchase-reason' | 'purchase-reason-other' | 'esim-experience' | 'compatibility' | 'compatibility-eid' | 'destination' | 'saving';

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 max-w-[85%]">
      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs">🤖</span>
      </div>
      <div className="bg-white rounded-2xl rounded-tl-md border border-gray-100 px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// Bot message bubble
function BotBubble({ text }: { text: string }) {
  const renderContent = (content: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | { label: string; url: string })[] = [];
    let lastIndex = 0;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index));
      parts.push({ label: match[1], url: match[2] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) parts.push(content.slice(lastIndex));

    return parts.map((part, i) =>
      typeof part === 'string' ? (
        <span key={i}>{part}</span>
      ) : (
        <a
          key={i}
          href={part.url}
          className="font-semibold text-orange-600 underline underline-offset-2 hover:text-orange-700"
        >
          {part.label}
        </a>
      )
    );
  };

  return (
    <div className="flex items-start gap-2 max-w-[85%]">
      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs">🤖</span>
      </div>
      <div className="bg-white rounded-2xl rounded-tl-md border border-gray-100 px-4 py-3 shadow-sm">
        <p className="text-sm text-gray-800 leading-relaxed">{renderContent(text)}</p>
      </div>
    </div>
  );
}

// User message bubble
function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="bg-orange-500 text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-[75%] shadow-sm">
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

// Option button component for multi-choice steps
function OptionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700
                 hover:bg-orange-50 hover:border-orange-400 transition-all min-w-[80px]"
    >
      {label}
    </button>
  );
}

export function ConversationalChat({ onTalkToSupport }: ConversationalChatProps) {
  const { language, t, localizeField } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<ConvoStep>('welcome');
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Collected data
  const [destination, setDestination] = useState('');
  const [purchaseReason, setPurchaseReason] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<{ code: string; name: string }[]>([]);
  const restoredRef = useRef(false);

  // Restore persisted state on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const saved = localStorage.getItem(CONVO_CHAT_STORAGE_KEY);
      if (!saved) return;
      const state = JSON.parse(saved);
      if (state.currentStep && state.currentStep !== 'welcome') {
        setDestination('');
        setCurrentStep('destination');
      }
    } catch (e) {
      console.error('[ConvoChat] Error restoring state:', e);
    }
  }, []);

  // Persist state on meaningful changes
  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      const state = { messages, currentStep, destination };
      localStorage.setItem(CONVO_CHAT_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('[ConvoChat] Error persisting state:', e);
    }
  }, [messages, currentStep, destination]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  const addBotMessage = useCallback((text: string, delay = 600) => {
    setIsTyping(true);
    scrollToBottom();
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text,
        timestamp: new Date(),
      }]);
      scrollToBottom();
    }, delay);
  }, [scrollToBottom]);

  const addUserMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    }]);
    scrollToBottom();
  }, [scrollToBottom]);

  // Initial welcome message — value proposition
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONVO_CHAT_STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.currentStep && state.currentStep !== 'welcome') {
          addBotMessage(t('convoChat.welcomeBack'), 300);
          return;
        }
      }
    } catch {}
    addBotMessage(t('convoChat.welcome'), 300);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Search countries effect
  useEffect(() => {
    if (searchValue.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      const results = searchCountries(searchValue);
      setSearchResults(results.slice(0, 6).map(r => ({ code: r.code, name: r.name })));
    }, 150);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // ── Step handlers ──

  // Welcome → Buy eSIM → ask eSIM experience
  const handleBuyEsim = () => {
    addUserMessage(t('convoChat.buyEsim'));
    setCurrentStep('purchase-reason');
    setTimeout(() => {
      addBotMessage(t('convoChat.purchaseReasonPrompt'), 800);
    }, 200);
  };

  // Purchase reason response
  const handlePurchaseReason = (reason: string, label: string) => {
    addUserMessage(label);
    setPurchaseReason(reason);

    if (reason === 'other') {
      setCurrentStep('purchase-reason-other');
      setTimeout(() => {
        addBotMessage(t('convoChat.purchaseReasonOtherPrompt'), 800);
      }, 200);
      return;
    }

    // Proceed to esim-experience
    goToEsimExperience();
  };

  // Handle "Others" free-text submission
  const handlePurchaseReasonOther = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    addUserMessage(trimmed);
    setInputValue('');
    goToEsimExperience();
  };

  // Navigate to esim-experience step
  const goToEsimExperience = () => {
    setCurrentStep('esim-experience');
    setTimeout(() => {
      addBotMessage(t('convoChat.esimExperiencePrompt'), 800);
    }, 200);
  };

  // eSIM experience response
  const handleEsimExperience = (answer: 'yes' | 'no' | 'not-sure') => {
    const labelKey = answer === 'yes' ? 'esimExperienceYes' : answer === 'no' ? 'esimExperienceNo' : 'esimExperienceNotSure';
    addUserMessage(t(`convoChat.${labelKey}`));

    if (answer === 'yes') {
      // Already used eSIM → skip compatibility check, go straight to destination
      setCurrentStep('destination');
      setTimeout(() => {
        addBotMessage(t('convoChat.alreadyKnow'), 800);
      }, 200);
    } else {
      // Show pitch then move to compatibility
      setCurrentStep('compatibility');
      setTimeout(() => {
        addBotMessage(t('convoChat.rightChoice'), 800);
        // Then ask compatibility after pitch
        setTimeout(() => {
          addBotMessage(t('convoChat.whatPhone'), 1400);
        }, 1000);
      }, 200);
    }
  };

  // Compatibility: iPhone / Android
  const handlePhoneType = (type: 'iphone' | 'android') => {
    addUserMessage(type === 'iphone' ? '📱 iPhone' : '📱 Android');

    if (type === 'iphone') {
      setCurrentStep('destination');
      setTimeout(() => {
        addBotMessage(t('convoChat.iphoneSupported'), 800);
      }, 200);
    } else {
      // Android → ask to check EID
      setCurrentStep('compatibility-eid');
      setTimeout(() => {
        addBotMessage(t('convoChat.androidEidCheck'), 800);
      }, 200);
    }
  };

  // EID check result
  const handleEidResult = (found: boolean) => {
    addUserMessage(found ? t('convoChat.eidSeen') : t('convoChat.noEid'));

    if (found) {
      setCurrentStep('destination');
      setTimeout(() => {
        addBotMessage(t('convoChat.phoneSupported'), 800);
      }, 200);
    } else {
      setCurrentStep('saving');
      setTimeout(() => {
        addBotMessage(t('convoChat.phoneNotSupported'), 800);
        setTimeout(() => onTalkToSupport(), 3000);
      }, 200);
    }
  };

  // Handle welcome free-text input
  const handleWelcomeInput = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    addUserMessage(trimmed);
    setInputValue('');

    const results = searchCountries(trimmed);
    if (results.length > 0) {
      const match = results[0];
      handleDestinationSelect(match.name);
    } else {
      setTimeout(() => {
        addBotMessage(t('convoChat.connectingSupportFull'), 600);
        setTimeout(() => onTalkToSupport(), 1500);
      }, 200);
    }
  };

  // Handle destination selection — fetch carrier + price info and show summary
  const handleDestinationSelect = async (dest: string) => {
    setDestination(dest);
    setSearchValue('');
    setSearchResults([]);
    addUserMessage(dest);
    setCurrentStep('saving');

    // Fetch carrier info
    const carriers = getCountryCarriers(dest);
    const bestNetwork = getCountryBestNetwork(dest);
    const carrierNames = carriers.slice(0, 3).map(c => c.name);

    // Fetch cheapest price
    let priceStr = '';
    let hasUnlimited = false;
    try {
      const { data } = await supabase
        .from('esim_packages')
        .select('price, package_type, data_amount')
        .eq('is_active', true)
        .ilike('country_name', dest)
        .order('price', { ascending: true })
        .limit(20);

      if (data && data.length > 0) {
        priceStr = `$${data[0].price.toFixed(2)} USD`;
        hasUnlimited = data.some((p: any) =>
          p.package_type === 'limitless' || p.data_amount?.toLowerCase().includes('unlimited')
        );
      }
    } catch (e) {
      console.error('Error fetching prices:', e);
    }

    // Save lead
    try {
      await supabase.from('chatbot_leads' as any).insert({
        name: 'Chat User',
        destination: dest,
        language,
        purchase_reason: purchaseReason || undefined,
      });
    } catch (e) {
      console.error('Error saving lead:', e);
    }

    const slug = countryToSlug(dest);
    const url = slug ? `/esim/${slug}` : '/esim';

    // Build carrier + price summary message
    const networkBadge = bestNetwork ? ` (${bestNetwork})` : '';
    const isQualityFocused = purchaseReason === 'better-quality';
    
    // For quality-focused customers, highlight #1 carrier with trophy icon
    let carrierLine = '';
    if (carrierNames.length > 0) {
      if (isQualityFocused) {
        // Find the top-rated carrier using carrierRatings
        const ratedCarriers = carrierNames.map(name => ({ name, rating: getCarrierRating(name) }));
        ratedCarriers.sort((a, b) => b.rating - a.rating);
        const topName = ratedCarriers[0]?.name || carrierNames[0];
        carrierLine = (t('convoChat.carrierTopRated') as string).replace('{carrier}', topName);
      } else {
        carrierLine = `📡 ${carrierNames.join(' / ')}${networkBadge}`;
      }
    }
    const priceLine = priceStr
      ? (t('convoChat.startingFrom') as string).replace('{price}', priceStr)
      : '';
    const tierLine = hasUnlimited ? t('convoChat.valueUnlimited') : '';

    const parts = [carrierLine, priceLine, tierLine].filter(Boolean);
    const summary = parts.length > 0 ? '\n' + parts.join('\n') : '';

    const msg = (t('convoChat.greatChoice') as string)
      .replace(/\{dest\}/g, dest)
      .replace('{summary}', summary)
      .replace('{url}', url);

    setTimeout(() => addBotMessage(msg, 800), 200);
  };

  // Render the interactive input for current step
  const renderCurrentInput = () => {
    if (isTyping || currentStep === 'saving') return null;

    switch (currentStep) {
      case 'welcome':
        return (
          <div className="px-4 py-3 border-t border-gray-100 bg-white space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleBuyEsim}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-200 rounded-xl
                           hover:bg-orange-50 hover:border-orange-400 transition-all"
              >
                <ShoppingCart className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">
                  {t('convoChat.buyEsimLabel')}
                </span>
              </button>
              <button
                onClick={() => {
                  addUserMessage(t('convoChat.support'));
                  setTimeout(() => {
                    addBotMessage(t('convoChat.connectingSupport'), 600);
                    setTimeout(() => onTalkToSupport(), 1500);
                  }, 200);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-200 rounded-xl
                           hover:bg-orange-50 hover:border-orange-400 transition-all"
              >
                <Headphones className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">
                  {t('convoChat.supportLabel')}
                </span>
              </button>
            </div>
            <a
              href="/esim"
              className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                         hover:bg-orange-50 hover:border-orange-300 transition-all text-sm font-medium text-gray-600"
            >
              <Globe className="h-4 w-4" />
              {t('convoChat.browseAll')}
            </a>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleWelcomeInput()}
                placeholder={t('convoChat.typeCountryOrQuestion')}
                className="flex-1 px-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-full
                           placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
              />
              <button
                onClick={handleWelcomeInput}
                disabled={!inputValue.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-full
                           hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t('convoChat.send')}
              </button>
            </div>
          </div>
        );

      case 'purchase-reason':
        return (
          <div className="px-4 py-3 border-t border-gray-100 bg-white space-y-2">
            {[
              { reason: 'first-time', key: 'reasonFirstTime' },
              { reason: 'cost-saving', key: 'reasonCostSaving' },
              { reason: 'unlimited-data', key: 'reasonUnlimited' },
              { reason: 'better-quality', key: 'reasonBetterQuality' },
              { reason: 'other', key: 'reasonOther' },
            ].map((opt) => (
              <button
                key={opt.reason}
                onClick={() => handlePurchaseReason(opt.reason, t(`convoChat.${opt.key}`))}
                className="w-full py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700
                           hover:bg-orange-50 hover:border-orange-400 transition-all text-left px-4"
              >
                {t(`convoChat.${opt.key}`)}
              </button>
            ))}
          </div>
        );

      case 'purchase-reason-other':
        return (
          <div className="px-4 py-3 border-t border-gray-100 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePurchaseReasonOther()}
                placeholder={t('convoChat.typeYourReason')}
                className="flex-1 px-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-full
                           placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                autoFocus
              />
              <button
                onClick={handlePurchaseReasonOther}
                disabled={!inputValue.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-full
                           hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t('convoChat.send')}
              </button>
            </div>
          </div>
        );

      case 'esim-experience':
        return (
          <div className="px-4 py-3 border-t border-gray-100 bg-white">
            <div className="flex gap-2">
              <OptionButton
                label={t('convoChat.usedBefore')}
                onClick={() => handleEsimExperience('yes')}
              />
              <OptionButton
                label={t('convoChat.notUsed')}
                onClick={() => handleEsimExperience('no')}
              />
              <OptionButton
                label={t('convoChat.notSure')}
                onClick={() => handleEsimExperience('not-sure')}
              />
            </div>
          </div>
        );

      case 'compatibility':
        return (
          <div className="px-4 py-3 border-t border-gray-100 bg-white">
            <div className="flex gap-2">
              <button
                onClick={() => handlePhoneType('iphone')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-200 rounded-xl
                           hover:bg-orange-50 hover:border-orange-400 transition-all"
              >
                <Smartphone className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">iPhone</span>
              </button>
              <button
                onClick={() => handlePhoneType('android')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-200 rounded-xl
                           hover:bg-orange-50 hover:border-orange-400 transition-all"
              >
                <Smartphone className="h-4 w-4 text-green-500" />
                <span className="text-sm font-semibold text-gray-700">Android</span>
              </button>
            </div>
          </div>
        );

      case 'compatibility-eid':
        return (
          <div className="px-4 py-3 border-t border-gray-100 bg-white">
            <div className="flex gap-2">
              <OptionButton
                label={t('convoChat.eidSeen')}
                onClick={() => handleEidResult(true)}
              />
              <OptionButton
                label={t('convoChat.noEid')}
                onClick={() => handleEidResult(false)}
              />
            </div>
          </div>
        );

      case 'destination':
        return (
          <div className="px-4 py-3 border-t border-gray-100 bg-white space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t('convoChat.searchCountry')}
                className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-gray-50 placeholder-gray-400
                           border border-gray-200 rounded-full focus:outline-none focus:ring-2
                           focus:ring-orange-500/20 focus:border-orange-400"
                autoFocus
              />
            </div>
            {searchResults.length > 0 ? (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {searchResults.map((r) => (
                  <button
                    key={r.code}
                    onClick={() => handleDestinationSelect(r.name)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-900 rounded-lg
                               hover:bg-orange-50 border border-gray-100 hover:border-orange-200 transition-colors"
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_DESTINATIONS.map((dest) => (
                  <button
                    key={dest.code}
                    onClick={() => handleDestinationSelect(dest.nameEn)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-800 bg-gray-50
                               border border-gray-200 rounded-full hover:bg-orange-50
                               hover:border-orange-300 transition-colors"
                  >
                    {dest.emoji} {localizeField(dest, 'name')}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2]">
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3" data-chat-messages>
        {messages.map((msg) => (
          msg.sender === 'bot'
            ? <BotBubble key={msg.id} text={msg.text} />
            : <UserBubble key={msg.id} text={msg.text} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      {renderCurrentInput()}
    </div>
  );
}
