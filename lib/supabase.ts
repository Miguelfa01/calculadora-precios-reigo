import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

if (import.meta.env.DEV && typeof window !== 'undefined') {
  if (!url || !anonKey) {
    console.warn('[ProfitFlow] Faltan variables de Supabase. Crea .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY y reinicia el servidor (npm run dev).');
  } else {
    console.info('[ProfitFlow] Supabase conectado. La configuración se guardará en la nube.');
  }
}

const DEVICE_KEY_STORAGE = 'profitflow_device_key';

function randomId(): string {
  return crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

export function getDeviceKey(): string {
  if (typeof localStorage === 'undefined') return randomId();
  let key = localStorage.getItem(DEVICE_KEY_STORAGE);
  if (!key) {
    key = randomId();
    localStorage.setItem(DEVICE_KEY_STORAGE, key);
  }
  return key;
}
