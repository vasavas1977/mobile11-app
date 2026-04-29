import { Translate2Header } from './Translate2Header';
import { Clock } from 'lucide-react';

export function Translate2History() {
  return (
    <div className="min-h-[100dvh] bg-white">
      <Translate2Header title="History" showBack />

      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Clock className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">No sessions yet</h3>
        <p className="text-sm text-muted-foreground">Your translation sessions will appear here after you start a conversation.</p>
      </div>
    </div>
  );
}
