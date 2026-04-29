export type ChatChannel = 'web' | 'line' | 'facebook' | 'whatsapp';

export interface ChannelConfig {
  id: ChatChannel;
  url?: string;
  enabled: boolean;
}

export const CHAT_CHANNELS: Record<ChatChannel, ChannelConfig> = {
  web: {
    id: 'web',
    enabled: true
  },
  line: {
    id: 'line',
    url: 'https://line.me/R/ti/p/@mobile11',
    enabled: true
  },
  facebook: {
    id: 'facebook',
    url: 'https://m.me/mobile11esim',
    enabled: true
  },
  whatsapp: {
    id: 'whatsapp',
    url: 'https://wa.me/15551863525',
    enabled: true
  }
};
