import { NativeShell } from "@/components/native/NativeShell";
import { StoreTab } from "@/components/native/tabs/StoreTab";
import { MyEsimsTab } from "@/components/native/tabs/MyEsimsTab";
import { ProfileTab } from "@/components/native/tabs/ProfileTab";

interface NativeAppPageProps {
  tab: "store" | "esims" | "profile";
}

export default function NativeAppPage({ tab }: NativeAppPageProps) {
  return (
    <NativeShell>
      {tab === "store" && <StoreTab />}
      {tab === "esims" && <MyEsimsTab />}
      {tab === "profile" && <ProfileTab />}
    </NativeShell>
  );
}
