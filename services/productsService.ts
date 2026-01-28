import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

function mapRow(row: Record<string, unknown>): Product {
  return {
    id: String(row.id ?? ''),
    code: String(row.code ?? ''),
    description: String(row.description ?? ''),
    cost: Number(row.cost ?? 0),
    sale_price: Number(row.sale_price ?? 0),
    category: String(row.category ?? ''),
    line: String(row.line ?? ''),
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export async function getProducts(): Promise<Product[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('products')
    .select('id, code, description, cost, sale_price, category, line, created_at, updated_at')
    .order('code', { ascending: true });
  if (error) {
    console.error('[ProfitFlow] Error al cargar productos:', error);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** Escapa caracteres comodín para ilike (%, _, \) */
function escapeIlike(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export const PRODUCTS_PAGE_SIZE = 20;

export async function getProductsPaginated(
  options: { search?: string; page?: number; pageSize?: number }
): Promise<{ data: Product[]; total: number }> {
  if (!supabase) return { data: [], total: 0 };
  const { search = '', page = 1, pageSize = PRODUCTS_PAGE_SIZE } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('products')
    .select('id, code, description, cost, sale_price, category, line, created_at, updated_at', { count: 'exact' })
    .order('code', { ascending: true })
    .range(from, to);

  const term = search.trim();
  if (term) {
    const escaped = escapeIlike(term);
    query = query.or(`code.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('[ProfitFlow] Error al cargar productos:', error);
    return { data: [], total: 0 };
  }
  return { data: (data ?? []).map(mapRow), total: count ?? 0 };
}

export interface ProductRow {
  code: string;
  description: string;
  cost: number;
  sale_price: number;
  category: string;
  line: string;
}

/** Normaliza nombre de columna para comparar (sin acentos, mayúsculas, trim, espacios colapsados) */
function normalizeHeader(h: string): string {
  return String(h ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .normalize('NFD')
    .replace(/\u0300/g, '');
}

/** Columnas esperadas del reporte del sistema administrativo */
const EXCEL_COLUMNS = {
  CODE: ['CODIGO', 'CÓDIGO'],
  PRODUCT: ['PRODUCTO'],
  COST: ['COSTO UNI.', 'COSTO UNI', 'TOTAL COSTO', 'TOTALCOSTO'],
  SALE_PRICE: ['PRECIO UNI.', 'PRECIO UNI', 'PRECIO DE VENTA', 'PRECIODEVENTA'],
  CATEGORIA: ['CATEGORIA', 'CATEGORÍA'],
  LINEA: ['LINEA', 'LÍNEA'],
} as const;

function findColumnIndex(headers: string[], possibleNames: readonly string[]): number {
  for (let c = 0; c < headers.length; c++) {
    const n = normalizeHeader(headers[c]);
    if (possibleNames.some((name) => normalizeHeader(name) === n)) return c;
  }
  return -1;
}

/**
 * Convierte valor de celda a número. Acepta:
 * - Número, string "123.45" o "123,45" (coma = decimal).
 * - Formato europeo "1.234,56" (punto miles, coma decimal) → 1234.56.
 * Si no se puede leer, devuelve 0 (no NaN) para no descartar la fila.
 */
function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number' && !Number.isNaN(val)) return val < 0 ? 0 : val;
  let s = String(val).trim().replace(/\s/g, '');
  // Formato europeo: 1.234,56 → quitar puntos de miles, coma a punto
  if (/^\d{1,3}(\.\d{3})*,\d+$/.test(s)) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else {
    s = s.replace(/,/g, '.');
  }
  const n = parseFloat(s);
  if (Number.isNaN(n) || n < 0) return 0;
  return n;
}

/**
 * Parsea un archivo Excel del reporte de inventario.
 * Columnas: CÓDIGO, PRODUCTO, COSTO UNI. (cost), PRECIO UNI. (precio base), CATEGORIA, LINEA.
 * sale_price_with_iva se calcula como sale_price * 1.16. Solo se omiten filas con CÓDIGO vacío.
 */
export function parseProductsExcel(arrayBuffer: ArrayBuffer): { rows: ProductRow[]; skipped: number } {
  const wb = XLSX.read(arrayBuffer, { type: 'array', raw: false });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  if (!firstSheet) return { rows: [], skipped: 0 };

  const data: unknown[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
  if (data.length < 2) return { rows: [], skipped: 0 };

  const headerRow = data[0].map((c) => String(c ?? ''));
  const idxCode = findColumnIndex(headerRow, EXCEL_COLUMNS.CODE);
  const idxProduct = findColumnIndex(headerRow, EXCEL_COLUMNS.PRODUCT);
  const idxCost = findColumnIndex(headerRow, EXCEL_COLUMNS.COST);
  const idxPrice = findColumnIndex(headerRow, EXCEL_COLUMNS.SALE_PRICE);
  const idxCategory = findColumnIndex(headerRow, EXCEL_COLUMNS.CATEGORIA);
  const idxLine = findColumnIndex(headerRow, EXCEL_COLUMNS.LINEA);

  if (idxCode === -1) return { rows: [], skipped: data.length - 1 };

  const rows: ProductRow[] = [];
  let skipped = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i] ?? [];
    const code = String(row[idxCode] ?? '').trim();

    if (!code) {
      skipped++;
      continue;
    }

    const cost = toNumber(row[idxCost]);
    const sale_price = toNumber(row[idxPrice]);

    rows.push({
      code,
      description: idxProduct >= 0 ? String(row[idxProduct] ?? '').trim() : '',
      cost,
      sale_price,
      category: idxCategory >= 0 ? String(row[idxCategory] ?? '').trim() : '',
      line: idxLine >= 0 ? String(row[idxLine] ?? '').trim() : '',
    });
  }

  return { rows, skipped };
}

/**
 * Parsea CSV con o sin encabezados.
 * Acepta columnas: code/codigo, description/descripcion, cost/costo, sale_price/precio/precio_venta
 */
export function parseProductsCSV(csvText: string): ProductRow[] {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const parseRow = (line: string): string[] => {
    const out: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        out.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    out.push(current.trim());
    return out;
  };

  const firstRow = parseRow(lines[0]).map((c) => c.toLowerCase().replace(/\s+/g, '_'));
  const hasHeader =
    firstRow.some((c) => /^(code|codigo)$/.test(c)) ||
    firstRow.some((c) => /^(description|descripcion|desc)$/.test(c)) ||
    firstRow.some((c) => /^(cost|costo)$/.test(c)) ||
    firstRow.some((c) => /^(sale_price|precio|precio_venta|price)$/.test(c));

  const findCol = (regex: RegExp): number => firstRow.findIndex((h) => regex.test(h));

  const idxCode = hasHeader ? findCol(/^(code|codigo)$/) : 0;
  const idxDesc = hasHeader ? findCol(/^(description|descripcion|desc)$/) : 1;
  const idxCost = hasHeader ? findCol(/^(cost|costo)$/) : 2;
  const idxPrice = hasHeader ? findCol(/^(sale_price|precio_venta|precio|price)$/) : 3;

  const start = hasHeader ? 1 : 0;
  const result: ProductRow[] = [];

  for (let i = start; i < lines.length; i++) {
    const cells = parseRow(lines[i]);
    const code = (cells[idxCode] ?? '').replace(/^"|"$/g, '').trim();
    const description = (cells[idxDesc] ?? '').replace(/^"|"$/g, '').trim();
    const cost = parseFloat((cells[idxCost] ?? '0').replace(/,/g, '.')) || 0;
    const sale_price = parseFloat((cells[idxPrice] ?? '0').replace(/,/g, '.')) || 0;
    if (code && cost >= 0 && sale_price >= 0) {
      result.push({ code, description, cost, sale_price, category: '', line: '' });
    }
  }

  return result;
}

/**
 * Reemplaza todos los productos con los del CSV (borra y vuelve a insertar).
 */
export async function replaceProductsWithRows(rows: ProductRow[]): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!supabase) return { ok: false, count: 0, error: 'Supabase no configurado' };

  const { error: deleteError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.error('[ProfitFlow] Error al borrar productos:', deleteError);
    return { ok: false, count: 0, error: deleteError.message };
  }

  if (rows.length === 0) return { ok: true, count: 0 };

  const chunkSize = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize).map((r) => ({
      code: r.code,
      description: r.description,
      cost: r.cost,
      sale_price: r.sale_price,
      category: r.category ?? '',
      line: r.line ?? '',
    }));
    const { error: insertError } = await supabase.from('products').insert(chunk);
    if (insertError) {
      console.error('[ProfitFlow] Error al insertar productos:', insertError);
      return { ok: false, count: inserted, error: insertError.message };
    }
    inserted += chunk.length;
  }

  return { ok: true, count: inserted };
}
