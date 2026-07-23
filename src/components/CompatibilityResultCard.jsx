import React, { forwardRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useLang } from '@/lib/LanguageContext';
import { ninaIcon } from '@/lib/images';
import { BIG5_TRAITS, ATTACHMENT_META, traitLevel, LEVEL_LABEL } from '@/lib/compatibilityQuiz';

// Reused both as the in-app result screen and as the captured shareable card.
const CompatibilityResultCard = forwardRef(function CompatibilityResultCard(
  { attachment, big5, displayName },
  ref
) {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const meta = ATTACHMENT_META[attachment?.style] || ATTACHMENT_META.secure;

  const radarData = BIG5_TRAITS.map((t) => ({
    trait: isFr ? t.fr : t.en,
    value: big5?.[t.key] ?? 0,
  }));

  return (
    <div
      ref={ref}
      className="rounded-3xl overflow-hidden flex flex-col"
      style={{
        width: 340,
        background: 'linear-gradient(160deg, #150C1E 0%, #0B0510 100%)',
        border: '1px solid rgba(245,168,0,0.25)',
        boxShadow: '0 10px 50px rgba(123,47,190,0.25)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3" style={{ borderBottom: '1px solid rgba(240,230,255,0.06)' }}>
        <img src={ninaIcon} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", color: '#F0E6FF', fontSize: 15, fontWeight: 600 }}>
            {isFr ? 'Profil de Compatibilité' : 'Compatibility Profile'}
          </div>
          <div style={{ color: 'rgba(240,230,255,0.45)', fontSize: 11 }}>
            {displayName ? displayName : (isFr ? 'Nina Purple' : 'Nina Purple')}
          </div>
        </div>
      </div>

      {/* Attachment style */}
      <div className="px-5 py-4 text-center">
        <div style={{ color: 'rgba(240,230,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
          {isFr ? 'Style d\u2019attachement' : 'Attachment Style'}
        </div>
        <div
          className="mx-auto mt-2 inline-flex items-center justify-center rounded-full px-5 py-1.5"
          style={{ background: `${meta.color}22`, border: `1px solid ${meta.color}55`, color: meta.color, fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600 }}
        >
          {isFr ? meta.fr : meta.en}
        </div>
        <p style={{ color: 'rgba(240,230,255,0.6)', fontSize: 12, lineHeight: 1.5, marginTop: 10, padding: '0 6px' }}>
          {isFr ? meta.desc_fr : meta.desc_en}
        </p>
      </div>

      {/* Radar chart */}
      <div className="flex justify-center px-2">
        <RadarChart data={radarData} width={300} height={230} outerRadius="72%">
          <PolarGrid stroke="rgba(240,230,255,0.12)" />
          <PolarAngleAxis dataKey="trait" tick={{ fill: 'rgba(240,230,255,0.7)', fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 5]} tick={{ fill: 'rgba(240,230,255,0.25)', fontSize: 8 }} axisLine={false} tickCount={6} />
          <Radar dataKey="value" stroke="#F5A800" fill="#F5A800" fillOpacity={0.25} strokeWidth={2} />
        </RadarChart>
      </div>

      {/* Big Five levels */}
      <div className="px-5 pb-4 pt-1 grid grid-cols-5 gap-1.5">
        {BIG5_TRAITS.map((t) => {
          const score = big5?.[t.key] ?? 0;
          const lvl = traitLevel(score);
          const lvlLabel = LEVEL_LABEL[lvl][isFr ? 'fr' : 'en'];
          return (
            <div key={t.key} className="text-center">
              <div style={{ color: 'rgba(240,230,255,0.85)', fontSize: 9, fontWeight: 600 }}>
                {isFr ? t.fr : t.en}
              </div>
              <div style={{ color: '#F5A800', fontSize: 9, marginTop: 2 }}>{lvlLabel}</div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-auto px-5 py-3 text-center" style={{ borderTop: '1px solid rgba(240,230,255,0.06)' }}>
        <div style={{ color: 'rgba(240,230,255,0.4)', fontSize: 10, fontStyle: 'italic' }}>
          {isFr ? 'Connu·e pour aimer à la juste mesure.' : 'Known to love at the right measure.'}
        </div>
        <div style={{ color: 'rgba(240,230,255,0.3)', fontSize: 9, marginTop: 3 }}>
          NinaPurple.love
        </div>
      </div>
    </div>
  );
});

export default CompatibilityResultCard;