import { useState, useRef } from "react";

const S = {
  navy:"#0d2340", navy2:"#1a3558", gold:"#c9a84c", gold2:"#e8c97a",
  cream:"#f5f0e8", cream2:"#ede5d4", brown:"#4a3728",
};

const SELLOS_DEF = [
  { id:0, num:1, cat:"Gastronomía",        name:"Cena con Beneficio Zelena",     color:"#1a5c4a", icon:"🍽️" },
  { id:1, num:2, cat:"Cafetería",          name:"Momento Café",                  color:"#1a4a5c", icon:"☕" },
  { id:2, num:3, cat:"Sabores Regionales", name:"Disfrutá lo nuestro",           color:"#5c3a1a", icon:"🧀" },
  { id:3, num:4, cat:"Relax",              name:"Tiempo para vos",               color:"#3a1a5c", icon:"🧘" },
  { id:4, num:5, cat:"Diversión",          name:"Viví nuevas experiencias",      color:"#1a5c2a", icon:"🎮" },
  { id:5, num:6, cat:"Atardecer Zelena",   name:"Experiencia al caer el sol",    color:"#5c1a1a", icon:"🌅" },
  { id:6, num:7, cat:"Compras Locales",    name:"Llevate un pedacito de Gesell", color:"#1a3a5c", icon:"🛍️" },
  { id:7, num:8, cat:"Playa & Aventura",   name:"Explorá entre mares y pinos",   color:"#5c4a1a", icon:"🏖️" },
];

const COLORS_OPCIONES = ["#1a5c4a","#1a4a5c","#5c3a1a","#3a1a5c","#1a5c2a","#5c1a1a","#1a3a5c","#5c4a1a","#5c1a3a","#1a5c5c"];
const ICONS_OPCIONES  = ["🍽️","☕","🧀","🧘","🎮","🌅","🛍️","🏖️","🎵","🏋️","🎨","🍷","🎭","🌿","🐴","🎯"];
const CATS = ["Gastronomía","Cafetería","Sabores Regionales","Relax","Diversión","Atardecer Zelena","Compras Locales","Playa & Aventura","Música & Arte","Deportes","Otros"];

const COMERCIOS_INIT = [
  { id:"c1", name:"La Parrilla del Bosque", cat:"Gastronomía",        pin:"1234", selloId:0, beneficio:"10% de descuento sobre el total de la cuenta. Válido de domingo a jueves, no acumulable con otras promociones.", maps:"", foto:"", color:"#1a5c4a", icon:"🍽️" },
  { id:"c2", name:"Café del Mar",           cat:"Cafetería",          pin:"2345", selloId:1, beneficio:"2 cafés o infusiones a elección sin cargo al consumir cualquier producto de pastelería.", maps:"", foto:"", color:"#1a4a5c", icon:"☕" },
  { id:"c3", name:"Sabores Gesell",         cat:"Sabores Regionales", pin:"3456", selloId:2, beneficio:"15% de descuento en toda la línea de productos artesanales, chocolates y dulces regionales.", maps:"", foto:"", color:"#5c3a1a", icon:"🧀" },
  { id:"c4", name:"Spa Pinos",              cat:"Relax",              pin:"4567", selloId:3, beneficio:"20% de descuento en masajes de 60 minutos o tratamientos faciales. Reserva previa requerida.", maps:"", foto:"", color:"#3a1a5c", icon:"🧘" },
  { id:"c5", name:"Aventura Costera",       cat:"Diversión",          pin:"5678", selloId:4, beneficio:"1 hora de alquiler de bicicleta sin cargo o 10% de descuento en excursiones grupales.", maps:"", foto:"", color:"#1a5c2a", icon:"🎮" },
  { id:"c6", name:"Atardecer Tour",         cat:"Atardecer Zelena",   pin:"6789", selloId:5, beneficio:"Paseo al atardecer en cuatriciclo para 2 personas con descuento del 25%.", maps:"", foto:"", color:"#5c1a1a", icon:"🌅" },
  { id:"c7", name:"Artesanías Gesell",      cat:"Compras Locales",    pin:"7890", selloId:6, beneficio:"10% de descuento en toda la tienda de artesanías, tejidos y souvenirs locales.", maps:"", foto:"", color:"#1a3a5c", icon:"🛍️" },
  { id:"c8", name:"Surf & Bike",            cat:"Playa & Aventura",   pin:"8901", selloId:7, beneficio:"Kit de playa (reposera + sombrilla) sin cargo por 1 día, o 15% de descuento en clases de surf.", maps:"", foto:"", color:"#5c4a1a", icon:"🏖️" },
];

const CONFIG_INIT = {
  hotelNombre: "ZELENA VODA",
  hotelSubtitulo: "APART HOTEL",
  edicion: "EDICIÓN INVIERNO 2026",
  tagline: "ENTRE MARES Y PINOS",
  logoUrl: "",
  premioTexto: "Reuní 5 sellos o más durante tu estadía y participás automáticamente.",
  despedida: "Disfrutá, descubrí y creá recuerdos inolvidables.\n¡Gracias por elegirnos! ♡",
};

