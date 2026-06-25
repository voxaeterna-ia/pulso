import { useState, useRef, useEffect } from "react";
import { db } from './firebase.js';
import { collection, doc, setDoc, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const COLORS_OPCIONES = ["#1a5c4a","#1a4a5c","#5c3a1a","#3a1a5c","#1a5c2a","#5c1a1a","#1a3a5c","#5c4a1a","#5c1a3a","#1a5c5c"];
const ICONS_OPCIONES  = ["🍽️","☕","🧀","🧘","🎮","🌅","🛍️","🏖️","🎵","🏋️","🎨","🍷","🎭","🌿","🐴","🎯"];
const CATS = ["Gastronomía","Cafetería","Sabores Regionales","Relax","Diversión","Compras Locales","Playa & Aventura","Música & Arte","Deportes","Seguridad","Restobar","Heladerías","Excursiones","Balnearios","Otros"];

const COMERCIOS_INIT = [
  { id:"c1", name:"La Parrilla del Bosque", cat:"Gastronomía",        discountPin:"1234", adminPass:"parrilla2026", beneficio:"10% de descuento sobre el total de la cuenta. Válido de domingo a jueves, no acumulable con otras promociones.", whatsapp:"", maps:"", foto:"", color:"#1a5c4a", icon:"🍽️" },
  { id:"c2", name:"Café del Mar",           cat:"Cafetería",          discountPin:"2345", adminPass:"cafemar2026",  beneficio:"2 cafés o infusiones a elección sin cargo al consumir cualquier producto de pastelería.", whatsapp:"", maps:"", foto:"", color:"#1a4a5c", icon:"☕" },
  { id:"c3", name:"Sabores Gesell",         cat:"Sabores Regionales", discountPin:"3456", adminPass:"sabores2026", beneficio:"15% de descuento en toda la línea de productos artesanales, chocolates y dulces regionales.", whatsapp:"", maps:"", foto:"", color:"#5c3a1a", icon:"🧀" },
  { id:"c4", name:"Spa Pinos",              cat:"Relax",              discountPin:"4567", adminPass:"spap2026",    beneficio:"20% de descuento en masajes de 60 minutos o tratamientos faciales. Reserva previa requerida.", whatsapp:"", maps:"", foto:"", color:"#3a1a5c", icon:"🧘" },
  { id:"c5", name:"Aventura Costera",       cat:"Diversión",          discountPin:"5678", adminPass:"aven2026",   beneficio:"1 hora de alquiler de bicicleta sin cargo o 10% de descuento en excursiones grupales.", whatsapp:"", maps:"", foto:"", color:"#1a5c2a", icon:"🎮" },
  { id:"c6", name:"Atardecer Tour",         cat:"Atardecer Zelena",   discountPin:"6789", adminPass:"atard2026",  beneficio:"Paseo al atardecer en cuatriciclo para 2 personas con descuento del 25%.", whatsapp:"", maps:"", foto:"", color:"#5c1a1a", icon:"🌅" },
  { id:"c7", name:"Artesanías Gesell",      cat:"Compras Locales",    discountPin:"7890", adminPass:"arteg2026",  beneficio:"10% de descuento en toda la tienda de artesanías, tejidos y souvenirs locales.", whatsapp:"", maps:"", foto:"", color:"#1a3a5c", icon:"🛍️" },
  { id:"c8", name:"Surf & Bike",            cat:"Playa & Aventura",   discountPin:"8901", adminPass:"surf2026",   beneficio:"Kit de playa (reposera + sombrilla) sin cargo por 1 día, o 15% de descuento en clases de surf.", whatsapp:"", maps:"", foto:"", color:"#5c4a1a", icon:"🏖️" },
];

const CONFIG_INIT = {
  hotelNombre: "ZELENA VODA",
  hotelSubtitulo: "APART HOTEL",
  edicion: "EDICIÓN INVIERNO 2026",
  logoUrl: "",
  bienvenida: "Presentá este pasaporte en los comercios adheridos y disfrutá de beneficios exclusivos durante tu estadía.",
  despedida: "Disfrutá, descubrí y creá recuerdos inolvidables.\n¡Gracias por elegirnos! ♡",
};

const ADMIN_PASS = "zelena2026";
const uid = () => Math.random().toString(36).slice(2,9);
const fmtDate = d => d ? new Date(d+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'}) : '';
const fmtNow = () => { const n=new Date(); return n.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'})+' '+n.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}); };
const migrateComercio = c => ({ ...c, discountPin: c.discountPin||c.pin||"0000", adminPass: c.adminPass||(c.id+"pass"), whatsapp: c.whatsapp||"", instagram: c.instagram||"", facebook: c.facebook||"", destacado: c.destacado||false, voucherTexto: c.voucherTexto||"", voucherLimit: c.voucherLimit||0 });

const st = {
  btnGold:   { background:"#c9a84c", color:"#0d2340", border:"none", padding:"0.75rem 2rem", borderRadius:30, fontSize:"0.9rem", fontWeight:700, cursor:"pointer", letterSpacing:"0.05em", fontFamily:"'Playfair Display',serif" },
  btnOutline:{ background:"none", color:"#c9a84c", border:"1px solid #c9a84c", padding:"0.7rem 2rem", borderRadius:30, fontSize:"0.85rem", fontWeight:700, cursor:"pointer", fontFamily:"'Playfair Display',serif" },
  btnWA:     { background:"#25D366", color:"white", border:"none", padding:"0.75rem 2rem", borderRadius:30, fontSize:"0.9rem", fontWeight:700, cursor:"pointer", fontFamily:"sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", textDecoration:"none" },
  secTitle:  { fontSize:"0.62rem", letterSpacing:"0.2em", color:"#4a3728", textAlign:"center", margin:"1.3rem 0 0.75rem", fontFamily:"sans-serif", fontWeight:700 },
  gLabel:    { fontSize:"0.52rem", color:"#4a3728", letterSpacing:"0.13em", fontFamily:"sans-serif", fontWeight:700, textTransform:"uppercase", marginBottom:2 },
  gVal:      { fontSize:"0.82rem", color:"#0d2340", fontStyle:"italic" },
  aLabel:    { fontSize:"0.58rem", color:"#888", fontFamily:"sans-serif", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 },
  aInput:    { background:"#faf8f4", border:"1px solid #e0d8c8", borderRadius:8, padding:"0.55rem 0.8rem", color:"#0d2340", fontSize:"0.88rem", width:"100%", outline:"none", fontFamily:"'Playfair Display',serif" },
  rInput:    { background:"rgba(255,255,255,0.07)", border:"1px solid rgba(201,168,76,0.4)", borderRadius:10, padding:"0.65rem 0.9rem", color:"white", fontSize:"0.9rem", width:"100%", outline:"none", fontFamily:"'Playfair Display',serif" },
  rLabel:    { fontSize:"0.58rem", color:"rgba(201,168,76,0.7)", letterSpacing:"0.15em", fontFamily:"sans-serif", fontWeight:700, textTransform:"uppercase", marginBottom:4 },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#f5f0e8;font-family:'Playfair Display',serif;}
input,button,select,textarea{font-family:'Playfair Display',serif;}
.fade{animation:fadeIn .3s ease;}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes stampAnim{0%{transform:scale(2);opacity:0}60%{transform:scale(.9)}100%{transform:scale(1);opacity:1}}
.stamp-anim{animation:stampAnim .45s cubic-bezier(.36,.07,.19,.97);}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
.pulse{animation:pulse 1.6s infinite;}
`;

export default function App() {
  const ls = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
  const [comercios, setComerciosState] = useState([]);
  const [config, setConfig]     = useState(CONFIG_INIT);
  const [huespedes, setHuespedes] = useState([]);
  const [usos, setUsos]         = useState([]);
  const [currentUser, setCurrentUser] = useState(() => ls("zv_currentUser") || null);
  const [screen, setScreen]     = useState("landing");
  const [pendingComercio, setPendingComercio] = useState(null);
  const [voucherMode, setVoucherMode] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [comercioActivo, setComercioActivo] = useState(null);
  const [toast, setToast]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [forceDesktop, setForceDesktop] = useState(false);

  useEffect(() => { try { localStorage.setItem("zv_currentUser", JSON.stringify(currentUser)); } catch {} }, [currentUser]);

  // Firestore writes
  const fsComercio  = c   => setDoc(doc(db, 'comercios', c.id), c);
  const fsDelComercio = id => deleteDoc(doc(db, 'comercios', id));
  const fsConfig    = cfg => setDoc(doc(db, 'config', 'hotel'), cfg);
  const fsHuesped   = h   => setDoc(doc(db, 'huespedes', h.id), h);
  const fsAddUso    = uso => setDoc(doc(db, 'usos', uso.id), uso);

  // Firestore real-time listeners
  useEffect(() => {
    const loaded = { c:false, cfg:false, h:false, u:false };
    const check = () => { if (Object.values(loaded).every(Boolean)) setLoading(false); };

    let seeded = false;
    const unC = onSnapshot(collection(db, 'comercios'), async snap => {
      if (snap.empty && !seeded) {
        seeded = true;
        for (const c of COMERCIOS_INIT.map(migrateComercio)) await setDoc(doc(db,'comercios',c.id), c);
      } else if (!snap.empty) {
        setComerciosState(snap.docs.map(d => ({...d.data(), id:d.id})).map(migrateComercio));
      }
      loaded.c = true; check();
    });

    const unCfg = onSnapshot(doc(db, 'config', 'hotel'), async snap => {
      if (!snap.exists()) await setDoc(doc(db,'config','hotel'), CONFIG_INIT);
      else setConfig({ ...CONFIG_INIT, ...snap.data() });
      loaded.cfg = true; check();
    });

    const unH = onSnapshot(collection(db, 'huespedes'), snap => {
      setHuespedes(snap.docs.map(d => ({...d.data(), id:d.id})));
      loaded.h = true; check();
    });

    const unU = onSnapshot(collection(db, 'usos'), snap => {
      setUsos(snap.docs.map(d => ({...d.data(), id:d.id})));
      loaded.u = true; check();
    });

    return () => { unC(); unCfg(); unH(); unU(); };
  }, []);

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#0d2340",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1rem"}}>
      <div style={{width:60,height:60,border:"3px solid #c9a84c",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{color:"#e8c97a",fontSize:"0.72rem",fontFamily:"sans-serif",letterSpacing:"0.15em"}}>CARGANDO...</div>
    </div>
  );

  const isMobile = window.innerWidth <= 480 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const huesped  = huespedes.find(h => h.id === currentUser);
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  function LogoSVG({ size=48 }) {
    if (config.logoUrl) return <img src={config.logoUrl} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover"}} alt="logo"/>;
    return (
      <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
        <path d="M26 8 L20 20 L26 18 L32 20 Z" fill="#c9a84c"/>
        <path d="M18 14 L13 24 L18 22 L23 24 Z" fill="#c9a84c" opacity="0.8"/>
        <path d="M34 14 L29 24 L34 22 L39 24 Z" fill="#c9a84c" opacity="0.8"/>
        <path d="M8 30 Q15 26 26 28 Q37 26 44 30 Q37 34 26 32 Q15 34 8 30Z" fill="#c9a84c" opacity="0.5"/>
        <path d="M6 36 Q15 31 26 33 Q37 31 46 36 Q37 41 26 39 Q15 41 6 36Z" fill="#c9a84c" opacity="0.35"/>
      </svg>
    );
  }

  if (!isMobile && !forceDesktop) return (
    <div style={{minHeight:"100vh",background:"#0d2340",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",gap:"1.5rem"}}>
      <div style={{width:80,height:80,border:"2px solid #c9a84c",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}><LogoSVG size={48}/></div>
      <div style={{color:"#c9a84c",fontSize:"1.5rem",fontWeight:700,letterSpacing:"0.12em",textAlign:"center"}}>{config.hotelNombre}</div>
      <div style={{color:"#e8c97a",fontSize:"0.65rem",letterSpacing:"0.22em",textAlign:"center"}}>PASAPORTE DE BENEFICIOS</div>
      <div style={{width:50,height:1,background:"#c9a84c"}}/>
      <div style={{fontSize:"3.5rem"}}>📱</div>
      <div style={{color:"white",fontSize:"1.1rem",fontStyle:"italic",textAlign:"center",maxWidth:360,lineHeight:1.5}}>Esta app está diseñada<br/>para celulares.</div>
      <div style={{color:"#e8c97a",fontSize:"0.78rem",fontFamily:"sans-serif",textAlign:"center",maxWidth:320,lineHeight:1.7}}>Escaneá el QR con tu teléfono<br/>o ingresá desde el navegador de tu celular.</div>
      <button onClick={() => setForceDesktop(true)} style={{background:"none",border:"1px solid rgba(201,168,76,0.35)",color:"rgba(201,168,76,0.6)",fontSize:"0.65rem",fontFamily:"sans-serif",letterSpacing:"0.1em",cursor:"pointer",padding:"0.6rem 1.4rem",borderRadius:20,marginTop:"0.5rem"}}>Continuar desde computadora →</button>
      <div style={{color:"rgba(201,168,76,0.3)",fontSize:"0.58rem",fontFamily:"sans-serif",letterSpacing:"0.15em"}}>ZELENA VODA — VILLA GESELL</div>
    </div>
  );

  // ── LANDING ────────────────────────────────────────────────────────────────
  function LandingScreen() {
    const [showAdmin, setShowAdmin] = useState(false);
    return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem 1.5rem",gap:"0.8rem"}}>
        <div style={{background:"#1a3558",borderRadius:18,border:"1.5px solid #c9a84c",padding:"2.5rem 2rem",width:"100%",maxWidth:340,display:"flex",flexDirection:"column",alignItems:"center",gap:"0.6rem"}}>
          <div style={{width:76,height:76,border:"2px solid #c9a84c",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4,overflow:"hidden"}}><LogoSVG size={56}/></div>
          <div style={{color:"#c9a84c",fontSize:"1.4rem",fontWeight:700,letterSpacing:"0.12em",textAlign:"center"}}>{config.hotelNombre}</div>
          <div style={{color:"#e8c97a",fontSize:"0.6rem",letterSpacing:"0.25em",textAlign:"center"}}>{config.hotelSubtitulo}</div>
          <div style={{width:50,height:1,background:"#c9a84c",margin:"0.3rem 0"}}/>
          <div style={{color:"#c9a84c",fontSize:"1.7rem",fontWeight:700,letterSpacing:"0.08em",textAlign:"center"}}>PASAPORTE</div>
          <div style={{color:"#e8c97a",fontSize:"0.6rem",letterSpacing:"0.2em",textAlign:"center"}}>DE BENEFICIOS</div>
          <div style={{color:"#e8c97a",fontSize:"0.6rem",letterSpacing:"0.15em",marginTop:2}}>{config.edicion}</div>
          <button onClick={() => setScreen("register")} style={{...st.btnGold,width:"100%",marginTop:"1rem"}}>Crear mi Pasaporte</button>
          {huespedes.length > 0 && (
            <button onClick={() => { const id = currentUser || huespedes[huespedes.length-1].id; setCurrentUser(id); setScreen("passport"); }} style={{...st.btnOutline,width:"100%"}}>Abrir mi Pasaporte</button>
          )}
        </div>
        <div style={{display:"flex",gap:"0.7rem",marginTop:"0.5rem"}}>
          <button onClick={() => setShowAdmin(v => !v)} style={{background:"none",border:"1px solid rgba(201,168,76,0.2)",color:"rgba(201,168,76,0.4)",fontSize:"0.58rem",fontFamily:"sans-serif",letterSpacing:"0.1em",cursor:"pointer",padding:"0.5rem 0.9rem",borderRadius:20}}>🏨 ADMIN HOTEL</button>
          <button onClick={() => setScreen("comerciologin")} style={{background:"none",border:"1px solid rgba(201,168,76,0.2)",color:"rgba(201,168,76,0.4)",fontSize:"0.58rem",fontFamily:"sans-serif",letterSpacing:"0.1em",cursor:"pointer",padding:"0.5rem 0.9rem",borderRadius:20}}>🏪 ADMIN COMERCIO</button>
        </div>
        {showAdmin && <button onClick={() => setScreen("adminlogin")} style={{...st.btnGold,fontSize:"0.75rem",padding:"0.6rem 1.5rem"}}>Ingresar como Admin Hotel</button>}
      </div>
    );
  }

  // ── REGISTER ───────────────────────────────────────────────────────────────
  function RegisterScreen() {
    const [form, setForm] = useState({nombre:"",apellido:"",mail:"",fnac:"",desde:"",hasta:""});
    const [err, setErr]   = useState("");
    const set = k => e => setForm(f => ({...f,[k]:e.target.value}));
    const submit = async () => {
      if (!form.nombre||!form.apellido||!form.mail||!form.fnac||!form.desde||!form.hasta) return setErr("Completá todos los campos.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail)) return setErr("Ingresá un email válido.");
      if (form.desde > form.hasta) return setErr("Las fechas de estadía no son válidas.");
      const h = {id:uid(),nombre:form.nombre,apellido:form.apellido,mail:form.mail,fnac:form.fnac,desde:form.desde,hasta:form.hasta,creado:new Date().toISOString().slice(0,10),activo:true};
      await fsHuesped(h); setCurrentUser(h.id); setScreen("passport");
    };
    return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",padding:"2rem 1.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.2rem"}}>
        <div style={{color:"#c9a84c",fontSize:"0.65rem",letterSpacing:"0.22em",fontFamily:"sans-serif",fontWeight:700}}>{config.hotelNombre} — REGISTRO</div>
        <div style={{color:"#c9a84c",fontSize:"1.4rem",fontStyle:"italic",textAlign:"center"}}>Creá tu Pasaporte</div>
        <div style={{background:"#1a3558",borderRadius:16,border:"1.5px solid #c9a84c",padding:"1.5rem 1.4rem",width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:"1rem"}}>
          {[["nombre","Nombre"],["apellido","Apellido"]].map(([k,l]) => (
            <div key={k}><div style={st.rLabel}>{l}</div><input value={form[k]} onChange={set(k)} placeholder={l} style={st.rInput}/></div>
          ))}
          <div><div style={st.rLabel}>Email</div><input type="email" value={form.mail} onChange={set("mail")} placeholder="tu@email.com" inputMode="email" style={st.rInput}/></div>
          <div><div style={st.rLabel}>Fecha de Nacimiento</div><input type="date" value={form.fnac} onChange={set("fnac")} style={st.rInput}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
            <div><div style={st.rLabel}>Check-in</div><input type="date" value={form.desde} onChange={set("desde")} style={st.rInput}/></div>
            <div><div style={st.rLabel}>Check-out</div><input type="date" value={form.hasta} onChange={set("hasta")} style={st.rInput}/></div>
          </div>
          {err && <div style={{color:"#f97",fontSize:"0.72rem",fontFamily:"sans-serif",textAlign:"center"}}>{err}</div>}
          <button onClick={submit} style={{...st.btnGold,width:"100%"}}>Crear mi Pasaporte</button>
        </div>
        <button onClick={() => setScreen("landing")} style={{background:"none",border:"none",color:"#e8c97a",fontSize:"0.75rem",cursor:"pointer",fontFamily:"sans-serif"}}>← Volver</button>
      </div>
    );
  }

  // ── PASSPORT ───────────────────────────────────────────────────────────────
  function PassportScreen() {
    const h = huesped;
    if (h.activo === false) return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",gap:"1.2rem",textAlign:"center"}}>
        <div style={{fontSize:"3rem"}}>🔒</div>
        <div style={{color:"#c9a84c",fontSize:"1.2rem",fontFamily:"'Playfair Display',serif",fontWeight:700}}>Pasaporte Desactivado</div>
        <div style={{color:"rgba(232,201,122,0.7)",fontSize:"0.82rem",fontFamily:"sans-serif",lineHeight:1.7,maxWidth:280}}>Tu pasaporte fue desactivado por el hotel. Para más información acercate a recepción.</div>
        <div style={{color:"rgba(201,168,76,0.35)",fontSize:"0.6rem",fontFamily:"sans-serif",letterSpacing:"0.15em",marginTop:"1rem"}}>{config.hotelNombre}</div>
      </div>
    );
    return (
      <div className="fade" style={{background:"#f5f0e8",minHeight:"100vh",paddingBottom:"2rem",overflowY:"auto"}}>
        <div style={{background:"#0d2340",padding:"1rem 1.4rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={() => setScreen("landing")} style={{background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontSize:"1.1rem"}}>⟵</button>
          <span style={{color:"#c9a84c",fontSize:"0.85rem",letterSpacing:"0.1em",fontWeight:700}}>PASAPORTE DE BENEFICIOS</span>
          <span style={{color:"#e8c97a",fontSize:"0.65rem",fontFamily:"sans-serif"}}>ZV</span>
        </div>
        <div style={{background:"#ede5d4",margin:"1.2rem 1.2rem 0",borderRadius:14,border:"1px solid #c9a84c",padding:"1.1rem 1.4rem",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,top:"50%",transform:"translateY(-50%) rotate(90deg)",color:"rgba(201,168,76,0.08)",fontSize:"1.8rem",fontWeight:700,letterSpacing:"0.15em",whiteSpace:"nowrap",fontFamily:"sans-serif"}}>{config.hotelNombre}</div>
          <div style={{fontSize:"0.55rem",color:"#4a3728",letterSpacing:"0.18em",fontFamily:"sans-serif",fontWeight:700,marginBottom:4}}>PASAPORTE DEL HUÉSPED</div>
          <div style={{fontSize:"1.1rem",color:"#0d2340",fontStyle:"italic",marginBottom:6}}>{h.nombre} {h.apellido}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.4rem"}}>
            <div><div style={st.gLabel}>Check-in</div><div style={st.gVal}>{fmtDate(h.desde)}</div></div>
            <div><div style={st.gLabel}>Check-out</div><div style={st.gVal}>{fmtDate(h.hasta)}</div></div>
          </div>
          <div style={{fontSize:"0.62rem",color:"#0d2340",fontFamily:"monospace",letterSpacing:"0.06em",marginTop:6}}>N.º ZV-{h.id.slice(0,6).toUpperCase()}</div>
        </div>
        {config.bienvenida && (
          <div style={{margin:"0.8rem 1.2rem 0",background:"rgba(201,168,76,0.08)",borderRadius:10,padding:"0.8rem 1rem",borderLeft:"3px solid #c9a84c"}}>
            <div style={{fontSize:"0.72rem",color:"#4a3728",fontFamily:"sans-serif",lineHeight:1.6,fontStyle:"italic"}}>{config.bienvenida}</div>
          </div>
        )}
        {(() => {
          const dest = comercios.filter(c => c.destacado);
          if (!dest.length) return null;
          return (
            <div onClick={() => setScreen("vouchers")} style={{margin:"1rem 1.2rem 0",background:"linear-gradient(135deg,#faf4e8 0%,#f5edcf 100%)",borderRadius:16,border:"1.5px solid #c9a84c",padding:"1.1rem 1.3rem",boxShadow:"0 2px 12px rgba(201,168,76,0.18)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"0.8rem"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{fontSize:"1rem"}}>✨</span>
                  <span style={{fontSize:"0.68rem",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.16em",color:"#0d2340",textTransform:"uppercase"}}>Vouchers Destacados</span>
                </div>
                <div style={{fontSize:"0.78rem",color:"#4a3728",fontFamily:"sans-serif",marginBottom:3}}>{dest.length} beneficio{dest.length!==1?"s":""} especial{dest.length!==1?"es":""} disponible{dest.length!==1?"s":""}</div>
                <div style={{fontSize:"0.65rem",color:"rgba(10,35,64,0.5)",fontFamily:"sans-serif",fontStyle:"italic"}}>Beneficios especiales durante tu estadía</div>
              </div>
              <div style={{background:"#0d2340",color:"#c9a84c",borderRadius:20,padding:"0.45rem 0.9rem",fontSize:"0.68rem",fontFamily:"sans-serif",fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>Ver vouchers →</div>
            </div>
          );
        })()}
        <div style={st.secTitle}>— BENEFICIOS EXCLUSIVOS —</div>
        <div style={{padding:"0 1.2rem",display:"flex",flexDirection:"column",gap:"0.65rem"}}>
          {comercios.map(comercio => {
            const cnt = usos.filter(u => u.comercioId===comercio.id && u.huespedId===h.id).length;
            return (
              <div key={comercio.id} onClick={() => { setPendingComercio(comercio); setVoucherMode(false); setScreen("detail"); }}
                style={{background:"white",borderRadius:12,border:"1px solid #ede5d4",display:"flex",alignItems:"stretch",overflow:"hidden",boxShadow:"0 1px 5px rgba(0,0,0,0.06)",cursor:"pointer"}}>
                <div style={{width:60,background:comercio.color||"#1a5c4a",display:"flex",alignItems:"center",justifyContent:"center",padding:"0.6rem 0.3rem",flexShrink:0}}>
                  <span style={{fontSize:"1.6rem"}}>{comercio.icon||"🏪"}</span>
                </div>
                <div style={{flex:1,padding:"0.65rem 0.8rem",minWidth:0}}>
                  <div style={{fontSize:"0.52rem",color:"#888",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase"}}>{comercio.cat}</div>
                  <div style={{fontSize:"0.88rem",color:"#0d2340",fontStyle:"italic",lineHeight:1.2,margin:"2px 0"}}>{comercio.name}</div>
                  <div style={{fontSize:"0.63rem",color:"#666",fontFamily:"sans-serif",lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{comercio.beneficio}</div>
                </div>
                <div style={{width:50,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderLeft:"1px dashed #ede5d4",flexShrink:0,gap:3}}>
                  {cnt > 0
                    ? <div style={{width:36,height:36,borderRadius:"50%",background:comercio.color||"#1a5c4a",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{color:"white",fontSize:"0.75rem",fontFamily:"sans-serif",fontWeight:700}}>×{cnt}</span>
                      </div>
                    : <span style={{fontSize:"0.4rem",color:"#ccc",fontFamily:"sans-serif",textAlign:"center",lineHeight:1.3,textTransform:"uppercase"}}>VER<br/>BENEFICIO</span>
                  }
                  <span style={{fontSize:"0.6rem",color:"#aaa"}}>›</span>
                </div>
              </div>
            );
          })}
        </div>
        {config.despedida && (
          <div style={{textAlign:"center",padding:"1.5rem 1.5rem 0.5rem",fontStyle:"italic",fontSize:"0.72rem",color:"#4a3728"}}>
            {config.despedida.split('\n').map((l,i) => <div key={i}>{l}</div>)}
          </div>
        )}
      </div>
    );
  }

  // ── DETAIL ─────────────────────────────────────────────────────────────────
  function DetailScreen() {
    const c = pendingComercio;
    if (!c) return (
      <div style={{background:"#f5f0e8",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1rem",padding:"2rem"}}>
        <div style={{fontSize:"2rem"}}>⚠️</div>
        <div style={{color:"#0d2340",fontSize:"0.9rem",fontFamily:"sans-serif",textAlign:"center"}}>No se encontró el comercio.</div>
        <button onClick={() => setScreen("passport")} style={st.btnGold}>← Volver</button>
      </div>
    );
    const color = c.color||"#1a5c4a";
    const icon  = c.icon||"🏪";
    const cnt   = usos.filter(u => u.comercioId===c.id && u.huespedId===huesped?.id).length;
    const waLink = c.whatsapp ? `https://wa.me/${c.whatsapp.replace(/\D/g,'')}` : null;
    const textoMostrado = voucherMode && c.voucherTexto ? c.voucherTexto : c.beneficio;
    const backScreen = voucherMode ? "vouchers" : "passport";
    return (
      <div className="fade" style={{background:"#f5f0e8",minHeight:"100vh",paddingBottom:"2rem",overflowY:"auto"}}>
        <div style={{background:"#0d2340",padding:"1rem 1.4rem",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={() => setScreen(backScreen)} style={{background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontSize:"1.1rem"}}>⟵</button>
          <span style={{color:"#c9a84c",fontSize:"0.85rem",letterSpacing:"0.1em",fontWeight:700,flex:1,textAlign:"center"}}>{voucherMode ? "✨ VOUCHER DESTACADO" : (c.cat||"").toUpperCase()}</span>
          <div style={{width:24}}/>
        </div>
        {voucherMode && (
          <div style={{background:"linear-gradient(90deg,#c9a84c,#e8c97a)",padding:"0.3rem 1rem",display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:"0.58rem",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.14em",color:"#0d2340",textTransform:"uppercase"}}>✨ Promoción especial para huéspedes</span>
          </div>
        )}
        {c.foto
          ? <div style={{width:"100%",maxHeight:220,overflow:"hidden",background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <img src={c.foto} style={{width:"100%",height:"auto",maxHeight:220,objectFit:"contain",display:"block"}} alt="foto"/>
            </div>
          : <div style={{height:130,background:color,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {icon && <div style={{width:80,height:80,borderRadius:"50%",border:"3px solid rgba(255,255,255,0.6)",background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.5rem"}}>{icon}</div>}
            </div>
        }
        <div style={{padding:"1.4rem",display:"flex",flexDirection:"column",gap:"0.9rem"}}>
          <div>
            <div style={{fontSize:"1.5rem",color:"#0d2340",fontStyle:"italic",lineHeight:1.1,marginBottom:3}}>{c.name}</div>
            <div style={{fontSize:"0.78rem",color:"#4a3728",fontFamily:"sans-serif"}}>{c.cat}</div>
          </div>
          <div style={{background:"#0d2340",borderRadius:12,padding:"1.1rem",border:voucherMode?"1.5px solid #c9a84c":"none"}}>
            <div style={{fontSize:"0.55rem",letterSpacing:"0.15em",color:"#e8c97a",fontFamily:"sans-serif",fontWeight:700,marginBottom:"0.5rem"}}>{voucherMode ? "✨ TU VOUCHER DESTACADO:" : "PRESENTANDO ESTE PASAPORTE OBTENÉS:"}</div>
            <div style={{color:"white",fontSize:"0.88rem",fontFamily:"sans-serif",lineHeight:1.6}}>{textoMostrado}</div>
            {c.maps && (
              <div style={{marginTop:"0.7rem",paddingTop:"0.6rem",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
                <a href={c.maps} target="_blank" rel="noreferrer" style={{fontSize:"0.65rem",color:"#5ab4ff",fontFamily:"sans-serif",fontWeight:700,textDecoration:"none"}}>📍 Ver en Google Maps →</a>
              </div>
            )}
          </div>
          {cnt > 0 && (
            <div style={{background:color,color:"white",borderRadius:10,padding:"0.8rem",textAlign:"center",fontFamily:"sans-serif",fontSize:"0.78rem"}}>
              ✓ Usaste este descuento {cnt === 1 ? "1 vez" : `${cnt} veces`} en tu estadía
            </div>
          )}
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer" style={st.btnWA}>
              <span style={{fontSize:"1.1rem"}}>💬</span> Contactar por WhatsApp
            </a>
          )}
          {c.instagram && (
            <a href={c.instagram} target="_blank" rel="noreferrer" style={{...st.btnWA,background:"#E1306C",textDecoration:"none"}}>
              <span style={{fontSize:"1.1rem"}}>📸</span> Ver en Instagram
            </a>
          )}
          {c.facebook && (
            <a href={c.facebook} target="_blank" rel="noreferrer" style={{...st.btnWA,background:"#1877F2",textDecoration:"none"}}>
              <span style={{fontSize:"1.1rem"}}>👍</span> Ver en Facebook
            </a>
          )}
          {(() => {
            const totalUsos = usos.filter(u => u.comercioId===c.id).length;
            const lim = c.voucherLimit||0;
            const agotado = voucherMode && lim > 0 && totalUsos >= lim;
            const restantes = voucherMode && lim > 0 ? lim - totalUsos : null;
            return agotado
              ? <div style={{background:"#eee",borderRadius:12,padding:"1rem",textAlign:"center",color:"#999",fontFamily:"sans-serif",fontSize:"0.8rem"}}>🚫 Los vouchers de esta promoción ya se agotaron</div>
              : <>
                  {restantes !== null && <div style={{background:"rgba(201,168,76,0.12)",borderRadius:10,padding:"0.5rem 0.9rem",textAlign:"center",color:"#4a3728",fontFamily:"sans-serif",fontSize:"0.72rem",border:"1px solid rgba(201,168,76,0.3)"}}>✨ Quedan <strong>{restantes}</strong> voucher{restantes!==1?"s":""} disponible{restantes!==1?"s":""}</div>}
                  <button onClick={() => setScreen("pinentry")} style={{...st.btnGold,width:"100%"}}>
                    Usar descuento — Ingresar PIN 🔑
                  </button>
                </>;
          })()}
        </div>
      </div>
    );
  }

  // ── PIN ENTRY ──────────────────────────────────────────────────────────────
  function PinEntryScreen() {
    const ref0 = useRef(); const ref1 = useRef(); const ref2 = useRef(); const ref3 = useRef();
    const refs = [ref0, ref1, ref2, ref3];
    const [pin, setPin]           = useState(["","","",""]);
    const [err, setErr]           = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const c = pendingComercio;
    if (!c) return (
      <div style={{background:"#0d2340",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1rem",padding:"2rem"}}>
        <div style={{color:"#c9a84c",fontSize:"0.9rem",fontFamily:"sans-serif",textAlign:"center"}}>No hay comercio seleccionado.</div>
        <button onClick={() => setScreen("passport")} style={st.btnGold}>← Volver</button>
      </div>
    );
    const color = c.color||"#1a5c4a";
    const icon  = c.icon||"🏪";
    const handleDigit = (i, v) => {
      if (!/^\d?$/.test(v)) return;
      const np = [...pin]; np[i] = v; setPin(np);
      if (v && i < 3) refs[i+1].current?.focus();
    };
    const confirm = async () => {
      const cFresh = comercios.find(x => x.id === c.id);
      if (voucherMode) {
        const totalUsos = usos.filter(u => u.comercioId===c.id).length;
        if (cFresh.voucherLimit > 0 && totalUsos >= cFresh.voucherLimit) { setErr("Los vouchers de esta promoción ya se agotaron."); return; }
      }
      if (pin.join("") !== cFresh.discountPin) { setErr("PIN incorrecto. Pedíselo al comerciante."); setPin(["","","",""]); refs[0].current?.focus(); return; }
      setErr(""); setConfirmed(true);
      const uso = { id:uid(), comercioId:c.id, comercioName:c.name, comercioIcon:c.icon, huespedId:currentUser, huespedNombre:`${huesped.nombre} ${huesped.apellido}`, fechaHora:fmtNow() };
      await fsAddUso(uso);
      showToast("¡Descuento aplicado! ✓");
      setTimeout(() => { setPendingComercio(null); setScreen("passport"); }, 2200);
    };
    return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",padding:"2rem 1.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.2rem"}}>
        <div style={{width:"100%"}}><button onClick={() => setScreen("detail")} style={{background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontSize:"1.1rem"}}>⟵</button></div>
        {voucherMode && <div style={{background:"linear-gradient(90deg,#c9a84c,#e8c97a)",padding:"0.25rem 1rem",width:"100%",textAlign:"center"}}><span style={{fontSize:"0.58rem",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.12em",color:"#0d2340"}}>✨ VOUCHER DESTACADO</span></div>}
        {!confirmed ? <>
          <div style={{color:"#c9a84c",fontSize:"0.65rem",letterSpacing:"0.22em",fontFamily:"sans-serif",fontWeight:700,textAlign:"center"}}>USAR DESCUENTO EN</div>
          <div style={{background:color,width:80,height:80,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.5rem",border:"3px solid #c9a84c"}}>{icon}</div>
          <div style={{textAlign:"center"}}>
            <div style={{color:"#c9a84c",fontSize:"1.1rem",fontStyle:"italic"}}>{c.name}</div>
            <div style={{color:"#e8c97a",fontSize:"0.72rem",fontFamily:"sans-serif",marginTop:4,maxWidth:260,lineHeight:1.4}}>{voucherMode && c.voucherTexto ? c.voucherTexto : c.beneficio}</div>
          </div>
          <div style={{color:"#e8c97a",fontSize:"0.72rem",fontFamily:"sans-serif",textAlign:"center",marginTop:4}}>
            Pedile al comerciante su <strong style={{color:"#c9a84c"}}>PIN de descuento:</strong>
          </div>
          <div style={{display:"flex",gap:"0.7rem"}}>
            {pin.map((v,i) => (
              <input key={i} ref={refs[i]} value={v} onChange={e => handleDigit(i, e.target.value)} maxLength={1} inputMode="numeric"
                style={{width:52,height:60,textAlign:"center",fontSize:"1.6rem",fontWeight:700,background:"#1a3558",border:`2px solid ${v?"#c9a84c":"rgba(201,168,76,0.3)"}`,borderRadius:12,color:"white",outline:"none"}}/>
            ))}
          </div>
          {err && <div style={{color:"#f97",fontSize:"0.72rem",fontFamily:"sans-serif",textAlign:"center"}}>{err}</div>}
          <button onClick={confirm} disabled={pin.some(v => !v)} style={{...st.btnGold,width:200,opacity:pin.some(v=>!v)?0.4:1}}>Confirmar PIN</button>
          <div style={{color:"rgba(201,168,76,0.3)",fontSize:"0.6rem",fontFamily:"sans-serif",textAlign:"center",lineHeight:1.6,maxWidth:260}}>El PIN te lo entrega el comerciante al realizar tu consumo.</div>
        </> : (
          <div className="fade" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",marginTop:"2rem"}}>
            <div className="stamp-anim" style={{background:color,width:100,height:100,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"3rem",border:"4px solid #c9a84c"}}>{icon}</div>
            <div style={{color:"#c9a84c",fontSize:"1.3rem",fontStyle:"italic",textAlign:"center"}}>¡Descuento aplicado!</div>
            <div style={{color:"#e8c97a",fontSize:"0.78rem",fontFamily:"sans-serif",textAlign:"center"}}>{c.name}</div>
          </div>
        )}
      </div>
    );
  }

  // ── COMERCIO LOGIN ─────────────────────────────────────────────────────────
  function ComercioLoginScreen() {
    const [selId, setSelId] = useState("");
    const [pass, setPass]   = useState("");
    const [err, setErr]     = useState("");
    const login = () => {
      const c = comercios.find(x => x.id === selId);
      if (!c) return setErr("Seleccioná tu comercio.");
      if (c.adminPass !== pass) return setErr("Contraseña incorrecta.");
      setComercioActivo(c); setScreen("comerciopanel");
    };
    return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",padding:"2.5rem 1.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.2rem"}}>
        <button onClick={() => setScreen("landing")} style={{alignSelf:"flex-start",background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontFamily:"sans-serif",fontSize:"0.8rem"}}>← Volver</button>
        <div style={{fontSize:"2rem"}}>🏪</div>
        <div style={{color:"#c9a84c",fontSize:"1.2rem",fontWeight:700,letterSpacing:"0.08em",textAlign:"center"}}>ACCESO COMERCIOS</div>
        <div style={{color:"#e8c97a",fontSize:"0.62rem",fontFamily:"sans-serif",letterSpacing:"0.15em",textAlign:"center"}}>{config.hotelNombre} — PANEL COMERCIO</div>
        <div style={{background:"#1a3558",borderRadius:16,border:"1.5px solid #c9a84c",padding:"1.5rem 1.4rem",width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div>
            <div style={st.rLabel}>Tu Comercio</div>
            <select value={selId} onChange={e => { setSelId(e.target.value); setErr(""); }} style={{...st.rInput,color:selId?"white":"rgba(255,255,255,0.5)",background:"#1a3558"}}>
              <option value="">— Seleccioná tu comercio —</option>
              {comercios.map(c => <option key={c.id} value={c.id} style={{color:"white",background:"#1a3558"}}>{c.name}</option>)}
            </select>
          </div>
          {selId && (
            <div className="fade">
              <div style={st.rLabel}>Contraseña de acceso</div>
              <input type="password" value={pass} onChange={e => { setPass(e.target.value); setErr(""); }}
                placeholder="Contraseña" style={st.rInput} onKeyDown={e => e.key==="Enter"&&login()} autoFocus/>
            </div>
          )}
          {err && <div style={{color:"#f97",fontSize:"0.72rem",fontFamily:"sans-serif",textAlign:"center"}}>{err}</div>}
          <button onClick={login} disabled={!selId||!pass} style={{...st.btnGold,width:"100%",opacity:selId&&pass?1:0.45}}>Ingresar</button>
        </div>
      </div>
    );
  }

  // ── COMERCIO PANEL ─────────────────────────────────────────────────────────
  function ComercioPanelScreen() {
    const c = comercioActivo;
    if (!c) return (
      <div style={{background:"#0d2340",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1rem",padding:"2rem"}}>
        <div style={{color:"#c9a84c",fontSize:"0.9rem",fontFamily:"sans-serif",textAlign:"center"}}>Sesión expirada.</div>
        <button onClick={() => setScreen("comerciologin")} style={st.btnGold}>Volver al login</button>
      </div>
    );
    const color    = c.color||"#1a5c4a";
    const icon     = c.icon||"🏪";
    const misUsos  = usos.filter(u => u.comercioId===c.id).sort((a,b) => (b.fechaHora||"").localeCompare(a.fechaHora||""));
    const [editBeneficio, setEditBeneficio] = useState(false);
    const [beneficioEdit, setBeneficioEdit] = useState(comercios.find(x=>x.id===c.id)?.beneficio||c.beneficio);
    const guardarBeneficio = async () => {
      const cf = comercios.find(x => x.id===c.id);
      await fsComercio({...cf, beneficio:beneficioEdit});
      setComercioActivo({...c, beneficio:beneficioEdit});
      setEditBeneficio(false); showToast("Beneficio actualizado ✓");
    };
    const [editPin,    setEditPin]    = useState(false);
    const [nuevoPin,   setNuevoPin]   = useState("");
    const [pinActual,  setPinActual]  = useState("");
    const [pinErr,     setPinErr]     = useState("");
    const [editPass,   setEditPass]   = useState(false);
    const [nuevaPass,  setNuevaPass]  = useState("");
    const [passActual, setPassActual] = useState("");
    const [passErr,    setPassErr]    = useState("");

    const guardarPin = async () => {
      const cf = comercios.find(x => x.id===c.id);
      if (pinActual !== cf.discountPin) { setPinErr("PIN actual incorrecto."); return; }
      if (!/^\d{4}$/.test(nuevoPin)) { setPinErr("El nuevo PIN debe tener exactamente 4 dígitos."); return; }
      const updated = {...cf, discountPin:nuevoPin};
      await fsComercio(updated);
      setComercioActivo(updated);
      setEditPin(false); setNuevoPin(""); setPinActual(""); setPinErr("");
      showToast("PIN de descuento actualizado ✓");
    };
    const guardarPass = async () => {
      const cf = comercios.find(x => x.id===c.id);
      if (passActual !== cf.adminPass) { setPassErr("Contraseña actual incorrecta."); return; }
      if (nuevaPass.length < 4) { setPassErr("La contraseña debe tener al menos 4 caracteres."); return; }
      const updated = {...cf, adminPass:nuevaPass};
      await fsComercio(updated);
      setComercioActivo(updated);
      setEditPass(false); setNuevaPass(""); setPassActual(""); setPassErr("");
      showToast("Contraseña actualizada ✓");
    };

    return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",display:"flex",flexDirection:"column",paddingBottom:"2rem",overflowY:"auto"}}>
        <div style={{background:"#1a3558",width:"100%",padding:"1rem 1.4rem",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #c9a84c"}}>
          <button onClick={() => { setComercioActivo(null); setScreen("landing"); }} style={{background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontSize:"1rem"}}>⟵</button>
          <div style={{textAlign:"center"}}>
            <div style={{color:"#c9a84c",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.08em"}}>{c.name}</div>
            <div style={{color:"#e8c97a",fontSize:"0.55rem",fontFamily:"sans-serif",letterSpacing:"0.12em"}}>{c.cat}</div>
          </div>
          <div style={{width:36,height:36,background:color,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem"}}>{icon}</div>
        </div>
        <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"1rem",width:"100%",maxWidth:400,alignSelf:"center"}}>
          {/* Stats */}
          <div style={{background:"rgba(255,255,255,0.05)",borderRadius:12,border:"1px solid rgba(201,168,76,0.3)",padding:"1rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{color:"#e8c97a",fontSize:"0.58rem",fontFamily:"sans-serif",letterSpacing:"0.12em",fontWeight:700}}>DESCUENTOS OTORGADOS</div>
              <div style={{color:"#c9a84c",fontSize:"2rem",fontWeight:700,fontFamily:"sans-serif",lineHeight:1.1}}>{misUsos.length}</div>
            </div>
            <div style={{fontSize:"2.5rem",opacity:0.6}}>🎟️</div>
          </div>
          {/* Usage list */}
          {misUsos.length > 0 && (
            <div style={{background:"rgba(255,255,255,0.05)",borderRadius:12,border:"1px solid rgba(201,168,76,0.2)",padding:"0.9rem"}}>
              <div style={{fontSize:"0.55rem",color:"#e8c97a",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.15em",marginBottom:"0.7rem"}}>HISTORIAL DE USOS</div>
              <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",maxHeight:200,overflowY:"auto"}}>
                {misUsos.map(u => (
                  <div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.45rem 0",borderBottom:"1px solid rgba(201,168,76,0.1)"}}>
                    <div>
                      <div style={{color:"white",fontSize:"0.78rem",fontFamily:"sans-serif"}}>{u.huespedNombre}</div>
                      <div style={{color:"rgba(201,168,76,0.5)",fontSize:"0.58rem",fontFamily:"sans-serif"}}>{u.fechaHora}</div>
                    </div>
                    <div style={{color:"#c9a84c",fontSize:"0.75rem"}}>✓</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Edit beneficio */}
          <div style={{background:"rgba(255,255,255,0.05)",borderRadius:12,border:`1px solid ${editBeneficio?"rgba(201,168,76,0.6)":"rgba(201,168,76,0.2)"}`,padding:"0.9rem 1rem"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:editBeneficio?8:0}}>
              <div style={{fontSize:"0.55rem",color:"#e8c97a",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.15em"}}>BENEFICIO / PROMOCIÓN</div>
              {!editBeneficio && <button onClick={() => { setBeneficioEdit(comercios.find(x=>x.id===c.id)?.beneficio||c.beneficio); setEditBeneficio(true); }} style={{background:"none",border:"1px solid rgba(201,168,76,0.3)",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:"0.55rem",color:"#e8c97a",fontFamily:"sans-serif"}}>✏️ Editar</button>}
            </div>
            {!editBeneficio
              ? <div style={{color:"white",fontSize:"0.82rem",fontFamily:"sans-serif",lineHeight:1.5,marginTop:4}}>{comercios.find(x=>x.id===c.id)?.beneficio||c.beneficio}</div>
              : <div className="fade" style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
                  <textarea value={beneficioEdit} onChange={e => setBeneficioEdit(e.target.value)} rows={4} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(201,168,76,0.4)",borderRadius:8,padding:"0.6rem 0.8rem",color:"white",fontSize:"0.82rem",fontFamily:"sans-serif",lineHeight:1.5,resize:"vertical",width:"100%",outline:"none"}}/>
                  <div style={{display:"flex",gap:"0.5rem"}}>
                    <button onClick={guardarBeneficio} style={{...st.btnGold,flex:1,padding:"0.55rem",fontSize:"0.75rem"}}>Guardar</button>
                    <button onClick={() => setEditBeneficio(false)} style={{...st.btnOutline,flex:1,padding:"0.55rem",fontSize:"0.75rem"}}>Cancelar</button>
                  </div>
                </div>
            }
          </div>
          {/* Change discount PIN */}
          <div style={{background:"rgba(255,255,255,0.05)",borderRadius:12,border:`1px solid ${editPin?"rgba(201,168,76,0.6)":"rgba(201,168,76,0.2)"}`,padding:"0.9rem 1rem"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:editPin?8:0}}>
              <div style={{fontSize:"0.55rem",color:"#e8c97a",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.15em"}}>PIN DE DESCUENTO</div>
              {!editPin && <button onClick={() => { setEditPin(true); setPinErr(""); }} style={{background:"none",border:"1px solid rgba(201,168,76,0.3)",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:"0.55rem",color:"#e8c97a",fontFamily:"sans-serif"}}>✏️ Cambiar</button>}
            </div>
            {!editPin
              ? <div style={{color:"white",fontSize:"1.4rem",letterSpacing:"0.4em",fontFamily:"monospace",marginTop:4}}>••••</div>
              : <div className="fade" style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
                  <div><div style={{fontSize:"0.52rem",color:"rgba(201,168,76,0.6)",fontFamily:"sans-serif",fontWeight:700,marginBottom:4}}>PIN ACTUAL</div>
                    <input type="password" value={pinActual} onChange={e => { if(/^\d{0,4}$/.test(e.target.value)){setPinActual(e.target.value);setPinErr("");} }} maxLength={4} inputMode="numeric" placeholder="••••" style={{...st.rInput,width:120,textAlign:"center",letterSpacing:"0.3em",fontSize:"1rem"}}/></div>
                  <div><div style={{fontSize:"0.52rem",color:"rgba(201,168,76,0.6)",fontFamily:"sans-serif",fontWeight:700,marginBottom:4}}>NUEVO PIN (4 dígitos)</div>
                    <input type="password" value={nuevoPin} onChange={e => { if(/^\d{0,4}$/.test(e.target.value)){setNuevoPin(e.target.value);setPinErr("");} }} maxLength={4} inputMode="numeric" placeholder="••••" style={{...st.rInput,width:120,textAlign:"center",letterSpacing:"0.3em",fontSize:"1rem"}}/></div>
                  {pinErr && <div style={{color:"#f97",fontSize:"0.68rem",fontFamily:"sans-serif"}}>{pinErr}</div>}
                  <div style={{display:"flex",gap:"0.5rem"}}>
                    <button onClick={guardarPin} style={{...st.btnGold,flex:1,padding:"0.55rem",fontSize:"0.75rem"}}>Guardar</button>
                    <button onClick={() => { setEditPin(false); setNuevoPin(""); setPinActual(""); setPinErr(""); }} style={{...st.btnOutline,flex:1,padding:"0.55rem",fontSize:"0.75rem"}}>Cancelar</button>
                  </div>
                </div>
            }
          </div>
          {/* Change admin password */}
          <div style={{background:"rgba(255,255,255,0.05)",borderRadius:12,border:`1px solid ${editPass?"rgba(201,168,76,0.6)":"rgba(201,168,76,0.2)"}`,padding:"0.9rem 1rem"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:editPass?8:0}}>
              <div style={{fontSize:"0.55rem",color:"#e8c97a",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.15em"}}>CONTRASEÑA DE ACCESO</div>
              {!editPass && <button onClick={() => { setEditPass(true); setPassErr(""); }} style={{background:"none",border:"1px solid rgba(201,168,76,0.3)",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:"0.55rem",color:"#e8c97a",fontFamily:"sans-serif"}}>✏️ Cambiar</button>}
            </div>
            {!editPass
              ? <div style={{color:"rgba(255,255,255,0.4)",fontSize:"0.8rem",fontFamily:"sans-serif",marginTop:4,letterSpacing:"0.2em"}}>••••••••</div>
              : <div className="fade" style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
                  <div><div style={{fontSize:"0.52rem",color:"rgba(201,168,76,0.6)",fontFamily:"sans-serif",fontWeight:700,marginBottom:4}}>CONTRASEÑA ACTUAL</div>
                    <input type="password" value={passActual} onChange={e => { setPassActual(e.target.value); setPassErr(""); }} placeholder="Contraseña actual" style={st.rInput}/></div>
                  <div><div style={{fontSize:"0.52rem",color:"rgba(201,168,76,0.6)",fontFamily:"sans-serif",fontWeight:700,marginBottom:4}}>NUEVA CONTRASEÑA</div>
                    <input type="password" value={nuevaPass} onChange={e => { setNuevaPass(e.target.value); setPassErr(""); }} placeholder="Nueva contraseña" style={st.rInput}/></div>
                  {passErr && <div style={{color:"#f97",fontSize:"0.68rem",fontFamily:"sans-serif"}}>{passErr}</div>}
                  <div style={{display:"flex",gap:"0.5rem"}}>
                    <button onClick={guardarPass} style={{...st.btnGold,flex:1,padding:"0.55rem",fontSize:"0.75rem"}}>Guardar</button>
                    <button onClick={() => { setEditPass(false); setNuevaPass(""); setPassActual(""); setPassErr(""); }} style={{...st.btnOutline,flex:1,padding:"0.55rem",fontSize:"0.75rem"}}>Cancelar</button>
                  </div>
                </div>
            }
          </div>
        </div>
      </div>
    );
  }

  // ── ADMIN LOGIN ────────────────────────────────────────────────────────────
  function AdminLoginScreen() {
    const [pass, setPass] = useState("");
    const [err, setErr]   = useState("");
    const login = () => { if (pass===ADMIN_PASS) { setAdminMode(true); setScreen("admin"); } else setErr("Contraseña incorrecta."); };
    return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",padding:"2.5rem 1.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.2rem"}}>
        <button onClick={() => setScreen("landing")} style={{alignSelf:"flex-start",background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontFamily:"sans-serif",fontSize:"0.8rem"}}>← Volver</button>
        <div style={{color:"#c9a84c",fontSize:"1.2rem",fontWeight:700,letterSpacing:"0.1em",textAlign:"center"}}>PANEL ADMINISTRADOR</div>
        <div style={{color:"#e8c97a",fontSize:"0.65rem",fontFamily:"sans-serif",letterSpacing:"0.15em",textAlign:"center"}}>{config.hotelNombre} — ACCESO RESTRINGIDO</div>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Contraseña"
          style={{...st.rInput,width:260,textAlign:"center",letterSpacing:"0.15em"}} onKeyDown={e => e.key==="Enter"&&login()}/>
        {err && <div style={{color:"#f97",fontSize:"0.72rem",fontFamily:"sans-serif"}}>{err}</div>}
        <button onClick={login} style={{...st.btnGold,width:260}}>Ingresar</button>
      </div>
    );
  }

  // ── ADMIN DASHBOARD ────────────────────────────────────────────────────────
  function AdminDashboard() {
    const [tab, setTab] = useState("dashboard");
    const ranking   = comercios.map(c => ({...c, total:usos.filter(u=>u.comercioId===c.id).length})).sort((a,b)=>b.total-a.total);
    const recentUsos = [...usos].sort((a,b) => (b.fechaHora||"").localeCompare(a.fechaHora||"")).slice(0,50);

    return (
      <div className="fade" style={{background:"#f5f0e8",minHeight:"100vh",paddingBottom:"2rem",overflowY:"auto"}}>
        <div style={{background:"#0d2340",padding:"1rem 1.4rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={() => { setAdminMode(false); setScreen("landing"); }} style={{background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontSize:"1rem"}}>⟵</button>
          <span style={{color:"#c9a84c",fontSize:"0.8rem",letterSpacing:"0.1em",fontWeight:700}}>ADMIN — {config.hotelNombre}</span>
          <span>🔐</span>
        </div>
        <div style={{display:"flex",background:"#1a3558",borderBottom:"1px solid #c9a84c",overflowX:"auto"}}>
          {[["dashboard","Dashboard"],["usos","Descuentos"],["huespedes","Huéspedes"],["comercios","Comercios"],["config","Config"]].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)} style={{flexShrink:0,padding:"0.7rem 0.8rem",background:"none",border:"none",borderBottom:`2px solid ${tab===t?"#c9a84c":"transparent"}`,color:tab===t?"#c9a84c":"#e8c97a",fontSize:"0.6rem",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.1em",cursor:"pointer",textTransform:"uppercase"}}>{l}</button>
          ))}
        </div>

        {tab==="dashboard" && (
          <div style={{padding:"1.2rem"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.8rem",marginBottom:"1rem"}}>
              {[["🏨","Huéspedes",huespedes.length,"#1a5c4a"],["🎟️","Descuentos Usados",usos.length,"#1a4a5c"],["🏪","Comercios Adheridos",comercios.length,"#5c3a1a"],["📊","Desc. por Huésped",huespedes.length>0?(usos.length/huespedes.length).toFixed(1):0,"#3a1a5c"]].map(([ic,label,val,col]) => (
                <div key={label} style={{background:"white",borderRadius:14,border:"1px solid #ede5d4",padding:"1rem 0.9rem",boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                  <div style={{fontSize:"1.4rem",marginBottom:4}}>{ic}</div>
                  <div style={{fontSize:"1.8rem",fontWeight:700,color:col,fontFamily:"sans-serif"}}>{val}</div>
                  <div style={{fontSize:"0.58rem",color:"#888",fontFamily:"sans-serif",lineHeight:1.3,marginTop:2}}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{background:"#0d2340",borderRadius:14,border:"1.5px solid #c9a84c",padding:"1.1rem"}}>
              <div style={{color:"#c9a84c",fontSize:"0.65rem",letterSpacing:"0.18em",fontFamily:"sans-serif",fontWeight:700,marginBottom:"0.8rem"}}>RANKING DE COMERCIOS</div>
              {ranking.map((c,i) => (
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:"0.7rem",padding:"0.5rem 0",borderBottom:i<ranking.length-1?"1px solid rgba(201,168,76,0.1)":"none"}}>
                  <div style={{width:24,height:24,background:i<3?"#c9a84c":"rgba(201,168,76,0.15)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",fontWeight:700,color:i<3?"#0d2340":"#e8c97a",fontFamily:"sans-serif",flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{color:"white",fontSize:"0.78rem",fontFamily:"sans-serif"}}>{c.name}</div>
                    <div style={{color:"#e8c97a",fontSize:"0.55rem",fontFamily:"sans-serif"}}>{c.cat}</div>
                  </div>
                  <div style={{color:"#c9a84c",fontSize:"1rem",fontWeight:700,fontFamily:"sans-serif"}}>{c.total}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="usos" && (
          <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.6rem"}}>
            <div style={{fontSize:"0.62rem",color:"#4a3728",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.15em",textAlign:"center",marginBottom:"0.3rem"}}>HISTORIAL DE DESCUENTOS — {usos.length} total</div>
            {recentUsos.length===0 && <div style={{textAlign:"center",color:"#999",fontFamily:"sans-serif",fontSize:"0.8rem",marginTop:"2rem"}}>No hay descuentos registrados aún.</div>}
            {recentUsos.map(u => (
              <div key={u.id} style={{background:"white",borderRadius:12,border:"1px solid #ede5d4",padding:"0.8rem 1rem",display:"flex",alignItems:"center",gap:"0.8rem",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                <div style={{fontSize:"1.4rem",flexShrink:0}}>{u.comercioIcon||"🏪"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"0.82rem",color:"#0d2340",fontStyle:"italic"}}>{u.huespedNombre}</div>
                  <div style={{fontSize:"0.62rem",color:"#4a3728",fontFamily:"sans-serif",marginTop:1}}>{u.comercioName}</div>
                  <div style={{fontSize:"0.58rem",color:"#aaa",fontFamily:"sans-serif",marginTop:1}}>{u.fechaHora}</div>
                </div>
                <div style={{background:"#1a5c4a",color:"white",fontSize:"0.58rem",fontFamily:"sans-serif",fontWeight:700,padding:"3px 8px",borderRadius:20,flexShrink:0}}>✓ OK</div>
              </div>
            ))}
          </div>
        )}

        {tab==="huespedes" && (
          <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.7rem"}}>
            {huespedes.length===0 && <div style={{textAlign:"center",color:"#999",fontFamily:"sans-serif",fontSize:"0.8rem",marginTop:"2rem"}}>No hay huéspedes registrados aún.</div>}
            {[...huespedes].reverse().map(h => {
              const hUsos = usos.filter(u => u.huespedId===h.id);
              const activo = h.activo !== false;
              const toggleActivo = async () => { await fsHuesped({...h, activo: !activo}); showToast(activo ? "Pasaporte desactivado" : "Pasaporte activado ✓"); };
              return (
                <div key={h.id} style={{background:"white",borderRadius:14,border:`1px solid ${activo?"#ede5d4":"#f5c0b0"}`,padding:"1rem 1.1rem",boxShadow:"0 1px 5px rgba(0,0,0,0.06)",opacity:activo?1:0.8}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6,gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"0.95rem",color:activo?"#0d2340":"#aaa",fontStyle:"italic"}}>{h.nombre} {h.apellido}</div>
                      {h.mail && <div style={{fontSize:"0.6rem",color:"#888",fontFamily:"sans-serif",marginTop:1}}>{h.mail}</div>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                      <div style={{background:hUsos.length>0?"#1a4a5c":"#eee",color:hUsos.length>0?"white":"#999",fontSize:"0.55rem",fontFamily:"sans-serif",fontWeight:700,padding:"3px 8px",borderRadius:20}}>{hUsos.length} desc.</div>
                      <button onClick={toggleActivo} style={{background:activo?"#fff8e6":"#fef0ee",border:`1px solid ${activo?"#c9a84c":"#e85020"}`,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:"0.58rem",fontFamily:"sans-serif",fontWeight:700,color:activo?"#c9a84c":"#e85020",whiteSpace:"nowrap"}}>
                        {activo ? "✓ Activo" : "✗ Inactivo"}
                      </button>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:hUsos.length>0?8:0}}>
                    {[["Check-in",fmtDate(h.desde)],["Check-out",fmtDate(h.hasta)]].map(([l,v]) => (
                      <div key={l}><div style={{fontSize:"0.5rem",color:"#aaa",fontFamily:"sans-serif",fontWeight:700,textTransform:"uppercase"}}>{l}</div><div style={{fontSize:"0.72rem",color:"#4a3728",fontFamily:"sans-serif"}}>{v}</div></div>
                    ))}
                  </div>
                  {!activo && <div style={{background:"#fef0ee",borderRadius:8,padding:"0.4rem 0.7rem",fontSize:"0.65rem",fontFamily:"sans-serif",color:"#e85020",marginBottom:hUsos.length>0?6:0}}>🔒 Pasaporte desactivado</div>}
                  {hUsos.length > 0 && (
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {hUsos.map(u => (
                        <div key={u.id} title={u.comercioName} style={{background:"#f0eee8",borderRadius:20,padding:"2px 8px",fontSize:"0.58rem",fontFamily:"sans-serif",color:"#4a3728"}}>
                          {u.comercioIcon||"🏪"} {u.comercioName?.split(" ")[0]}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab==="comercios" && (
          <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.7rem"}}>
            {comercios.map(c => {
              const tot = usos.filter(u => u.comercioId===c.id).length;
              return <ComercioCard key={c.id} c={c} tot={tot}
                onSave={updated => fsComercio(updated)}
                onDelete={() => fsDelComercio(c.id)}/>;
            })}
            <button onClick={() => { const nc={id:uid(),name:"Nuevo Comercio",cat:"Gastronomía",discountPin:"0000",adminPass:"pass2026",beneficio:"Describí el beneficio aquí.",whatsapp:"",instagram:"",facebook:"",maps:"",foto:"",color:COLORS_OPCIONES[comercios.length%COLORS_OPCIONES.length],icon:ICONS_OPCIONES[comercios.length%ICONS_OPCIONES.length]}; fsComercio(nc); }}
              style={{...st.btnGold,width:"100%",marginTop:"0.5rem"}}>+ Agregar Comercio</button>
          </div>
        )}

        {tab==="config" && <ConfigTab/>}
      </div>
    );
  }

  // ── CONFIG TAB ─────────────────────────────────────────────────────────────
  function ConfigTab() {
    const [form, setForm] = useState({...config});
    const set = k => e => setForm(f => ({...f,[k]:e.target.value}));
    const guardar = async () => { await fsConfig(form); showToast("Configuración guardada ✓"); };
    const handleLogo = e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => setForm(f => ({...f,logoUrl:ev.target.result}));
      reader.readAsDataURL(file);
    };
    return (
      <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.9rem"}}>
        <div style={{background:"white",borderRadius:14,border:"1px solid #ede5d4",padding:"1.1rem",display:"flex",flexDirection:"column",gap:"0.8rem"}}>
          <div style={{fontSize:"0.65rem",color:"#4a3728",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.15em",marginBottom:2}}>IDENTIDAD DEL HOTEL</div>
          <div><div style={st.aLabel}>Nombre del Hotel</div><input value={form.hotelNombre} onChange={set("hotelNombre")} style={st.aInput}/></div>
          <div><div style={st.aLabel}>Subtítulo</div><input value={form.hotelSubtitulo||""} onChange={set("hotelSubtitulo")} style={st.aInput}/></div>
          <div><div style={st.aLabel}>Edición / Temporada</div><input value={form.edicion||""} onChange={set("edicion")} style={st.aInput}/></div>
          <div>
            <div style={st.aLabel}>Logo del Hotel</div>
            {form.logoUrl && <img src={form.logoUrl} style={{width:60,height:60,borderRadius:"50%",objectFit:"cover",marginBottom:8,border:"2px solid #c9a84c"}} alt="logo"/>}
            <input type="file" accept="image/*" onChange={handleLogo} style={{fontSize:"0.75rem",fontFamily:"sans-serif",color:"#4a3728"}}/>
          </div>
        </div>
        <div style={{background:"white",borderRadius:14,border:"1px solid #ede5d4",padding:"1.1rem",display:"flex",flexDirection:"column",gap:"0.8rem"}}>
          <div style={{fontSize:"0.65rem",color:"#4a3728",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.15em",marginBottom:2}}>TEXTOS</div>
          <div><div style={st.aLabel}>Mensaje de Bienvenida</div><textarea value={form.bienvenida||""} onChange={set("bienvenida")} rows={3} style={{...st.aInput,resize:"vertical",lineHeight:1.5,fontSize:"0.82rem"}}/></div>
          <div><div style={st.aLabel}>Mensaje de Despedida</div><textarea value={form.despedida||""} onChange={set("despedida")} rows={2} style={{...st.aInput,resize:"vertical",lineHeight:1.5,fontSize:"0.82rem"}}/></div>
        </div>
        <button onClick={guardar} style={{...st.btnGold,width:"100%"}}>Guardar Configuración</button>
      </div>
    );
  }

  // ── COMERCIO CARD (admin) ──────────────────────────────────────────────────
  function ComercioCard({c, tot, onSave, onDelete}) {
    const [editing, setEditing]           = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [form, setForm] = useState({
      name:c.name, cat:c.cat, beneficio:c.beneficio,
      discountPin:c.discountPin||"0000", adminPass:c.adminPass||"pass2026",
      whatsapp:c.whatsapp||"", instagram:c.instagram||"", facebook:c.facebook||"",
      maps:c.maps||"", foto:c.foto||"",
      color:c.color||COLORS_OPCIONES[0], icon:c.icon||ICONS_OPCIONES[0],
      destacado:c.destacado||false, voucherTexto:c.voucherTexto||"", voucherLimit:c.voucherLimit||0
    });
    const set = k => e => setForm(f => ({...f,[k]:e.target.value}));
    const save = async () => { await fsComercio({...c,...form}); setEditing(false); showToast("Comercio actualizado ✓"); };
    const handleFoto = e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => setForm(f => ({...f,foto:ev.target.result}));
      reader.readAsDataURL(file);
    };
    return (
      <div style={{background:"white",borderRadius:14,border:`1px solid ${editing?"#c9a84c":"#ede5d4"}`,padding:"1rem 1.1rem",boxShadow:"0 1px 5px rgba(0,0,0,0.06)",transition:"border .2s"}}>
        {!editing ? (
          <div style={{display:"flex",alignItems:"flex-start",gap:"0.8rem"}}>
            <div style={{width:46,height:46,background:c.color||"#1a5c4a",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",flexShrink:0,overflow:"hidden"}}>
              {c.foto ? <img src={c.foto} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="foto"/> : (c.icon||"🏪")}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:"0.92rem",color:"#0d2340",fontStyle:"italic",marginBottom:2}}>{c.name}</div>
              <div style={{fontSize:"0.58rem",color:"#888",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>{c.cat}</div>
              <div style={{fontSize:"0.72rem",color:"#555",fontFamily:"sans-serif",lineHeight:1.4,marginBottom:6,background:"#f9f6f0",borderRadius:8,padding:"0.5rem 0.6rem",borderLeft:`3px solid ${c.color||"#1a5c4a"}`}}>{c.beneficio}</div>
              <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:"0.55rem",color:"#aaa",fontFamily:"sans-serif"}}>PIN:</span>
                <span style={{fontSize:"0.6rem",color:"#0d2340",fontFamily:"monospace",background:"#f0eee8",padding:"2px 10px",borderRadius:6,letterSpacing:"0.18em",fontWeight:700}}>{c.discountPin}</span>
                {c.whatsapp && <span style={{fontSize:"0.55rem",color:"#25D366",fontFamily:"sans-serif"}}>💬 {c.whatsapp}</span>}
                <span style={{fontSize:"0.55rem",color:"#aaa",fontFamily:"sans-serif"}}>{tot} usos</span>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <button onClick={() => setEditing(true)} style={{background:"none",border:"1px solid #ede5d4",borderRadius:8,padding:"0.35rem 0.6rem",cursor:"pointer",fontSize:"0.65rem",fontFamily:"sans-serif",color:"#888"}}>✏️</button>
              {!confirmDelete
                ? <button onClick={() => setConfirmDelete(true)} style={{background:"none",border:"1px solid #fcc",borderRadius:8,padding:"0.35rem 0.6rem",cursor:"pointer",fontSize:"0.65rem",color:"#e85020"}}>🗑️</button>
                : <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    <button onClick={() => { onDelete(); setConfirmDelete(false); }} style={{background:"#e85020",border:"none",borderRadius:8,padding:"0.35rem 0.5rem",cursor:"pointer",fontSize:"0.55rem",color:"white",fontFamily:"sans-serif",fontWeight:700}}>Sí</button>
                    <button onClick={() => setConfirmDelete(false)} style={{background:"none",border:"1px solid #ede5d4",borderRadius:8,padding:"0.35rem 0.5rem",cursor:"pointer",fontSize:"0.55rem",color:"#888",fontFamily:"sans-serif"}}>No</button>
                  </div>
              }
            </div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"0.7rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:36,height:36,background:form.color,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",overflow:"hidden"}}>
                {form.foto ? <img src={form.foto} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="foto"/> : form.icon}
              </div>
              <div style={{color:"#0d2340",fontSize:"0.78rem",fontFamily:"sans-serif",fontWeight:700}}>Editando comercio</div>
            </div>
            <div><div style={st.aLabel}>Nombre</div><input value={form.name} onChange={set("name")} style={st.aInput}/></div>
            <div>
              <div style={st.aLabel}>Categoría</div>
              <select value={form.cat} onChange={set("cat")} style={st.aInput}>
                {CATS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <div style={st.aLabel}>Ícono (opcional)</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                <button onClick={() => setForm(f => ({...f,icon:""}))} style={{width:36,height:36,borderRadius:8,border:`2px solid ${!form.icon?"#c9a84c":"#e0d8c8"}`,background:!form.icon?"#faf4e8":"white",fontSize:"0.6rem",fontFamily:"sans-serif",color:"#888",cursor:"pointer"}}>ninguno</button>
                {ICONS_OPCIONES.map(ic => (
                  <button key={ic} onClick={() => setForm(f => ({...f,icon:ic}))} style={{width:36,height:36,borderRadius:8,border:`2px solid ${form.icon===ic?"#c9a84c":"#e0d8c8"}`,background:form.icon===ic?"#faf4e8":"white",fontSize:"1.2rem",cursor:"pointer"}}>{ic}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={st.aLabel}>Color</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {COLORS_OPCIONES.map(col => (
                  <button key={col} onClick={() => setForm(f => ({...f,color:col}))} style={{width:28,height:28,borderRadius:"50%",background:col,border:`3px solid ${form.color===col?"#c9a84c":"transparent"}`,cursor:"pointer"}}/>
                ))}
              </div>
            </div>
            <div>
              <div style={st.aLabel}>Foto del Comercio</div>
              {form.foto && <img src={form.foto} style={{width:60,height:60,borderRadius:8,objectFit:"cover",marginBottom:6,border:"1px solid #ede5d4"}} alt="foto"/>}
              <input type="file" accept="image/*" onChange={handleFoto} style={{fontSize:"0.72rem",fontFamily:"sans-serif",color:"#4a3728"}}/>
            </div>
            <div><div style={st.aLabel}>Beneficio</div><textarea value={form.beneficio} onChange={set("beneficio")} rows={3} style={{...st.aInput,resize:"vertical",lineHeight:1.5,fontSize:"0.82rem"}}/></div>
            <div><div style={st.aLabel}>WhatsApp (con código de país, ej: 5491155556666)</div><input value={form.whatsapp} onChange={set("whatsapp")} style={st.aInput} placeholder="5491155556666"/></div>
            <div><div style={st.aLabel}>Instagram (URL del perfil)</div><input value={form.instagram} onChange={set("instagram")} style={st.aInput} placeholder="https://instagram.com/comercio"/></div>
            <div><div style={st.aLabel}>Facebook (URL del perfil)</div><input value={form.facebook} onChange={set("facebook")} style={st.aInput} placeholder="https://facebook.com/comercio"/></div>
            <div><div style={st.aLabel}>Link Google Maps</div><input value={form.maps} onChange={set("maps")} style={st.aInput} placeholder="https://maps.google.com/..."/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
              <div><div style={st.aLabel}>PIN Descuento (4 dígitos)</div><input value={form.discountPin} onChange={e => { if(/^\d{0,4}$/.test(e.target.value)) set("discountPin")(e); }} maxLength={4} inputMode="numeric" style={{...st.aInput,letterSpacing:"0.2em",textAlign:"center",fontSize:"1rem"}}/></div>
              <div><div style={st.aLabel}>Contraseña Admin</div><input value={form.adminPass} onChange={set("adminPass")} style={st.aInput} placeholder="Contraseña"/></div>
            </div>
            <div onClick={() => setForm(f => ({...f,destacado:!f.destacado}))} style={{display:"flex",alignItems:"center",gap:10,padding:"0.6rem 0.8rem",borderRadius:10,background:form.destacado?"#faf4e8":"#f9f6f0",border:`1.5px solid ${form.destacado?"#c9a84c":"#e0d8c8"}`,cursor:"pointer",userSelect:"none"}}>
              <div style={{width:22,height:22,borderRadius:6,background:form.destacado?"#c9a84c":"white",border:`2px solid ${form.destacado?"#c9a84c":"#c0b898"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                {form.destacado && <span style={{color:"#0d2340",fontSize:"0.8rem",fontWeight:700,lineHeight:1}}>✓</span>}
              </div>
              <div>
                <div style={{fontSize:"0.7rem",color:"#0d2340",fontFamily:"sans-serif",fontWeight:700}}>✨ Voucher Destacado</div>
                <div style={{fontSize:"0.58rem",color:"#888",fontFamily:"sans-serif",lineHeight:1.3}}>Aparece en la sección especial del pasaporte</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.6rem",opacity:form.destacado?1:0.35,pointerEvents:form.destacado?"auto":"none"}}>
              <div style={{background:"#faf4e8",borderRadius:10,border:"1px solid #e8d8a0",padding:"0.75rem 0.9rem",display:"flex",flexDirection:"column",gap:"0.6rem"}}>
                <div style={{fontSize:"0.6rem",color:"#4a3728",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.12em"}}>✨ CONFIGURACIÓN DEL VOUCHER</div>
                <div>
                  <div style={st.aLabel}>Cantidad máxima de vouchers (0 = sin límite)</div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <input type="number" min={0} value={form.voucherLimit} onChange={e => setForm(f => ({...f,voucherLimit:Math.max(0,parseInt(e.target.value)||0)}))} style={{...st.aInput,width:90,textAlign:"center",fontSize:"1.1rem",fontFamily:"sans-serif",fontWeight:700}}/>
                    <span style={{fontSize:"0.72rem",color:form.voucherLimit===0?"#aaa":"#1a5c4a",fontFamily:"sans-serif",fontWeight:700}}>{form.voucherLimit===0 ? "Sin límite" : `Máximo ${form.voucherLimit} uso${form.voucherLimit!==1?"s":""}`}</span>
                  </div>
                </div>
                <div>
                  <div style={st.aLabel}>Texto del Voucher</div>
                  <textarea value={form.voucherTexto} onChange={set("voucherTexto")} rows={3} placeholder="Ej: 20% de descuento especial para huéspedes de Zelena Voda." style={{...st.aInput,resize:"vertical",lineHeight:1.5,fontSize:"0.82rem"}}/>
                  <div style={{fontSize:"0.58rem",color:"#888",fontFamily:"sans-serif",marginTop:3}}>Texto independiente del beneficio que edita el comerciante.</div>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:"0.6rem"}}>
              <button onClick={save} style={{...st.btnGold,flex:1,padding:"0.65rem",fontSize:"0.82rem"}}>Guardar</button>
              <button onClick={() => setEditing(false)} style={{...st.btnOutline,flex:1,padding:"0.65rem",fontSize:"0.82rem"}}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── VOUCHERS SCREEN ────────────────────────────────────────────────────────
  function VouchersScreen() {
    const h = huesped;
    const dest = comercios.filter(c => c.destacado);
    return (
      <div className="fade" style={{background:"#f5f0e8",minHeight:"100vh",paddingBottom:"2rem",overflowY:"auto"}}>
        <div style={{background:"#0d2340",padding:"1rem 1.4rem",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={() => setScreen("passport")} style={{background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontSize:"1.1rem"}}>⟵</button>
          <span style={{color:"#c9a84c",fontSize:"0.85rem",letterSpacing:"0.1em",fontWeight:700,flex:1,textAlign:"center"}}>✨ VOUCHERS DESTACADOS</span>
          <div style={{width:24}}/>
        </div>
        <div style={{padding:"1rem 1.2rem 0",background:"linear-gradient(135deg,#faf4e8,#f0e8cc)",margin:"1.2rem 1.2rem 0",borderRadius:14,border:"1px solid #c9a84c"}}>
          <div style={{fontSize:"0.62rem",color:"#4a3728",fontFamily:"sans-serif",letterSpacing:"0.15em",fontWeight:700,marginBottom:4}}>BENEFICIOS ESPECIALES</div>
          <div style={{fontSize:"0.78rem",color:"#0d2340",fontFamily:"sans-serif",fontStyle:"italic",paddingBottom:"1rem"}}>{dest.length} voucher{dest.length!==1?"s":""} disponible{dest.length!==1?"s":""} durante tu estadía</div>
        </div>
        <div style={{padding:"1rem 1.2rem 0",display:"flex",flexDirection:"column",gap:"0.65rem"}}>
          {dest.map(comercio => {
            const cnt = usos.filter(u => u.comercioId===comercio.id && u.huespedId===h.id).length;
            const totalUsos = usos.filter(u => u.comercioId===comercio.id).length;
            const lim = comercio.voucherLimit||0;
            const agotado = lim > 0 && totalUsos >= lim;
            const restantes = lim > 0 ? lim - totalUsos : null;
            return (
              <div key={comercio.id} onClick={() => { if (!agotado) { setPendingComercio(comercio); setVoucherMode(true); setScreen("detail"); } }}
                style={{background:agotado?"#f5f5f5":"white",borderRadius:14,border:`2px solid ${agotado?"#ccc":"#c9a84c"}`,overflow:"hidden",boxShadow:"0 2px 10px rgba(201,168,76,0.15)",cursor:agotado?"default":"pointer",opacity:agotado?0.7:1}}>
                <div style={{background:agotado?"#ccc":"linear-gradient(90deg,#c9a84c,#e8c97a)",padding:"0.35rem 0.9rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:"0.7rem"}}>{agotado?"🚫":"✨"}</span>
                    <span style={{fontSize:"0.55rem",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.14em",color:"#0d2340",textTransform:"uppercase"}}>{agotado?"Voucher Agotado":"Voucher Destacado"}</span>
                  </div>
                  {restantes !== null && !agotado && (
                    <span style={{fontSize:"0.55rem",fontFamily:"sans-serif",fontWeight:700,color:"#0d2340",background:"rgba(0,0,0,0.12)",borderRadius:10,padding:"1px 7px"}}>{restantes} disponible{restantes!==1?"s":""}</span>
                  )}
                </div>
                <div style={{display:"flex",alignItems:"stretch"}}>
                  <div style={{width:60,background:comercio.color||"#1a5c4a",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:agotado?0.5:1}}>
                    <span style={{fontSize:"1.6rem"}}>{comercio.icon||"🏪"}</span>
                  </div>
                  <div style={{flex:1,padding:"0.75rem 0.9rem",minWidth:0}}>
                    <div style={{fontSize:"0.52rem",color:"#888",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase"}}>{comercio.cat}</div>
                    <div style={{fontSize:"0.92rem",color:agotado?"#aaa":"#0d2340",fontStyle:"italic",lineHeight:1.2,margin:"2px 0"}}>{comercio.name}</div>
                    <div style={{fontSize:"0.65rem",color:agotado?"#bbb":"#555",fontFamily:"sans-serif",lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{agotado?"Los vouchers para esta promoción ya fueron utilizados.":comercio.voucherTexto||comercio.beneficio}</div>
                  </div>
                  <div style={{width:46,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderLeft:"1px dashed #ede5d4",flexShrink:0,gap:3}}>
                    {agotado
                      ? <span style={{fontSize:"1rem"}}>🚫</span>
                      : cnt > 0
                        ? <div style={{width:32,height:32,borderRadius:"50%",background:comercio.color||"#1a5c4a",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{color:"white",fontSize:"0.7rem",fontFamily:"sans-serif",fontWeight:700}}>×{cnt}</span>
                          </div>
                        : <span style={{fontSize:"0.55rem",color:"#c9a84c"}}>›</span>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      {toast && <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:"#0d2340",color:"#c9a84c",padding:"0.65rem 1.4rem",borderRadius:30,border:"1px solid #c9a84c",fontSize:"0.78rem",fontFamily:"sans-serif",zIndex:999,whiteSpace:"nowrap"}}>{toast}</div>}
      <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh"}}>
        {screen==="landing"       && <LandingScreen/>}
        {screen==="register"      && <RegisterScreen/>}
        {screen==="passport"      && huesped && <PassportScreen/>}
        {screen==="detail"        && huesped && pendingComercio && <DetailScreen/>}
        {screen==="pinentry"      && huesped && pendingComercio && <PinEntryScreen/>}
        {screen==="comerciologin" && <ComercioLoginScreen/>}
        {screen==="comerciopanel" && comercioActivo && <ComercioPanelScreen/>}
        {screen==="adminlogin"    && <AdminLoginScreen/>}
        {screen==="vouchers"      && huesped && <VouchersScreen/>}
        {screen==="admin"         && adminMode && <AdminDashboard/>}
      </div>
    </>
  );
}
