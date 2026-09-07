import React, { useState, useEffect } from 'react';
import { 
  Wrench, Car, Users, ClipboardList, Package, Plus, Search, 
  CheckCircle, Clock, AlertTriangle, FileText, Trash2, Edit, ChevronRight, BarChart2, Sparkles, Bot, Loader2, Save, X
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estados de datos principales
  const [clientes, setClientes] = useState([
    { id: 1, nombre: 'Carlos Mendoza', telefono: '555-0192', email: 'carlos@mail.com' },
    { id: 2, nombre: 'Ana Gómez', telefono: '555-4321', email: 'ana@mail.com' }
  ]);

  const [vehiculos, setVehiculos] = useState([
    { id: 1, clienteId: 1, placa: 'ABC-123', marca: 'Toyota', modelo: 'Corolla', anio: 2020, kilometraje: 45000 },
    { id: 2, clienteId: 2, placa: 'XYZ-789', marca: 'Honda', modelo: 'Civic', anio: 2018, kilometraje: 72000 }
  ]);

  const [inventario, setInventario] = useState([
    { id: 1, nombre: 'Aceite Sintético 5W30', stock: 15, precio: 25.00 },
    { id: 2, nombre: 'Filtro de Aceite', stock: 8, precio: 12.50 },
    { id: 3, nombre: 'Pastillas de Freno (Delanteras)', stock: 5, precio: 45.00 },
    { id: 4, nombre: 'Bujía de Iridio', stock: 20, precio: 15.00 }
  ]);

  const [ordenes, setOrdenes] = useState([
    {
      id: 1,
      vehiculoId: 1,
      mecanico: 'Juan Pérez',
      diagnostico: 'Mantenimiento preventivo de 45,000 km y cambio de pastillas.',
      estado: 'En Proceso',
      fechaIngreso: '2026-06-05',
      items: [
        { tipo: 'Repuesto', descripcion: 'Aceite Sintético 5W30', cantidad: 4, precio: 25.00 },
        { tipo: 'Mano de Obra', descripcion: 'Cambio de aceite y frenos', cantidad: 1, precio: 50.00 }
      ]
    }
  ]);

  // Búsqueda en órdenes de trabajo
  const [busquedaOrden, setBusquedaOrden] = useState('');

  // Modales y formularios
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [showModalVehiculo, setShowModalVehiculo] = useState(false);
  const [showModalOrden, setShowModalOrden] = useState(false);
  const [showModalInventario, setShowModalInventario] = useState(false);

  // Edición de inventario en línea
  const [editandoItemInvId, setEditandoItemInvId] = useState(null);
  const [tempStock, setTempStock] = useState(0);
  const [tempPrecio, setTempPrecio] = useState(0);

  // Formulario nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', email: '' });
  // Formulario nuevo vehículo
  const [nuevoVehiculo, setNuevoVehiculo] = useState({ clienteId: '', placa: '', marca: '', modelo: '', anio: '', kilometraje: '' });
  // Formulario nuevo inventario
  const [nuevoItemInv, setNuevoItemInv] = useState({ nombre: '', stock: '', precio: '' });
  // Formulario nueva orden
  const [nuevaOrden, setNuevaOrden] = useState({ vehiculoId: '', mecanico: '', diagnostico: '' });
  const [itemsOrden, setItemsOrden] = useState([]);
  const [itemSeleccionadoInv, setItemSeleccionadoInv] = useState('');
  const [cantidadItemInv, setCantidadItemInv] = useState(1);

  // Estados para características Gemini API
  const [sintomaSugerencia, setSintomaSugerencia] = useState('');
  const [cargandoIA, setCargandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState(null);

  // API Key Gemini
  const apiKey = "";

  // Función de llamada a Gemini API con reintentos exponenciales
  const llamarGeminiAPI = async (promptTexto) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: promptTexto }] }],
      systemInstruction: { parts: [{ text: "Eres un asistente experto en mecánica automotriz, diagnóstico vehicular y gestión de talleres. Responde siempre de forma clara, profesional y en español." }] }
    };

    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let intento = 0; intento < 5; intento++) {
      try {
        const respuesta = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        const data = await respuesta.json();
        const texto = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (texto) return texto;
        throw new Error('Respuesta vacía de la IA');
      } catch (error) {
        if (intento === 4) throw error;
        await new Promise(resolve => setTimeout(resolve, delays[intento]));
      }
    }
  };

  // Funciones de IA
  const generarDiagnosticoInteligente = async () => {
    if (!sintomaSugerencia.trim()) return;
    setCargandoIA(true);
    setResultadoIA(null);
    try {
      const prompt = `Un cliente reporta los siguientes síntomas en su vehículo: "${sintomaSugerencia}". Genera un diagnóstico preliminar técnico, posibles causas raíz y los repuestos recomendados para solucionar este problema.`;
      const respuesta = await llamarGeminiAPI(prompt);
      setResultadoIA(respuesta);
    } catch (e) {
      setResultadoIA("No se pudo conectar con el servicio de IA. Intente nuevamente.");
    } finally {
      setCargandoIA(false);
    }
  };

  // Funciones CRUD auxiliares
  const agregarCliente = (e) => {
    e.preventDefault();
    if (!nuevoCliente.nombre) return;
    setClientes([...clientes, { id: Date.now(), ...nuevoCliente }]);
    setNuevoCliente({ nombre: '', telefono: '', email: '' });
    setShowModalCliente(false);
  };

  const agregarVehiculo = (e) => {
    e.preventDefault();
    if (!nuevoVehiculo.placa || !nuevoVehiculo.clienteId) return;
    setVehiculos([...vehiculos, { id: Date.now(), ...nuevoVehiculo, anio: Number(nuevoVehiculo.anio), kilometraje: Number(nuevoVehiculo.kilometraje) }]);
    setNuevoVehiculo({ clienteId: '', placa: '', marca: '', modelo: '', anio: '', kilometraje: '' });
    setShowModalVehiculo(false);
  };

  const agregarInventarioItem = (e) => {
    e.preventDefault();
    if (!nuevoItemInv.nombre) return;
    setInventario([...inventario, { id: Date.now(), nombre: nuevoItemInv.nombre, stock: Number(nuevoItemInv.stock), precio: Number(nuevoItemInv.precio) }]);
    setNuevoItemInv({ nombre: '', stock: '', precio: '' });
    setShowModalInventario(false);
  };

  const iniciarEdicionInventario = (item) => {
    setEditandoItemInvId(item.id);
    setTempStock(item.stock);
    setTempPrecio(item.precio);
  };

  const guardarEdicionInventario = (id) => {
    setInventario(inventario.map(item => item.id === id ? { ...item, stock: Number(tempStock), precio: Number(tempPrecio) } : item));
    setEditandoItemInvId(null);
  };

  const agregarItemAOrden = () => {
    const item = inventario.find(i => i.id === Number(itemSeleccionadoInv));
    if (!item) return;
    setItemsOrden([...itemsOrden, { tipo: 'Repuesto', descripcion: item.nombre, cantidad: Number(cantidadItemInv), precio: item.precio }]);
    setItemSeleccionadoInv('');
    setCantidadItemInv(1);
  };

  const crearOrdenTrabajo = (e) => {
    e.preventDefault();
    if (!nuevaOrden.vehiculoId || !nuevaOrden.mecanico) return;
    const nueva = {
      id: Date.now(),
      vehiculoId: Number(nuevaOrden.vehiculoId),
      mecanico: nuevaOrden.mecanico,
      diagnostico: nuevaOrden.diagnostico,
      estado: 'Recepción',
      fechaIngreso: new Date().toISOString().split('T')[0],
      items: itemsOrden.length > 0 ? itemsOrden : [{ tipo: 'Mano de Obra', descripcion: 'Diagnóstico general', cantidad: 1, precio: 30.00 }]
    };
    setOrdenes([nueva, ...ordenes]);
    setNuevaOrden({ vehiculoId: '', mecanico: '', diagnostico: '' });
    setItemsOrden([]);
    setShowModalOrden(false);
  };

  const cambiarEstadoOrden = (id, nuevoEstado) => {
    setOrdenes(ordenes.map(o => o.id === id ? { ...o, estado: nuevoEstado } : o));
  };

  const calcularTotalOrden = (items) => {
    return items.reduce((acc, curr) => acc + (curr.cantidad * curr.precio), 0).toFixed(2);
  };

  // Filtrado de órdenes
  const ordenesFiltradas = ordenes.filter(o => {
    const veh = vehiculos.find(v => v.id === o.vehiculoId);
    const texto = busquedaOrden.toLowerCase();
    return (
      String(o.id).includes(texto) ||
      o.mecanico.toLowerCase().includes(texto) ||
      o.diagnostico.toLowerCase().includes(texto) ||
      (veh && (veh.placa.toLowerCase().includes(texto) || veh.marca.toLowerCase().includes(texto) || veh.modelo.toLowerCase().includes(texto)))
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Barra de navegación superior */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 p-2 rounded-lg text-slate-950 font-bold">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Servicios de mecánica automotriz JASIF</h1>
            <p className="text-xs text-slate-400">Sistema Integral con Asistente IA Gemini</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm bg-slate-700 px-3 py-1 rounded-full text-amber-400 font-medium">Taller Central v2.0</span>
        </div>
      </header>

      {/* Contenedor principal con pestañas */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar de Navegación */}
        <aside className="w-full md:w-64 bg-slate-800 border-r border-slate-700 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' : 'text-slate-300 hover:bg-slate-700/60'}`}
          >
            <BarChart2 className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('ordenes')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === 'ordenes' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' : 'text-slate-300 hover:bg-slate-700/60'}`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Órdenes de Trabajo</span>
          </button>
          <button 
            onClick={() => setActiveTab('asistente')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === 'asistente' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' : 'text-slate-300 hover:bg-slate-700/60'}`}
          >
            <Bot className="w-5 h-5" />
            <span>Diagnóstico IA ✨</span>
          </button>
          <button 
            onClick={() => setActiveTab('vehiculos')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === 'vehiculos' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' : 'text-slate-300 hover:bg-slate-700/60'}`}
          >
            <Car className="w-5 h-5" />
            <span>Vehículos</span>
          </button>
          <button 
            onClick={() => setActiveTab('clientes')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === 'clientes' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' : 'text-slate-300 hover:bg-slate-700/60'}`}
          >
            <Users className="w-5 h-5" />
            <span>Clientes</span>
          </button>
          <button 
            onClick={() => setActiveTab('inventario')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === 'inventario' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' : 'text-slate-300 hover:bg-slate-700/60'}`}
          >
            <Package className="w-5 h-5" />
            <span>Inventario / Repuestos</span>
          </button>
        </aside>

        {/* Contenido Dinámico */}
        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Resumen General del Taller</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex items-center space-x-4">
                  <div className="p-4 bg-blue-500/10 text-blue-400 rounded-xl"><ClipboardList className="w-8 h-8"/></div>
                  <div>
                    <p className="text-slate-400 text-sm">Órdenes Activas</p>
                    <h3 className="text-2xl font-bold text-white">{ordenes.filter(o => o.estado !== 'Finalizado').length}</h3>
                  </div>
                </div>
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex items-center space-x-4">
                  <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-xl"><Car className="w-8 h-8"/></div>
                  <div>
                    <p className="text-slate-400 text-sm">Vehículos Registrados</p>
                    <h3 className="text-2xl font-bold text-white">{vehiculos.length}</h3>
                  </div>
                </div>
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex items-center space-x-4">
                  <div className="p-4 bg-amber-500/10 text-amber-400 rounded-xl"><Users className="w-8 h-8"/></div>
                  <div>
                    <p className="text-slate-400 text-sm">Clientes Totales</p>
                    <h3 className="text-2xl font-bold text-white">{clientes.length}</h3>
                  </div>
                </div>
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex items-center space-x-4">
                  <div className="p-4 bg-purple-500/10 text-purple-400 rounded-xl"><Package className="w-8 h-8"/></div>
                  <div>
                    <p className="text-slate-400 text-sm">Ítems en Stock</p>
                    <h3 className="text-2xl font-bold text-white">{inventario.reduce((acc, curr) => acc + curr.stock, 0)}</h3>
                  </div>
                </div>
              </div>

              {/* Órdenes recientes */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Últimas Órdenes de Trabajo</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-700/50 text-slate-400 uppercase text-xs">
                      <tr>
                        <th className="p-3"># OT</th>
                        <th className="p-3">Vehículo (Placa)</th>
                        <th className="p-3">Mecánico</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {ordenes.map(o => {
                        const veh = vehiculos.find(v => v.id === o.vehiculoId);
                        return (
                          <tr key={o.id} className="hover:bg-slate-700/30">
                            <td className="p-3 font-semibold text-white">#{o.id}</td>
                            <td className="p-3">{veh ? `${veh.marca} ${veh.modelo} (${veh.placa})` : 'Desconocido'}</td>
                            <td className="p-3">{o.mecanico}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                o.estado === 'Recepción' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                o.estado === 'En Proceso' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {o.estado}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-white">${calcularTotalOrden(o.items)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ASISTENTE DIAGNÓSTICO IA */}
          {activeTab === 'asistente' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <span>Asistente de Diagnóstico Automotriz</span>
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </h2>
                <p className="text-sm text-slate-400">Describe los síntomas del vehículo para recibir un análisis técnico y sugerencias automáticas potenciadas por Gemini.</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-2 block font-medium">Síntomas reportados o ruidos extraños:</label>
                  <textarea 
                    rows="3"
                    value={sintomaSugerencia}
                    onChange={(e) => setSintomaSugerencia(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Ej. El motor vibra al acelerar en segunda marcha y se enciende la luz de check engine..."
                  ></textarea>
                </div>
                <button 
                  onClick={generarDiagnosticoInteligente}
                  disabled={cargandoIA || !sintomaSugerencia.trim()}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-3 rounded-xl flex items-center space-x-2 transition shadow-lg shadow-amber-500/20"
                >
                  {cargandoIA ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
                  <span>{cargandoIA ? 'Analizando síntomas...' : '✨ Analizar Diagnóstico con IA'}</span>
                </button>
              </div>

              {resultadoIA && (
                <div className="bg-slate-800 border border-amber-500/30 rounded-2xl p-6 space-y-3 shadow-xl">
                  <h3 className="text-lg font-bold text-amber-400 flex items-center space-x-2">
                    <Bot className="w-5 h-5"/>
                    <span>Resultado del Diagnóstico Inteligente</span>
                  </h3>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {resultadoIA}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: ORDENES DE TRABAJO */}
          {activeTab === 'ordenes' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Órdenes de Trabajo</h2>
                  <p className="text-sm text-slate-400">Control de estado, diagnósticos y asignación de repuestos</p>
                </div>
                <button 
                  onClick={() => setShowModalOrden(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-5 h-5"/>
                  <span>Nueva Orden</span>
                </button>
              </div>

              {/* Barra de búsqueda de historial de órdenes */}
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input 
                  type="text" 
                  value={busquedaOrden}
                  onChange={(e) => setBusquedaOrden(e.target.value)}
                  placeholder="Buscar por # OT, placa, mecánico o diagnóstico..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {ordenesFiltradas.length > 0 ? (
                  ordenesFiltradas.map(o => {
                    const veh = vehiculos.find(v => v.id === o.vehiculoId);
                    const cli = clientes.find(c => c.id === veh?.clienteId);
                    return (
                      <div key={o.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-amber-400 font-mono font-bold text-lg">#OT-{o.id}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              o.estado === 'Recepción' ? 'bg-blue-500/10 text-blue-400' :
                              o.estado === 'En Proceso' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {o.estado}
                            </span>
                            <span className="text-xs text-slate-400">Ingreso: {o.fechaIngreso}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium text-base">
                              {veh ? `${veh.marca} ${veh.modelo} - Placa: ${veh.placa}` : 'Vehículo no encontrado'} 
                              <span className="text-slate-400 text-sm ml-2">({cli ? cli.nombre : 'Cliente sin asignar'})</span>
                            </p>
                            <p className="text-slate-300 text-sm mt-1"><strong className="text-slate-400">Diagnóstico:</strong> {o.diagnostico}</p>
                            <p className="text-slate-400 text-xs mt-1">Mecánico asignado: <strong className="text-white">{o.mecanico}</strong></p>
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end space-y-3 w-full md:w-auto">
                          <div className="text-right">
                            <span className="text-xs text-slate-400">Total Estimado</span>
                            <p className="text-xl font-bold text-white">${calcularTotalOrden(o.items)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select 
                              value={o.estado} 
                              onChange={(e) => cambiarEstadoOrden(o.id, e.target.value)}
                              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="Recepción">Recepción</option>
                              <option value="En Proceso">En Proceso</option>
                              <option value="Finalizado">Finalizado</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-500 bg-slate-800/40 rounded-2xl border border-slate-800">
                    No se encontraron órdenes de trabajo que coincidan con la búsqueda.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: VEHICULOS */}
          {activeTab === 'vehiculos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Catálogo de Vehículos</h2>
                  <p className="text-sm text-slate-400">Administra los automóviles registrados en el taller</p>
                </div>
                <button 
                  onClick={() => setShowModalVehiculo(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-5 h-5"/>
                  <span>Nuevo Vehículo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehiculos.map(v => {
                  const cliente = clientes.find(c => c.id === Number(v.clienteId));
                  return (
                    <div key={v.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="bg-slate-700 text-amber-400 font-mono font-bold px-3 py-1 rounded-lg text-sm">
                          {v.placa}
                        </div>
                        <span className="text-xs text-slate-400">Año {v.anio}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{v.marca} {v.modelo}</h3>
                        <p className="text-sm text-slate-400">Propietario: <span className="text-slate-200 font-medium">{cliente ? cliente.nombre : 'No asignado'}</span></p>
                      </div>
                      <div className="pt-2 border-t border-slate-700 flex justify-between text-xs text-slate-400">
                        <span>Kilometraje:</span>
                        <span className="text-white font-medium">{v.kilometraje?.toLocaleString()} km</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: CLIENTES */}
          {activeTab === 'clientes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Base de Clientes</h2>
                  <p className="text-sm text-slate-400">Información de contacto de los propietarios</p>
                </div>
                <button 
                  onClick={() => setShowModalCliente(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-5 h-5"/>
                  <span>Nuevo Cliente</span>
                </button>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-700/50 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-4">Nombre Completo</th>
                      <th className="p-4">Teléfono</th>
                      <th className="p-4">Correo Electrónico</th>
                      <th className="p-4">Vehículos Asociados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {clientes.map(c => {
                      const vehsCli = vehiculos.filter(v => Number(v.clienteId) === c.id);
                      return (
                        <tr key={c.id} className="hover:bg-slate-700/30">
                          <td className="p-4 font-semibold text-white">{c.nombre}</td>
                          <td className="p-4">{c.telefono}</td>
                          <td className="p-4">{c.email}</td>
                          <td className="p-4">
                            {vehsCli.length > 0 ? vehsCli.map(v => `${v.marca} ${v.modelo} (${v.placa})`).join(', ') : <span className="text-slate-500 italic">Sin vehículos</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: INVENTARIO */}
          {activeTab === 'inventario' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Inventario y Repuestos</h2>
                  <p className="text-sm text-slate-400">Control de stock de piezas y suministros de taller</p>
                </div>
                <button 
                  onClick={() => setShowModalInventario(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-5 h-5"/>
                  <span>Nuevo Repuesto</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {inventario.map(item => (
                  <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        {editandoItemInvId === item.id ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-slate-400">Stock:</span>
                            <input 
                              type="number" 
                              value={tempStock} 
                              onChange={(e) => setTempStock(e.target.value)}
                              className="w-16 bg-slate-900 border border-amber-500 text-white rounded px-2 py-0.5 text-xs font-semibold"
                            />
                          </div>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.stock <= 5 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                            Stock: {item.stock} un.
                          </span>
                        )}

                        {editandoItemInvId === item.id ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-slate-400">$</span>
                            <input 
                              type="number" 
                              step="0.01"
                              value={tempPrecio} 
                              onChange={(e) => setTempPrecio(e.target.value)}
                              className="w-20 bg-slate-900 border border-amber-500 text-white rounded px-2 py-0.5 text-xs font-bold"
                            />
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-white">${item.precio.toFixed(2)}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-white text-base">{item.nombre}</h3>
                    </div>

                    <div className="pt-2 border-t border-slate-700 flex justify-end space-x-2">
                      {editandoItemInvId === item.id ? (
                        <>
                          <button 
                            onClick={() => setEditandoItemInvId(null)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-lg text-xs flex items-center space-x-1 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancelar</span>
                          </button>
                          <button 
                            onClick={() => guardarEdicionInventario(item.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-2 rounded-lg text-xs flex items-center space-x-1 transition shadow"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Guardar</span>
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => iniciarEdicionInventario(item)}
                          className="bg-slate-700 hover:bg-slate-600 text-amber-400 font-medium px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Modificar Stock / Precio</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL NUEVO CLIENTE */}
      {showModalCliente && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Registrar Nuevo Cliente</h3>
            <form onSubmit={agregarCliente} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nombre Completo</label>
                <input 
                  type="text" 
                  required 
                  value={nuevoCliente.nombre} 
                  onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Teléfono</label>
                <input 
                  type="text" 
                  value={nuevoCliente.telefono} 
                  onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="Ej. 555-1234"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={nuevoCliente.email} 
                  onChange={(e) => setNuevoCliente({...nuevoCliente, email: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="Ej. juan@mail.com"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModalCliente(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-700 text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO VEHICULO */}
      {showModalVehiculo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Registrar Nuevo Vehículo</h3>
            <form onSubmit={agregarVehiculo} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Propietario</label>
                <select 
                  required
                  value={nuevoVehiculo.clienteId}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, clienteId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Seleccione un cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Placa</label>
                  <input 
                    type="text" 
                    required 
                    value={nuevoVehiculo.placa} 
                    onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, placa: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-500" 
                    placeholder="ABC-123"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Año</label>
                  <input 
                    type="number" 
                    value={nuevoVehiculo.anio} 
                    onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, anio: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
                    placeholder="2022"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Marca</label>
                  <input 
                    type="text" 
                    value={nuevoVehiculo.marca} 
                    onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, marca: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Modelo</label>
                  <input 
                    type="text" 
                    value={nuevoVehiculo.modelo} 
                    onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, modelo: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
                    placeholder="Hilux"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Kilometraje</label>
                <input 
                  type="number" 
                  value={nuevoVehiculo.kilometraje} 
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, kilometraje: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="35000"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModalVehiculo(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-700 text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm">Guardar Vehículo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO REPUESTO */}
      {showModalInventario && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Añadir Repuesto / Producto</h3>
            <form onSubmit={agregarInventarioItem} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nombre del Repuesto</label>
                <input 
                  type="text" 
                  required 
                  value={nuevoItemInv.nombre} 
                  onChange={(e) => setNuevoItemInv({...nuevoItemInv, nombre: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="Ej. Filtro de Aire"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Stock Inicial</label>
                  <input 
                    type="number" 
                    required 
                    value={nuevoItemInv.stock} 
                    onChange={(e) => setNuevoItemInv({...nuevoItemInv, stock: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Precio Unitario ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={nuevoItemInv.precio} 
                    onChange={(e) => setNuevoItemInv({...nuevoItemInv, precio: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
                    placeholder="15.00"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModalInventario(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-700 text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm">Guardar Repuesto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVA ORDEN DE TRABAJO */}
      {showModalOrden && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white">Nueva Orden de Trabajo</h3>
            <form onSubmit={crearOrdenTrabajo} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Vehículo</label>
                <select 
                  required
                  value={nuevaOrden.vehiculoId}
                  onChange={(e) => setNuevaOrden({...nuevaOrden, vehiculoId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Seleccione vehículo...</option>
                  {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placa}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Mecánico Asignado</label>
                <input 
                  type="text" 
                  required 
                  value={nuevaOrden.mecanico} 
                  onChange={(e) => setNuevaOrden({...nuevaOrden, mecanico: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="Ej. Roberto Sánchez"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Diagnóstico / Motivo de Ingreso</label>
                <textarea 
                  rows="2"
                  value={nuevaOrden.diagnostico} 
                  onChange={(e) => setNuevaOrden({...nuevaOrden, diagnostico: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="Describe la falla reportada..."
                ></textarea>
              </div>

              {/* Agregar repuestos o mano de obra a la orden */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-3">
                <h4 className="text-sm font-semibold text-white">Repuestos / Servicios Iniciales</h4>
                <div className="flex space-x-2">
                  <select 
                    value={itemSeleccionadoInv}
                    onChange={(e) => setItemSeleccionadoInv(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  >
                    <option value="">Seleccionar repuesto del inventario...</option>
                    {inventario.map(i => <option key={i.id} value={i.id}>{i.nombre} (${i.precio})</option>)}
                  </select>
                  <input 
                    type="number" 
                    min="1" 
                    value={cantidadItemInv} 
                    onChange={(e) => setCantidadItemInv(e.target.value)}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center"
                  />
                  <button type="button" onClick={itemSeleccionadoInv ? agregarItemAOrden : null} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">Agregar</button>
                </div>
                {itemsOrden.length > 0 && (
                  <ul className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    {itemsOrden.map((it, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{it.descripcion} (x{it.cantidad})</span>
                        <span className="font-semibold text-white">${(it.cantidad * it.precio).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModalOrden(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-700 text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm">Crear Orden</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}