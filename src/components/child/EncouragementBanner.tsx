interface EncouragementBannerProps {
  message: string;
}

export function EncouragementBanner({ message }: EncouragementBannerProps) {
  return (
    <div className="w-full max-w-sm rounded-lg bg-brand-purple/10 p-3 text-center text-sm font-medium text-brand-purple">
      {message}
    </div>
  );
}
