import { Award } from 'lucide-react';

// Small badge shown on profile headers when the user is a confirmed
// Nina Purple Ambassador. Only renders when is_ambassador is true — the
// flag is set server-side by an admin approving an application, never
// by the user themselves.
export default function AmbassadorBadge({ size = 'sm', lang = 'en' }) {
  const isFr = lang === 'fr';
  const sizes = {
    sm: { badge: 'px-2 py-0.5 text-[10px] gap-1', icon: 'w-3 h-3' },
    md: { badge: 'px-2.5 py-1 text-xs gap-1.5', icon: 'w-3.5 h-3.5' },
  };
  const s = sizes[size] || sizes.sm;

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${s.badge}`}
      style={{
        background: 'linear-gradient(135deg, rgba(245,168,0,0.15) 0%, rgba(123,47,190,0.15) 100%)',
        color: '#F5A800',
        border: '1px solid rgba(245,168,0,0.3)',
        boxShadow: '0 0 12px rgba(245,168,0,0.15)',
      }}
      title={isFr ? 'Ambassadeur Nina Purple — Ambassadeur pour l\'humanité' : 'Nina Purple Ambassador — Ambassador for humanity'}
    >
      <Award className={s.icon} />
      {isFr ? 'Ambassadeur' : 'Ambassador'}
    </span>
  );
}