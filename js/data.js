/* ============================================
   PULSO · DATOS BASE
   Catálogo de productos (sin precios, solo metadata)
   CEDEARs (sin precios, solo metadata)
   Categorías de gastos
   ============================================ */

const PulsoData = {

  // ============= PRODUCTOS DEL CHANGUITO =============
  // Sin precios hardcodeados. Cuando integremos SEPA (oficial del gob)
  // los precios reales vendrán de ahí.
  productos: [
    // CARNES
    { id: 'carne-picada', emoji: '🥩', name: 'Carne picada común', sub: '1 kg', cat: 'carnes' },
    { id: 'pollo', emoji: '🍗', name: 'Pollo entero', sub: '1 kg', cat: 'carnes' },
    { id: 'asado-tira', emoji: '🥩', name: 'Asado de tira', sub: '1 kg', cat: 'carnes' },
    { id: 'milanesa-nalga', emoji: '🥩', name: 'Milanesas de nalga', sub: '1 kg', cat: 'carnes' },
    { id: 'matambre', emoji: '🥩', name: 'Matambre', sub: '1 kg', cat: 'carnes' },

    // VERDURA
    { id: 'tomate', emoji: '🍅', name: 'Tomate redondo', sub: '1 kg', cat: 'verdura' },
    { id: 'papa', emoji: '🥔', name: 'Papa', sub: '1 kg', cat: 'verdura' },
    { id: 'cebolla', emoji: '🧅', name: 'Cebolla', sub: '1 kg', cat: 'verdura' },
    { id: 'banana', emoji: '🍌', name: 'Banana', sub: '1 kg', cat: 'verdura' },
    { id: 'manzana', emoji: '🍏', name: 'Manzana roja', sub: '1 kg', cat: 'verdura' },
    { id: 'lechuga', emoji: '🥬', name: 'Lechuga criolla', sub: '1 unidad', cat: 'verdura' },
    { id: 'zanahoria', emoji: '🥕', name: 'Zanahoria', sub: '1 kg', cat: 'verdura' },

    // LÁCTEOS
    { id: 'leche-serenisima', emoji: '🥛', name: 'Leche La Serenísima', sub: '1 L entera', cat: 'lacteos' },
    { id: 'huevos', emoji: '🥚', name: 'Huevos blancos', sub: 'docena L', cat: 'lacteos' },
    { id: 'queso-cremoso', emoji: '🧀', name: 'Queso cremoso La Paulina', sub: '1 kg', cat: 'lacteos' },
    { id: 'manteca', emoji: '🧈', name: 'Manteca La Serenísima', sub: '200 g', cat: 'lacteos' },
    { id: 'yogur-bebible', emoji: '🥤', name: 'Yogur bebible Yogurísimo', sub: '1 L', cat: 'lacteos' },
    { id: 'dulce-leche', emoji: '🍯', name: 'Dulce de leche La Serenísima', sub: '400 g', cat: 'lacteos' },

    // ALMACÉN
    { id: 'pan-frances', emoji: '🍞', name: 'Pan francés', sub: '1 kg', cat: 'almacen' },
    { id: 'yerba-taragui', emoji: '🧉', name: 'Yerba Taragüí', sub: '1 kg', cat: 'almacen' },
    { id: 'aceite-natura', emoji: '🛢️', name: 'Aceite Natura', sub: '1,5 L girasol', cat: 'almacen' },
    { id: 'fideos-matarazzo', emoji: '🍝', name: 'Fideos Matarazzo', sub: '500 g spaghetti', cat: 'almacen' },
    { id: 'cafe-virginia', emoji: '☕', name: 'Café La Virginia', sub: '250 g molido', cat: 'almacen' },
    { id: 'arroz-gallo', emoji: '🍚', name: 'Arroz Gallo', sub: '1 kg', cat: 'almacen' },
    { id: 'azucar-ledesma', emoji: '🍬', name: 'Azúcar Ledesma', sub: '1 kg', cat: 'almacen' },
    { id: 'harina-pureza', emoji: '🌾', name: 'Harina 000 Pureza', sub: '1 kg', cat: 'almacen' },
    { id: 'lentejas', emoji: '🫘', name: 'Lentejas', sub: '500 g', cat: 'almacen' },
    { id: 'mayonesa', emoji: '🥗', name: 'Mayonesa Hellmann\'s', sub: '500 g', cat: 'almacen' },

    // LIMPIEZA
    { id: 'higienol', emoji: '🧻', name: 'Papel higiénico Higienol', sub: 'x 4', cat: 'limpieza' },
    { id: 'detergente-magistral', emoji: '🧴', name: 'Detergente Magistral', sub: '750 ml', cat: 'limpieza' },
    { id: 'jabon-polvo-ala', emoji: '🧼', name: 'Jabón en polvo Ala', sub: '3 kg', cat: 'limpieza' },
    { id: 'lavandina-ayudin', emoji: '🧽', name: 'Lavandina Ayudín', sub: '1 L', cat: 'limpieza' },
    { id: 'shampoo-sedal', emoji: '🧴', name: 'Shampoo Sedal', sub: '650 ml', cat: 'limpieza' },
    { id: 'desodorante-rexona', emoji: '🧴', name: 'Desodorante Rexona', sub: '150 ml', cat: 'limpieza' },

    // BEBIDAS
    { id: 'coca-cola', emoji: '🥤', name: 'Coca-Cola', sub: '2,25 L', cat: 'bebidas' },
    { id: 'agua-villavicencio', emoji: '💧', name: 'Agua Villavicencio', sub: '2 L sin gas', cat: 'bebidas' },
    { id: 'vino-norton', emoji: '🍷', name: 'Vino Norton Malbec', sub: '750 ml', cat: 'bebidas' },
    { id: 'cerveza-quilmes', emoji: '🍺', name: 'Cerveza Quilmes', sub: '1 L', cat: 'bebidas' },
    { id: 'gancia', emoji: '🍸', name: 'Gancia', sub: '950 ml', cat: 'bebidas' }
  ],

  productosDefault: [
    'carne-picada', 'leche-serenisima', 'pan-frances', 'huevos', 'yerba-taragui',
    'aceite-natura', 'tomate', 'fideos-matarazzo', 'cafe-virginia', 'higienol'
  ],

  // Nombres legibles de cada supermercado (clave = id que devuelve el proxy)
  supermercadosNombres: {
    dia: 'Día',
    carrefour: 'Carrefour',
    disco: 'Disco',
    jumbo: 'Jumbo',
    vea: 'Vea'
  },

  // ============= CEDEARS - SOLO METADATA =============
  // Los PRECIOS vienen de data912 en tiempo real
  cedears: [
    // USA TECH
    { id: 'AAPL', emoji: '🍎', name: 'AAPL', empresa: 'Apple', ratio: 10, mercado: 'USA', cat: 'usa tech' },
    { id: 'MSFT', emoji: '🪟', name: 'MSFT', empresa: 'Microsoft', ratio: 30, mercado: 'USA', cat: 'usa tech' },
    { id: 'NVDA', emoji: '💚', name: 'NVDA', empresa: 'Nvidia', ratio: 20, mercado: 'USA', cat: 'usa tech' },
    { id: 'GOOGL', emoji: '🔍', name: 'GOOGL', empresa: 'Alphabet', ratio: 58, mercado: 'USA', cat: 'usa tech' },
    { id: 'AMZN', emoji: '📦', name: 'AMZN', empresa: 'Amazon', ratio: 20, mercado: 'USA', cat: 'usa tech' },
    { id: 'META', emoji: '📘', name: 'META', empresa: 'Meta', ratio: 20, mercado: 'USA', cat: 'usa tech' },
    { id: 'AMD', emoji: '🔴', name: 'AMD', empresa: 'AMD', ratio: 5, mercado: 'USA', cat: 'usa tech' },
    { id: 'INTC', emoji: '🔵', name: 'INTC', empresa: 'Intel', ratio: 5, mercado: 'USA', cat: 'usa tech' },

    // USA CONSUMO
    { id: 'TSLA', emoji: '🚗', name: 'TSLA', empresa: 'Tesla', ratio: 30, mercado: 'USA', cat: 'usa consumo' },
    { id: 'KO', emoji: '🥤', name: 'KO', empresa: 'Coca-Cola', ratio: 7, mercado: 'USA', cat: 'usa consumo' },
    { id: 'NFLX', emoji: '🎬', name: 'NFLX', empresa: 'Netflix', ratio: 10, mercado: 'USA', cat: 'usa consumo' },
    { id: 'MCD', emoji: '🍔', name: 'MCD', empresa: 'McDonald\'s', ratio: 6, mercado: 'USA', cat: 'usa consumo' },
    { id: 'DISN', emoji: '🐭', name: 'DISN', empresa: 'Disney', ratio: 8, mercado: 'USA', cat: 'usa consumo' },
    { id: 'SBUX', emoji: '☕', name: 'SBUX', empresa: 'Starbucks', ratio: 5, mercado: 'USA', cat: 'usa consumo' },
    { id: 'NKE', emoji: '👟', name: 'NKE', empresa: 'Nike', ratio: 5, mercado: 'USA', cat: 'usa consumo' },
    { id: 'WMT', emoji: '🏪', name: 'WMT', empresa: 'Walmart', ratio: 5, mercado: 'USA', cat: 'usa consumo' },
    { id: 'BA', emoji: '✈️', name: 'BA', empresa: 'Boeing', ratio: 5, mercado: 'USA', cat: 'usa consumo' },

    // USA BANCA
    { id: 'V', emoji: '💳', name: 'V', empresa: 'Visa', ratio: 5, mercado: 'USA', cat: 'usa banca' },
    { id: 'MA', emoji: '💳', name: 'MA', empresa: 'Mastercard', ratio: 5, mercado: 'USA', cat: 'usa banca' },
    { id: 'JPM', emoji: '🏛️', name: 'JPM', empresa: 'JP Morgan', ratio: 5, mercado: 'USA', cat: 'usa banca' },
    { id: 'BAC', emoji: '🏦', name: 'BAC', empresa: 'Bank of America', ratio: 4, mercado: 'USA', cat: 'usa banca' },

    // USA ENERGÍA
    { id: 'XOM', emoji: '⛽', name: 'XOM', empresa: 'Exxon Mobil', ratio: 4, mercado: 'USA', cat: 'usa energia' },

    // ARGENTINA
    { id: 'MELI', emoji: '🛒', name: 'MELI', empresa: 'Mercado Libre', ratio: 1, mercado: 'ARG', cat: 'arg tech' },
    { id: 'YPFD', emoji: '🛢️', name: 'YPFD', empresa: 'YPF', ratio: 1, mercado: 'ARG', cat: 'arg energia' },
    { id: 'GGAL', emoji: '🏦', name: 'GGAL', empresa: 'Banco Galicia', ratio: 1, mercado: 'ARG', cat: 'arg banca' },
    { id: 'BMA', emoji: '🏛️', name: 'BMA', empresa: 'Banco Macro', ratio: 1, mercado: 'ARG', cat: 'arg banca' },
    { id: 'PAMP', emoji: '⚡', name: 'PAMP', empresa: 'Pampa Energía', ratio: 1, mercado: 'ARG', cat: 'arg energia' },
    { id: 'ALUA', emoji: '🏗️', name: 'ALUA', empresa: 'Aluar', ratio: 1, mercado: 'ARG', cat: 'arg consumo' },
    { id: 'TXAR', emoji: '🔩', name: 'TXAR', empresa: 'Ternium', ratio: 1, mercado: 'ARG', cat: 'arg energia' },
    { id: 'CEPU', emoji: '⚡', name: 'CEPU', empresa: 'Central Puerto', ratio: 1, mercado: 'ARG', cat: 'arg energia' },
    { id: 'TGSU2', emoji: '🔥', name: 'TGSU2', empresa: 'Transportadora Gas Sur', ratio: 1, mercado: 'ARG', cat: 'arg energia' }
  ],

  cedearsDefault: ['AAPL', 'TSLA', 'NVDA', 'KO', 'MELI'],

  // ============= SUBMENÚS DE GASTOS =============
  submenus: {
    servicios: {
      title: 'Servicios',
      emoji: '💡',
      items: [
        { label: 'Luz', emoji: '💡', hint: 'Edenor / Edesur' },
        { label: 'Gas', emoji: '🔥', hint: 'Metrogas / Naturgy' },
        { label: 'Agua', emoji: '💧', hint: 'AySA' },
        { label: 'Teléfono / Internet', emoji: '📞', hint: 'Movistar / Personal / Claro' },
        { label: 'Cable / TV', emoji: '📺', hint: 'Flow / DirecTV' },
        { label: 'Plataformas digitales', emoji: '🎬', hint: 'Netflix / Spotify / Disney+' },
        { label: 'Expensas', emoji: '🏢', hint: 'consorcio / barrio cerrado' },
        { label: 'Limpieza', emoji: '🧹', hint: 'doméstica / encargado' },
        { label: 'Seguridad', emoji: '🛡️', hint: 'alarma / vigilancia' }
      ]
    },
    impuestos: {
      title: 'Impuestos y tasas',
      emoji: '📋',
      items: [
        { label: 'Patente automotor', emoji: '🚗', hint: 'auto / moto' },
        { label: 'Embarcaciones', emoji: '⛵', hint: 'lancha / velero' },
        { label: 'Inmobiliario', emoji: '🏠', hint: 'ARBA / AGIP' },
        { label: 'Municipales', emoji: '🏛️', hint: 'ABL / tasas' },
        { label: 'AFIP / ARCA', emoji: '🧾', hint: 'monotributo / IIBB' }
      ]
    },
    mascotas: {
      title: 'Mascotas',
      emoji: '🐾',
      items: [
        { label: 'Comida', emoji: '🦴', hint: 'alimento / snacks' },
        { label: 'Veterinario', emoji: '🐕', hint: 'consultas / vacunas' },
        { label: 'Peluquería', emoji: '✂️', hint: 'baño / corte' }
      ]
    },
    otros: {
      title: 'Otros gastos',
      emoji: '➕',
      items: [
        { label: 'Comidas rápidas', emoji: '🍔', hint: 'delivery / take away' },
        { label: 'Mercado Libre', emoji: '🛵', hint: 'compras online' },
        { label: 'Cafetería', emoji: '☕', hint: 'café / merienda' },
        { label: 'Movilidad', emoji: '🚕', hint: 'taxi / Uber / SUBE' },
        { label: 'Otro (editar)', emoji: '✏️', hint: 'escribir concepto', editable: true }
      ]
    }
  },

  headlines: [
    { template: 'El blue está en {hl}{val}{/hl}. La inflación no para 📊' },
    { template: 'El dólar blue rompió los {hl}{val}{/hl}. ¿Aguantamos otra semana? 👀' },
    { template: 'Blue: {hl}{val}{/hl}. La diferencia con el oficial sigue en alza 📈' },
    { template: 'Hoy el blue está en {hl}{val}{/hl}. Ojo si tenés que comprar dólares 🇦🇷' }
  ]
};

window.PulsoData = PulsoData;
