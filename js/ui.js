/* ============================================
   PULSO · UTILIDADES DE UI
   Helpers de formato, modal, toast, score
   ============================================ */

const PulsoUI = {

  // ============= FORMATO DE NÚMEROS =============
  fmt(val, opts = {}) {
    const n = parseFloat(val);
    if (isNaN(n)) return '—';
    const decimals = opts.decimals ?? 0;
    return n.toLocaleString('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  fmtPct(val) {
    if (val == null || isNaN(val)) return '—';
    const sign = val >= 0 ? '+' : '';
    return sign + parseFloat(val).toFixed(2) + '%';
  },

  // ============= FECHAS =============
  fmtFecha(fechaISO) {
    if (!fechaISO) return '—';
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const f = new Date(fechaISO + 'T12:00:00');
    return `${f.getDate()} ${meses[f.getMonth()]} ${f.getFullYear()}`;
  },

  fmtFechaCompleta() {
    return new Date().toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  },

  todayISO() {
    return new Date().toISOString().split('T')[0];
  },

  // ============= PULSO DEL DÍA (score 0-100) =============
  calcPulso({ blueChg, riesgo, inflacion }) {
    let score = 50;

    // Riesgo país: menor es mejor
    if (riesgo < 500)       score += 15;
    else if (riesgo < 800)  score += 5;
    else if (riesgo < 1200) score -= 10;
    else if (riesgo < 2000) score -= 20;
    else                    score -= 30;

    // Inflación mensual: menor es mejor
    if (inflacion < 2)      score += 15;
    else if (inflacion < 4) score += 5;
    else if (inflacion < 7) score -= 10;
    else if (inflacion < 12) score -= 15;
    else                    score -= 20;

    // Variación blue (señal de calma/tensión)
    if (blueChg < -1)  score += 5;
    else if (blueChg > 3) score -= 5;

    score = Math.max(0, Math.min(100, Math.round(score)));

    let emoji, estado;
    if (score >= 70)      { emoji = '😊'; estado = 'Economía estable'; }
    else if (score >= 55) { emoji = '😐'; estado = 'Con algo de tensión'; }
    else if (score >= 40) { emoji = '😬'; estado = 'Tensión moderada'; }
    else if (score >= 25) { emoji = '😟'; estado = 'Situación difícil'; }
    else                  { emoji = '😰'; estado = 'Crisis severa'; }

    return { score, emoji, estado };
  },

  // ============= PILL DE VARIACIÓN =============
  pillFor(chg) {
    const cls = chg >= 0 ? 'pill-up' : 'pill-down';
    const sign = chg >= 0 ? '+' : '';
    return `<span class="pill ${cls}">${sign}${parseFloat(chg).toFixed(2)}%</span>`;
  },

  // ============= TIEMPO DE VIDA =============
  montoATiempo(monto, valorHora) {
    if (!valorHora || valorHora <= 0 || !monto) return null;
    const totalHoras = Math.abs(monto) / valorHora;
    const horas = Math.floor(totalHoras);
    const minutos = Math.round((totalHoras - horas) * 60);
    return { horas, minutos, totalHoras };
  },

  // ============= MODAL =============
  showModal(html) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    if (!modal || !content) return;
    content.innerHTML = html;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const modal = document.getElementById('modal');
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
  },

  // ============= TOAST =============
  _toastTimer: null,

  toast(msg, duration = 2500) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }
};

window.PulsoUI = PulsoUI;
