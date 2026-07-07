import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useLang } from '@/lib/LanguageContext';

export default function BBPConversionChart() {
  const { lang } = useLang();
  const isFr = lang === 'fr';

  const data = [
    { month: isFr ? 'Mois 1' : 'Month 1', pct: 30 },
    { month: isFr ? 'Mois 2' : 'Month 2', pct: 40 },
    { month: isFr ? 'Mois 3' : 'Month 3', pct: 50 },
    { month: isFr ? 'Mois 4' : 'Month 4', pct: 60 },
    { month: isFr ? 'Mois 5' : 'Month 5', pct: 70 },
    { month: isFr ? 'Mois 6+' : 'Month 6+', pct: 80 },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 16, right: 10, left: -28, bottom: 0 }}>
        <XAxis
          dataKey="month"
          tick={{ fill: 'rgba(240,230,255,0.5)', fontSize: 10 }}
          axisLine={{ stroke: 'rgba(240,230,255,0.1)' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: 'rgba(240,230,255,0.4)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(123,47,190,0.08)' }}
          contentStyle={{
            background: '#1F1026',
            border: '1px solid rgba(245,168,0,0.3)',
            borderRadius: '0.75rem',
            fontSize: '12px',
            color: '#F0E6FF',
          }}
          formatter={(v) => [`${v}%`, isFr ? 'Valeur convertie' : 'Value converted']}
        />
        <Bar dataKey="pct" radius={[8, 8, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={i === data.length - 1 ? '#F5A800' : '#7B2FBE'} />
          ))}
          <LabelList
            dataKey="pct"
            position="top"
            formatter={(v) => `${v}%`}
            style={{ fill: 'rgba(240,230,255,0.7)', fontSize: 10, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}