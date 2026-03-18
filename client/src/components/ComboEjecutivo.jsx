import React from "react";
import "./css/comboEjecutivo.css";

export default function ComboEjecutivo({ productos }) {
  // Group products by combo section
  const platos = productos.filter(p => p.code && p.code.startsWith("PLATO-"));
  const bebidas = productos.filter(p => p.code && p.code.startsWith("BEBIDA-"));
  const postres = productos.filter(p => p.code && p.code.startsWith("POSTRE-"));
  const mainCombo = productos.find(p => p.code === "MENU-EJEC");

  return (
    <div className="combo-ejecutivo-container">
      {/* Main combo product with price */}
      {mainCombo && (
        <div className="combo-main">
          <h3 className="combo-title">{mainCombo.title}</h3>
          <p className="combo-description">{mainCombo.description}</p>
          <div className="combo-price">${mainCombo.price?.toFixed(2)}</div>
        </div>
      )}

      {/* Combo selection sections */}
      <div className="combo-selection">
        {/* Plato Section */}
        <div className="combo-section">
          <h4 className="section-title">PLATO</h4>
          <div className="combo-options">
            {platos.map((plato, index) => (
              <div key={plato._id} className="combo-option">
                <label className="combo-option-label">
                  <input 
                    type="radio" 
                    name="plato" 
                    value={plato._id}
                    className="combo-radio"
                  />
                  <span className="option-text">{plato.title}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Bebida Section */}
        <div className="combo-section">
          <h4 className="section-title">BEBIDA</h4>
          <div className="combo-options">
            {bebidas.map((bebida, index) => (
              <div key={bebida._id} className="combo-option">
                <label className="combo-option-label">
                  <input 
                    type="radio" 
                    name="bebida" 
                    value={bebida._id}
                    className="combo-radio"
                  />
                  <span className="option-text">{bebida.title}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Postre Section */}
        <div className="combo-section">
          <h4 className="section-title">POSTRE</h4>
          <div className="combo-options">
            {postres.map((postre, index) => (
              <div key={postre._id} className="combo-option">
                <label className="combo-option-label">
                  <input 
                    type="radio" 
                    name="postre" 
                    value={postre._id}
                    className="combo-radio"
                  />
                  <span className="option-text">{postre.title}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
