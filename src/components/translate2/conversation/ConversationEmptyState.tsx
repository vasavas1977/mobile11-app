export function ConversationEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center" role="status">
      {/* Hint */}
      <p
        className="text-[13px] text-muted-foreground/60 max-w-[220px] leading-relaxed animate-fade-in"
        style={{ animationDelay: '80ms' }}
      >
        Real-time translation starts instantly
      </p>

      {/* Feature pills */}
      <div
        className="mt-5 flex items-center gap-1.5 animate-fade-in"
        style={{ animationDelay: '200ms' }}
      >
        {['Voice', 'Real-time', 'Bilingual'].map((label) => (
          <span
            key={label}
            className="px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-100/60 text-[10px] font-medium text-muted-foreground/50 tracking-wide uppercase"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}