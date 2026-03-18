import { useEffect, useState } from "react";
import Producto from "./Producto";
import ComboEjecutivo from "./ComboEjecutivo";
import "./css/mostrarProductos.css";

export default function MostrarProductos() {
  const API_BASE = `${process.env.REACT_APP_PROXY}/api/products`;
  const API_CAT = `${process.env.REACT_APP_PROXY}/api/categories`;
  const API_SUB = `${process.env.REACT_APP_PROXY}/api/subcategories`;

  useEffect(() => {
    document.title = "Neldo Martinez - Menú";
  }, []);

  const [productos, setProductos] = useState([]);
  const [mostrarFlecha, setMostrarFlecha] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  // Mostramos todo expandido por defecto, sin funcionalidad de colapso

  useEffect(() => {
    fetch(API_BASE)
      .then((res) => res.json())
      .then((json) => {
        console.log("/api/products response:", json);
        const data = Array.isArray(json) ? json : json.payload || [];
        setProductos(data);
      });
    fetch(API_CAT)
      .then((res) => res.json())
      .then((json) => {
        console.log("/api/categories response:", json);
        const data = Array.isArray(json) ? json : json.payload || [];
        setCategorias(data);
      });
    fetch(API_SUB)
      .then((res) => res.json())
      .then((json) => {
        console.log("/api/subcategories response:", json);
        const data = Array.isArray(json) ? json : json.payload || [];
        setSubcategorias(data);
      });
  }, []);

  useEffect(() => {
  const manejarScroll = () => {
    setMostrarFlecha(window.scrollY > 300);
  };

  window.addEventListener("scroll", manejarScroll);
  return () => window.removeEventListener("scroll", manejarScroll);
}, []);


  const irArriba = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Organizar productos por categoría (id) y subcategoría
  const productosPorJerarquia = (productos || []).reduce((acc, p) => {
    const cId = p.categoryId || "none";
    if (!acc[cId]) acc[cId] = { noSub: [], bySub: {} };
    if (p.subcategoryId) {
      if (!acc[cId].bySub[p.subcategoryId]) acc[cId].bySub[p.subcategoryId] = [];
      acc[cId].bySub[p.subcategoryId].push(p);
    } else {
      acc[cId].noSub.push(p);
    }
    return acc;
  }, {});

  const scrollToCategoria = (id) => {
    const section = document.getElementById(id);
    if (section) {
      const offset = 140; // compensar el banner y margen superior
      const top = section.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };
  
  const phone = process.env.REACT_APP_PHONE;

  // Detectar categoría llamada "Combos" si existe (por compatibilidad)
  const combosCategory = categorias.find((c) => c.name === "Combos");
  const combos = combosCategory
    ? (productosPorJerarquia[combosCategory._id]?.noSub || [])
        .concat(
          Object.values(productosPorJerarquia[combosCategory._id]?.bySub || {}).flat()
        )
    : [];

  const openWhatsApp = () => {
    const isMobile = /Android|iPhone/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `whatsapp://send?phone=${phone}`;
    } else {
      window.open(`https://wa.me/${phone}`, "_blank");
    }
  };
  
  return (
    <>
      <div className="menu-container">


        <nav className="categoria-nav">
          {categorias.map((c) => (
            <button
              key={c._id}
              className="categoria-btn"
              onClick={() => scrollToCategoria(`cat-${c._id}`)}
            >
              {c.name}
            </button>
          ))}
        </nav>

        {combos.length > 0 && (
          <section id="cat-combos" className="categoria-section">
            <h2 className="categoria-titulo">Combos</h2>
            <div className="menu-grid">
              {combos.map((producto) => (
                <Producto key={producto._id} producto={producto} />
              ))}
            </div>
          </section>
        )}

        {categorias
          .filter((c) => c.name !== "Combos")
          .map((c) => {
            const group = productosPorJerarquia[c._id] || { noSub: [], bySub: {} };
            const subcatsDeCat = subcategorias.filter((s) => String(s.categoryId) === String(c._id));
            const tieneSubcats = subcatsDeCat.length > 0;
            
            return (
              <section key={c._id} id={`cat-${c._id}`} className="categoria-section">
                <h2 className="categoria-titulo">{c.name}</h2>
                
                {!tieneSubcats && (
                  <div className="menu-grid">
                    {group.noSub.map((producto) => (
                      <Producto key={producto._id} producto={producto} />
                    ))}
                  </div>
                )}
                
                {tieneSubcats && (
                  <div className="menu-grid">
                    {subcatsDeCat.map((s) => {
                      const items = group.bySub[s._id] || [];
                      
                      // Special handling for Executive Menu combo
                      if (c.name === "Menú Ejecutivo" && s.name === "Menú Ejecutivo") {
                        return (
                          <div key={s._id} className="subcat-block">
                            <h3 className="subcat-title">{s.name}</h3>
                            <div style={{ paddingTop: 8 }}>
                              <ComboEjecutivo productos={items} />
                            </div>
                          </div>
                        );
                      }
                      
                      // Regular subcategory rendering
                      return (
                        <div key={s._id} className="subcat-block">
                          <h3 className="subcat-title">{s.name}</h3>
                          <div className="menu-grid" style={{ paddingTop: 8 }}>
                            {items.map((producto) => (
                              <Producto key={producto._id} producto={producto} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {/* También mostrar productos sin subcategoría en esta categoría */}
                    {group.noSub.length > 0 && (
                      <div className="subcat-block">
                        <h3 className="subcat-title">Otros</h3>
                        <div className="menu-grid">
                          {group.noSub.map((producto) => (
                            <Producto key={producto._id} producto={producto} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        <a
          href={`https://api.whatsapp.com/send?phone=${process.env.REACT_APP_PHONE}`}
          className="whatsapp-float"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/logo/whatsapp_logo.png"
            alt="WhatsApp"
            className="whatsapp-icon"
          />
        </a>

        

        <button
          className={`scroll-to-top ${mostrarFlecha ? "visible" : "oculto"}`}
          onClick={irArriba}
        >
          ↑
        </button>

      </div>

    </>
  );
}
