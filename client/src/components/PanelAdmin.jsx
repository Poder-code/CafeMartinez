import React, { useEffect, useState } from "react";
import "./css/panelAdmin.css";

const API_BASE = `${process.env.REACT_APP_PROXY}/api/products`;
const API_CAT = `${process.env.REACT_APP_PROXY}/api/categories`;
const API_SUB = `${process.env.REACT_APP_PROXY}/api/subcategories`;

const AdminPanel = () => {
  useEffect(() => {
    document.title = "Neldo Martinez - Administración";
  }, []);

  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [simpleView, setSimpleView] = useState(false);
  const [priceEdits, setPriceEdits] = useState({});
  const [variations, setVariations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newProdAssignType, setNewProdAssignType] = useState("category"); // "category" | "subcategory"
  const [newProdCategoryId, setNewProdCategoryId] = useState("");
  const [newProdSubcategoryId, setNewProdSubcategoryId] = useState("");
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: 0,
    code: "",
    status: true,
    categoryId: "",
    subcategoryId: "",
    categoryName: "",
    subcategoryName: "",
    assignType: "category"
  });
  const [newProductImageFile, setNewProductImageFile] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_BASE, { credentials: "include" });
      const data = await res.json();
      setProducts(data.payload || []);
    } catch {
      alert("Error al obtener productos");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(API_CAT);
      const data = await res.json();
      setCategories(data.payload || []);
    } catch {
      // ignore
    }
  };

  const fetchSubcategories = async () => {
    try {
      const res = await fetch(API_SUB);
      const data = await res.json();
      setSubcategories(data.payload || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubcategories();
  }, []);

  const handleEditClick = (product) => {
    setEditingId(product._id);
    const assignType = product.subcategoryId ? "subcategory" : "category";
    setEditedProduct({
      ...product,
      variations: product.variations || [],
      assignType,
      categoryId: product.categoryId || "",
      subcategoryId: product.subcategoryId || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE", credentials: "include" });
      fetchProducts();
    } catch {
      alert("Error al eliminar producto");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedProduct(null);
  };

  const handleChange = (field) => (e) => {
    const value = field === "status" ? e.target.checked : e.target.value;
    if (field === "price") {
      setEditedProduct((prev) => ({ ...prev, [field]: Number(value) }));
    } else {
      setEditedProduct((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (!editedProduct || !editingId) return;

    try {
      const formData = new FormData();
      formData.append("title", editedProduct.title);
      formData.append("description", editedProduct.description);
      
      // Handle price: if product has variations, don't send base price or calculate from variations
      let priceToSend = editedProduct.price;
      if (editedProduct.variations?.length > 0) {
        // For products with variations, either use base price or calculate from variations
        if (priceToSend && !isNaN(priceToSend) && priceToSend > 0) {
          // Use existing base price if valid
          formData.append("price", priceToSend);
        } else {
          // Calculate base price from variations (lowest price)
          const validPrices = editedProduct.variations
            .map(v => v.price || v.precio)
            .filter(p => p && !isNaN(p) && p > 0);
          
          if (validPrices.length > 0) {
            const minPrice = Math.min(...validPrices);
            formData.append("price", minPrice);
          } else {
            // Don't send price if no valid prices found
            formData.append("price", "");
          }
        }
      } else {
        // For products without variations, send the base price
        if (priceToSend && !isNaN(priceToSend) && priceToSend >= 0) {
          formData.append("price", priceToSend);
        } else {
          formData.append("price", "");
        }
      }
      
      formData.append("code", editedProduct.code);
      formData.append("status", editedProduct.status);

      // Hierarchical assignment on edit
      if (editedProduct.assignType === "subcategory" && editedProduct.subcategoryId) {
        formData.append("subcategoryId", editedProduct.subcategoryId);
      } else if (editedProduct.assignType === "category" && editedProduct.categoryId) {
        formData.append("categoryId", editedProduct.categoryId);
      } else if (editedProduct.category) {
        // fallback compatibility
        formData.append("category", editedProduct.category);
      }

      if (editedProduct.variations?.length > 0) {
        formData.append("variations", JSON.stringify(editedProduct.variations));
      }

      // ✅ Subida de imagen: solo si hay archivo
      if (editedProduct.newImageFile instanceof File) {
        formData.append("image", editedProduct.newImageFile);
      }
      if(editedProduct.removeImage){
        formData.append("removeImage", editedProduct.removeImage);
      }

      const res = await fetch(`${API_BASE}/${editingId}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
        // ❌ NO pongas headers aquí, el browser pone multipart/form-data automáticamente
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error del servidor: ${res.status} - ${errorText}`);
      }

      setEditingId(null);
      setEditedProduct(null);
      fetchProducts();
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      const errorMessage = err.message || "Error desconocido";
      alert(`Error al actualizar producto: ${errorMessage}`);
    }
  };

  const handlePriceChange = (id, value) => {
    setPriceEdits((prev) => ({ ...prev, [id]: value }));
  };

  const handleSavePrice = async (id) => {
    const newPrice = priceEdits[id];
    if (newPrice === undefined) return;
    try {
      await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: Number(newPrice) }),
        credentials: "include",
      });
      setPriceEdits((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      fetchProducts();
    } catch {
      alert("Error al actualizar precio");
    }
  };

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.title?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term) ||
      p.code?.toLowerCase().includes(term)
    );
  });

  const groupedProducts = filteredProducts.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  // Variaciones nuevas
  const addVariation = () => setVariations([...variations, { size: "", price: 0 }]);
  const updateVariation = (i, field, value) => {
    const newVars = [...variations];
    newVars[i][field] = field === "price" ? Number(value) : value;
    setVariations(newVars);
  };
  const removeVariation = (i) => {
    const newVars = [...variations];
    newVars.splice(i, 1);
    setVariations(newVars);
  };

  
  // Función para mostrar notificaciones
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  
  
  // Manejar creación de producto
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append('title', newProduct.title);
      formData.append('description', newProduct.description);
      formData.append('price', newProduct.price);
      formData.append('code', newProduct.code);
      formData.append('status', newProduct.status);
      
      if (newProduct.assignType === 'subcategory' && newProduct.subcategoryId) {
        formData.append('subcategoryId', newProduct.subcategoryId);
      } else if (newProduct.categoryId) {
        formData.append('categoryId', newProduct.categoryId);
      }
      
      if (variations.length > 0) {
        formData.append('variations', JSON.stringify(variations));
      }

      // Imagen al crear producto (opcional)
      if (newProductImageFile instanceof File) {
        formData.append('image', newProductImageFile);
      }
      
      const response = await fetch(API_BASE, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (response.ok) {
        setNewProduct({
          title: '',
          description: '',
          price: 0,
          code: '',
          status: true,
          categoryId: '',
          subcategoryId: '',
          categoryName: '',
          subcategoryName: '',
          assignType: 'category'
        });
        setVariations([]);
        setNewProductImageFile(null);
        await fetchProducts();
        showNotification('Producto creado exitosamente');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear producto');
      }
      } catch (error) {
      showNotification(error.message || 'Error al crear producto', 'error');
    }
  };

