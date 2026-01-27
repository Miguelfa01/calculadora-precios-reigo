
import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Tag, 
  ArrowRight,
  Info,
  AlertTriangle,
  Receipt,
  Settings,
  X,
  DollarSign,
  Briefcase,
  TrendingUp,
  Banknote,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { AppInputs } from './types';
import { calculateResults, formatCurrency, formatPercent } from './services/calculatorService';

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [inputs, setInputs] = useState<AppInputs>({
    precioVentaConIva: 100,
    utilidadActual: 90,
    ivaActual: 16,
    margenUtilidadDeseado: 30,
    tasaBcv: 47.11,
    tasaBinance: 53.50,
    descuentoProveedor1: 35,
    descuentoProveedor2: 10,
    descuentoSugerido1: 0,
    currency: 'USD'
  });

  const results = useMemo(() => calculateResults(inputs), [inputs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const precioFinalCalculado = inputs.precioVentaConIva * (1 - results.descuento1/100) * (1 - results.descuento2/100);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Calculator size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">ProfitFlow <span className="text-indigo-600 font-medium tracking-tight">Analytics</span></h1>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="hidden md:flex gap-6">
              <div className="text-right border-r border-slate-100 pr-6">
                <span className="block text-[10px] uppercase font-black text-slate-400 leading-none mb-1 tracking-widest text-nowrap">Tasa BCV</span>
                <span className="font-mono text-sm font-bold text-slate-700">{inputs.tasaBcv.toFixed(2)} Bs</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] uppercase font-black text-slate-400 leading-none mb-1 tracking-widest text-nowrap">Tasa Reposición</span>
                <span className="font-mono text-sm font-bold text-slate-700">{inputs.tasaBinance.toFixed(2)} Bs</span>
              </div>
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all font-bold text-xs uppercase tracking-wider border border-slate-200"
            >
              <Settings size={16} />
              Configurar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10 space-y-10">
        
        {/* Panel Principal: Entrada y Estrategia Big Card */}
        <section className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-xl border border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            <div className="flex flex-col justify-center space-y-8 lg:pr-6">
              <h2 className="text-slate-400 font-black uppercase tracking-[0.25em] text-[10px] mb-2">Entrada de Operación</h2>
              
              <div className="space-y-8">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-3 block uppercase tracking-widest">Escenario de Pago</label>
                  <div className="flex p-1 bg-slate-100 rounded-2xl w-full sm:w-fit border border-slate-200/50">
                    <button 
                      onClick={() => setInputs(p => ({...p, currency: 'USD'}))}
                      className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${inputs.currency === 'USD' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <DollarSign size={18} /> Divisas
                    </button>
                    <button 
                      onClick={() => setInputs(p => ({...p, currency: 'Bs'}))}
                      className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${inputs.currency === 'Bs' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Banknote size={18} /> Bolívares
                    </button>
                  </div>
                </div>

                <div className="max-w-md">
                  <label className="text-xs font-bold text-slate-500 mb-3 block uppercase tracking-widest">Precio Venta (Actual)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                      <DollarSign size={32} />
                    </div>
                    <input 
                      type="number" 
                      name="precioVentaConIva"
                      value={inputs.precioVentaConIva}
                      onChange={handleInputChange}
                      className="block w-full pl-14 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-5xl font-black text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gran Tarjeta de Estrategia */}
            <div className={`rounded-[2.5rem] p-10 border-2 transition-all relative overflow-hidden flex flex-col justify-center min-h-[400px] ${results.isLoss ? 'bg-rose-50 border-rose-100 text-rose-900 shadow-rose-50' : 'bg-indigo-900 text-white border-indigo-800 shadow-2xl shadow-indigo-200'}`}>
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${results.isLoss ? 'bg-rose-500 text-white' : 'bg-white/10 text-indigo-300'}`}>
                      <Tag size={20} />
                    </div>
                    <h3 className="font-black text-[10px] uppercase tracking-[0.25em]">Estrategia Sugerida</h3>
                  </div>
                  {!results.isLoss && (
                     <div className="flex items-center gap-2 text-indigo-300 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                       <CheckCircle2 size={14} className="text-emerald-400" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Optimización Redonda</span>
                     </div>
                  )}
                </div>

                {!results.isLoss ? (
                  <div className="space-y-10">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">D1 (Mayor)</p>
                        <div className="text-5xl lg:text-6xl font-black tracking-tighter">{results.descuento1}%</div>
                      </div>
                      <div className="text-indigo-600/50 flex-shrink-0">
                        <ArrowRight size={36} strokeWidth={3} />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">D2 (Menor)</p>
                        <div className="text-5xl lg:text-6xl font-black tracking-tighter">{results.descuento2}%</div>
                      </div>
                    </div>
                    
                    <div className="pt-8 border-t border-white/10 space-y-4 text-center">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Precio Final Sugerido (USD)</p>
                        <div className="text-6xl lg:text-7xl font-black text-white tracking-tighter">
                          {formatCurrency(precioFinalCalculado)}
                        </div>
                        <div className="flex justify-center items-center gap-3 bg-white/5 py-2.5 px-5 rounded-2xl w-fit mx-auto border border-white/5 mt-4">
                           <div className={`h-2 w-2 rounded-full ${results.margenRealLogrado >= inputs.margenUtilidadDeseado ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-400'}`} />
                           <p className="text-[10px] font-black uppercase tracking-widest">
                             Margen Logrado: <span className={results.margenRealLogrado >= inputs.margenUtilidadDeseado ? 'text-emerald-400' : 'text-amber-400'}>{formatPercent(results.margenRealLogrado)}</span>
                           </p>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                    <div className="p-8 bg-rose-200/50 rounded-full">
                      <AlertTriangle size={48} className="text-rose-600" />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-2xl font-black uppercase tracking-tight">Margen Insuficiente</h4>
                      <p className="text-sm font-medium opacity-80 max-w-[280px] mx-auto leading-relaxed">
                        El precio de venta no permite descuentos bajo el margen objetivo del <span className="font-bold">{inputs.margenUtilidadDeseado}%</span>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {!results.isLoss && <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-white/5 rounded-full blur-[100px] pointer-events-none" />}
            </div>
          </div>
        </section>

        {/* Fila de 3 Cuadros de Detalle */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-indigo-100 transition-colors group">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Costo Neto Real</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {formatCurrency(results.costoNetoReal)}
              </h3>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 bg-slate-50 py-2 px-3.5 rounded-xl border border-slate-100 w-fit">
              <Info size={14} className="text-indigo-400" /> <span>Costo Adquisición</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-emerald-100 transition-colors group">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Precio Objetivo (USD)</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {formatCurrency(results.precioObjetivoConIvaUsd)}
              </h3>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 py-2 px-3.5 rounded-xl border border-emerald-100 w-fit">
              <TrendingUp size={14} /> <span>Meta {inputs.margenUtilidadDeseado}%</span>
            </div>
          </div>

          <div className={`bg-white p-8 rounded-[2rem] shadow-sm border transition-all flex flex-col justify-between ${results.isLoss ? 'border-rose-100 bg-rose-50/30' : 'border-slate-100 hover:border-amber-100'}`}>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">D. Facturación Único</p>
              <h3 className={`text-3xl font-black tracking-tight ${results.isLoss ? 'text-rose-600' : 'text-slate-800'}`}>
                {results.isLoss ? '0.00%' : formatPercent(results.descuentoUnico)}
              </h3>
            </div>
            <div className={`mt-6 flex items-center gap-2 text-[10px] font-black uppercase py-2 px-3.5 rounded-xl border w-fit ${results.isLoss ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
               {results.isLoss ? <AlertTriangle size={14} /> : <Receipt size={14} className="text-amber-500" />}
               <span>Valor Sistema</span>
            </div>
          </div>
        </section>

        {/* Fila Inferior: Desglose y Resumen Operativo */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Detalles de Cálculo */}
          <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-center">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-l-4 border-indigo-500 pl-4 mb-2">Parámetros Base</h4>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center group">
                       <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider group-hover:text-indigo-500 transition-colors">Costo Base Inferido</span>
                       <span className="font-mono font-bold text-slate-700 text-sm">{formatCurrency(results.costoBase)}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                       <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider group-hover:text-indigo-500 transition-colors">Precio Sin IVA Actual</span>
                       <span className="font-mono font-bold text-slate-700 text-sm">{formatCurrency(results.precioSinIva)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-l-4 border-emerald-500 pl-4 mb-2">Rentabilidad Est.</h4>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center group">
                       <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider group-hover:text-emerald-500 transition-colors">Utilidad Neta</span>
                       <span className="font-mono font-black text-emerald-600">+{formatCurrency((results.margenRealLogrado/100) * results.costoNetoReal)}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                       <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider group-hover:text-emerald-500 transition-colors">Meta de Empresa</span>
                       <span className="font-mono font-bold text-slate-700 text-sm">{inputs.margenUtilidadDeseado}%</span>
                    </div>
                  </div>
                </div>
             </div>
          </div>

          {/* Panel Lateral: Resumen Operativo */}
          <div className="lg:col-span-4 bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-center relative overflow-hidden group min-h-[240px]">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                  <Briefcase size={18} />
                </div>
                <h3 className="font-black text-base uppercase tracking-tight">Escenario Local</h3>
              </div>

              <div className="space-y-4">
                {inputs.currency === 'Bs' && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2 text-indigo-400">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest">Ajuste de Tasa</span>
                      </div>
                      <span className="font-mono font-black text-xs">x{results.factorCambiario.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Objetivo en Bs (Ref)</span>
                      <span className="font-mono font-bold text-xs text-emerald-100">{results.precioObjetivoConIvaAjustado.toFixed(2)} Bs</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Margen Real</span>
                      <span className={`text-sm font-black ${results.margenRealLogrado >= inputs.margenUtilidadDeseado ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {formatPercent(results.margenRealLogrado)}
                      </span>
                   </div>
                   <div className="text-right">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Retorno Est.</span>
                      <div className="font-mono font-black text-sm text-white">
                        {formatCurrency((results.margenRealLogrado/100) * results.costoNetoReal)}
                      </div>
                   </div>
                </div>
              </div>

              <div className="text-center">
                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] opacity-50">ProfitFlow v2.8 Final</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          </div>

        </section>
      </main>

      {/* Modal de Configuración Maestros */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
            <div className="p-10 lg:p-12 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-white rounded-xl shadow-sm text-slate-500 border border-slate-100">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-800 tracking-tight uppercase">Parámetros</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] mt-1">Costos e Impuestos</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-3 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 lg:p-10 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Tasas de Cambio */}
              <section className="space-y-6">
                <div className="flex items-center gap-2">
                  <Banknote size={16} className="text-indigo-500" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Tipo de Cambio</h4>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BCV Oficial (Bs/$)</label>
                    <input 
                      type="number" 
                      name="tasaBcv"
                      step="0.01"
                      value={inputs.tasaBcv}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-mono text-lg font-black transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Binance / Reposición</label>
                    <input 
                      type="number" 
                      name="tasaBinance"
                      step="0.01"
                      value={inputs.tasaBinance}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-mono text-lg font-black transition-all shadow-inner"
                    />
                  </div>
                </div>
              </section>

              {/* Fiscal & Utilidad */}
              <section className="space-y-6">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-500" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Márgenes</h4>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IVA (%)</label>
                    <input 
                      type="number" 
                      name="ivaActual"
                      value={inputs.ivaActual}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-lg text-center"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Utilidad Origen (%)</label>
                    <input 
                      type="number" 
                      name="utilidadActual"
                      value={inputs.utilidadActual}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-lg text-center"
                    />
                  </div>
                </div>
                <div className="mt-6 p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 shadow-sm">
                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4 block text-center">Margen Objetivo Deseado (%)</label>
                  <input 
                    type="number" 
                    name="margenUtilidadDeseado"
                    value={inputs.margenUtilidadDeseado}
                    onChange={handleInputChange}
                    className="w-full px-8 py-5 bg-white border-2 border-indigo-200 rounded-2xl focus:ring-8 focus:ring-indigo-500/5 outline-none font-black text-indigo-600 text-3xl shadow-sm transition-all text-center"
                  />
                </div>
              </section>

              {/* Proveedores */}
              <section className="space-y-6">
                <div className="flex items-center gap-2">
                   <Briefcase size={16} className="text-indigo-500" />
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Costos</h4>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descuento Prov. 1 (%)</label>
                    <input 
                      type="number" 
                      name="descuentoProveedor1"
                      value={inputs.descuentoProveedor1}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-lg shadow-inner text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descuento Prov. 2 (%)</label>
                    <input 
                      type="number" 
                      name="descuentoProveedor2"
                      value={inputs.descuentoProveedor2}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-lg shadow-inner text-center"
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setShowSettings(false)}
                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl transition-all shadow-xl shadow-indigo-200 hover:shadow-indigo-300"
              >
                Actualizar Motor
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto px-6 mt-16 text-center">
        <div className="p-10 bg-white/40 rounded-[3rem] border border-slate-200/50 backdrop-blur-2xl">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">ProfitFlow v2.8 • Optimized Financial Engine</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
