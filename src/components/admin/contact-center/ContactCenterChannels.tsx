import { FacebookChannelCard } from "./FacebookChannelCard";
import { LineChannelCard } from "./LineChannelCard";
import { WhatsAppChannelCard } from "./WhatsAppChannelCard";
import { VoiceChannelCard } from "./VoiceChannelCard";

export function ContactCenterChannels() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Channel Connections</h2>
        <p className="text-sm text-muted-foreground">
          Manage your messaging channel integrations to receive and respond to customer messages.
        </p>
      </div>

      <div className="grid gap-6">
        <FacebookChannelCard />
        <LineChannelCard />
        <WhatsAppChannelCard />
        <VoiceChannelCard />
      </div>
    </div>
  );
}
