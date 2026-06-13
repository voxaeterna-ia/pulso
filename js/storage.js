/* ============================================
   PULSO · PERSISTENCIA LOCAL
   Guarda en localStorage del navegador
   ============================================ */

const PulsoStore = {

  KEYS: {
    productos: 'pulso_productos_v1',
    cedears: 'pulso_cedears_v1',
    cedearsCantidades: 'pulso_cedears_cant_v1',
    gastos: 'pulso_gastos_v1',
    ingresos: 'pulso_ingresos_v1',
    valorHora: 'pulso_valor_hora_v1',
    streak: 'pulso_streak_v1',
    lastVote: 'pulso_lastvote_v1',
    onboarded: 'pulso_onboarded_v1'
  },

  // ============= GENÉRICO =============
  get(key, defaultVal = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch (e) {
      console.warn('[Pulso] Error leyendo storage:', key, e);
      return defaultVal;
    }
  },

  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      console.warn('[Pulso] Error escribiendo storage:', key, e);
      return false;
    }
  },

  // ============= PRODUCTOS DEL CHANGUITO =============
  // Ahora guardamos OBJETOS completos (no solo IDs) porque vienen de búsqueda real
  // Cada producto tiene: id (interno), ean, nombre, marca, imagen, supermercado origen
  getProductos() {
    return this.get(this.KEYS.productos, []);
  },

  setProductos(arr) {
    this.set(this.KEYS.productos, arr);
  },

  // Agregar producto al changuito (devuelve true/false/null)
  agregarProducto(producto) {
    const list = this.getProductos();
    if (list.length >= 10) return null; // ya hay 10
    if (list.some(p => p.id === producto.id || (producto.ean && p.ean === producto.ean))) {
      return false; // ya está
    }
    list.push({
      ...producto,
      addedAt: Date.now()
    });
    this.setProductos(list);
    return true;
  },

  // Sacar del changuito
  sacarProducto(idOrEan) {
    const list = this.getProductos();
    const nuevos = list.filter(p => p.id !== idOrEan && p.ean !== idOrEan);
    this.setProductos(nuevos);
    return list.length !== nuevos.length;
  },

  // ¿Ya está en el changuito?
  tieneProducto(idOrEan) {
    return this.getProductos().some(p => p.id === idOrEan || p.ean === idOrEan);
  },

  // ============= CEDEARS =============
  getCedears() {
    return this.get(this.KEYS.cedears, PulsoData.cedearsDefault);
  },

  setCedears(ids) {
    this.set(this.KEYS.cedears, ids);
  },

  // Cantidades por ticker: { AAPL: 10, TSLA: 5, ... }
  getCedearsCantidades() {
    return this.get(this.KEYS.cedearsCantidades, {});
  },

  setCedearCantidad(id, cantidad) {
    const map = this.getCedearsCantidades();
    const n = Math.max(0, parseInt(cantidad) || 0);
    if (n === 0) delete map[id];
    else map[id] = n;
    this.set(this.KEYS.cedearsCantidades, map);
    return n;
  },

  toggleCedear(id) {
    const list = this.getCedears();
    if (list.includes(id)) {
      this.setCedears(list.filter(x => x !== id));
      return false;
    } else {
      if (list.length >= 5) return null;
      this.setCedears([...list, id]);
      return true;
    }
  },

  // ============= GASTOS =============
  getGastos() {
    return this.get(this.KEYS.gastos, []);
  },

  addGasto(gasto) {
    const gastos = this.getGastos();
    gastos.unshift({
      ...gasto,
      id: 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      createdAt: Date.now()
    });
    this.set(this.KEYS.gastos, gastos);
    this.bumpStreak();
    return gastos[0];
  },

  removeGasto(id) {
    const gastos = this.getGastos().filter(g => g.id !== id);
    this.set(this.KEYS.gastos, gastos);
  },

  // Total de gastos del mes actual
  getGastosDelMes() {
    const ahora = new Date();
    const mes = ahora.getMonth();
    const anio = ahora.getFullYear();
    return this.getGastos().filter(g => {
      const f = new Date(g.fecha + 'T12:00:00');
      return f.getMonth() === mes && f.getFullYear() === anio;
    });
  },

  getTotalMes() {
    return this.getGastosDelMes().reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
  },

  // ============= INGRESOS =============
  getIngresos() {
    return this.get(this.KEYS.ingresos, 1850000);
  },

  setIngresos(monto) {
    this.set(this.KEYS.ingresos, monto);
  },

  // ============= VALOR HORA =============
  // Estructura: { ingresoMensual, horasMes, valorHora, activado }
  getValorHora() {
    return this.get(this.KEYS.valorHora, { activado: false });
  },

  setValorHora(ingresoMensual, horasMes) {
    const valorHora = ingresoMensual / horasMes;
    const data = {
      ingresoMensual,
      horasMes,
      valorHora,
      activado: true,
      updatedAt: Date.now()
    };
    this.set(this.KEYS.valorHora, data);
    return data;
  },

  desactivarValorHora() {
    this.set(this.KEYS.valorHora, { activado: false });
  },

  // ============= STREAK (racha de uso) =============
  getStreak() {
    const data = this.get(this.KEYS.streak, { dias: 12, lastDate: null });
    return data;
  },

  bumpStreak() {
    const today = new Date().toDateString();
    const data = this.getStreak();
    if (data.lastDate === today) return data;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = data.lastDate === yesterday.toDateString();
    const newDias = isConsecutive ? data.dias + 1 : (data.lastDate ? 1 : data.dias);
    const newData = { dias: newDias, lastDate: today };
    this.set(this.KEYS.streak, newData);
    return newData;
  },

  // ============= VOTO ÚLTIMO =============
  getLastVote() {
    return this.get(this.KEYS.lastVote, null);
  },

  setLastVote(opcion) {
    this.set(this.KEYS.lastVote, { opcion, fecha: Date.now() });
  },

  // ============= RESET COMPLETO (debug) =============
  resetAll() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  }
};

window.PulsoStore = PulsoStore;
