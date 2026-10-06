import { HardDrive, Lock, LockOpen } from "lucide-react";

/** Device glyph + 48% lock badge, recovered from SealedVolumeAlert's j/W/P. */
export function ColdVolumeIcon({ className, sealed }: { className?: string; sealed: boolean }) {
  const Badge = sealed ? Lock : LockOpen;
  return <span className={`relative inline-flex ${className ?? ""}`}><HardDrive className="size-full" strokeWidth={1.5} /><Badge className={`absolute bottom-0 right-0 size-[48%] ${sealed ? "text-amber-500" : "text-[var(--nori-teal,#5eead4)]"}`} strokeWidth={2.5} /></span>;
}

export function SealedColdVolumeIcon({ className }: { className?: string }) {
  return <ColdVolumeIcon className={className} sealed />;
}

export function OpenColdVolumeIcon({ className }: { className?: string }) {
  return <ColdVolumeIcon className={className} sealed={false} />;
}

/** The shipped PDF page uses a red PDF badge, not a FileText glyph. */
export function PdfFileIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <rect x="5" y="12.5" width="12" height="6" rx="1.4" fill="#dc2626" />
    <text x="11" y="17.15" textAnchor="middle" fontSize="5" fontWeight="800" letterSpacing="-0.2" fontFamily="ui-sans-serif, system-ui, sans-serif" fill="#ffffff">PDF</text>
  </svg>;
}