// Renderizar el componente
return (
  <div className="admin-panel">
    <h1>Panel de Administración</h1>
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
          <button onClick={() => setNotification({ ...notification, show: false })}>×</button>
        </div>
      )}

      <div className="create-product-form">
        <h2>Crear nuevo producto</h2>
        <form onSubmit={handleCreateProduct} className="admin-form">
          <div className="form-group">
            <label>Nombre del producto</label>
            <input 
              name="title" 
              placeholder="Ej: Café Americano" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea 
              name="description" 
              placeholder="Describe el producto" 
              rows="3"
              required 
            />
          </div>
          <div className="form-group">
            <label>Precio</label>
            <input 
              name="price" 
              type="number" 
              placeholder="0.00" 
              step="0.01" 
              min="0"
              required 
            />
          </div>
          <div className="form-group">
            <label>Asignar a</label>
            <div className="radio-group">
              <label className={`radio-option ${newProdAssignType === 'category' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="assignType"
                  checked={newProdAssignType === "category"}
                  onChange={() => setNewProdAssignType("category")}
                />
                <span>Categoría</span>
              </label>
              <label className={`radio-option ${newProdAssignType === 'subcategory' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="assignType"
                  checked={newProdAssignType === "subcategory"}
                  onChange={() => setNewProdAssignType("subcategory")}
                />
                <span>Subcategoría</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            {newProdAssignType === "category" ? (
              <div>
                <label>Categoría</label>
                <select
                  value={newProdCategoryId}
                  onChange={(e) => setNewProdCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>Seleccione categoría</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label>Subcategoría</label>
                <select
                  value={newProdSubcategoryId}
                  onChange={(e) => setNewProdSubcategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>Seleccione subcategoría</option>
                  {subcategories.map((s) => {
                    const category = categories.find((c) => c._id === s.categoryId);
                    return (
                      <option key={s._id} value={s._id}>
                        {category ? `${category.name} / ` : ''}{s.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Código del producto</label>
            <input 
              name="code" 
              placeholder="Ej: CAF-001" 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Imagen del producto</label>
            <div className="file-upload">
              <input 
                type="file" 
                name="image" 
                accept="image/*" 
                id="product-image"
                className="file-input"
                onChange={(e) => setNewProductImageFile(e.target.files[0] || null)}
              />
              <label htmlFor="product-image" className="file-label">
                <i className="fas fa-upload"></i>
                <span>Seleccionar imagen</span>
              </label>
            </div>
          </div>

          <div className="form-group switch-container">
            <label>Estado del producto</label>
            <label className="switch">
              <input name="status" type="checkbox" defaultChecked />
              <span className="slider"></span>
              <span className="switch-label">Activo</span>
            </label>
          </div>

          <div className="form-group">
            <div className="variations-header">
              <h3>Variaciones</h3>
              <small>Agrega variaciones como tamaños o sabores</small>
            </div>
            
            {variations.length > 0 && (
              <div className="variations-list">
                {variations.map((v, i) => (
                  <div key={i} className="variation-item">
                    <input
                      type="text"
                      placeholder="Ej: Grande"
                      value={v.nombre}
                      onChange={(e) => updateVariation(i, "nombre", e.target.value)}
                      className="variation-input"
                    />
                    <div className="variation-price">
                      <span>$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={v.precio}
                        onChange={(e) => updateVariation(i, "precio", e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn-remove"
                      onClick={() => removeVariation(i)}
                      title="Eliminar variación"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              type="button" 
              className="btn-variation" 
              onClick={addVariation}
            >
              <i className="fas fa-plus"></i> Agregar variación
            </button>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <i className="fas fa-save"></i> Crear producto
            </button>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={(e) => {
                if (e.target.form) {
                  e.target.form.reset();
                }
                setVariations([]);
              }}
            >
              <i className="fas fa-undo"></i> Limpiar
            </button>
          </div>
        </form>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <button
        onClick={() => setSimpleView(!simpleView)}
        className={`toggle-view ${simpleView ? "is-simple" : ""}`}
      >
        {simpleView ? "Volver a vista completa" : "Mostrar solo nombre y precio"}
      </button>

      {Object.entries(groupedProducts).map(([category, items]) => (
        <div key={category} className="category-section">
          <h2 className="category-title">{category}</h2>
          <div className="product-list">
            {items.map((p) => {
              const isEditing = editingId === p._id;

              if (simpleView) {
                return (
                  <div key={p._id} className="product-simple-card">
                    <span className="product-name">{p.title}</span>
                    <input
                      type="number"
                      value={priceEdits[p._id] ?? p.price}
                      onChange={(e) => handlePriceChange(p._id, e.target.value)}
                      className="price-inline-input"
                    />
                    <button onClick={() => handleSavePrice(p._id)} className="btn-inline">
                      Guardar
                    </button>
                  </div>
                );
              }

              if (isEditing) {
                return (
                  <div className="product-info" key={p._id}>
                    {/* Resto del JSX de edición intacto */}
                    <h3>
                      <input
                        type="text"
                        value={editedProduct.title}
                        onChange={(e) => handleChange("title")(e)}
                        className="edit-input"
                      />
                    </h3>
                    <p>
                      <textarea
                        value={editedProduct.description}
                        onChange={(e) => handleChange("description")(e)}
                        className="edit-textarea"
                      />
                    </p>
                    <p>
                      <strong>Precio: </strong>
                      <input
                        type="number"
                        value={editedProduct.price}
                        onChange={(e) => handleChange("price")(e)}
                        step="0.01"
                        className="edit-input narrow"
                      />
                    </p>
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong>Categoría/Subcategoría: </strong>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <label>
                          <input
                            type="radio"
                            checked={editedProduct.assignType === "category"}
                            onChange={() => setEditedProduct((prev) => ({ ...prev, assignType: "category", subcategoryId: "" }))}
                          />
                          Categoría
                        </label>
                        <label>
                          <input
                            type="radio"
                            checked={editedProduct.assignType === "subcategory"}
                            onChange={() => setEditedProduct((prev) => ({ ...prev, assignType: "subcategory", categoryId: "" }))}
                          />
                          Subcategoría
                        </label>
                      </div>
                      {editedProduct.assignType === "category" && (
                        <select
                          value={editedProduct.categoryId || ""}
                          onChange={(e) => setEditedProduct((prev) => ({ ...prev, categoryId: e.target.value }))}
                        >
                          <option value="">Seleccione categoría</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      )}
                      {editedProduct.assignType === "subcategory" && (
                        <select
                          value={editedProduct.subcategoryId || ""}
                          onChange={(e) => setEditedProduct((prev) => ({ ...prev, subcategoryId: e.target.value }))}
                        >
                          <option value="">Seleccione subcategoría</option>
                          {subcategories.map((s) => (
                            <option key={s._id} value={s._id}>
                              {categories.find((c) => c._id === s.categoryId)?.name || ""} / {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <p>
                      <strong>Código: </strong>
                      <input
                        type="text"
                        value={editedProduct.code}
                        onChange={(e) => handleChange("code")(e)}
                        className="edit-input narrow"
                      />
                    </p>
                    <p>
                      <strong>Imagen:</strong>
                      {p.image && (
                        <>
                          {editedProduct.image}
                          <button
                            type="button"
                            className="btn-inline danger"
                            onClick={() =>
                              setEditedProduct((prev) => ({
                                ...prev,
                                image: null,
                                removeImage: true
                              }))
                            }
                          >
                            ❌
                          </button>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setEditedProduct((prev) => ({
                            ...prev,
                            newImageFile: e.target.files[0] || null,
                          }))
                        }
                        style={{ display: "block", marginTop: "6px" }}
                      />
                    </p>
                    <label className="switch-label">
                      Activo
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={editedProduct.status}
                          onChange={(e) => handleChange("status")(e)}
                        />
                        <span className="slider"></span>
                      </label>
                    </label>
                    <div>
                      <strong>Variaciones:</strong>
                      {(editedProduct.variations?.length || 0) === 0 && <p>No tiene variaciones</p>}
                      {(editedProduct.variations || []).map((v, i) => (
                        <div
                          key={i}
                          style={{ display: "flex", gap: "8px", marginTop: "6px", alignItems: "center" }}
                        >
                          <input
                            type="text"
                            placeholder="Tamaño variación"
                            value={v.size}
                            onChange={(e) => {
                              const nuevasVar = [...editedProduct.variations];
                              nuevasVar[i] = { ...nuevasVar[i], size: e.target.value };
                              setEditedProduct((prev) => ({ ...prev, variations: nuevasVar }));
                            }}
                            className="edit-input"
                            style={{ flex: "1" }}
                          />
                          <input
                            type="number"
                            placeholder="Precio"
                            value={v.price}
                            onChange={(e) => {
                              const nuevasVar = [...editedProduct.variations];
                              nuevasVar[i] = { ...nuevasVar[i], price: Number(e.target.value) };
                              setEditedProduct((prev) => ({ ...prev, variations: nuevasVar }));
                            }}
                            className="edit-input narrow"
                          />
                          <button
                            type="button"
                            className="btn-inline danger"
                            onClick={() => {
                              const nuevasVar = [...editedProduct.variations];
                              nuevasVar.splice(i, 1);
                              setEditedProduct((prev) => ({ ...prev, variations: nuevasVar }));
                            }}
                          >
                            ❌
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn-variation"
                        onClick={() => {
                          const nuevasVar = [...(editedProduct.variations || []), { size: "", price: 0 }];
                          setEditedProduct((prev) => ({ ...prev, variations: nuevasVar }));
                        }}
                        style={{ marginTop: "8px" }}
                      >
                        ➕ Agregar variación
                      </button>
                    </div>
                    <div className="product-actions" style={{ marginTop: "12px" }}>
                      <button onClick={handleSave}>Guardar</button>
                      <button onClick={handleCancelEdit} className="delete" style={{ marginLeft: "10px" }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="product-info" key={p._id}>
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  <p>
                    <strong>Precio:</strong> ${p.price}
                  </p>
                  {p.variations?.length > 0 && (
                    <div>
                      <strong>Variaciones:</strong>
                      <ul>
                        {p.variations.map((v, i) => (
                          <li key={i}>
                            {v.size} - ${v.price}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="product-actions">
                    <button onClick={() => handleEditClick(p)}>Editar</button>
                    <button onClick={() => handleDelete(p._id)} className="delete">
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminPanel;
