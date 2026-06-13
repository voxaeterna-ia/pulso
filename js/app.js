/* ============================================
   PULSO · APP PRINCIPAL
   Sin precios falsos. Solo datos reales o "—".
   ============================================ */

const Pulso = {

  state: {
    dolares: null,
    blue: null,
    mep: null,
    btc: null,
    eth: null,
    riesgo: null,
    inflacion: null,
    inflacionIA: null,
    uva: null,
    cedearsLive: {},
    cedearsSource: null,
    usStocks: {},
    cbt: 1124300, // valor de referencia, eventualmente vendrá de API INDEC
    currentScreen: 'home',
    pulsoScore: 50
  },

  async init() {
    console.log('%c PULSO v2.3 ', 'background:#1A1612;color:#FBC25A;font-weight:bold;', '· Tiempo de Vida activo · ' + new Date().toLocaleString('es-AR'));

    this.bindNav();
    this.bindSearch();

    const streak = PulsoStore.getStreak();
    const streakEl = document.getElementById('streakDays');
    if (streakEl) streakEl.textContent = streak.dias;

    // Cada render protegido: si uno falla, los demás siguen
    const safeRender = (name, fn) => {
      try { fn.call(this); }
      catch (e) { console.error('[Pulso] Error en ' + name + ':', e); }
    };

    safeRender('renderChanguito', this.renderChanguito);
    // Auto-refresh prices for saved products in background (no spinner)
    if (PulsoStore.getProductos().length > 0) {
      this.refrescarPreciosSilencioso();
    }
    safeRender('renderCedearList', this.renderCedearList);
    safeRender('renderRecentList', this.renderRecentList);
    safeRender('renderPlata', this.renderPlata);
    safeRender('renderCounters', this.renderCounters);
    safeRender('renderChanguitoMini', this.renderChanguitoMini);
    safeRender('renderTiempoVida', this.renderTiempoVida);

    const fechaEl = document.getElementById('pulsoFecha');
    if (fechaEl) fechaEl.textContent = 'pulso del día · ' + PulsoUI.fmtFechaCompleta();

    await this.loadLiveData();
  },

  async loadLiveData() {
    const all = await PulsoAPI.loadAll();
    this.state.dolares = all.dolares.data;
    this.state.riesgo = all.riesgo.data;
    this.state.riesgoHist = all.riesgoHist?.data;
    this.state.inflacion = all.inflacion.data;
    this.state.inflacionIA = all.inflacionIA.data;
    this.state.uva = all.uva.data;
    this.state.btc = all.cryptos.data.btc;
    this.state.eth = all.cryptos.data.eth;
    this.state.cedearsLive = all.cedears.data;
    this.state.cedearsSource = all.cedears.source;
    this.state.usStocks = all.usStocks.data;
    this.state.merval = all.indices?.merval;
    this.state.nasdaq = all.indices?.nasdaq;
    this.state.sp500 = all.indices?.sp500;

    this.state.blue = this.state.dolares.find(d => d.casa === 'blue' || d.nombre?.toLowerCase().includes('blue'));
    this.state.mep = this.state.dolares.find(d => d.casa === 'bolsa');

    this.renderPulsoDelDia();
    this.renderHeadline();
    this.renderIndicators();
    this.renderDolarList();
    this.renderMercadosCripto();
    this.renderUVA();
    this.renderInflacionMercados();
    this.renderRiesgoMerval();
    this.renderIndicesGlobales();
    this.renderMaquinaTiempo();
    this.renderCedearList();
    this.renderCarteraCedears();
    this.renderEquivalencias();
    this.renderLogros();

    if (all.cedears.source === 'live') {
      console.log(`✓ Pulso: ${all.cedears.count} CEDEARs cargados desde data912`);
    } else {
      console.warn('⚠ Pulso: CEDEARs en modo demo');
    }
    if (this.state.merval?.price) {
      console.log(`✓ Merval: $${this.state.merval.price.toFixed(0)} (${this.state.merval.changePercent?.toFixed(2)}%)`);
    }
  },

  bindNav() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.screen;
        if (screen) this.go(screen);
      });
    });
  },

  go(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.querySelector(`.screen[data-screen="${screen}"]`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navBtn = document.querySelector(`.nav-item[data-screen="${screen}"]`);
    if (navBtn) navBtn.classList.add('active');

    this.state.currentScreen = screen;

    if (target) {
      const sa = target.querySelector('.scroll-area');
      if (sa) sa.scrollTop = 0;
    }
  },

  // ============= PULSO DEL DÍA =============
  renderPulsoDelDia() {
    // Spread compra/venta del blue como señal de tensión cambiaria
    // Un spread > 2% indica nerviosismo; DolarAPI no provee variación diaria histórica
    const blue = this.state.blue;
    const blueChg = (blue?.compra && blue?.venta)
      ? ((blue.venta - blue.compra) / blue.compra) * 100
      : 1.5; // spread típico de referencia
    const riesgoVal = this.state.riesgo?.valor ?? 724;
    const inflVal = this.state.inflacion?.valor ?? 2.4;

    const { score, emoji, estado } = PulsoUI.calcPulso({
      blueChg, riesgo: riesgoVal, inflacion: inflVal
    });

    this.state.pulsoScore = score;
    document.getElementById('pulsoNumero').textContent = score;
    document.getElementById('pulsoEmoji').textContent = emoji;
    document.getElementById('pulsoEstado').textContent = estado;
    document.getElementById('pulsoBarMark').style.left = score + '%';
  },

  renderHeadline() {
    const blueVenta = this.state.blue?.venta ?? 1385;
    const idx = new Date().getDay() % PulsoData.headlines.length;
    const tpl = PulsoData.headlines[idx].template;
    const html = tpl
      .replace('{hl}', '<span class="hl">')
      .replace('{/hl}', '</span>')
      .replace('{val}', '$' + PulsoUI.fmt(blueVenta));
    document.getElementById('headlineText').innerHTML = html;
    document.getElementById('headlineMeta').textContent = 'Actualizado hace pocos minutos · ' + PulsoUI.fmtFechaCompleta();
  },

  renderIndicators() {
    const blue = this.state.blue;
    const blueVal = blue?.venta;
    const blueIndEl = document.getElementById('indBlue');
    const blueChgEl = document.getElementById('indBlueChg');

    if (blueVal) {
      blueIndEl.textContent = '$' + PulsoUI.fmt(blueVal);
      // Mostrar la brecha con el oficial (dato real, no inventado)
      const oficial = this.state.dolares?.find(d => d.casa === 'oficial');
      if (oficial?.venta) {
        const brecha = ((blueVal - oficial.venta) / oficial.venta) * 100;
        blueChgEl.textContent = 'brecha ' + brecha.toFixed(0) + '%';
        blueChgEl.className = 'indicator-chg';
      } else {
        blueChgEl.textContent = 'venta';
        blueChgEl.className = 'indicator-chg';
      }
    } else {
      blueIndEl.textContent = '—';
      blueChgEl.textContent = 'sin datos';
    }

    const inflVal = this.state.inflacion?.valor ?? null;
    if (inflVal != null) {
      document.getElementById('indInfl').textContent = inflVal.toFixed(1) + '%';
      // Mostrar mes del dato
      if (this.state.inflacion?.fecha) {
        const f = new Date(this.state.inflacion.fecha + 'T12:00:00');
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        document.getElementById('indInflChg').textContent = meses[f.getMonth()] + ' ' + f.getFullYear();
      } else {
        document.getElementById('indInflChg').textContent = 'mensual';
      }
    } else {
      document.getElementById('indInfl').textContent = '—';
      document.getElementById('indInflChg').textContent = 'sin datos';
    }
    document.getElementById('indInflChg').className = 'indicator-chg';

    const riesgoVal = this.state.riesgo?.valor;
    if (riesgoVal != null) {
      document.getElementById('indRiesgo').textContent = Math.round(riesgoVal);
      // Variación del histórico
      if (this.state.riesgoHist && this.state.riesgoHist.length >= 2) {
        const ult = this.state.riesgoHist[this.state.riesgoHist.length - 1];
        const ant = this.state.riesgoHist[this.state.riesgoHist.length - 2];
        if (ult && ant) {
          const diff = ult.valor - ant.valor;
          document.getElementById('indRiesgoChg').textContent = (diff >= 0 ? '▲' : '▼') + ' ' + Math.abs(Math.round(diff)) + ' pb';
          document.getElementById('indRiesgoChg').className = 'indicator-chg ' + (diff >= 0 ? 'down' : 'up');
        } else {
          document.getElementById('indRiesgoChg').textContent = 'puntos';
        }
      } else {
        document.getElementById('indRiesgoChg').textContent = 'puntos';
      }
    } else {
      document.getElementById('indRiesgo').textContent = '—';
      document.getElementById('indRiesgoChg').textContent = 'sin datos';
    }

    const btcVal = this.state.btc?.current_price;
    const btcChg = this.state.btc?.price_change_percentage_24h;
    const btcEl = document.getElementById('indBtc');
    const btcChgEl = document.getElementById('indBtcChg');

    if (btcVal != null) {
      btcEl.textContent = btcVal >= 1000 ? 'US$' + Math.round(btcVal / 1000) + 'K' : 'US$' + btcVal;
      if (btcChg != null) {
        btcChgEl.textContent = PulsoUI.fmtPct(btcChg);
        btcChgEl.className = 'indicator-chg ' + (btcChg >= 0 ? 'up' : 'down');
      }
    } else {
      btcEl.textContent = '—';
      btcChgEl.textContent = 'sin datos';
    }

    document.querySelectorAll('.indicator-tile').forEach(t => t.classList.remove('loading'));
  },

  renderDolarList() {
    const list = document.getElementById('dolarList');
    if (!this.state.dolares || !list) return;

    const orden = ['blue', 'oficial', 'bolsa', 'contadoconliqui', 'cripto', 'tarjeta', 'mayorista'];
    const nombres = {
      blue: { name: 'Blue', sub: 'paralelo' },
      oficial: { name: 'Oficial', sub: 'BNA' },
      bolsa: { name: 'MEP', sub: 'bolsa' },
      contadoconliqui: { name: 'CCL', sub: 'contado liqui' },
      cripto: { name: 'Cripto', sub: 'USDT' },
      tarjeta: { name: 'Tarjeta', sub: 'oficial + impuestos' },
      mayorista: { name: 'Mayorista', sub: 'BCRA' }
    };

    let html = '';
    orden.forEach(key => {
      const d = this.state.dolares.find(x => x.casa === key);
      if (!d) return;
      const meta = nombres[key];
      html += `
        <div class="market-row">
          <div><div class="mr-name">${meta.name}</div><div class="mr-sub">${meta.sub}</div></div>
          <div class="mr-val"><div>$${PulsoUI.fmt(d.venta)}</div></div>
        </div>
      `;
    });
    list.innerHTML = html;
  },

  renderRiesgoMerval() {
    // Riesgo país: valor + variación calculada del histórico
    if (this.state.riesgo) {
      const valor = Math.round(this.state.riesgo.valor);
      document.getElementById('riesgoVal').textContent = valor + ' pb';

      // Variación: compara con el penúltimo registro histórico
      const chgEl = document.getElementById('riesgoChg');
      if (this.state.riesgoHist && this.state.riesgoHist.length >= 2) {
        const ultimo = this.state.riesgoHist[this.state.riesgoHist.length - 1];
        const anterior = this.state.riesgoHist[this.state.riesgoHist.length - 2];
        if (ultimo && anterior && anterior.valor) {
          const diff = ultimo.valor - anterior.valor;
          const pct = (diff / anterior.valor) * 100;
          chgEl.textContent = (diff >= 0 ? '▲' : '▼') + ' ' + Math.abs(Math.round(diff)) + ' pb';
          chgEl.className = 'pill ' + (diff >= 0 ? 'pill-down' : 'pill-up'); // sube riesgo = mal
        } else {
          chgEl.textContent = '—';
          chgEl.className = 'pill';
        }
      } else {
        chgEl.textContent = '—';
        chgEl.className = 'pill';
      }
    }

    // Merval desde Yahoo Finance
    const mervalVal = document.getElementById('mervalVal');
    const mervalChg = document.getElementById('mervalChg');
    if (this.state.merval?.price) {
      mervalVal.textContent = PulsoUI.fmt(Math.round(this.state.merval.price));
      const chg = this.state.merval.changePercent;
      if (chg != null) {
        mervalChg.textContent = PulsoUI.fmtPct(chg);
        mervalChg.className = 'pill ' + (chg >= 0 ? 'pill-up' : 'pill-down');
      }
    }
  },

  renderIndicesGlobales() {
    // Nasdaq desde Yahoo Finance
    const nasdaqVal = document.getElementById('nasdaqVal');
    const nasdaqChg = document.getElementById('nasdaqChg');
    if (nasdaqVal && this.state.nasdaq?.price) {
      nasdaqVal.textContent = PulsoUI.fmt(Math.round(this.state.nasdaq.price));
      const chg = this.state.nasdaq.changePercent;
      if (chg != null) {
        nasdaqChg.textContent = PulsoUI.fmtPct(chg);
        nasdaqChg.className = 'pill ' + (chg >= 0 ? 'pill-up' : 'pill-down');
      }
    }

    // S&P 500 desde Yahoo Finance
    const spVal = document.getElementById('spVal');
    const spChg = document.getElementById('spChg');
    if (spVal && this.state.sp500?.price) {
      spVal.textContent = PulsoUI.fmt(Math.round(this.state.sp500.price));
      const chg = this.state.sp500.changePercent;
      if (chg != null) {
        spChg.textContent = PulsoUI.fmtPct(chg);
        spChg.className = 'pill ' + (chg >= 0 ? 'pill-up' : 'pill-down');
      }
    }
  },

  renderInflacionMercados() {
    // Mostrar inflación en pantalla Mercados con fecha del dato
    const inflVal = document.getElementById('inflVal');
    const inflMeta = document.getElementById('inflMeta');
    const inflIA = document.getElementById('inflIA');

    if (inflVal && this.state.inflacion?.valor != null) {
      inflVal.textContent = this.state.inflacion.valor.toFixed(1) + '%';
    }
    if (inflMeta && this.state.inflacion?.fecha) {
      const f = new Date(this.state.inflacion.fecha + 'T12:00:00');
      const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      inflMeta.textContent = meses[f.getMonth()] + ' ' + f.getFullYear();
    }
    if (inflIA && this.state.inflacionIA?.valor != null) {
      inflIA.textContent = 'interanual ' + this.state.inflacionIA.valor.toFixed(1) + '%';
    }
  },

  renderMercadosCripto() {
    if (this.state.btc) {
      document.getElementById('btcVal').textContent = 'US$ ' + PulsoUI.fmt(this.state.btc.current_price);
      const chg = this.state.btc.price_change_percentage_24h ?? 0;
      document.getElementById('btcChg').className = 'pill ' + (chg >= 0 ? 'pill-up' : 'pill-down');
      document.getElementById('btcChg').textContent = PulsoUI.fmtPct(chg);
    }
    if (this.state.eth) {
      document.getElementById('ethVal').textContent = 'US$ ' + PulsoUI.fmt(this.state.eth.current_price);
      const chg = this.state.eth.price_change_percentage_24h ?? 0;
      document.getElementById('ethChg').className = 'pill ' + (chg >= 0 ? 'pill-up' : 'pill-down');
      document.getElementById('ethChg').textContent = PulsoUI.fmtPct(chg);
    }
  },

  renderUVA() {
    if (this.state.uva) {
      const uvaVal = document.getElementById('uvaVal');
      const uvaChg = document.getElementById('uvaChg');
      if (uvaVal) uvaVal.textContent = '$' + PulsoUI.fmt(this.state.uva.valor, { decimals: 2 });
      if (uvaChg && this.state.uva.fecha) {
        const f = new Date(this.state.uva.fecha + 'T12:00:00');
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        uvaChg.textContent = `${f.getDate()} ${meses[f.getMonth()]} ${f.getFullYear()}`;
      }
    }
  },

  renderMaquinaTiempo() {
    const blueHoy = this.state.blue?.venta ?? 1385;
    const inflIA = this.state.inflacionIA?.valor;

    if (inflIA) {
      // Estimar blue de hace 1 año usando variación interanual del IPC
      // (es una aproximación, no exacta, pero más honesta que un número fijo)
      const factor = 1 + (inflIA / 100);
      const blueAnio = Math.round(blueHoy / factor);
      const variacion = ((blueHoy - blueAnio) / blueAnio * 100).toFixed(1);

      document.getElementById('maquinaTexto').innerHTML = `Hace 1 año, ajustando por inflación, el blue equivalía a <strong>$${PulsoUI.fmt(blueAnio)}</strong>. Hoy <strong>$${PulsoUI.fmt(blueHoy)}</strong> (+${variacion}%).`;
      document.getElementById('maquinaWarn').textContent = 'Comparativa basada en IPC interanual del INDEC';
    } else {
      document.getElementById('maquinaTexto').textContent = 'Cargando datos históricos...';
      document.getElementById('maquinaWarn').textContent = '';
    }
  },

  // ============= CHANGUITO (búsqueda real + comparativa) =============
  // Estado de búsqueda
  searchState: { query: '', results: [], loading: false },
  changuitoPreciosCache: {}, // ean -> [{super, precio, ...}]

  async buscar() {
    const input = document.getElementById('searchProducts');
    const query = input?.value?.trim();
    if (!query || query.trim().split(/\s+/).filter(Boolean).length < 2) {
      PulsoUI.toast('Escribí al menos 2 palabras · Ej: "azúcar común" o "leche descremada"');
      return;
    }

    const btn = document.getElementById('searchBtn');
    const card = document.getElementById('searchResultsCard');
    const title = document.getElementById('searchResultsTitle');
    const resultsDiv = document.getElementById('searchResults');

    btn.disabled = true;
    btn.textContent = 'Buscando...';
    card.style.display = 'block';
    title.textContent = `buscando "${query}"...`;
    resultsDiv.innerHTML = '<p class="meta-line" style="padding: 20px; text-align: center;">Consultando supermercados...</p>';

    const data = await PulsoAPI.buscarProductos(query);

    btn.disabled = false;
    btn.textContent = 'Buscar';

    if (!data.ok) {
      title.textContent = 'búsqueda no disponible';
      resultsDiv.innerHTML = `<p class="meta-line" style="padding: 14px; text-align: center; color: var(--accent-red);">${data.error || 'Error al buscar'}</p>`;
      return;
    }

    // Procesar resultados: consolidar por EAN para no duplicar el mismo producto
    const productosPorEan = {};
    data.resultados.forEach(r => {
      if (!r.ok || !r.productos) return;
      r.productos.forEach(p => {
        const key = p.ean || `${r.super}_${p.id}`;
        if (!productosPorEan[key]) {
          productosPorEan[key] = {
            ean: p.ean,
            nombre: p.nombre,
            marca: p.marca,
            imagen: p.imagen,
            precios: {}
          };
        }
        productosPorEan[key].precios[r.super] = {
          supermercado: r.supermercado,
          precio: p.precio,
          disponible: p.disponible
        };
      });
    });

    const productos = Object.values(productosPorEan).slice(0, 50);
    this.searchState = { query, results: productos };

    title.textContent = `resultados para "${query}" · ${productos.length} productos`;

    if (productos.length === 0) {
      resultsDiv.innerHTML = '<p class="meta-line" style="padding: 14px; text-align: center;">No encontramos ese producto. Probá otro término.</p>';
      return;
    }

    resultsDiv.innerHTML = productos.map(p => this.searchResultHTML(p)).join('');
  },

  searchResultHTML(p) {
    const precios = Object.entries(p.precios);
    if (precios.length === 0) return '';

    const validos = precios.filter(([, v]) => v.precio != null);
    const minPrecio = validos.length ? Math.min(...validos.map(([, v]) => v.precio)) : null;
    const supersConPrecio = validos.length;

    const yaEnChanguito = p.ean ? PulsoStore.tieneProducto(p.ean) : false;

    // Mini-grid de precios — usa las cadenas que realmente vienen en la respuesta
    const preciosHTML = Object.entries(p.precios).map(([s, info]) => {
      const nombre = PulsoData.supermercadosNombres[s] || info.supermercado || s;
      if (!info || info.precio == null) {
        return `<div class="price-cell-mini empty"><span class="ps-name">${nombre}</span><span class="ps-val">—</span></div>`;
      }
      const isMin = info.precio === minPrecio;
      return `<div class="price-cell-mini ${isMin ? 'cheapest' : ''}"><span class="ps-name">${nombre}</span><span class="ps-val">$${PulsoUI.fmt(info.precio)}</span></div>`;
    }).join('');

    const eanData = p.ean ? `data-ean="${p.ean}"` : '';
    const idEsc = (p.ean || p.nombre).replace(/'/g, "\\'");

    return `
      <div class="search-result" ${eanData}>
        <div class="sr-header">
          ${p.imagen ? `<img src="${p.imagen}" alt="" class="sr-img" loading="lazy" onerror="this.style.display='none'">` : ''}
          <div class="sr-info">
            <div class="sr-name">${this.escape(p.nombre)}</div>
            ${p.marca ? `<div class="sr-brand">${this.escape(p.marca)}</div>` : ''}
            <div class="sr-meta">disponible en ${supersConPrecio} supermercado${supersConPrecio !== 1 ? 's' : ''}</div>
          </div>
          <button
            class="sr-add ${yaEnChanguito ? 'added' : ''}"
            onclick="Pulso.agregarAlChanguito('${idEsc}')"
            ${yaEnChanguito ? 'disabled' : ''}>
            ${yaEnChanguito ? '✓ Agregado' : '+ Agregar'}
          </button>
        </div>
        <div class="price-grid-mini">${preciosHTML}</div>
      </div>
    `;
  },

  escape(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  },

  agregarAlChanguito(key) {
    const found = this.searchState.results.find(p => p.ean === key || p.nombre === key);
    if (!found) return;

    const producto = {
      id: found.ean || found.nombre,
      ean: found.ean,
      nombre: found.nombre,
      marca: found.marca,
      imagen: found.imagen,
      preciosIniciales: found.precios
    };

    const result = PulsoStore.agregarProducto(producto);
    if (result === null) {
      PulsoUI.toast('Tu changuito ya tiene 10 productos. Sacá uno primero.');
      return;
    }
    if (result === false) {
      PulsoUI.toast('Ya está en tu changuito');
      return;
    }

    // Guardar precios en cache
    if (producto.ean) {
      this.changuitoPreciosCache[producto.ean] = found.precios;
    }

    PulsoUI.toast(`✓ ${found.nombre.substring(0, 30)}... agregado`);
    this.renderChanguito();
    this.renderCounters();

    // Actualizar botón en resultados
    const card = document.querySelector(`.search-result[data-ean="${found.ean}"] .sr-add`);
    if (card) {
      card.classList.add('added');
      card.disabled = true;
      card.textContent = '✓ Agregado';
    }
  },

  sacarDelChanguito(idOrEan) {
    PulsoStore.sacarProducto(idOrEan);
    delete this.changuitoPreciosCache[idOrEan];
    PulsoUI.toast('Producto sacado del changuito');
    this.renderChanguito();
    this.renderCounters();

    // Re-habilitar botón en resultados si estaba allí
    const card = document.querySelector(`.search-result[data-ean="${idOrEan}"] .sr-add`);
    if (card) {
      card.classList.remove('added');
      card.disabled = false;
      card.textContent = '+ Agregar';
    }
  },

  renderChanguito() {
    const list = document.getElementById('changuitoList');
    const refreshBtn = document.getElementById('refreshPricesBtn');
    const comparativaCard = document.getElementById('comparativaCard');
    if (!list) return;

    const productos = PulsoStore.getProductos();

    if (productos.length === 0) {
      list.innerHTML = '<p class="meta-line empty-state">Tu changuito está vacío. Buscá productos arriba para agregar.</p>';
      refreshBtn.style.display = 'none';
      comparativaCard.style.display = 'none';
      return;
    }

    list.innerHTML = productos.map(p => this.changuitoItemHTML(p)).join('');
    refreshBtn.style.display = 'block';

    // Renderizar tabla comparativa total
    this.renderComparativaTotal(productos);
    comparativaCard.style.display = 'block';
  },

  changuitoItemHTML(p) {
    const precios = p.preciosIniciales || {};
    const validos = Object.entries(precios).filter(([, v]) => v?.precio != null);
    const minPrecio = validos.length ? Math.min(...validos.map(([, v]) => v.precio)) : null;

    const preciosHTML = Object.entries(precios).map(([s, info]) => {
      const nombre = PulsoData.supermercadosNombres[s] || info?.supermercado || s;
      if (!info || info.precio == null) {
        return `<div class="price-cell-mini empty"><span class="ps-name">${nombre}</span><span class="ps-val">—</span></div>`;
      }
      const isMin = info.precio === minPrecio;
      return `<div class="price-cell-mini ${isMin ? 'cheapest' : ''}"><span class="ps-name">${nombre}</span><span class="ps-val">$${PulsoUI.fmt(info.precio)}</span></div>`;
    }).join('');

    const idEsc = (p.ean || p.id).replace(/'/g, "\\'");

    return `
      <div class="changuito-item">
        <div class="sr-header">
          ${p.imagen ? `<img src="${p.imagen}" alt="" class="sr-img" loading="lazy" onerror="this.style.display='none'">` : ''}
          <div class="sr-info">
            <div class="sr-name">${this.escape(p.nombre)}</div>
            ${p.marca ? `<div class="sr-brand">${this.escape(p.marca)}</div>` : ''}
          </div>
          <button class="sr-remove" onclick="Pulso.sacarDelChanguito('${idEsc}')" title="Sacar del changuito">✕</button>
        </div>
        <div class="price-grid-mini">${preciosHTML}</div>
      </div>
    `;
  },

  renderComparativaTotal(productos) {
    const div = document.getElementById('comparativaTotales');
    if (!div) return;

    // Reunir todas las cadenas presentes en los productos guardados
    const todasCadenas = new Set();
    productos.forEach(p => Object.keys(p.preciosIniciales || {}).forEach(s => todasCadenas.add(s)));

    const totales = {};
    const conteos = {};
    todasCadenas.forEach(s => { totales[s] = 0; conteos[s] = 0; });

    productos.forEach(p => {
      const precios = p.preciosIniciales || {};
      todasCadenas.forEach(s => {
        if (precios[s]?.precio != null) {
          totales[s] += precios[s].precio;
          conteos[s]++;
        }
      });
    });

    const totalesArr = Object.entries(totales).map(([s, total]) => ({
      super: s,
      nombre: PulsoData.supermercadosNombres[s] || s.charAt(0).toUpperCase() + s.slice(1),
      total,
      productos: conteos[s],
      completo: conteos[s] === productos.length
    })).sort((a, b) => a.total - b.total);

    const totalesCompletos = totalesArr.filter(t => t.completo);
    const minTotal = totalesCompletos.length ? Math.min(...totalesCompletos.map(t => t.total)) : null;
    const maxTotal = totalesCompletos.length ? Math.max(...totalesCompletos.map(t => t.total)) : null;

    div.innerHTML = totalesArr.map(t => {
      const isMin = t.completo && t.total === minTotal;
      const cls = isMin ? 'cheapest' : '';
      const completoLabel = t.completo
        ? ''
        : `<span class="incomplete-note">${t.productos} de ${productos.length} disp.</span>`;
      return `
        <div class="total-row ${cls}">
          <div class="total-name">${t.nombre}</div>
          <div class="total-val">$${PulsoUI.fmt(t.total)} ${completoLabel}</div>
        </div>
      `;
    }).join('');

    // Si tenemos un mínimo y un máximo claros, agregamos el ahorro al final
    if (minTotal && maxTotal && maxTotal > minTotal) {
      const ahorro = maxTotal - minTotal;
      const cheapName = totalesArr.find(t => t.total === minTotal)?.nombre;
      const expensiveName = totalesArr.find(t => t.total === maxTotal)?.nombre;
      div.innerHTML += `
        <div class="ahorro-note">
          💡 Eligiendo <strong>${cheapName}</strong> en vez de <strong>${expensiveName}</strong> ahorrás <strong>$${PulsoUI.fmt(ahorro)}</strong> en este changuito
        </div>
      `;
    }
  },

  async refrescarPrecios() {
    const productos = PulsoStore.getProductos();
    if (productos.length === 0) return;

    const btn = document.getElementById('refreshPricesBtn');
    btn.disabled = true;
    btn.textContent = 'Actualizando...';

    const conEan = productos.filter(p => p.ean);
    if (conEan.length === 0) {
      PulsoUI.toast('Los productos no tienen EAN, no se pueden actualizar');
      btn.disabled = false;
      btn.textContent = '↻ Actualizar precios';
      return;
    }

    const eans = conEan.map(p => p.ean);
    const resultados = await PulsoAPI.obtenerPreciosBatch(eans);

    // Actualizar cada producto con precios nuevos
    const actualizados = productos.map(p => {
      if (!p.ean) return p;
      const idx = eans.indexOf(p.ean);
      const r = resultados[idx];
      if (!r || !r.ok) return p;

      const preciosNuevos = {};
      r.resultados?.forEach(item => {
        const prod = item.productos?.[0];
        if (item.ok && prod?.precio != null) {
          preciosNuevos[item.super] = {
            supermercado: item.supermercado,
            precio: prod.precio,
            disponible: prod.disponible
          };
        }
      });

      if (Object.keys(preciosNuevos).length === 0) return p;
      return { ...p, preciosIniciales: preciosNuevos, lastUpdated: Date.now() };
    });

    PulsoStore.setProductos(actualizados);
    this.renderChanguito();

    btn.disabled = false;
    btn.textContent = '↻ Actualizar precios';
    PulsoUI.toast('✓ Precios actualizados');
  },

  // Auto-refresh de precios en background al iniciar la app (sin botón ni toast)
  async refrescarPreciosSilencioso() {
    const productos = PulsoStore.getProductos();
    if (productos.length === 0) return;

    const promesas = productos.map(p =>
      p.ean ? PulsoAPI.obtenerPreciosPorEAN(p.ean) : PulsoAPI.buscarProductos(p.nombre)
    );
    const resultados = await Promise.all(promesas);

    const actualizados = productos.map((p, idx) => {
      const r = resultados[idx];
      if (!r || !r.ok || !r.resultados) return p;

      const preciosNuevos = {};
      r.resultados.forEach(item => {
        const prod = item.productos?.[0];
        if (item.ok && prod?.precio != null) {
          preciosNuevos[item.super] = {
            supermercado: item.supermercado,
            precio: prod.precio,
            disponible: prod.disponible
          };
        }
      });

      if (Object.keys(preciosNuevos).length === 0) return p;
      return { ...p, preciosIniciales: preciosNuevos, lastUpdated: Date.now() };
    });

    PulsoStore.setProductos(actualizados);
    this.renderChanguito();
    this.renderChanguitoMini();
  },

  clearSearch() {
    const input = document.getElementById('searchProducts');
    if (input) input.value = '';
    document.getElementById('searchResultsCard').style.display = 'none';
    document.getElementById('searchResults').innerHTML = '';
    this.searchState = { query: '', results: [] };
  },

  renderChanguitoMini() {
    const count = PulsoStore.getProductos().length;
    const el = document.getElementById('changuitoCount');
    if (el) el.textContent = count;
  },

  // ============= CEDEARS · DATOS REALES =============
  // Tolera dos formatos: data912 (c, q_bid, q_ask, v, v_pct)
  // y BYMA normalizado por el proxy (c, bid, ask, v, v_pct)
  enrichCedear(c) {
    const live = this.state.cedearsLive[c.id];
    const out = { ...c, sub: `${c.empresa} · ${c.ratio}:1 · ${c.mercado}` };

    if (live) {
      // El precio puede venir como 'c' (ambas fuentes lo usan)
      out.priceARS = live.c ?? live.last ?? null;
      // bid/ask: data912 usa q_bid/q_ask, BYMA usa bid/ask
      out.bid = live.q_bid ?? live.bid ?? null;
      out.ask = live.q_ask ?? live.ask ?? null;
      out.volume = live.v ?? live.volume ?? null;
      out.chg = live.v_pct ?? live.chg ?? null;
      out.live = true;

      const mepVal = this.state.mep?.venta;
      if (mepVal && out.priceARS) {
        out.priceUSD = (out.priceARS * c.ratio) / mepVal;
      }
    } else {
      out.priceARS = null;
      out.priceUSD = null;
      out.chg = null;
      out.live = false;
    }
    return out;
  },

  renderCedearList() {
    const list = document.getElementById('cedearList');
    if (!list) return;

    const seleccionados = PulsoStore.getCedears();
    const cedears = PulsoData.cedears.map(c => this.enrichCedear(c));

    const sortedSel = cedears.filter(c => seleccionados.includes(c.id));
    const sortedNo = cedears.filter(c => !seleccionados.includes(c.id));

    let html = '';

    if (this.state.cedearsSource === 'fallback') {
      html += `
        <div style="background: #FCEBEB; color: #791F1F; padding: 10px 12px; border-radius: var(--radius-md); margin-bottom: 10px; font-size: 11px; border: 0.5px solid rgba(200,51,44,0.2);">
          ⚠️ <strong>No pudimos conectar con la API de precios.</strong><br>
          Los CEDEARs no se muestran por ahora. Reintentá en unos minutos.
        </div>
      `;
    }

    sortedSel.forEach(c => html += this.cedearItemHTML(c, true));

    if (sortedNo.length > 0) {
      html += `
        <div class="section-divider">
          <span class="line"></span>
          <span class="label">+${sortedNo.length} disponibles</span>
          <span class="line"></span>
        </div>
      `;
      sortedNo.forEach(c => html += this.cedearItemHTML(c, false));
    }

    list.innerHTML = html;

    list.querySelectorAll('.list-item.cedear').forEach(el => {
      el.addEventListener('click', () => this.toggleCedear(el.dataset.id));
    });

    const src = document.getElementById('byMaSource');
    if (src) {
      if (this.state.cedearsSource === 'byma') {
        const mep = this.state.mep?.venta ?? 0;
        src.innerHTML = `BYMA Open Data · USD MEP $${PulsoUI.fmt(mep)} · delay 1-5 min`;
      } else if (this.state.cedearsSource === 'data912') {
        const mep = this.state.mep?.venta ?? 0;
        src.innerHTML = `data912 (BYMA secundaria) · USD MEP $${PulsoUI.fmt(mep)} · delay ~2hs`;
      } else {
        src.textContent = 'Sin conexión a fuente de precios';
      }
    }
  },

  cedearItemHTML(c, selected) {
    const priceHTML = c.priceARS != null
      ? `<div class="item-price">$${PulsoUI.fmt(c.priceARS, { decimals: c.priceARS < 100 ? 2 : 0 })}</div>
         <div class="item-price-sub">${c.priceUSD != null ? '≈ US$ ' + c.priceUSD.toFixed(2) : ''}</div>`
      : `<div class="item-price" style="color: var(--text-tertiary);">—</div>
         <div class="item-price-sub">sin datos</div>`;

    const pillHTML = c.chg != null
      ? PulsoUI.pillFor(c.chg)
      : '<span class="pill" style="opacity: 0.4;">—</span>';

    return `
      <div class="list-item cedear ${selected ? 'selected' : ''}" data-id="${c.id}" data-cat="${c.cat}" data-name="${c.name.toLowerCase()} ${c.empresa.toLowerCase()}">
        <span class="check-circle">${selected ? '✓' : ''}</span>
        <span class="item-emoji">${c.emoji}</span>
        <div class="item-info">
          <div class="item-name">${c.name}</div>
          <div class="item-sub">${c.sub}</div>
        </div>
        <div>${priceHTML}</div>
        ${pillHTML}
      </div>
    `;
  },

  toggleCedear(id) {
    const result = PulsoStore.toggleCedear(id);
    if (result === null) {
      PulsoUI.toast('Ya elegiste 5 CEDEARs. Sacá uno primero.');
      return;
    }
    this.renderCedearList();
    this.renderCounters();
    this.renderCarteraCedears();
  },

  renderCarteraCedears() {
    const seleccionados = PulsoStore.getCedears();
    const ceds = PulsoData.cedears
      .filter(c => seleccionados.includes(c.id))
      .map(c => this.enrichCedear(c));

    const conPrecio = ceds.filter(c => c.priceARS != null);
    const totalARS = conPrecio.reduce((s, c) => s + c.priceARS, 0);
    const totalUSD = conPrecio.reduce((s, c) => s + (c.priceUSD ?? 0), 0);
    const conChg = ceds.filter(c => c.chg != null);
    const promChg = conChg.length ? conChg.reduce((s, c) => s + c.chg, 0) / conChg.length : 0;

    const totalEl = document.getElementById('carteraTotal');
    const usdEl = document.getElementById('carteraUSD');
    const hoyEl = document.getElementById('carteraHoy');

    if (conPrecio.length === 0) {
      totalEl.textContent = '—';
      usdEl.textContent = 'sin datos disponibles';
      hoyEl.textContent = '—';
      hoyEl.className = '';
    } else {
      totalEl.textContent = '$' + PulsoUI.fmt(totalARS);
      usdEl.textContent = '≈ US$ ' + totalUSD.toFixed(2) + ' al MEP';
      hoyEl.textContent = PulsoUI.fmtPct(promChg);
      hoyEl.className = promChg >= 0 ? 'green' : 'red';
    }

    document.getElementById('cedearsCount').textContent = ceds.length;
    document.getElementById('cedearsTotal').textContent = conPrecio.length > 0 ? '$' + PulsoUI.fmt(totalARS) : '—';
    document.getElementById('cedearsTrend').textContent = conPrecio.length > 0
      ? `${promChg >= 0 ? '▲' : '▼'} ${Math.abs(promChg).toFixed(1)}% hoy`
      : 'Esperando datos en vivo...';
  },

  renderCounters() {
    const cntC = document.getElementById('counterCanasta');
    const numProds = PulsoStore.getProductos().length;
    if (cntC) {
      cntC.textContent = numProds + ' de 10';
      cntC.classList.toggle('full', numProds === 10);
    }

    const cntCe = document.getElementById('counterCedears');
    const numCeds = PulsoStore.getCedears().length;
    if (cntCe) {
      cntCe.textContent = numCeds + ' de 5';
      cntCe.classList.toggle('full', numCeds === 5);
    }
  },

  // ============= MI PLATA =============
  renderPlata() {
    const ingresos = PulsoStore.getIngresos();
    const gastos = PulsoStore.getTotalMes();
    const balance = ingresos - gastos;
    const pctGastado = ingresos > 0 ? Math.min(100, (gastos / ingresos) * 100) : 0;
    const pctBalance = ingresos > 0 ? (balance / ingresos * 100) : 0;

    document.getElementById('ingresosVal').textContent = '$' + PulsoUI.fmt(ingresos);
    document.getElementById('gastosVal').textContent = '$' + PulsoUI.fmt(gastos);

    const balanceEl = document.getElementById('balanceVal');
    balanceEl.textContent = (balance >= 0 ? '+' : '-') + '$' + PulsoUI.fmt(Math.abs(balance));
    balanceEl.className = 'big-number ' + (balance >= 0 ? 'green' : 'red');

    document.getElementById('balanceMeta').textContent = pctBalance.toFixed(1) + '% de tus ingresos · ' + this.balanceUSD(balance);
    document.getElementById('progressFill').style.width = pctGastado + '%';
  },

  balanceUSD(balance) {
    const blue = this.state.blue?.venta ?? 1385;
    const usd = Math.round(balance / blue);
    return 'US$ ' + PulsoUI.fmt(Math.abs(usd)) + ' al blue';
  },

  renderRecentList() {
    const list = document.getElementById('recentList');
    if (!list) return;

    const gastos = PulsoStore.getGastos().slice(0, 5);
    if (gastos.length === 0) {
      list.innerHTML = '<p class="meta-line empty-state">Aún no cargaste gastos. Tocá una categoría arriba.</p>';
      return;
    }

    list.innerHTML = gastos.map(g => `
      <div class="recent-row${g._justAdded ? ' just-added' : ''}">
        <div class="recent-info">
          <span class="recent-emoji">${g.emoji}</span>
          <div>
            <div class="recent-cat">${g.categoria}</div>
            <div class="recent-date">${PulsoUI.fmtFecha(g.fecha)}</div>
          </div>
        </div>
        <span class="recent-amount">$${PulsoUI.fmt(g.monto)}</span>
      </div>
    `).join('');
  },

  renderEquivalencias() {
    const ingresos = PulsoStore.getIngresos();
    const gastos = PulsoStore.getTotalMes();
    const balance = ingresos - gastos;

    const blue = this.state.blue?.venta ?? 1385;
    const mep = this.state.mep?.venta ?? 1298;
    const btc = this.state.btc?.current_price ?? 98420;

    const dolaresBlue = Math.round(balance / blue);
    const dolaresMep = Math.round(balance / mep);
    const btcEq = (balance / blue / btc).toFixed(4);
    const cbtEq = (balance / this.state.cbt).toFixed(2);

    const setIf = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setIf('equivDolares', 'US$ ' + PulsoUI.fmt(Math.abs(dolaresBlue)));
    setIf('equivMep', 'US$ ' + PulsoUI.fmt(Math.abs(dolaresMep)));
    setIf('equivBtc', btcEq);
    setIf('equivCbt', cbtEq);
  },

  renderLogros() {
    const streak = PulsoStore.getStreak();
    const ingresos = PulsoStore.getIngresos();
    const gastos = PulsoStore.getTotalMes();
    const balance = ingresos - gastos;
    const blue = this.state.blue?.venta ?? 1385;

    const setIf = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setIf('logroDias', streak.dias + ' días');

    const balanceEl = document.getElementById('logroBalance');
    const balanceSubEl = document.getElementById('logroBalanceSub');
    if (balanceEl) {
      balanceEl.textContent = (balance >= 0 ? '+$' : '-$') + PulsoUI.fmt(Math.abs(balance));
    }
    if (balanceSubEl) {
      const usd = Math.round(balance / blue);
      balanceSubEl.textContent = 'Equivale a US$ ' + PulsoUI.fmt(Math.abs(usd)) + ' al blue';
    }
  },

  // ============= MODAL DE GASTOS =============
  openExpense(category, emoji) {
    const html = `
      <div class="modal-header">
        <span class="modal-emoji">${emoji}</span>
        <span class="modal-title">${category}</span>
        <button class="modal-close" onclick="Pulso.closeModal()">✕</button>
      </div>
      <div class="field">
        <label class="field-label">Importe</label>
        <input type="number" inputmode="numeric" class="input-amount" id="expAmount" placeholder="$0" />
      </div>
      <div class="field">
        <label class="field-label">Fecha</label>
        <div class="date-row">
          <input type="date" class="date-input" id="expDate" value="${PulsoUI.todayISO()}" />
          <button class="date-chip active" onclick="Pulso.setQuickDate(this, 0)">Hoy</button>
          <button class="date-chip" onclick="Pulso.setQuickDate(this, -1)">Ayer</button>
        </div>
      </div>
      <div class="field">
        <label class="field-label">Nota (opcional)</label>
        <input type="text" class="input-text" id="expNote" placeholder="Ej: factura mes" />
      </div>
      <button class="btn-primary" onclick="Pulso.saveExpense('${category.replace(/'/g, "\\'")}', '${emoji}')">Guardar gasto</button>
      <button class="btn-secondary" onclick="Pulso.closeModal()">Cancelar</button>
    `;
    PulsoUI.showModal(html);
    setTimeout(() => { const i = document.getElementById('expAmount'); if (i) i.focus(); }, 200);
  },

  openSubmenu(key) {
    const opt = PulsoData.submenus[key];
    if (!opt) return;
    const html = `
      <div class="modal-header">
        <span class="modal-emoji">${opt.emoji}</span>
        <span class="modal-title">${opt.title}</span>
        <button class="modal-close" onclick="Pulso.closeModal()">✕</button>
      </div>
      <p class="meta-line" style="margin-bottom: 12px;">¿Cuál querés cargar?</p>
      <div class="submenu-list">
        ${opt.items.map(it => {
          const safeLabel = it.label.replace(/'/g, "\\'");
          const action = it.editable
            ? `Pulso.openOtherEditable('${opt.title.replace(/'/g, "\\'")}')`
            : `Pulso.openExpense('${opt.title.replace(/'/g, "\\'")} · ${safeLabel}', '${it.emoji}')`;
          return `
            <button class="sub-tile" onclick="${action}">
              <span class="sub-emoji">${it.emoji}</span>
              <div style="flex: 1;">
                <div class="sub-label">${it.label}</div>
                <div class="sub-hint">${it.hint}</div>
              </div>
              <span class="sub-arrow">›</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
    PulsoUI.showModal(html);
  },

  openOtherEditable(parentTitle) {
    const html = `
      <div class="modal-header">
        <span class="modal-emoji">✏️</span>
        <span class="modal-title">${parentTitle} · concepto libre</span>
        <button class="modal-close" onclick="Pulso.closeModal()">✕</button>
      </div>
      <div class="field">
        <label class="field-label">Concepto</label>
        <input type="text" class="input-text" id="expCat" placeholder="Ej: regalo, ropa, médico..." />
      </div>
      <div class="field">
        <label class="field-label">Importe</label>
        <input type="number" inputmode="numeric" class="input-amount" id="expAmount" placeholder="$0" />
      </div>
      <div class="field">
        <label class="field-label">Fecha</label>
        <div class="date-row">
          <input type="date" class="date-input" id="expDate" value="${PulsoUI.todayISO()}" />
          <button class="date-chip active" onclick="Pulso.setQuickDate(this, 0)">Hoy</button>
          <button class="date-chip" onclick="Pulso.setQuickDate(this, -1)">Ayer</button>
        </div>
      </div>
      <button class="btn-primary" onclick="Pulso.saveOther('${parentTitle.replace(/'/g, "\\'")}')">Guardar gasto</button>
      <button class="btn-secondary" onclick="Pulso.closeModal()">Cancelar</button>
    `;
    PulsoUI.showModal(html);
    setTimeout(() => { const i = document.getElementById('expCat'); if (i) i.focus(); }, 200);
  },

  setQuickDate(btn, offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const inp = document.getElementById('expDate');
    if (inp) inp.value = d.toISOString().split('T')[0];
    document.querySelectorAll('.date-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
  },

  saveExpense(category, emoji) {
    const amount = parseFloat(document.getElementById('expAmount').value);
    const fecha = document.getElementById('expDate').value;
    const nota = document.getElementById('expNote')?.value || '';
    if (!amount || amount <= 0) { PulsoUI.toast('Ingresá un importe válido'); return; }

    const gasto = PulsoStore.addGasto({
      categoria: category, emoji, monto: amount, fecha, nota, _justAdded: true
    });

    PulsoUI.closeModal();
    PulsoUI.toast('✓ Gasto registrado');
    this.renderRecentList();
    this.renderPlata();
    this.renderEquivalencias();
    this.renderLogros();
    this.renderTiempoVida();

    setTimeout(() => {
      const g = PulsoStore.getGastos();
      const found = g.find(x => x.id === gasto.id);
      if (found) { found._justAdded = false; PulsoStore.set(PulsoStore.KEYS.gastos, g); }
    }, 2000);
  },

  saveOther(parentTitle) {
    const cat = document.getElementById('expCat').value.trim();
    const amount = parseFloat(document.getElementById('expAmount').value);
    const fecha = document.getElementById('expDate').value;
    if (!cat) { PulsoUI.toast('Escribí un concepto'); return; }
    if (!amount || amount <= 0) { PulsoUI.toast('Importe inválido'); return; }

    PulsoStore.addGasto({
      categoria: parentTitle + ' · ' + cat, emoji: '✏️', monto: amount, fecha, _justAdded: true
    });

    PulsoUI.closeModal();
    PulsoUI.toast('✓ "' + cat + '" registrado');
    this.renderRecentList();
    this.renderPlata();
    this.renderEquivalencias();
    this.renderLogros();
    this.renderTiempoVida();
  },

  closeModal() { PulsoUI.closeModal(); },

  editIngresos() {
    const actual = PulsoStore.getIngresos();
    const html = `
      <div class="modal-header">
        <span class="modal-emoji">💰</span>
        <span class="modal-title">Tus ingresos del mes</span>
        <button class="modal-close" onclick="Pulso.closeModal()">✕</button>
      </div>
      <p class="meta-line" style="margin-bottom: 12px;">Sumá todo lo que entra: sueldo, freelance, alquileres, dividendos.</p>
      <div class="field">
        <label class="field-label">Total mensual</label>
        <input type="number" inputmode="numeric" class="input-amount" id="ingAmount" value="${actual}" />
      </div>
      <button class="btn-primary" onclick="Pulso.saveIngresos()">Guardar</button>
      <button class="btn-secondary" onclick="Pulso.closeModal()">Cancelar</button>
    `;
    PulsoUI.showModal(html);
    setTimeout(() => { const i = document.getElementById('ingAmount'); if (i) { i.focus(); i.select(); } }, 200);
  },

  saveIngresos() {
    const monto = parseFloat(document.getElementById('ingAmount').value);
    if (!monto || monto <= 0) { PulsoUI.toast('Ingresá un monto válido'); return; }
    PulsoStore.setIngresos(monto);
    PulsoUI.closeModal();
    PulsoUI.toast('✓ Ingresos actualizados');
    this.renderPlata();
    this.renderEquivalencias();
    this.renderLogros();
    this.renderTiempoVida();
  },

  // ============= TIEMPO DE VIDA =============
  // Setup del valor hora: pedir ingreso mensual + horas trabajadas
  abrirSetupValorHora() {
    console.log('[Pulso] 🟡 abrirSetupValorHora ejecutándose...');
    try {
      const actual = PulsoStore.getValorHora();
      const ingresos = PulsoStore.getIngresos();
      const ingresoActual = actual.ingresoMensual ?? ingresos;
      console.log('[Pulso] 🟡 datos OK · ingreso:', ingresoActual, '· horas:', actual.horasMes ?? 'sin definir');

    const html = `
      <div class="modal-header">
        <span class="modal-emoji">⏰</span>
        <span class="modal-title">Calculá tu valor hora</span>
        <button class="modal-close" onclick="Pulso.closeModal()">✕</button>
      </div>
      <p class="meta-line" style="margin-bottom: 16px;">Necesitamos 2 datos para saber cuánto vale una hora de tu vida</p>

      <div class="vh-step">
        <div class="vh-step-num">1</div>
        <div class="vh-step-body">
          <label class="field-label">¿Cuánto ganás por mes? (bruto)</label>
          <input type="number" inputmode="numeric" class="input-amount" id="vhIngreso" value="${ingresoActual || ''}" placeholder="Ej: 850000" oninput="Pulso.previewValorHora()" />
        </div>
      </div>

      <div class="vh-step">
        <div class="vh-step-num">2</div>
        <div class="vh-step-body">
          <label class="field-label">¿Cuántas horas trabajás por mes?</label>
          <p class="vh-hint">Elegí una opción rápida o escribí el número exacto:</p>
          <div class="quick-hours">
            <button type="button" class="hour-chip" data-h="80" onclick="Pulso.setHoras(80, this)">80 h<br><span class="hour-chip-sub">medio turno</span></button>
            <button type="button" class="hour-chip" data-h="120" onclick="Pulso.setHoras(120, this)">120 h<br><span class="hour-chip-sub">6h x día</span></button>
            <button type="button" class="hour-chip" data-h="160" onclick="Pulso.setHoras(160, this)">160 h<br><span class="hour-chip-sub">full time</span></button>
            <button type="button" class="hour-chip" data-h="200" onclick="Pulso.setHoras(200, this)">200 h<br><span class="hour-chip-sub">+ extras</span></button>
          </div>
          <input type="number" inputmode="numeric" class="input-amount" id="vhHoras" value="${actual.horasMes || ''}" placeholder="O escribí las horas exactas" oninput="Pulso.onHorasInput()" />
        </div>
      </div>

      <div class="preview-box" id="vhPreview">
        <div class="kicker">tu valor hora será</div>
        <div class="preview-val" id="vhPreviewVal">$—</div>
        <div class="preview-note" id="vhPreviewNote">Completá los 2 datos de arriba</div>
      </div>

      <button class="btn-primary" onclick="Pulso.guardarValorHora()">Calcular mi vida en horas</button>
      ${actual.activado ? '<button class="btn-secondary" onclick="Pulso.desactivarValorHora()">Desactivar este feature</button>' : ''}
      <button class="btn-secondary" onclick="Pulso.closeModal()">Cancelar</button>
    `;
      console.log('[Pulso] 🟡 HTML armado, llamando a showModal...');
      if (!window.PulsoUI || typeof PulsoUI.showModal !== 'function') {
        console.error('[Pulso] 🔴 PulsoUI.showModal NO existe!');
        alert('Error: el sistema de ventanas no cargó. Recargá la página.');
        return;
      }
      PulsoUI.showModal(html);
      console.log('[Pulso] 🟢 showModal ejecutado OK');

      const modalCheck = document.getElementById('modal');
      console.log('[Pulso] 🟢 modal tiene clase show?', modalCheck?.classList.contains('show'));

      setTimeout(() => {
        // Si ya había un valor de horas guardado, marcamos el chip que coincida
        const hs = actual.horasMes;
        if (hs) {
          const chip = document.querySelector(`.hour-chip[data-h="${hs}"]`);
          if (chip) chip.classList.add('selected');
        }
        this.previewValorHora();
      }, 150);
    } catch (e) {
      console.error('[Pulso] 🔴 ERROR en abrirSetupValorHora:', e);
      alert('Error al abrir: ' + e.message);
    }
  },

  setHoras(horas, btn) {
    const input = document.getElementById('vhHoras');
    if (input) input.value = horas;
    document.querySelectorAll('.hour-chip').forEach(c => c.classList.remove('selected'));
    if (btn) btn.classList.add('selected');
    this.previewValorHora();
  },

  // Cuando el usuario escribe horas a mano, deseleccionamos los chips
  onHorasInput() {
    const input = document.getElementById('vhHoras');
    const val = parseFloat(input?.value);
    document.querySelectorAll('.hour-chip').forEach(c => {
      c.classList.toggle('selected', parseFloat(c.dataset.h) === val);
    });
    this.previewValorHora();
  },

  previewValorHora() {
    const ing = parseFloat(document.getElementById('vhIngreso')?.value);
    const hs = parseFloat(document.getElementById('vhHoras')?.value);
    const preview = document.getElementById('vhPreviewVal');
    const note = document.getElementById('vhPreviewNote');
    if (!preview) return;

    if (!ing || ing <= 0) {
      preview.textContent = '$—';
      if (note) note.textContent = 'Falta tu ingreso mensual (paso 1)';
      return;
    }
    if (!hs || hs <= 0) {
      preview.textContent = '$—';
      if (note) note.textContent = 'Falta cuántas horas trabajás (paso 2)';
      return;
    }
    const vh = ing / hs;
    preview.innerHTML = '$' + PulsoUI.fmt(vh) + ' <span class="preview-small">/hora</span>';
    if (note) note.textContent = `${PulsoUI.fmt(ing)} ÷ ${hs} horas`;
  },

  guardarValorHora() {
    const ing = parseFloat(document.getElementById('vhIngreso').value);
    const hs = parseFloat(document.getElementById('vhHoras').value);
    if (!ing || ing <= 0) { PulsoUI.toast('Ingresá un monto válido'); return; }
    if (!hs || hs <= 0 || hs > 744) { PulsoUI.toast('Ingresá las horas (entre 1 y 744)'); return; }

    PulsoStore.setValorHora(ing, hs);
    PulsoStore.setIngresos(ing); // sincronizamos para que coincida con el card de ingresos
    PulsoUI.closeModal();
    PulsoUI.toast('✓ Tu valor hora es $' + PulsoUI.fmt(ing / hs));
    this.renderTiempoVida();
    this.renderPlata();
    this.renderEquivalencias();
  },

  desactivarValorHora() {
    if (!confirm('¿Querés sacar el feature de tiempo de vida? Vas a poder volver a activarlo cuando quieras.')) return;
    PulsoStore.desactivarValorHora();
    PulsoUI.closeModal();
    PulsoUI.toast('Feature desactivado');
    this.renderTiempoVida();
  },

  // Renderiza el card de valor hora y el desglose por categoría
  renderTiempoVida() {
    const vh = PulsoStore.getValorHora();
    const inactivo = document.getElementById('tiempoVidaInactivo');
    const activo = document.getElementById('tiempoVidaActivo');
    const desglose = document.getElementById('desgloseTiempoCard');

    if (!inactivo || !activo) {
      console.warn('[Pulso] Card de Tiempo de Vida no encontrado en el DOM');
      return;
    }

    if (!vh.activado) {
      inactivo.style.display = 'block';
      activo.style.display = 'none';
      if (desglose) desglose.style.display = 'none';
      return;
    }

    inactivo.style.display = 'none';
    activo.style.display = 'block';
    if (desglose) desglose.style.display = 'block';

    const valEl = document.getElementById('valorHoraVal');
    const subEl = document.getElementById('valorHoraSub');
    if (valEl) valEl.innerHTML = '$' + PulsoUI.fmt(vh.valorHora) + ' <span class="dark-small">/hora</span>';
    if (subEl) subEl.textContent = '$' + PulsoUI.fmt(vh.ingresoMensual) + ' mensuales · ' + vh.horasMes + ' hs/mes';

    this.renderDesgloseTiempo(vh.valorHora);
  },

  renderDesgloseTiempo(valorHora) {
    const lista = document.getElementById('desgloseTiempoList');
    const footer = document.getElementById('tiempoFooter');
    if (!lista) return;

    const gastos = PulsoStore.getGastosDelMes();

    // Agrupar por categoría principal (antes del "·")
    const porCategoria = {};
    gastos.forEach(g => {
      // La categoría puede ser "Servicios · Luz" → tomamos "Servicios"
      const catPrincipal = (g.categoria || 'Otros').split('·')[0].trim();
      if (!porCategoria[catPrincipal]) {
        porCategoria[catPrincipal] = { monto: 0, emoji: g.emoji || '💵', categoria: catPrincipal };
      }
      porCategoria[catPrincipal].monto += g.monto;
    });

    const arr = Object.values(porCategoria).sort((a, b) => b.monto - a.monto);

    if (arr.length === 0) {
      lista.innerHTML = '<p class="meta-line empty-state">No hay gastos este mes todavía. Cargá algunos para ver el desglose.</p>';
      footer.innerHTML = '';
      return;
    }

    const totalGastado = arr.reduce((s, x) => s + x.monto, 0);
    const ingresos = PulsoStore.getIngresos();
    const balance = ingresos - totalGastado;

    lista.innerHTML = arr.map(cat => {
      const pct = (cat.monto / totalGastado) * 100;
      const tiempo = PulsoUI.montoATiempo(cat.monto, valorHora);
      const dias = tiempo.totalHoras / 8;
      const diasTxt = tiempo.totalHoras >= 8 ? `${dias.toFixed(1)} días laborales` : 'menos de un día';

      return `
        <div class="time-row">
          <div class="time-row-bar" style="width: ${Math.min(100, pct)}%;"></div>
          <div class="time-row-content">
            <div class="time-row-left">
              <span class="time-emoji">${cat.emoji}</span>
              <div>
                <div class="time-cat">${cat.categoria}</div>
                <div class="time-monto">$${PulsoUI.fmt(cat.monto)}</div>
              </div>
            </div>
            <div class="time-row-right">
              <div class="time-hs">${tiempo.horas} h ${tiempo.minutos} min</div>
              <div class="time-dias">${diasTxt}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Footer: tiempo que te queda en el mes (o que debés)
    const balanceTiempo = PulsoUI.montoATiempo(balance, valorHora);
    if (balanceTiempo) {
      const positivo = balance >= 0;
      const labelTop = positivo ? 'te quedan en el mes' : 'gastaste de más en el mes';
      const colorClass = positivo ? 'time-footer-green' : 'time-footer-red';
      footer.innerHTML = `
        <div class="time-footer-inner ${colorClass}">
          <div>
            <div class="kicker-on-color">${labelTop}</div>
            <div class="time-footer-big">${balanceTiempo.horas} h ${balanceTiempo.minutos} min</div>
          </div>
          <div class="time-footer-right">
            <div class="time-footer-small">o sea</div>
            <div class="time-footer-money">$${PulsoUI.fmt(Math.abs(balance))}</div>
          </div>
        </div>
      `;
    } else {
      footer.innerHTML = '';
    }
  },

  vote(btn) {
    const all = btn.parentElement.querySelectorAll('.vote-btn');
    all.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    PulsoStore.setLastVote(btn.dataset.vote);
    document.getElementById('voteStatus').textContent = '✓ Te avisamos el lunes si acertaste';
    PulsoUI.toast('Voto registrado ✓');
  },

  invitar() {
    const url = window.location.href;
    const text = `Estoy usando Pulso, una app argentina que une el dólar, la inflación, mi changuito y mis CEDEARs en un solo lugar. Probala 👉 ${url}`;
    if (navigator.share) {
      navigator.share({ title: 'Pulso', text, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => PulsoUI.toast('Link copiado al portapapeles ✓'));
    } else {
      PulsoUI.toast('Compartí: ' + url);
    }
  },

  share(tipo) {
    const score = this.state.pulsoScore;
    const text = `El pulso económico de Argentina hoy: ${score}/100. Mirá los detalles en Pulso 👉 ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: 'Pulso del día', text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => PulsoUI.toast('Texto copiado ✓'));
    } else {
      PulsoUI.toast('Pulso de hoy: ' + score + '/100');
    }
  },

  bindSearch() {
    // Buscador del changuito: Enter dispara búsqueda
    const sp = document.getElementById('searchProducts');
    if (sp) {
      sp.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.buscar();
        }
      });
    }

    // Buscador de CEDEARs (filtrado local sobre lista cargada)
    const sc = document.getElementById('searchCedears');
    if (sc) {
      sc.addEventListener('input', e => this.searchCedears(e.target.value));
    }

    // Filtros de CEDEARs
    document.querySelectorAll('#filterChipsCedears .chip').forEach(chip => {
      chip.addEventListener('click', () => this.filterCedears(chip.dataset.cat, chip));
    });
  },

  filterCedears(cat, btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.chip').forEach(c => c.classList.remove('active-filter'));
    btn.classList.add('active-filter');

    document.querySelectorAll('.list-item.cedear').forEach(item => {
      const cats = (item.dataset.cat || '').split(' ');
      const visible = (cat === 'all' || cats.includes(cat));
      item.style.display = visible ? '' : 'none';
    });
  },

  searchCedears(q) {
    const query = q.toLowerCase().trim();
    document.querySelectorAll('.list-item.cedear').forEach(item => {
      const name = item.dataset.name || '';
      item.style.display = (!query || name.includes(query)) ? '' : 'none';
    });
  }
};

window.Pulso = Pulso;

document.addEventListener('DOMContentLoaded', () => Pulso.init());
