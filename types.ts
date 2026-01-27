
export interface AppInputs {
  precioVentaConIva: number;
  utilidadActual: number;
  ivaActual: number;
  margenUtilidadDeseado: number;
  tasaBcv: number;
  tasaBinance: number;
  descuentoProveedor1: number;
  descuentoProveedor2: number;
  descuentoSugerido1: number;
  currency: 'USD' | 'Bs';
}

export interface CalculationResults {
  precioSinIva: number;
  costoBase: number;
  costoNetoReal: number;
  precioObjetivoSinIva: number;
  precioObjetivoConIvaUsd: number;
  precioObjetivoConIvaAjustado: number;
  factorCambiario: number;
  descuentoMaximo: number;
  descuento1: number;
  descuento2: number;
  descuentoUnico: number;
  isLoss: boolean;
  faltantePct: number;
  margenRealLogrado: number; // The margin achieved after rounding discounts
}
