// Best-effort local daily reminder for the Daily Insight card.
// Web cannot reliably fire notifications while the app is closed without a
// push server, so we schedule the next firing while the app is open and also
// surface the notification on open when a new day's insight is served.

const KEY = 'nina_di_reminder';
let timer = null;

export function getReminderEnabled() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function setReminderEnabled(v) {
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch {}
}

export function getPermission() {
  return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
}

export async function ensurePermission() {
  if (typeof Notification === 'undefined') return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}

export function showInsightNotification(title, body) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const opts = { body, icon: '/images/nina-icon.png' };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => reg.showNotification(title, opts))
        .catch(() => { try { new Notification(title, opts); } catch {} });
    } else {
      new Notification(title, opts);
    }
  } catch {}
}

function next9am() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(9, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

// Schedules a daily firing at 9:00 local while the app stays open.
// getText() should return { title, body } for the current insight.
export function scheduleDailyReminder(getText) {
  clearDailyReminder();
  if (!getReminderEnabled() || getPermission() !== 'granted') return;
  const ms = next9am().getTime() - Date.now();
  timer = setTimeout(() => {
    const t = getText();
    if (t) showInsightNotification(t.title, t.body);
    scheduleDailyReminder(getText);
  }, ms);
}

export function clearDailyReminder() {
  if (timer) { clearTimeout(timer); timer = null; }
}