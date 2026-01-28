
import { AppInputs, CalculationResults } from '../types';

// Standard commercial 'nice' percentages
const NICE_NUMBERS = [0, 2, 3, 5, 7, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70];

export const calculateResults = (inputs: AppInputs): CalculationResults => {
  const {
    precioVentaConIva,
    utilidadActual,
    ivaActual,
    margenUtilidadDeseado,
    descuentoProveedor1,
    descuentoProveedor2,
    tasaBcv,
    tasaBinance,
    colchonBinancePct = 0,
    currency
  } = inputs;

  const tasaReposicionEfectiva = tasaBinance * (1 + colchonBinancePct / 100);

  // 1. Remover IVA del precio actual
  const precioSinIva = precioVentaConIva / (1 + ivaActual / 100);

  // 2. Inferir costo base desde utilidad actual (Costo = Precio / (1 + Utilidad))
  const costoBase = precioSinIva / (1 + utilidadActual / 100);

  // 3. Aplicar descuentos del proveedor (secuenciales)
  const costoNetoReal = costoBase * (1 - descuentoProveedor1 / 100) * (1 - descuentoProveedor2 / 100);

  // 4. Precio objetivo sin IVA (margen objetivo sobre costo neto real)
  const precioObjetivoSinIva = costoNetoReal * (1 + margenUtilidadDeseado / 100);

  // 5. Precio objetivo con IVA (USD)
  const precioObjetivoConIvaUsd = precioObjetivoSinIva * (1 + ivaActual / 100);

  // 6. Factor cambiario (usa tasa reposición con colchón %) y ajuste por modo de pago
  const factorCambiario = tasaReposicionEfectiva / tasaBcv;
  const precioObjetivoConIvaAjustado = currency === 'Bs'
    ? precioObjetivoConIvaUsd * factorCambiario
    : precioObjetivoConIvaUsd;

  // 7. Descuento máximo total vs precio actual para llegar al objetivo exacto
  const descuentoTotalDecimal = 1 - (precioObjetivoConIvaAjustado / precioVentaConIva);
  const isLoss = descuentoTotalDecimal < 0;
  const descuentoUnico = isLoss ? 0 : descuentoTotalDecimal * 100;

  // 8. Búsqueda de pareja de descuentos "bonitos" (redondos)
  // Requisito: D1 mayor que D2. Buscar la combinación que más se acerque al descuentoTotalDecimal.
  let bestD1 = 0;
  let bestD2 = 0;
  let minDiff = Infinity;

  if (!isLoss) {
    for (const d1 of NICE_NUMBERS) {
      for (const d2 of NICE_NUMBERS) {
        if (d2 > d1) continue; // D1 siempre es el mayor
        
        const combined = 1 - (1 - d1 / 100) * (1 - d2 / 100);
        const diff = Math.abs(combined - descuentoTotalDecimal);
        
        // Priorizar D1 >= D2 y cercanía al objetivo
        if (diff < minDiff) {
          minDiff = diff;
          bestD1 = d1;
          bestD2 = d2;
        }
      }
    }
  }

  // 9. Calcular el margen real logrado con los descuentos de números redondos
  const factorDescuentoReal = (1 - bestD1 / 100) * (1 - bestD2 / 100);
  const precioFinalConIvaReal = precioVentaConIva * factorDescuentoReal;
  
  // Revertimos el factor cambiario si estamos en Bs para comparar contra el costo neto real en USD
  const precioVentaSinIvaFinal = (precioFinalConIvaReal / (1 + ivaActual / 100)) / (currency === 'Bs' ? factorCambiario : 1);
  const margenRealLogrado = ((precioVentaSinIvaFinal / costoNetoReal) - 1) * 100;

  return {
    precioSinIva,
    costoBase,
    costoNetoReal,
    precioObjetivoSinIva,
    precioObjetivoConIvaUsd,
    precioObjetivoConIvaAjustado,
    factorCambiario,
    descuentoMaximo: descuentoUnico,
    descuento1: bestD1,
    descuento2: bestD2,
    descuentoUnico,
    isLoss,
    faltantePct: isLoss ? Math.abs(descuentoTotalDecimal * 100) : 0,
    margenRealLogrado
  };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(val);
};

export const formatPercent = (val: number) => {
  return `${val.toFixed(2)}%`;
};
