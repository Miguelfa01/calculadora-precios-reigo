import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Package, Upload, Loader2, FileSpreadsheet, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../types';
import type { CalculationResults } from '../types';
import { getProducts, getProductsPaginated, parseProductsExcel, replaceProductsWithRows, PRODUCTS_PAGE_SIZE } from '../services/productsService';
import { formatCurrency } from '../services/calculatorService';

interface ProductsViewProps {
  results: CalculationResults;
  currency: 'USD' | 'Bs';
  factorCambiario: number;
}

function formatPrice(value: number, currency: 'USD' | 'Bs'): string {
  if (currency === 'Bs') return `${value.toFixed(2)} Bs`;
  return formatCurrency(value);
}

export const ProductsView: React.FC<ProductsViewProps> = ({ results, currency, factorCambiario }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback((searchTerm: string, pageNum: number = 1) => {
    setLoading(true);
    getProductsPaginated({
      search: searchTerm,
      page: pageNum,
      pageSize: PRODUCTS_PAGE_SIZE,
    }).then(({ data: list, total: t }) => {
      setProducts(list);
      setTotal(t);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load(search, page);
  }, [search, page]);

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  /** Descuento aplicado al precio que reciba (usamos P. venta con IVA como base). */
  const discountedPrice = (priceBase: number) =>
    priceBase * (1 - results.descuento1 / 100) * (1 - results.descuento2 / 100);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result;
      if (!buffer || !(buffer instanceof ArrayBuffer)) {
        setImportMessage({ type: 'error', text: 'No se pudo leer el archivo.' });
        setImporting(false);
        return;
      }
      const { rows, skipped } = parseProductsExcel(buffer);
      if (rows.length === 0) {
        setImportMessage({
          type: 'error',
          text: 'No se encontraron filas válidas. Usa Excel con columnas: CÓDIGO, PRODUCTO, TOTAL COSTO, PRECIO DE VENTA, CATEGORIA, LINEA.',
        });
        setImporting(false);
        return;
      }
      replaceProductsWithRows(rows).then((res) => {
        if (res.ok) {
          const msg = skipped > 0
            ? `Importados ${res.count} productos. Omitidas ${skipped} filas (sin código o costo/precio inválidos).`
            : `Importados ${res.count} productos correctamente.`;
          setImportMessage({ type: 'ok', text: msg });
          load(search, 1);
        } else {
          setImportMessage({ type: 'error', text: res.error ?? 'Error al importar' });
        }
        setImporting(false);
      });
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-slate-400 font-black uppercase tracking-[0.25em] text-[10px]">Productos</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {importing ? 'Importando…' : 'Importar Excel'}
          </button>
          {importMessage && (
            <span className={`text-xs font-bold ${importMessage.type === 'ok' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {importMessage.text}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Con desc. = descuento de la calculadora (D1 {results.descuento1}% + D2 {results.descuento2}%) aplicado sobre P. venta con IVA.
        {currency === 'Bs' && ` Mostrado en Bs (× ${factorCambiario.toFixed(4)}).`}
      </p>

      {(total > 0 || search.length > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar por código o nombre..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider"
            >
              Buscar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      ) : products.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 sm:p-16 text-center">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-bold text-slate-600 uppercase tracking-wider text-sm">
            {total === 0 && !search ? 'Sin productos' : 'Sin resultados'}
          </p>
          <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto">
            {total === 0 && !search
              ? 'Exporta el reporte de inventario en Excel (columnas: CÓDIGO, PRODUCTO, TOTAL COSTO, PRECIO DE VENTA, CATEGORIA, LINEA) e impórtalo aquí.'
              : 'Prueba otro término de búsqueda por código o nombre.'}
          </p>
          {total === 0 && !search && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider mx-auto"
            >
              <Upload className="w-4 h-4" /> Importar Excel
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop: table con columnas ajustadas */}
          {/* ANCHOS DE COLUMNA (editar aquí): cada <col> es una columna en orden:
              1=Código, 2=Producto, 3=Categoría, 4=Línea, 5=Costo, 6=P.venta, 7=P.venta con IVA, 8=Con desc.
              Usar w-[XXpx] o style={{ width: 'XX%' }} para dar más/menos espacio. */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed" style={{ minWidth: 880 }}>
                <colgroup>
                  <col className="w-[80px]" />                    {/* 1. Código */}
                  <col style={{ minWidth: 260, width: '32%' }} /> {/* 2. Producto */}
                  <col className="w-[90px]" />                    {/* 3. Categoría */}
                  <col className="w-[65px]" />                    {/* 4. Línea */}
                  <col className="w-[68px]" />                    {/* 5. Costo */}
                  <col className="w-[68px]" />                    {/* 6. P. venta (base) */}
                  <col className="w-[72px]" />                    {/* 7. P. venta con IVA */}
                  <col className="w-[72px]" />                    {/* 8. Con descuento */}
                </colgroup>
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Código</th>
                    <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Producto</th>
                    <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Categoría</th>
                    <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Línea</th>
                    <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Costo</th>
                    <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">P. venta</th>
                    <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">P. venta con IVA</th>
                    <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 text-right">Con desc.</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const priceBaseWithIva = p.sale_price * 1.16;
                    const price = currency === 'Bs' ? discountedPrice(priceBaseWithIva) * factorCambiario : discountedPrice(priceBaseWithIva);
                    const costDisplay = currency === 'Bs' ? p.cost * factorCambiario : p.cost;
                    const saleDisplay = currency === 'Bs' ? p.sale_price * factorCambiario : p.sale_price;
                    const saleIvaDisplay = currency === 'Bs' ? p.sale_price * 1.16 * factorCambiario : p.sale_price * 1.16;
                    return (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="px-3 py-2.5 font-mono text-sm font-bold text-slate-800 truncate" title={p.code}>{p.code}</td>
                        <td className="px-3 py-2.5 text-sm text-slate-700 truncate" title={p.description}>{p.description}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-600 truncate" title={p.category || undefined}>{p.category || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-500 truncate" title={p.line || undefined}>{p.line || '—'}</td>
                        <td className="px-3 py-2.5 text-sm font-mono text-slate-600 text-right whitespace-nowrap">{formatPrice(costDisplay, currency)}</td>
                        <td className="px-3 py-2.5 text-sm font-mono text-slate-600 text-right whitespace-nowrap">{formatPrice(saleDisplay, currency)}</td>
                        <td className="px-3 py-2.5 text-sm font-mono text-slate-600 text-right whitespace-nowrap">{formatPrice(saleIvaDisplay, currency)}</td>
                        <td className="px-3 py-2.5 text-sm font-mono font-bold text-indigo-600 text-right whitespace-nowrap">{formatPrice(price, currency)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Paginación */}
            {total > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                <p className="text-xs text-slate-500 font-medium">
                  Mostrando {(page - 1) * PRODUCTS_PAGE_SIZE + 1}–{Math.min(page * PRODUCTS_PAGE_SIZE, total)} de {total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-3 text-sm font-bold text-slate-700 min-w-[4rem] text-center">
                    {page} / {Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE))}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(total / PRODUCTS_PAGE_SIZE) || loading}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Siguiente"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile: cards con paginación */}
          <div className="md:hidden space-y-3 pb-4">
            {products.map((p) => {
              const priceBaseWithIva = p.sale_price * 1.16;
              const price = currency === 'Bs' ? discountedPrice(priceBaseWithIva) * factorCambiario : discountedPrice(priceBaseWithIva);
              const costDisplay = currency === 'Bs' ? p.cost * factorCambiario : p.cost;
              const saleDisplay = currency === 'Bs' ? p.sale_price * factorCambiario : p.sale_price;
              return (
                <div key={p.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="font-mono font-bold text-slate-800">{p.code}</span>
                    <div className="flex flex-col items-end text-right gap-0.5">
                      <span className="font-mono font-bold text-xs text-slate-800">
                        P. IVA: {formatPrice(currency === 'Bs' ? priceBaseWithIva * factorCambiario : priceBaseWithIva, currency)}
                      </span>
                      <span className="font-mono font-bold text-xs text-indigo-600">
                        Con desc.: {formatPrice(price, currency)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-2 line-clamp-2">{p.description}</p>
                  {(p.category || p.line) && (
                    <p className="text-[10px] text-slate-400 mb-2">
                      {[p.category, p.line].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase tracking-wider text-slate-400">
                    <span>Costo: {formatPrice(costDisplay, currency)}</span>
                    <span>P. venta: {formatPrice(saleDisplay, currency)}</span>
                    <span>P. con IVA: {formatPrice(currency === 'Bs' ? p.sale_price * 1.16 * factorCambiario : p.sale_price * 1.16, currency)}</span>
                  </div>
                </div>
              );
            })}
            {total > PRODUCTS_PAGE_SIZE && (
              <div className="flex items-center justify-between pt-4 pb-8">
                <p className="text-xs text-slate-500">
                  {(page - 1) * PRODUCTS_PAGE_SIZE + 1}–{Math.min(page * PRODUCTS_PAGE_SIZE, total)} de {total}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="p-2 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(total / PRODUCTS_PAGE_SIZE) || loading}
                    className="p-2 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-40"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
};
