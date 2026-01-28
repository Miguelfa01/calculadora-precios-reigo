import { supabase, getDeviceKey } from '../lib/supabase';
import type { AppInputs } from '../types';

const DEFAULT_INPUTS: AppInputs = {
  precioVentaConIva: 100,
  utilidadActual: 90,
  ivaActual: 16,
  margenUtilidadDeseado: 30,
  tasaBcv: 47.11,
  tasaBinance: 53.5,
  colchonBinancePct: 0,
  descuentoProveedor1: 35,
  descuentoProveedor2: 10,
  descuentoSugerido1: 0,
  currency: 'USD',
};

function validateLoaded(c: unknown): c is AppInputs {
  if (!c || typeof c !== 'object') return false;
  const o = c as Record<string, unknown>;
  return (
    typeof o.precioVentaConIva === 'number' &&
    typeof o.utilidadActual === 'number' &&
    typeof o.ivaActual === 'number' &&
    typeof o.margenUtilidadDeseado === 'number' &&
    typeof o.tasaBcv === 'number' &&
    typeof o.tasaBinance === 'number' &&
    typeof (o.colchonBinancePct ?? 0) === 'number' &&
    typeof o.descuentoProveedor1 === 'number' &&
    typeof o.descuentoProveedor2 === 'number' &&
    typeof o.descuentoSugerido1 === 'number' &&
    (o.currency === 'USD' || o.currency === 'Bs')
  );
}

export async function loadConfig(): Promise<AppInputs> {
  if (!supabase) return DEFAULT_INPUTS;
  const deviceKey = getDeviceKey();
  const { data, error } = await supabase
    .from('app_config')
    .select('config')
    .eq('device_key', deviceKey)
    .maybeSingle();
  if (error || !data?.config) return DEFAULT_INPUTS;
  const parsed = data.config as unknown;
  if (!validateLoaded(parsed)) return DEFAULT_INPUTS;
  return { ...DEFAULT_INPUTS, ...parsed };
}

export async function saveConfig(inputs: AppInputs): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) {
    if (import.meta.env.DEV) {
      console.warn('[ProfitFlow] Supabase no está configurado. Comprueba VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local y reinicia el servidor.');
    }
    return { ok: false, error: 'Supabase no configurado' };
  }
  const deviceKey = getDeviceKey();
  const config = { ...inputs };
  const { error } = await supabase.from('app_config').upsert(
    { device_key: deviceKey, config },
    { onConflict: 'device_key' }
  );
  if (error) {
    console.error('[ProfitFlow] Error al guardar en Supabase:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export { DEFAULT_INPUTS };