const ADMIN_PASS = "zelena2026";
const uid = () => Math.random().toString(36).slice(2,9);
const fmtDate = d => d ? new Date(d+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'}) : '';
const totalSellos = h => Object.values(h.sellos||{}).reduce((a,b)=>a+b,0);

const st = {
  btnGold:   { background:"#c9a84c", color:"#0d2340", border:"none", padding:"0.75rem 2rem", borderRadius:30, fontSize:"0.9rem", fontWeight:700, cursor:"pointer", letterSpacing:"0.05em", fontFamily:"'Playfair Display',serif" },
  btnOutline:{ background:"none", color:"#c9a84c", border:"1px solid #c9a84c", padding:"0.7rem 2rem", borderRadius:30, fontSize:"0.85rem", fontWeight:700, cursor:"pointer", fontFamily:"'Playfair Display',serif" },
  navBtn:    { flex:1, padding:"0.7rem 0.5rem 0.6rem", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, fontSize:"0.5rem", fontFamily:"sans-serif", letterSpacing:"0.08em", textTransform:"uppercase" },
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
@keyframes scanLine{0%{transform:translateY(-70px);opacity:0.4}50%{opacity:1}100%{transform:translateY(70px);opacity:0.4}}
.stamp-anim{animation:stampAnim .45s cubic-bezier(.36,.07,.19,.97);}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
.pulse{animation:pulse 1.6s infinite;}
`;

export default function App() {
  const [comercios, setComerciosState] = useState(COMERCIOS_INIT);
  const [config, setConfig] = useState(CONFIG_INIT);
  const [huespedes, setHuespedes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState("landing");
  const [pendingComercio, setPendingComercio] = useState(null);
  const [detailSello, setDetailSello] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [comercioActivo, setComercioActivo] = useState(null);
  const [toast, setToast] = useState("");
  const [stampAnimate, setStampAnimate] = useState(null);

  const isMobile = window.innerWidth <= 480 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const huesped = huespedes.find(h => h.id === currentUser);
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""), 2800); };
  const updateHuesped = (id, fn) => setHuespedes(hs => hs.map(h => h.id===id ? fn(h) : h));

  function LogoSVG({ size=48 }) {
    if(config.logoUrl) return <img src={config.logoUrl} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover"}} alt="logo"/>;
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

  if(!isMobile) return (
    <div style={{minHeight:"100vh",background:"#0d2340",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",gap:"1.5rem"}}>
      <div style={{width:80,height:80,border:"2px solid #c9a84c",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}><LogoSVG size={48}/></div>
      <div style={{color:"#c9a84c",fontSize:"1.5rem",fontWeight:700,letterSpacing:"0.12em",textAlign:"center"}}>{config.hotelNombre}</div>
      <div style={{color:"#e8c97a",fontSize:"0.65rem",letterSpacing:"0.22em",textAlign:"center"}}>PASAPORTE DE BENEFICIOS</div>
      <div style={{width:50,height:1,background:"#c9a84c"}}/>
      <div style={{fontSize:"3.5rem"}}>📱</div>
      <div style={{color:"white",fontSize:"1.1rem",fontStyle:"italic",textAlign:"center",maxWidth:360,lineHeight:1.5}}>Esta app está diseñada<br/>exclusivamente para celulares.</div>
      <div style={{color:"#e8c97a",fontSize:"0.78rem",fontFamily:"sans-serif",textAlign:"center",maxWidth:320,lineHeight:1.7}}>Escaneá el QR con tu teléfono<br/>o ingresá desde el navegador de tu celular.</div>
      <div style={{background:"white",borderRadius:12,padding:"1rem",border:"2px solid #c9a84c"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,width:112,height:112}}>
          {Array.from({length:49}).map((_,i)=>{
            const on=[0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,48,9,11,16,18,23,25,30,32,37,39].includes(i);
            return <div key={i} style={{background:on?"#0d2340":"white",borderRadius:1}}/>;
          })}
        </div>
      </div>
      <div style={{color:"rgba(201,168,76,0.3)",fontSize:"0.58rem",fontFamily:"sans-serif",letterSpacing:"0.15em"}}>ZELENA VODA — VILLA GESELL</div>
    </div>
  );

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
          <button onClick={()=>setScreen("register")} style={{...st.btnGold,width:"100%",marginTop:"1rem"}}>Crear mi Pasaporte</button>
          {huespedes.length>0&&(
            <button onClick={()=>{ setCurrentUser(huespedes[huespedes.length-1].id); setScreen("passport"); }} style={{...st.btnOutline,width:"100%"}}>Abrir Pasaporte Existente</button>
          )}
        </div>
        <div style={{display:"flex",gap:"0.7rem",marginTop:"0.5rem"}}>
          <button onClick={()=>setShowAdmin(v=>!v)} style={{background:"none",border:"1px solid rgba(201,168,76,0.2)",color:"rgba(201,168,76,0.4)",fontSize:"0.58rem",fontFamily:"sans-serif",letterSpacing:"0.1em",cursor:"pointer",padding:"0.5rem 0.9rem",borderRadius:20}}>🏨 ADMIN HOTEL</button>
          <button onClick={()=>setScreen("comerciologin")} style={{background:"none",border:"1px solid rgba(201,168,76,0.2)",color:"rgba(201,168,76,0.4)",fontSize:"0.58rem",fontFamily:"sans-serif",letterSpacing:"0.1em",cursor:"pointer",padding:"0.5rem 0.9rem",borderRadius:20}}>🏪 ADMIN COMERCIO</button>
        </div>
        {showAdmin&&<button onClick={()=>setScreen("adminlogin")} style={{...st.btnGold,fontSize:"0.75rem",padding:"0.6rem 1.5rem"}}>Ingresar como Admin Hotel</button>}
      </div>
    );
  }

  function RegisterScreen() {
    const [form, setForm] = useState({nombre:"",apellido:"",fnac:"",desde:"",hasta:""});
    const [err, setErr] = useState("");
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const submit = () => {
      if(!form.nombre||!form.apellido||!form.fnac||!form.desde||!form.hasta) return setErr("Completá todos los campos.");
      if(form.desde>form.hasta) return setErr("Las fechas de estadía no son válidas.");
      const h = {id:uid(),nombre:form.nombre,apellido:form.apellido,fnac:form.fnac,desde:form.desde,hasta:form.hasta,sellos:{},creado:new Date().toISOString().slice(0,10)};
      setHuespedes(hs=>[...hs,h]); setCurrentUser(h.id); setScreen("passport");
    };
    return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",padding:"2rem 1.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.2rem"}}>
        <div style={{color:"#c9a84c",fontSize:"0.65rem",letterSpacing:"0.22em",fontFamily:"sans-serif",fontWeight:700}}>{config.hotelNombre} — REGISTRO</div>
        <div style={{color:"#c9a84c",fontSize:"1.4rem",fontStyle:"italic",textAlign:"center"}}>Creá tu Pasaporte</div>
        <div style={{background:"#1a3558",borderRadius:16,border:"1.5px solid #c9a84c",padding:"1.5rem 1.4rem",width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:"1rem"}}>
          {[["nombre","Nombre"],["apellido","Apellido"]].map(([k,l])=>(
            <div key={k}><div style={st.rLabel}>{l}</div><input value={form[k]} onChange={set(k)} placeholder={l} style={st.rInput}/></div>
          ))}
          <div><div style={st.rLabel}>Fecha de Nacimiento</div><input type="date" value={form.fnac} onChange={set("fnac")} style={st.rInput}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
            <div><div style={st.rLabel}>Check-in</div><input type="date" value={form.desde} onChange={set("desde")} style={st.rInput}/></div>
            <div><div style={st.rLabel}>Check-out</div><input type="date" value={form.hasta} onChange={set("hasta")} style={st.rInput}/></div>
          </div>
          {err&&<div style={{color:"#f97",fontSize:"0.72rem",fontFamily:"sans-serif",textAlign:"center"}}>{err}</div>}
          <button onClick={submit} style={{...st.btnGold,width:"100%"}}>Crear mi Pasaporte</button>
        </div>
        <button onClick={()=>setScreen("landing")} style={{background:"none",border:"none",color:"#e8c97a",fontSize:"0.75rem",cursor:"pointer",fontFamily:"sans-serif"}}>← Volver</button>
      </div>
    );
  }

  function PassportScreen() {
    const h = huesped;
    const total = totalSellos(h);
    const pct = Math.min(total/5*100,100);
    return (
      <div className="fade" style={{background:"#f5f0e8",minHeight:"100vh",paddingBottom:"4.5rem",overflowY:"auto"}}>
        <div style={{background:"#0d2340",padding:"1rem 1.4rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>setScreen("landing")} style={{background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontSize:"1.1rem"}}>⟵</button>
          <span style={{color:"#c9a84c",fontSize:"0.85rem",letterSpacing:"0.1em",fontWeight:700}}>PASAPORTE DE BENEFICIOS</span>
          <span style={{color:"#e8c97a",fontSize:"0.65rem",fontFamily:"sans-serif"}}>ZV 2026</span>
        </div>
        <div style={{background:"#ede5d4",margin:"1.2rem 1.2rem 0",borderRadius:14,border:"1px solid #c9a84c",padding:"1.2rem 1.4rem",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,top:"50%",transform:"translateY(-50%) rotate(90deg)",color:"rgba(201,168,76,0.08)",fontSize:"1.8rem",fontWeight:700,letterSpacing:"0.15em",whiteSpace:"nowrap",fontFamily:"sans-serif"}}>{config.hotelNombre}</div>
          <div style={{fontSize:"0.55rem",color:"#4a3728",letterSpacing:"0.18em",fontFamily:"sans-serif",fontWeight:700,marginBottom:6}}>PASAPORTE DEL HUÉSPED</div>
          <div style={{fontSize:"1.1rem",color:"#0d2340",fontStyle:"italic",marginBottom:8}}>{h.nombre} {h.apellido}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem",marginBottom:6}}>
            <div><div style={st.gLabel}>Nacimiento</div><div style={st.gVal}>{fmtDate(h.fnac)}</div></div>
            <div><div style={st.gLabel}>Alojamiento</div><div style={{...st.gVal,fontSize:"0.72rem"}}>{config.hotelNombre}</div></div>
            <div><div style={st.gLabel}>Check-in</div><div style={st.gVal}>{fmtDate(h.desde)}</div></div>
            <div><div style={st.gLabel}>Check-out</div><div style={st.gVal}>{fmtDate(h.hasta)}</div></div>
          </div>
          <div style={{fontSize:"0.68rem",color:"#0d2340",fontFamily:"monospace",letterSpacing:"0.06em"}}>N.º ZV-2026-{h.id.slice(0,6).toUpperCase()}</div>
        </div>
        <div style={st.secTitle}>— BENEFICIOS EXCLUSIVOS —</div>
        <div style={{padding:"0 1.2rem",display:"flex",flexDirection:"column",gap:"0.65rem"}}>
          {comercios.map((comercio,idx)=>{
            const cnt = h.sellos[comercio.id]||0;
            return (
              <div key={comercio.id} onClick={()=>{setDetailSello({...SELLOS_DEF[idx%8],comercioId:comercio.id});setScreen("detail");}}
                style={{background:"white",borderRadius:12,border:"1px solid #ede5d4",display:"flex",alignItems:"stretch",overflow:"hidden",boxShadow:"0 1px 5px rgba(0,0,0,0.06)",cursor:"pointer"}}>
                <div style={{width:60,background:comercio.color||"#1a5c4a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0.6rem 0.3rem",flexShrink:0,gap:2}}>
                  <span style={{color:"rgba(255,255,255,0.7)",fontSize:"0.44rem",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.1em"}}>SELLO</span>
                  <span style={{color:"white",fontSize:"1.1rem",fontFamily:"'Playfair Display',serif",fontWeight:700}}>{idx+1}</span>
                </div>
                <div style={{flex:1,padding:"0.65rem 0.8rem",minWidth:0}}>
                  <div style={{fontSize:"0.52rem",color:"#888",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase"}}>{comercio.cat}</div>
                  <div style={{fontSize:"0.88rem",color:"#0d2340",fontStyle:"italic",lineHeight:1.2,margin:"2px 0"}}>{comercio.name}</div>
                  <div style={{fontSize:"0.63rem",color:"#666",fontFamily:"sans-serif",lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{comercio.beneficio}</div>
                </div>
                <div style={{width:54,display:"flex",alignItems:"center",justifyContent:"center",borderLeft:"1px dashed #ede5d4",flexShrink:0}}>
                  {cnt>0
                    ? <div className={stampAnimate===comercio.id?"stamp-anim":""} style={{width:42,height:42,borderRadius:"50%",background:comercio.color||"#1a5c4a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                        {cnt>1&&<span style={{color:"rgba(255,255,255,0.7)",fontSize:"0.44rem",fontFamily:"sans-serif",fontWeight:700}}>×{cnt}</span>}
                        <span style={{color:"white",fontSize:"1rem"}}>✓</span>
                      </div>
                    : <div style={{width:42,height:42,borderRadius:"50%",border:"2px solid #ede5d4",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:"0.4rem",color:"#ccc",fontFamily:"sans-serif",textAlign:"center",lineHeight:1.3,textTransform:"uppercase"}}>SELLO<br/>DEL<br/>COMERCIO</span>
                      </div>
                  }
                </div>
              </div>
            );
          })}
        </div>
        <div style={st.secTitle}>— PREMIO FINAL —</div>
        <div style={{margin:"0 1.2rem 1rem",background:"#0d2340",borderRadius:14,border:"2px solid #c9a84c",padding:"1.2rem 1.4rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"0.7rem"}}>
            <div style={{width:36,height:36,background:"#c9a84c",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0}}>🎁</div>
            <div style={{color:"#c9a84c",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.08em"}}>PREMIO FINAL {config.hotelNombre}</div>
          </div>
          <div style={{color:"#e8c97a",fontSize:"0.65rem",fontFamily:"sans-serif",lineHeight:1.5,marginBottom:"0.7rem"}}>{config.premioTexto}</div>
          <div style={{background:"rgba(255,255,255,0.1)",borderRadius:20,height:8,overflow:"hidden",marginBottom:"0.35rem"}}>
            <div style={{height:"100%",background:"#c9a84c",borderRadius:20,width:`${pct}%`,transition:"width .6s ease"}}/>
          </div>
          <div style={{color:"#e8c97a",fontSize:"0.65rem",fontFamily:"sans-serif",textAlign:"center",marginBottom:"0.8rem"}}>{total} / 5 sellos obtenidos</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.45rem",marginBottom:"0.6rem"}}>
            {[["🛏️","1 noche para dos"],["⬆️","Upgrade categoría"],["☕","Desayuno premium"]].map(([ic,tx])=>(
              <div key={tx} style={{background:"rgba(255,255,255,0.07)",borderRadius:8,padding:"0.5rem 0.3rem",textAlign:"center",border:"1px solid rgba(201,168,76,0.2)"}}>
                <div style={{fontSize:"1rem",marginBottom:3}}>{ic}</div>
                <div style={{color:"#e8c97a",fontSize:"0.48rem",fontFamily:"sans-serif",lineHeight:1.3}}>{tx}</div>
              </div>
            ))}
          </div>
          {total>=5
            ? <div className="pulse" style={{color:"#c9a84c",fontSize:"0.75rem",fontFamily:"sans-serif",textAlign:"center",fontWeight:700}}>🎉 ¡Ya participás del Premio Final!</div>
            : <div style={{color:"rgba(201,168,76,0.4)",fontSize:"0.62rem",fontFamily:"sans-serif",textAlign:"center",fontStyle:"italic"}}>Completá 5 sellos para participar</div>
          }
        </div>
        <div style={{textAlign:"center",padding:"0.5rem 1.5rem 1rem",fontStyle:"italic",fontSize:"0.72rem",color:"#4a3728"}}>
          {config.despedida.split('\n').map((l,i)=><div key={i}>{l}</div>)}
        </div>
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0d2340",borderTop:"1px solid #c9a84c",display:"flex",zIndex:100}}>
          <button style={{...st.navBtn,color:"#c9a84c",borderTop:"2px solid #c9a84c"}}>🪪 Pasaporte</button>
          <button style={{...st.navBtn,color:"rgba(201,168,76,0.4)"}} onClick={()=>setScreen("qrscan")}>📷 Escanear QR</button>
        </div>
      </div>
    );
  }

  function DetailScreen() {
    const s = detalleSello;
    if(!s) return null;
    const comercio = comercios.find(c=>c.id===s.comercioId);
    if(!comercio) return null;
    const cnt = huesped?.sellos[comercio.id]||0;
    const color = comercio.color||s.color;
    const icon = comercio.icon||s.icon;
    return (
      <div className="fade" style={{background:"#f5f0e8",minHeight:"100vh",paddingBottom:"2rem",overflowY:"auto"}}>
        <div style={{background:"#0d2340",padding:"1rem 1.4rem",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setScreen("passport")} style={{background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontSize:"1.1rem"}}>⟵</button>
          <span style={{color:"#c9a84c",fontSize:"0.85rem",letterSpacing:"0.1em",fontWeight:700,flex:1,textAlign:"center"}}>{comercio.cat.toUpperCase()}</span>
          <div style={{width:24}}/>
        </div>
        <div style={{height:130,background:color,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
          {comercio.foto&&<img src={comercio.foto} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.5}} alt="foto"/>}
          <div style={{width:80,height:80,borderRadius:"50%",border:"3px solid rgba(255,255,255,0.6)",background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.5rem",zIndex:1}}>{icon}</div>
        </div>
        <div style={{padding:"1.4rem"}}>
          <div style={{fontSize:"0.58rem",color:"#4a3728",letterSpacing:"0.18em",fontFamily:"sans-serif",fontWeight:700}}>SELLO N.º {comercios.indexOf(comercio)+1}</div>
          <div style={{fontSize:"1.5rem",color:"#0d2340",fontStyle:"italic",lineHeight:1.1,margin:"4px 0 3px"}}>{comercio.name}</div>
          <div style={{fontSize:"0.78rem",color:"#4a3728",fontFamily:"sans-serif",marginBottom:"1.1rem"}}>{comercio.cat}</div>
          <div style={{background:"#0d2340",borderRadius:12,padding:"1.1rem",marginBottom:"1.1rem"}}>
            <div style={{fontSize:"0.55rem",letterSpacing:"0.15em",color:"#e8c97a",fontFamily:"sans-serif",fontWeight:700,marginBottom:"0.5rem"}}>PRESENTANDO ESTE PASAPORTE OBTENÉS:</div>
            <div style={{color:"white",fontSize:"0.88rem",fontFamily:"sans-serif",lineHeight:1.6}}>{comercio.beneficio}</div>
            <div style={{marginTop:"0.7rem",paddingTop:"0.6rem",borderTop:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:"0.65rem",color:"#e8c97a",fontFamily:"sans-serif"}}>📍 {comercio.name}</div>
              {comercio.maps&&<a href={comercio.maps} target="_blank" rel="noreferrer" style={{fontSize:"0.65rem",color:"#5ab4ff",fontFamily:"sans-serif",fontWeight:700,textDecoration:"none"}}>Ver en Maps →</a>}
            </div>
          </div>
          {cnt>0&&<div style={{background:color,color:"white",borderRadius:10,padding:"0.8rem",textAlign:"center",fontFamily:"sans-serif",fontSize:"0.78rem",marginBottom:"0.8rem"}}>
            ✓ {cnt===1?"Sello obtenido":"Sello obtenido ×"+cnt} — Mostrá esta pantalla
          </div>}
          <button onClick={()=>{ setPendingComercio(comercio); setScreen("qrscan_comercio"); }} style={{...st.btnGold,width:"100%"}}>
            {cnt>0?"Escanear nuevamente":"Escanear QR del comercio"} 📷
          </button>
        </div>
      </div>
    );
  }

  function QRScanComercioScreen() {
    const c = pendingComercio;
    const color = c.color||"#1a5c4a";
    const icon = c.icon||"🏪";
    const [scanned, setScanned] = useState(false);
    return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",padding:"2rem 1.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.2rem"}}>
        <button onClick={()=>setScreen("detail")} style={{alignSelf:"flex-start",background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontSize:"1.1rem"}}>⟵</button>
        <div style={{color:"#c9a84c",fontSize:"0.65rem",letterSpacing:"0.22em",fontFamily:"sans-serif",fontWeight:700,textAlign:"center"}}>ESCANEÁ EL QR DE</div>
        <div style={{background:"#1a3558",borderRadius:14,border:"1.5px solid #c9a84c",padding:"0.9rem 1.4rem",display:"flex",alignItems:"center",gap:"0.8rem",width:"100%",maxWidth:300}}>
          <div style={{width:44,height:44,background:color,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",flexShrink:0}}>{icon}</div>
          <div>
            <div style={{color:"#c9a84c",fontSize:"0.9rem",fontStyle:"italic"}}>{c.name}</div>
            <div style={{color:"#e8c97a",fontSize:"0.6rem",fontFamily:"sans-serif",marginTop:2}}>{c.cat}</div>
          </div>
        </div>
        <div style={{position:"relative",width:220,height:220,borderRadius:16,overflow:"hidden",border:`3px solid ${scanned?"#c9a84c":"rgba(201,168,76,0.4)"}`}}>
          <div style={{width:"100%",height:"100%",background:"#111",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{position:"relative",width:180,height:180}}>
              {[[0,0],[0,1],[1,0],[1,1]].map(([t,r],i)=>(
                <div key={i} style={{position:"absolute",top:t?'auto':0,bottom:t?0:'auto',left:r?'auto':0,right:r?0:'auto',width:28,height:28,
                  borderTop:!t?"3px solid #c9a84c":"none",borderBottom:t?"3px solid #c9a84c":"none",
                  borderLeft:!r?"3px solid #c9a84c":"none",borderRight:r?"3px solid #c9a84c":"none"}}/>
              ))}
              {!scanned&&<div style={{position:"absolute",left:10,right:10,height:2,background:"#c9a84c",opacity:0.8,animation:"scanLine 1.8s ease-in-out infinite",top:"50%"}}/>}
              {scanned&&<div className="fade" style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(26,92,74,0.9)",border:"3px solid #c9a84c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem"}}>✓</div>
              </div>}
            </div>
          </div>
        </div>
        {!scanned ? (
          <>
            <div style={{color:"#e8c97a",fontSize:"0.72rem",fontFamily:"sans-serif",textAlign:"center",lineHeight:1.6}}>Pedile al comerciante que genere su QR<br/>y apuntá la cámara para escanearlo.</div>
            <button onClick={()=>setScanned(true)} style={{...st.btnGold,width:"100%",maxWidth:300}}>📷 Simular escaneo exitoso</button>
          </>
        ) : (
          <>
            <div style={{color:"#c9a84c",fontSize:"0.82rem",fontFamily:"sans-serif",textAlign:"center",fontWeight:700}}>✓ QR escaneado correctamente</div>
            <div style={{color:"#e8c97a",fontSize:"0.72rem",fontFamily:"sans-serif",textAlign:"center",lineHeight:1.5}}>Ahora pedile al comerciante<br/>que ingrese su <strong style={{color:"#c9a84c"}}>PIN de 4 dígitos.</strong></div>
            <button onClick={()=>setScreen("pinentry")} style={{...st.btnGold,width:"100%",maxWidth:300}}>Ingresar PIN del comerciante 🔑</button>
          </>
        )}
      </div>
    );
  }

  function QRScanScreen() {
    const [sel, setSel] = useState("");
    const comercio = comercios.find(c=>c.id===sel);
    return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",padding:"2rem 1.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.2rem"}}>
        <button onClick={()=>setScreen("passport")} style={{alignSelf:"flex-start",background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontSize:"1.1rem"}}>⟵</button>
        <div style={{color:"#c9a84c",fontSize:"0.65rem",letterSpacing:"0.22em",fontFamily:"sans-serif",fontWeight:700,textAlign:"center"}}>ESCANEAR QR DEL COMERCIO</div>
        <div style={{position:"relative",width:220,height:220,borderRadius:16,overflow:"hidden",border:"3px solid rgba(201,168,76,0.4)"}}>
          <div style={{width:"100%",height:"100%",background:"#111",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{position:"relative",width:180,height:180}}>
              {[[0,0],[0,1],[1,0],[1,1]].map(([t,r],i)=>(
                <div key={i} style={{position:"absolute",top:t?'auto':0,bottom:t?0:'auto',left:r?'auto':0,right:r?0:'auto',width:28,height:28,
                  borderTop:!t?"3px solid #c9a84c":"none",borderBottom:t?"3px solid #c9a84c":"none",
                  borderLeft:!r?"3px solid #c9a84c":"none",borderRight:r?"3px solid #c9a84c":"none"}}/>
              ))}
              <div style={{position:"absolute",left:10,right:10,height:2,background:"#c9a84c",opacity:0.8,animation:"scanLine 1.8s ease-in-out infinite",top:"50%"}}/>
            </div>
          </div>
        </div>
        <div style={{color:"#e8c97a",fontSize:"0.7rem",fontFamily:"sans-serif",textAlign:"center",lineHeight:1.6}}>
          Apuntá la cámara al QR del comercio.<br/>
          <span style={{color:"rgba(201,168,76,0.45)",fontSize:"0.6rem"}}>Demo: seleccioná el comercio para simular</span>
        </div>
        <div style={{width:"100%",maxWidth:300}}>
          <select value={sel} onChange={e=>setSel(e.target.value)} style={{...st.rInput,color:sel?"white":"rgba(255,255,255,0.35)"}}>
            <option value="">— simulá el escaneo —</option>
            {comercios.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {comercio&&(
          <div className="fade" style={{background:"#1a3558",borderRadius:14,border:"1px solid #c9a84c",padding:"0.9rem 1.1rem",width:"100%",maxWidth:300,display:"flex",alignItems:"center",gap:"0.8rem"}}>
            <div style={{fontSize:"1.8rem"}}>{comercio.icon||"🏪"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:"#c9a84c",fontSize:"0.88rem",fontStyle:"italic"}}>{comercio.name}</div>
              <div style={{color:"#e8c97a",fontSize:"0.62rem",fontFamily:"sans-serif",marginTop:2,lineHeight:1.3}}>{comercio.beneficio?.slice(0,60)}...</div>
            </div>
          </div>
        )}
        <button onClick={()=>{ if(!comercio) return; setPendingComercio(comercio); setScreen("pinentry"); }} disabled={!sel} style={{...st.btnGold,width:"100%",maxWidth:300,opacity:sel?1:0.35}}>
          Ingresar PIN del comerciante →
        </button>
      </div>
    );
  }

  function PinEntryScreen() {
    const [pin, setPin] = useState(["","","",""]);
    const [err, setErr] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const refs = [useRef(),useRef(),useRef(),useRef()];
    const c = pendingComercio;
    if(!c) return null;
    const color = c.color||"#1a5c4a";
    const icon = c.icon||"🏪";
    const handleDigit = (i,v) => {
      if(!/^\d?$/.test(v)) return;
      const np=[...pin]; np[i]=v; setPin(np);
      if(v&&i<3) refs[i+1].current?.focus();
    };
    const confirm = () => {
      const cFresh = comercios.find(x=>x.id===c.id);
      if(pin.join("")!==cFresh.pin){ setErr("PIN incorrecto."); setPin(["","","",""]); refs[0].current?.focus(); return; }
      setErr(""); setConfirmed(true);
      updateHuesped(currentUser, h=>({...h,sellos:{...h.sellos,[c.id]:(h.sellos[c.id]||0)+1}}));
      setStampAnimate(c.id);
      setTimeout(()=>setStampAnimate(null),800);
      showToast("¡Sello obtenido! ✓");
      setTimeout(()=>{ setPendingComercio(null); setScreen("passport"); },2200);
    };
    return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",padding:"2rem 1.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.2rem"}}>
        <div style={{width:"100%"}}><button onClick={()=>setScreen("qrscan_comercio")} style={{background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontSize:"1.1rem"}}>⟵</button></div>
        {!confirmed ? <>
          <div style={{color:"#c9a84c",fontSize:"0.65rem",letterSpacing:"0.22em",fontFamily:"sans-serif",fontWeight:700,textAlign:"center"}}>¡ESTÁS POR OBTENER EL SELLO!</div>
          <div style={{background:color,width:80,height:80,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.5rem",border:"3px solid #c9a84c"}}>{icon}</div>
          <div style={{textAlign:"center"}}>
            <div style={{color:"#c9a84c",fontSize:"1.1rem",fontStyle:"italic"}}>{c.name}</div>
            <div style={{color:"#e8c97a",fontSize:"0.72rem",fontFamily:"sans-serif",marginTop:4,maxWidth:260,lineHeight:1.4}}>{c.beneficio}</div>
          </div>
          <div style={{color:"#e8c97a",fontSize:"0.72rem",fontFamily:"sans-serif",textAlign:"center",marginTop:4}}>
            Pedile al comerciante su <strong style={{color:"#c9a84c"}}>PIN de 4 dígitos:</strong>
          </div>
          <div style={{display:"flex",gap:"0.7rem"}}>
            {pin.map((v,i)=>(
              <input key={i} ref={refs[i]} value={v} onChange={e=>handleDigit(i,e.target.value)} maxLength={1} inputMode="numeric"
                style={{width:52,height:60,textAlign:"center",fontSize:"1.6rem",fontWeight:700,background:"#1a3558",border:`2px solid ${v?"#c9a84c":"#e8c97a"}`,borderRadius:12,color:"white",outline:"none"}}/>
            ))}
          </div>
          {err&&<div style={{color:"#f97",fontSize:"0.72rem",fontFamily:"sans-serif",textAlign:"center"}}>{err}</div>}
          <button onClick={confirm} disabled={pin.some(v=>!v)} style={{...st.btnGold,width:200,opacity:pin.some(v=>!v)?0.4:1}}>Confirmar PIN</button>
        </> : (
          <div className="fade" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",marginTop:"2rem"}}>
            <div className="stamp-anim" style={{background:color,width:100,height:100,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"3rem",border:"4px solid #c9a84c"}}>{icon}</div>
            <div style={{color:"#c9a84c",fontSize:"1.3rem",fontStyle:"italic",textAlign:"center"}}>¡Sello obtenido!</div>
            <div style={{color:"#e8c97a",fontSize:"0.78rem",fontFamily:"sans-serif",textAlign:"center"}}>{c.name}</div>
          </div>
        )}
      </div>
    );
  }

  function ComercioLoginScreen() {
    const [selId, setSelId] = useState("");
    const [pin, setPin] = useState("");
    const [err, setErr] = useState("");
    const login = () => {
      const c = comercios.find(x=>x.id===selId);
      if(!c) return setErr("Seleccioná tu comercio.");
      if(c.pin!==pin) return setErr("PIN incorrecto.");
      setComercioActivo(c); setScreen("comerciopanel");
    };
    return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",padding:"2.5rem 1.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.2rem"}}>
        <button onClick={()=>setScreen("landing")} style={{alignSelf:"flex-start",background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontFamily:"sans-serif",fontSize:"0.8rem"}}>← Volver</button>
        <div style={{fontSize:"2rem"}}>🏪</div>
        <div style={{color:"#c9a84c",fontSize:"1.2rem",fontWeight:700,letterSpacing:"0.08em",textAlign:"center"}}>ADMIN COMERCIO</div>
        <div style={{color:"#e8c97a",fontSize:"0.62rem",fontFamily:"sans-serif",letterSpacing:"0.15em",textAlign:"center"}}>{config.hotelNombre} — ACCESO COMERCIOS</div>
        <div style={{background:"#1a3558",borderRadius:16,border:"1.5px solid #c9a84c",padding:"1.5rem 1.4rem",width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div>
            <div style={st.rLabel}>Tu Comercio</div>
            <select value={selId} onChange={e=>{setSelId(e.target.value);setErr("");}} style={{...st.rInput,color:selId?"white":"rgba(255,255,255,0.5)",background:"#1a3558"}}>
              <option value="">— Seleccioná tu comercio —</option>
              {comercios.map(c=><option key={c.id} value={c.id} style={{color:"white",background:"#1a3558"}}>{c.name}</option>)}
            </select>
          </div>
          {selId&&(
            <div className="fade">
              <div style={st.rLabel}>PIN de acceso</div>
              <input type="password" value={pin} onChange={e=>{if(/^\d{0,4}$/.test(e.target.value)){setPin(e.target.value);setErr("");}}}
                placeholder="••••" maxLength={4} inputMode="numeric"
                style={{...st.rInput,letterSpacing:"0.3em",textAlign:"center",fontSize:"1.2rem"}}
                onKeyDown={e=>e.key==="Enter"&&login()} autoFocus/>
            </div>
          )}
          {err&&<div style={{color:"#f97",fontSize:"0.72rem",fontFamily:"sans-serif",textAlign:"center"}}>{err}</div>}
          <button onClick={login} disabled={!selId||!pin} style={{...st.btnGold,width:"100%",opacity:selId&&pin?1:0.45}}>Ingresar</button>
        </div>
        <div style={{color:"rgba(201,168,76,0.25)",fontSize:"0.58rem",fontFamily:"sans-serif",textAlign:"center",lineHeight:1.6}}>Usá el PIN que te asignó {config.hotelNombre}.</div>
      </div>
    );
  }

  function ComercioPanelScreen() {
    const c = comercioActivo;
    const color = c.color||"#1a5c4a";
    const icon = c.icon||"🏪";
    const [qrActivo, setQrActivo] = useState(false);
    const [segundos, setSegundos] = useState(0);
    const [token, setToken] = useState("");
    const [editando, setEditando] = useState(false);
    const [beneficioEdit, setBeneficioEdit] = useState(c.beneficio);
    const [editandoPin, setEditandoPin] = useState(false);
    const [pinEdit, setPinEdit] = useState("");
    const [pinActual, setPinActual] = useState("");
    const [pinErr, setPinErr] = useState("");
    const timerRef = useRef(null);
    const sellCount = huespedes.reduce((acc,h)=>(h.sellos[c.id]||0)+acc,0);
    const beneficioActual = comercios.find(x=>x.id===c.id)?.beneficio||c.beneficio;
    const guardarBeneficio = () => {
      setComerciosState(cs=>cs.map(x=>x.id===c.id?{...x,beneficio:beneficioEdit}:x));
      setComercioActivo({...c,beneficio:beneficioEdit});
      setEditando(false); showToast("Beneficio actualizado ✓");
    };
    const guardarPin = () => {
      const cFresh = comercios.find(x=>x.id===c.id);
      if(pinActual!==cFresh.pin){setPinErr("PIN actual incorrecto.");return;}
      if(pinEdit.length!==4){setPinErr("El nuevo PIN debe tener 4 dígitos.");return;}
      setComerciosState(cs=>cs.map(x=>x.id===c.id?{...x,pin:pinEdit}:x));
      setComercioActivo({...c,pin:pinEdit});
      setEditandoPin(false); setPinEdit(""); setPinActual(""); setPinErr(""); showToast("PIN actualizado ✓");
    };
    const generarQR = () => {
      if(timerRef.current) clearInterval(timerRef.current);
      const t = Math.random().toString(36).slice(2,8).toUpperCase();
      setToken(t); setQrActivo(true); setSegundos(90);
      timerRef.current = setInterval(()=>{
        setSegundos(prev=>{ if(prev<=1){clearInterval(timerRef.current);setQrActivo(false);setToken("");return 0;} return prev-1; });
      },1000);
    };
    const pct = Math.min(segundos/90*100,100);
    const ringColor = segundos>45?"#c9a84c":segundos>20?"#e8a020":"#e85020";
    const qrBits = token?Array.from(token).reduce((acc,ch)=>acc+ch.charCodeAt(0),0):0;
    const qrGrid = Array.from({length:49},(_,i)=>{ const corner=[0,1,2,3,4,5,6,7,13,14,20,21,28,35,42,43,44,45,46,47,48].includes(i); return corner||((qrBits+i*7)%3===0); });
    return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",paddingBottom:"2rem",overflowY:"auto"}}>
        <div style={{background:"#1a3558",width:"100%",padding:"1rem 1.4rem",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #c9a84c"}}>
          <button onClick={()=>{if(timerRef.current)clearInterval(timerRef.current);setComercioActivo(null);setScreen("landing");}} style={{background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontSize:"1rem"}}>⟵</button>
          <div style={{textAlign:"center"}}>
            <div style={{color:"#c9a84c",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.08em"}}>{c.name}</div>
            <div style={{color:"#e8c97a",fontSize:"0.55rem",fontFamily:"sans-serif",letterSpacing:"0.12em"}}>{c.cat}</div>
          </div>
          <div style={{width:36,height:36,background:color,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem"}}>{icon}</div>
        </div>
        <div style={{padding:"1.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.2rem",width:"100%",maxWidth:360}}>
          <div style={{background:"rgba(255,255,255,0.05)",borderRadius:12,border:`1px solid ${editando?"rgba(201,168,76,0.6)":"rgba(201,168,76,0.2)"}`,padding:"0.9rem 1rem",width:"100%",transition:"border .2s"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{fontSize:"0.55rem",color:"#e8c97a",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.15em"}}>BENEFICIO A OTORGAR</div>
              {!editando&&<button onClick={()=>{setBeneficioEdit(beneficioActual);setEditando(true);}} style={{background:"none",border:"1px solid rgba(201,168,76,0.3)",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:"0.55rem",color:"#e8c97a",fontFamily:"sans-serif"}}>✏️ Editar</button>}
            </div>
            {!editando
              ? <div style={{color:"white",fontSize:"0.82rem",fontFamily:"sans-serif",lineHeight:1.5}}>{beneficioActual}</div>
              : <div className="fade" style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
                  <textarea value={beneficioEdit} onChange={e=>setBeneficioEdit(e.target.value)} rows={4}
                    style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(201,168,76,0.4)",borderRadius:8,padding:"0.6rem 0.8rem",color:"white",fontSize:"0.82rem",fontFamily:"sans-serif",lineHeight:1.5,resize:"vertical",width:"100%",outline:"none"}}/>
                  <div style={{display:"flex",gap:"0.5rem"}}>
                    <button onClick={guardarBeneficio} style={{...st.btnGold,flex:1,padding:"0.55rem",fontSize:"0.75rem"}}>Guardar</button>
                    <button onClick={()=>setEditando(false)} style={{...st.btnOutline,flex:1,padding:"0.55rem",fontSize:"0.75rem"}}>Cancelar</button>
                  </div>
                </div>
            }
          </div>
          <div style={{background:"rgba(255,255,255,0.05)",borderRadius:12,border:`1px solid ${editandoPin?"rgba(201,168,76,0.6)":"rgba(201,168,76,0.2)"}`,padding:"0.9rem 1rem",width:"100%",transition:"border .2s"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{fontSize:"0.55rem",color:"#e8c97a",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.15em"}}>PIN DE ACCESO</div>
              {!editandoPin&&<button onClick={()=>{setEditandoPin(true);setPinErr("");}} style={{background:"none",border:"1px solid rgba(201,168,76,0.3)",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:"0.55rem",color:"#e8c97a",fontFamily:"sans-serif"}}>✏️ Cambiar</button>}
            </div>
            {!editandoPin
              ? <div style={{color:"white",fontSize:"1.4rem",letterSpacing:"0.4em",fontFamily:"monospace"}}>••••</div>
              : <div className="fade" style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
                  <div>
                    <div style={{fontSize:"0.55rem",color:"rgba(201,168,76,0.6)",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.12em",marginBottom:4}}>PIN ACTUAL</div>
                    <input type="password" value={pinActual} onChange={e=>{if(/^\d{0,4}$/.test(e.target.value)){setPinActual(e.target.value);setPinErr("");}}} maxLength={4} inputMode="numeric" placeholder="••••"
                      style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:8,padding:"0.5rem",color:"white",fontSize:"1.1rem",letterSpacing:"0.3em",textAlign:"center",width:100,outline:"none"}}/>
                  </div>
                  <div>
                    <div style={{fontSize:"0.55rem",color:"rgba(201,168,76,0.6)",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.12em",marginBottom:4}}>NUEVO PIN</div>
                    <input type="password" value={pinEdit} onChange={e=>{if(/^\d{0,4}$/.test(e.target.value)){setPinEdit(e.target.value);setPinErr("");}}} maxLength={4} inputMode="numeric" placeholder="••••"
                      style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:8,padding:"0.5rem",color:"white",fontSize:"1.1rem",letterSpacing:"0.3em",textAlign:"center",width:100,outline:"none"}}/>
                  </div>
                  {pinErr&&<div style={{color:"#f97",fontSize:"0.68rem",fontFamily:"sans-serif"}}>{pinErr}</div>}
                  <div style={{display:"flex",gap:"0.5rem"}}>
                    <button onClick={guardarPin} style={{...st.btnGold,flex:1,padding:"0.55rem",fontSize:"0.75rem"}}>Guardar</button>
                    <button onClick={()=>{setEditandoPin(false);setPinEdit("");setPinActual("");setPinErr("");}} style={{...st.btnOutline,flex:1,padding:"0.55rem",fontSize:"0.75rem"}}>Cancelar</button>
                  </div>
                </div>
            }
          </div>
          <div style={{background:"rgba(255,255,255,0.05)",borderRadius:12,border:"1px solid rgba(201,168,76,0.2)",padding:"0.8rem 1rem",width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{color:"#e8c97a",fontSize:"0.62rem",fontFamily:"sans-serif"}}>Sellos emitidos por tu comercio</div>
            <div style={{color:"#c9a84c",fontSize:"1.6rem",fontWeight:700,fontFamily:"sans-serif"}}>{sellCount}</div>
          </div>
          {!qrActivo ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",width:"100%"}}>
              <div style={{color:"#e8c97a",fontSize:"0.72rem",fontFamily:"sans-serif",textAlign:"center",lineHeight:1.6}}>Cuando el huésped esté presente,<br/>generá el QR para que lo escanée.</div>
              <button onClick={generarQR} style={{...st.btnGold,width:"100%",fontSize:"1rem",padding:"1rem"}}>Generar QR 📲</button>
            </div>
          ) : (
            <div className="fade" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.8rem",width:"100%"}}>
              <div style={{position:"relative",width:200,height:200}}>
                <svg width="200" height="200" style={{position:"absolute",top:0,left:0,transform:"rotate(-90deg)"}}>
                  <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(201,168,76,0.1)" strokeWidth="6"/>
                  <circle cx="100" cy="100" r="90" fill="none" stroke={ringColor} strokeWidth="6"
                    strokeDasharray={`${2*Math.PI*90}`} strokeDashoffset={`${2*Math.PI*90*(1-pct/100)}`}
                    style={{transition:"stroke-dashoffset 1s linear, stroke .5s"}}/>
                </svg>
                <div style={{position:"absolute",inset:16,background:"white",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,width:100,height:100}}>
                    {qrGrid.map((on,i)=><div key={i} style={{background:on?"#0d2340":"white",borderRadius:1}}/>)}
                  </div>
                </div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{color:ringColor,fontSize:"2rem",fontWeight:700,fontFamily:"sans-serif",lineHeight:1}}>{segundos}</div>
                <div style={{color:"#e8c97a",fontSize:"0.62rem",fontFamily:"sans-serif",marginTop:2}}>segundos restantes</div>
              </div>
              <div style={{color:"#e8c97a",fontSize:"0.68rem",fontFamily:"sans-serif",textAlign:"center",lineHeight:1.5}}>
                Mostrá este QR al huésped para que lo escanée.<br/>
                <span style={{color:"rgba(201,168,76,0.45)"}}>El código expira automáticamente.</span>
              </div>
              <button onClick={generarQR} style={{...st.btnOutline,fontSize:"0.78rem",padding:"0.6rem 1.5rem"}}>Regenerar QR</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function AdminLoginScreen() {
    const [pass, setPass] = useState("");
    const [err, setErr] = useState("");
    const login = () => { if(pass===ADMIN_PASS){setAdminMode(true);setScreen("admin");}else setErr("Contraseña incorrecta."); };
    return (
      <div className="fade" style={{background:"#0d2340",minHeight:"100vh",padding:"2.5rem 1.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.2rem"}}>
        <button onClick={()=>setScreen("landing")} style={{alignSelf:"flex-start",background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontFamily:"sans-serif",fontSize:"0.8rem"}}>← Volver</button>
        <div style={{color:"#c9a84c",fontSize:"1.2rem",fontWeight:700,letterSpacing:"0.1em",textAlign:"center"}}>PANEL ADMINISTRADOR</div>
        <div style={{color:"#e8c97a",fontSize:"0.65rem",fontFamily:"sans-serif",letterSpacing:"0.15em",textAlign:"center"}}>{config.hotelNombre} — ACCESO RESTRINGIDO</div>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Contraseña"
          style={{...st.rInput,width:260,textAlign:"center",letterSpacing:"0.15em"}}
          onKeyDown={e=>e.key==="Enter"&&login()}/>
        {err&&<div style={{color:"#f97",fontSize:"0.72rem",fontFamily:"sans-serif"}}>{err}</div>}
        <button onClick={login} style={{...st.btnGold,width:260}}>Ingresar</button>
        <div style={{color:"rgba(201,168,76,0.3)",fontSize:"0.6rem",fontFamily:"sans-serif",marginTop:"1rem"}}>Pass: zelena2026</div>
      </div>
    );
  }

  function AdminDashboard() {
    const [tab, setTab] = useState("dashboard");
    const totalH = huespedes.length;
    const totalSE = huespedes.reduce((acc,h)=>acc+totalSellos(h),0);
    const comp5 = huespedes.filter(h=>totalSellos(h)>=5).length;
    const ranking = comercios.map(c=>({...c,total:huespedes.reduce((acc,h)=>(h.sellos[c.id]||0)+acc,0)})).sort((a,b)=>b.total-a.total);
    return (
      <div className="fade" style={{background:"#f5f0e8",minHeight:"100vh",paddingBottom:"2rem",overflowY:"auto"}}>
        <div style={{background:"#0d2340",padding:"1rem 1.4rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setAdminMode(false);setScreen("landing");}} style={{background:"none",border:"none",color:"#c9a84c",cursor:"pointer",fontSize:"1rem"}}>⟵</button>
          <span style={{color:"#c9a84c",fontSize:"0.8rem",letterSpacing:"0.1em",fontWeight:700}}>ADMIN — {config.hotelNombre}</span>
          <span>🔐</span>
        </div>
        <div style={{display:"flex",background:"#1a3558",borderBottom:"1px solid #c9a84c",overflowX:"auto"}}>
          {[["dashboard","Dashboard"],["huespedes","Huéspedes"],["comercios","Comercios"],["config","Config"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{flexShrink:0,padding:"0.7rem 0.8rem",background:"none",border:"none",borderBottom:`2px solid ${tab===t?"#c9a84c":"transparent"}`,color:tab===t?"#c9a84c":"#e8c97a",fontSize:"0.6rem",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.1em",cursor:"pointer",textTransform:"uppercase"}}>{l}</button>
          ))}
        </div>
        {tab==="dashboard"&&(
          <div style={{padding:"1.2rem"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.8rem",marginBottom:"1rem"}}>
              {[["🏨","Huéspedes Alojados",totalH,"#1a5c4a"],["🔖","Sellos Emitidos",totalSE,"#1a4a5c"],["🏪","Comercios Adheridos",comercios.length,"#5c3a1a"],["🏆","Completaron 5 sellos",comp5,"#3a1a5c"]].map(([ic,label,val,col])=>(
                <div key={label} style={{background:"white",borderRadius:14,border:"1px solid #ede5d4",padding:"1rem 0.9rem",boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                  <div style={{fontSize:"1.4rem",marginBottom:4}}>{ic}</div>
                  <div style={{fontSize:"1.8rem",fontWeight:700,color:col,fontFamily:"sans-serif"}}>{val}</div>
                  <div style={{fontSize:"0.58rem",color:"#888",fontFamily:"sans-serif",lineHeight:1.3,marginTop:2}}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{background:"#0d2340",borderRadius:14,border:"1.5px solid #c9a84c",padding:"1.1rem"}}>
              <div style={{color:"#c9a84c",fontSize:"0.65rem",letterSpacing:"0.18em",fontFamily:"sans-serif",fontWeight:700,marginBottom:"0.8rem"}}>RANKING DE COMERCIOS</div>
              {ranking.map((c,i)=>(
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
        {tab==="huespedes"&&(
          <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.7rem"}}>
            {huespedes.length===0&&<div style={{textAlign:"center",color:"#999",fontFamily:"sans-serif",fontSize:"0.8rem",marginTop:"2rem"}}>No hay huéspedes registrados aún.</div>}
            {huespedes.map(h=>{
              const tot=totalSellos(h);
              return (
                <div key={h.id} style={{background:"white",borderRadius:14,border:"1px solid #ede5d4",padding:"1rem 1.1rem",boxShadow:"0 1px 5px rgba(0,0,0,0.06)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{fontSize:"0.95rem",color:"#0d2340",fontStyle:"italic"}}>{h.nombre} {h.apellido}</div>
                    <div style={{background:tot>=5?"#1a5c4a":"#eee",color:tot>=5?"white":"#999",fontSize:"0.55rem",fontFamily:"sans-serif",fontWeight:700,padding:"3px 8px",borderRadius:20}}>{tot>=5?"PREMIO ✓":tot+" sellos"}</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:8}}>
                    {[["Nacimiento",fmtDate(h.fnac)],["Check-in",fmtDate(h.desde)],["Check-out",fmtDate(h.hasta)],["ID","ZV-"+h.id.slice(0,6).toUpperCase()]].map(([l,v])=>(
                      <div key={l}><div style={{fontSize:"0.5rem",color:"#aaa",fontFamily:"sans-serif",fontWeight:700,textTransform:"uppercase"}}>{l}</div><div style={{fontSize:"0.72rem",color:"#4a3728",fontFamily:"sans-serif"}}>{v}</div></div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {comercios.map((c,idx)=>{
                      const cnt=h.sellos[c.id]||0;
                      const col=c.color||SELLOS_DEF[idx%8].color;
                      return (
                        <div key={c.id} title={c.name} style={{width:28,height:28,borderRadius:"50%",background:cnt>0?col:"#eee",display:"flex",alignItems:"center",justifyContent:"center",border:`1.5px solid ${cnt>0?col:"#ddd"}`,position:"relative"}}>
                          {cnt>0?<span style={{fontSize:"0.75rem",color:"white"}}>✓</span>:<span style={{fontSize:"0.6rem",color:"#ccc"}}>{idx+1}</span>}
                          {cnt>1&&<span style={{position:"absolute",top:-4,right:-4,background:"#c9a84c",color:"#0d2340",borderRadius:"50%",width:14,height:14,fontSize:"0.45rem",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif",fontWeight:700}}>×{cnt}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab==="comercios"&&(
          <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.7rem"}}>
            {comercios.map(c=>{
              const tot=huespedes.reduce((acc,h)=>(h.sellos[c.id]||0)+acc,0);
              return <ComercioCard key={c.id} c={c} tot={tot}
                onSave={updated=>setComerciosState(cs=>cs.map(x=>x.id===updated.id?updated:x))}
                onDelete={()=>setComerciosState(cs=>cs.filter(x=>x.id!==c.id))}/>;
            })}
            <button onClick={()=>setComerciosState(cs=>[...cs,{id:uid(),name:"Nuevo Comercio",cat:"Gastronomía",pin:"0000",selloId:cs.length%8,beneficio:"Describí el beneficio aquí.",maps:"",foto:"",color:COLORS_OPCIONES[cs.length%COLORS_OPCIONES.length],icon:ICONS_OPCIONES[cs.length%ICONS_OPCIONES.length]}])}
              style={{...st.btnGold,width:"100%",marginTop:"0.5rem"}}>+ Agregar Comercio</button>
          </div>
        )}
        {tab==="config"&&<ConfigTab/>}
      </div>
    );
  }

  function ConfigTab() {
    const [form, setForm] = useState({...config});
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const guardar = () => { setConfig(form); showToast("Configuración guardada ✓"); };
    const handleLogo = e => {
      const file = e.target.files[0]; if(!file) return;
      const reader = new FileReader();
      reader.onload = ev => setForm(f=>({...f,logoUrl:ev.target.result}));
      reader.readAsDataURL(file);
    };
    return (
      <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.9rem"}}>
        <div style={{background:"white",borderRadius:14,border:"1px solid #ede5d4",padding:"1.1rem",display:"flex",flexDirection:"column",gap:"0.8rem"}}>
          <div style={{fontSize:"0.65rem",color:"#4a3728",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.15em",marginBottom:2}}>IDENTIDAD DEL HOTEL</div>
          <div><div style={st.aLabel}>Nombre del Hotel</div><input value={form.hotelNombre} onChange={set("hotelNombre")} style={st.aInput}/></div>
          <div><div style={st.aLabel}>Subtítulo</div><input value={form.hotelSubtitulo} onChange={set("hotelSubtitulo")} style={st.aInput}/></div>
          <div><div style={st.aLabel}>Edición / Temporada</div><input value={form.edicion} onChange={set("edicion")} style={st.aInput}/></div>
          <div><div style={st.aLabel}>Tagline</div><input value={form.tagline} onChange={set("tagline")} style={st.aInput}/></div>
          <div>
            <div style={st.aLabel}>Logo del Hotel</div>
            {form.logoUrl&&<img src={form.logoUrl} style={{width:60,height:60,borderRadius:"50%",objectFit:"cover",marginBottom:8,border:"2px solid #c9a84c"}} alt="logo"/>}
            <input type="file" accept="image/*" onChange={handleLogo} style={{fontSize:"0.75rem",fontFamily:"sans-serif",color:"#4a3728"}}/>
          </div>
        </div>
        <div style={{background:"white",borderRadius:14,border:"1px solid #ede5d4",padding:"1.1rem",display:"flex",flexDirection:"column",gap:"0.8rem"}}>
          <div style={{fontSize:"0.65rem",color:"#4a3728",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.15em",marginBottom:2}}>TEXTOS DEL PASAPORTE</div>
          <div><div style={st.aLabel}>Texto Premio Final</div><textarea value={form.premioTexto} onChange={set("premioTexto")} rows={2} style={{...st.aInput,resize:"vertical",lineHeight:1.5,fontSize:"0.82rem"}}/></div>
          <div><div style={st.aLabel}>Mensaje de Despedida</div><textarea value={form.despedida} onChange={set("despedida")} rows={2} style={{...st.aInput,resize:"vertical",lineHeight:1.5,fontSize:"0.82rem"}}/></div>
        </div>
        <button onClick={guardar} style={{...st.btnGold,width:"100%"}}>Guardar Configuración</button>
      </div>
    );
  }

  function ComercioCard({c,tot,onSave,onDelete}) {
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [form, setForm] = useState({name:c.name,cat:c.cat,beneficio:c.beneficio,pin:c.pin,maps:c.maps||"",foto:c.foto||"",color:c.color||COLORS_OPCIONES[0],icon:c.icon||ICONS_OPCIONES[0]});
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const save = () => { onSave({...c,...form}); setEditing(false); showToast("Comercio actualizado ✓"); };
    const handleFoto = e => {
      const file = e.target.files[0]; if(!file) return;
      const reader = new FileReader();
      reader.onload = ev => setForm(f=>({...f,foto:ev.target.result}));
      reader.readAsDataURL(file);
    };
    return (
      <div style={{background:"white",borderRadius:14,border:`1px solid ${editing?"#c9a84c":"#ede5d4"}`,padding:"1rem 1.1rem",boxShadow:"0 1px 5px rgba(0,0,0,0.06)",transition:"border .2s"}}>
        {!editing ? (
          <div style={{display:"flex",alignItems:"flex-start",gap:"0.8rem"}}>
            <div style={{width:46,height:46,background:c.color||"#1a5c4a",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",flexShrink:0,overflow:"hidden"}}>
              {c.foto?<img src={c.foto} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="foto"/>:(c.icon||"🏪")}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:"0.92rem",color:"#0d2340",fontStyle:"italic",marginBottom:2}}>{c.name}</div>
              <div style={{fontSize:"0.58rem",color:"#888",fontFamily:"sans-serif",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>{c.cat}</div>
              <div style={{fontSize:"0.72rem",color:"#555",fontFamily:"sans-serif",lineHeight:1.5,marginBottom:6,background:"#f9f6f0",borderRadius:8,padding:"0.5rem 0.6rem",borderLeft:`3px solid ${c.color||"#1a5c4a"}`}}>{c.beneficio}</div>
              <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:"0.58rem",color:"#aaa",fontFamily:"sans-serif"}}>PIN:</span>
                <span style={{fontSize:"0.58rem",color:"#0d2340",fontFamily:"monospace",background:"#f0eee8",padding:"2px 10px",borderRadius:6,letterSpacing:"0.18em",fontWeight:700}}>{c.pin}</span>
                <span style={{fontSize:"0.58rem",color:"#aaa",fontFamily:"sans-serif"}}>{tot} sello{tot!==1?"s":""}</span>
                {c.maps&&<a href={c.maps} target="_blank" rel="noreferrer" style={{fontSize:"0.58rem",color:"#1a73e8",fontFamily:"sans-serif"}}>📍 Maps</a>}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <button onClick={()=>setEditing(true)} style={{background:"none",border:"1px solid #ede5d4",borderRadius:8,padding:"0.35rem 0.6rem",cursor:"pointer",fontSize:"0.65rem",fontFamily:"sans-serif",color:"#888"}}>✏️</button>
              {!confirmDelete
                ? <button onClick={()=>setConfirmDelete(true)} style={{background:"none",border:"1px solid #fcc",borderRadius:8,padding:"0.35rem 0.6rem",cursor:"pointer",fontSize:"0.65rem",color:"#e85020"}}>🗑️</button>
                : <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    <button onClick={()=>{ onDelete(); setConfirmDelete(false); }} style={{background:"#e85020",border:"none",borderRadius:8,padding:"0.35rem 0.5rem",cursor:"pointer",fontSize:"0.55rem",color:"white",fontFamily:"sans-serif",fontWeight:700}}>Sí, eliminar</button>
                    <button onClick={()=>setConfirmDelete(false)} style={{background:"none",border:"1px solid #ede5d4",borderRadius:8,padding:"0.35rem 0.5rem",cursor:"pointer",fontSize:"0.55rem",color:"#888",fontFamily:"sans-serif"}}>Cancelar</button>
                  </div>
              }
            </div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"0.7rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:36,height:36,background:form.color,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",overflow:"hidden"}}>
                {form.foto?<img src={form.foto} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="foto"/>:form.icon}
              </div>
              <div style={{color:"#0d2340",fontSize:"0.78rem",fontFamily:"sans-serif",fontWeight:700}}>Editando comercio</div>
            </div>
            <div><div style={st.aLabel}>Nombre</div><input value={form.name} onChange={set("name")} style={st.aInput}/></div>
            <div>
              <div style={st.aLabel}>Categoría</div>
              <select value={form.cat} onChange={set("cat")} style={st.aInput}>
                {CATS.map(cat=><option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <div style={st.aLabel}>Ícono</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {ICONS_OPCIONES.map(ic=>(
                  <button key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))} style={{width:36,height:36,borderRadius:8,border:`2px solid ${form.icon===ic?"#c9a84c":"#e0d8c8"}`,background:form.icon===ic?"#faf4e8":"white",fontSize:"1.2rem",cursor:"pointer"}}>{ic}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={st.aLabel}>Color</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {COLORS_OPCIONES.map(col=>(
                  <button key={col} onClick={()=>setForm(f=>({...f,color:col}))} style={{width:28,height:28,borderRadius:"50%",background:col,border:`3px solid ${form.color===col?"#c9a84c":"transparent"}`,cursor:"pointer"}}/>
                ))}
              </div>
            </div>
            <div>
              <div style={st.aLabel}>Foto del Comercio</div>
              {form.foto&&<img src={form.foto} style={{width:60,height:60,borderRadius:8,objectFit:"cover",marginBottom:6,border:"1px solid #ede5d4"}} alt="foto"/>}
              <input type="file" accept="image/*" onChange={handleFoto} style={{fontSize:"0.72rem",fontFamily:"sans-serif",color:"#4a3728"}}/>
            </div>
            <div><div style={st.aLabel}>Beneficio</div><textarea value={form.beneficio} onChange={set("beneficio")} rows={3} style={{...st.aInput,resize:"vertical",lineHeight:1.5,fontSize:"0.82rem"}}/></div>
            <div><div style={st.aLabel}>Link Google Maps</div><input value={form.maps} onChange={set("maps")} style={st.aInput} placeholder="https://maps.google.com/..."/></div>
            <div><div style={st.aLabel}>PIN (4 dígitos)</div><input value={form.pin} onChange={e=>{if(/^\d{0,4}$/.test(e.target.value)) set("pin")(e);}} maxLength={4} inputMode="numeric" style={{...st.aInput,width:120,letterSpacing:"0.2em",textAlign:"center",fontSize:"1rem"}}/></div>
            <div style={{display:"flex",gap:"0.6rem"}}>
              <button onClick={save} style={{...st.btnGold,flex:1,padding:"0.65rem",fontSize:"0.82rem"}}>Guardar</button>
              <button onClick={()=>setEditing(false)} style={{...st.btnOutline,flex:1,padding:"0.65rem",fontSize:"0.82rem"}}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>
      {toast&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:"#0d2340",color:"#c9a84c",padding:"0.65rem 1.4rem",borderRadius:30,border:"1px solid #c9a84c",fontSize:"0.78rem",fontFamily:"sans-serif",zIndex:999,whiteSpace:"nowrap"}}>{toast}</div>}
      <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh"}}>
        {screen==="landing"         && <LandingScreen/>}
        {screen==="register"        && <RegisterScreen/>}
        {screen==="passport"        && huesped && <PassportScreen/>}
        {screen==="detail"          && huesped && <DetailScreen/>}
        {screen==="qrscan_comercio" && huesped && pendingComercio && <QRScanComercioScreen/>}
        {screen==="qrscan"          && huesped && <QRScanScreen/>}
        {screen==="pinentry"        && huesped && pendingComercio && <PinEntryScreen/>}
        {screen==="comerciologin"   && <ComercioLoginScreen/>}
        {screen==="comerciopanel"   && comercioActivo && <ComercioPanelScreen/>}
        {screen==="adminlogin"      && <AdminLoginScreen/>}
        {screen==="admin"           && adminMode && <AdminDashboard/>}
      </div>
    </>
  );
}
