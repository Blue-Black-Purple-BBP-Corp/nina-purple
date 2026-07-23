import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Bell, BellOff } from 'lucide-react';
import { getTodayInsight, getCumulativeCount } from '@/lib/dailyInsights';
import {
  getReminderEnabled, setReminderEnabled, ensurePermission, getPermission,
  scheduleDailyReminder, clearDailyReminder, showInsightNotification,
} from '@/lib/dailyNotification';

export default function DailyInsightCard({ profile, lang }) {
  const [card, setCard] = useState(null);
  const [count, setCount] = useState(0);
  const [reminderOn, setReminderOn] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    const { card: c, isNewDay } = getTodayInsight(profile);
    setCard(c);
    setCount(getCumulativeCount());
    const enabled = getReminderEnabled();
    setReminderOn(enabled);
    setPermission(getPermission());

    const getText = () => {
      if (!c) return null;
      const title = lang === 'fr' ? 'L\u2019insight du jour · Nina Purple' : "Today's Insight · Nina Purple";
      return { title, body: lang === 'fr' ? c.fr : c.en };
    };

    if (enabled && getPermission() === 'granted') scheduleDailyReminder(getText);
    if (isNewDay && enabled && getPermission() === 'granted') {
      showInsightNotification(getText().title, getText().body);
    }
    return () => clearDailyReminder();
  }, [profile, lang]);

  const toggleReminder = async () => {
    if (reminderOn) {
      setReminderEnabled(false);
      setReminderOn(false);
      clearDailyReminder();
      return;
    }
    const perm = await ensurePermission();
    setPermission(perm);
    if (perm !== 'granted') return;
    setReminderEnabled(true);
    setReminderOn(true);
    scheduleDailyReminder(() => {
      if (!card) return null;
      const title = lang === 'fr' ? 'L\u2019insight du jour · Nina Purple' : "Today's Insight · Nina Purple";
      return { title, body: lang === 'fr' ? card.fr : card.en };
    });
  };

  if (!card) return null;

  const text = lang === 'fr' ? card.fr : card.en;
  const reminderSupported = typeof Notification !== 'undefined';
  const reminderBlocked = reminderSupported && permission === 'denied';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.08 }}
      className="glass-card-gold rounded-2xl p-4 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[rgba(245,168,0,0.12)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#F5A800]" />
          </div>
          <h3 className="font-serif text-sm text-[#F0E6FF]">
            {lang === 'fr' ? 'L\u2019insight du jour' : "Today's Insight"}
          </h3>
        </div>
        {reminderSupported && (
          <button
            onClick={toggleReminder}
            disabled={reminderBlocked}
            title={
              reminderBlocked
                ? (lang === 'fr' ? 'Notifications bloquées dans le navigateur' : 'Notifications blocked in browser')
                : reminderOn
                  ? (lang === 'fr' ? 'Désactiver le rappel quotidien' : 'Turn off daily reminder')
                  : (lang === 'fr' ? 'Activer le rappel quotidien' : 'Turn on daily reminder')
            }
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
              reminderOn
                ? 'bg-[rgba(245,168,0,0.15)] text-[#F5A800] border border-[rgba(245,168,0,0.3)]'
                : 'text-[#F0E6FF]/40 hover:text-[#F5A800] border border-[rgba(240,230,255,0.1)]'
            } ${reminderBlocked ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {reminderOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
        )}
      </div>

      <p className="text-[#F0E6FF]/85 text-[15px] leading-relaxed font-serif italic">
        {text}
      </p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(245,168,0,0.12)]">
        <span className="text-[#F0E6FF]/40 text-[11px]">
          {count} {lang === 'fr' ? 'insights explorés' : 'insights explored'}
        </span>
        <span className="text-[#F0E6FF]/30 text-[10px] uppercase tracking-wider">
          {lang === 'fr' ? 'Personnalisé à votre profil' : 'Personalized to your profile'}
        </span>
      </div>
    </motion.div>
  );
}