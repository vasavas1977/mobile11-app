import { Headphones, Menu, X, LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentStatusToggle } from './AgentStatusToggle';
import { AgentPushToggle } from './AgentPushToggle';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

interface QueueStats {
  open: number;
  pending: number;
  myConversations: number;
}

interface AgentMobileHeaderProps {
  stats?: QueueStats;
  unreadCount?: number;
}

export function AgentMobileHeader({ stats, unreadCount = 0 }: AgentMobileHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#F3F0EB] md:hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
            <Headphones className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-[#1A1A1A] text-lg">Agent</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Unread bell */}
          <button className="relative p-2 rounded-xl hover:bg-[#FAF7F2] transition-colors">
            <Bell className="h-5 w-5 text-[#9CA3AF]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <AgentPushToggle />
          <AgentStatusToggle />
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-[#FAF7F2]">
                <Menu className="h-5 w-5 text-[#1A1A1A]" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-white p-0 border-l border-[#F3F0EB]">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-[#F3F0EB]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-[#1A1A1A] text-lg">Menu</h2>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-[#FAF7F2]">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>
                  
                  <p className="text-sm text-[#9CA3AF] truncate">
                    {user?.email}
                  </p>
                </div>

                {/* Queue Stats */}
                {stats && (
                  <div className="p-4 border-b border-[#F3F0EB]">
                    <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">
                      Queue Overview
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#FAF7F2] rounded-2xl p-3 text-center">
                        <div className="text-xl font-bold text-orange-500">{stats.open}</div>
                        <div className="text-[10px] text-[#9CA3AF] font-medium">Open</div>
                      </div>
                      <div className="bg-[#FAF7F2] rounded-2xl p-3 text-center">
                        <div className="text-xl font-bold text-yellow-500">{stats.pending}</div>
                        <div className="text-[10px] text-[#9CA3AF] font-medium">Pending</div>
                      </div>
                      <div className="bg-[#FAF7F2] rounded-2xl p-3 text-center">
                        <div className="text-xl font-bold text-orange-500">{stats.myConversations}</div>
                        <div className="text-[10px] text-[#9CA3AF] font-medium">Mine</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Sign Out */}
                <div className="p-4 border-t border-[#F3F0EB]">
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-2xl border-[#F3F0EB] text-[#1A1A1A] hover:bg-[#FAF7F2]"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
