import { ProductsService } from "../services/repositories.js";
import { CategoriesService, SubcategoriesService } from "../services/repositories.js";

const getProducts = async(req, res) => {
    const result = await ProductsService.getProducts();
    if (!result) {
        return res.sendServerError("No se consiguieron productos");
    }
    return res.sendPayload(null, result);
};

const getProductsByCategory = async(req, res) => {
    const { category } = req.params;
    const result = await ProductsService.getProductsByCategory(category);
    if (!result) {
        return res.sendServerError("No se consiguieron productos");
    }
    return res.sendPayload(null, result);
};

const getProductById = async(req, res) => {
    const { pid } = req.params;
    const result = await ProductsService.getProductById(pid);
    if (!result) {
        return res.sendServerError("No se consiguió el producto");
    }
    return res.sendPayload(null, result);
};

const createProduct = async(req, res) => {
    try {
        const data = req.body;

        // Validación: debe elegir al menos categoría o subcategoría (si ambos, prioriza subcategoría)
        const categoryId = data.categoryId || null;
        const subcategoryId = data.subcategoryId || null;
        if (!categoryId && !subcategoryId) {
            return res.sendBadRequest("Debe seleccionar una categoría (y opcionalmente una subcategoría)");
        }

        let resolvedCategoryId = null;
        let resolvedSubcategoryId = null;
        let resolvedCategoryName = data.category || null; // backward compatible input

        if (subcategoryId) {
            const sub = await SubcategoriesService.getSubcategoryById(subcategoryId);
            if (!sub) return res.sendBadRequest("Subcategoría inválida");
            const cat = await CategoriesService.getCategoryById(sub.categoryId);
            if (!cat) return res.sendBadRequest("Categoría padre inválida");
            resolvedSubcategoryId = subcategoryId;
            resolvedCategoryId = String(sub.categoryId);
            resolvedCategoryName = cat.name; // mostrar siempre la categoría padre en string plano
        } else if (categoryId) {
            const cat = await CategoriesService.getCategoryById(categoryId);
            if (!cat) return res.sendBadRequest("Categoría inválida");
            resolvedCategoryId = categoryId;
            resolvedSubcategoryId = null;
            resolvedCategoryName = cat.name;
        }

        // Parse variations safely for create product too
        let parsedVariations = null;
        if (data.variations) {
            try {
                parsedVariations = JSON.parse(data.variations);
                // Validate variations structure
                if (Array.isArray(parsedVariations)) {
                    parsedVariations = parsedVariations.filter(v => 
                        v && typeof v === 'object' && 
                        (v.size !== undefined || v.nombre !== undefined) && 
                        (v.price !== undefined || v.precio !== undefined)
                    ).map(v => ({
                        size: v.size || v.nombre || '',
                        price: v.price !== undefined ? Number(v.price) : Number(v.precio) || 0
                    }));
                }
            } catch (parseError) {
                console.error("Error parsing variations in create:", parseError);
                return res.sendBadRequest("Formato de variaciones inválido");
            }
        }

        const newProduct = {
            title: data.title,
            description: data.description,
            code: data.code,
            price: data.price !== undefined && data.price !== "" ? Number(data.price) : 0,
            category: resolvedCategoryName,
            categoryId: resolvedCategoryId,
            subcategoryId: resolvedSubcategoryId,
            status: data.status === "true" || data.status === true,
            variations: parsedVariations,
            image: req.file ? req.file.filename : null,
        };

        const exists = await ProductsService.searchProduct({ code: newProduct.code });
        if (exists.length > 0) {
            return res.sendBadRequest("El producto ya existe");
        }

        const product = await ProductsService.createProduct(newProduct);
        if (!product) {
            return res.sendServerError("No se pudo crear el producto");
        }

        return res.sendPayload("Producto creado con éxito", product);
    } catch (err) {
        console.error(err);
        return res.sendServerError("Error en creando el producto");
    }
};

const updateProduct = async(req, res) => {
    const { pid } = req.params;
    const data = req.body;
    
    try {
        // Parse variations safely
        let parsedVariations = undefined;
        if (data.variations) {
            try {
                parsedVariations = JSON.parse(data.variations);
                // Validate variations structure
                if (Array.isArray(parsedVariations)) {
                    parsedVariations = parsedVariations.filter(v => 
                        v && typeof v === 'object' && 
                        (v.size !== undefined || v.nombre !== undefined) && 
                        (v.price !== undefined || v.precio !== undefined)
                    ).map(v => ({
                        size: v.size || v.nombre || '',
                        price: v.price !== undefined ? Number(v.price) : Number(v.precio) || 0
                    }));
                }
            } catch (parseError) {
                console.error("Error parsing variations:", parseError);
                return res.sendBadRequest("Formato de variaciones inválido");
            }
        }
        
        const update = {
            title: data.title,
            description: data.description,
            code: data.code,
            price: data.price !== undefined && data.price !== "" ? Number(data.price) : undefined,
            image: req.file ? req.file.filename : data.image,
            status: data.status === "true" || data.status === true,
            variations: parsedVariations,
        };
        
        // Si se envía jerarquía, validar y resolver nombre y refs
        if (data.categoryId || data.subcategoryId) {
            if (data.subcategoryId) {
                const sub = await SubcategoriesService.getSubcategoryById(data.subcategoryId);
                if (!sub) return res.sendBadRequest("Subcategoría inválida");
                const cat = await CategoriesService.getCategoryById(sub.categoryId);
                if (!cat) return res.sendBadRequest("Categoría padre inválida");
                update.subcategoryId = data.subcategoryId;
                update.categoryId = String(sub.categoryId);
                update.category = cat.name;
            } else if (data.categoryId) {
                const cat = await CategoriesService.getCategoryById(data.categoryId);
                if (!cat) return res.sendBadRequest("Categoría inválida");
                update.subcategoryId = null;
                update.categoryId = data.categoryId;
                update.category = cat.name;
            }
        } else if (data.category) {
            // Compatibilidad: si solo llega string category, intentamos mantenerlo tal cual
            update.category = data.category;
        }
        if (data.removeImage) {
            update.image = null;
        }
        
        const updatedProduct = await ProductsService.updateProduct(pid, update);
        if (!updatedProduct) return res.sendServerError("No se pudo actualizar el producto");
        return res.sendPayload("Producto actualizado exitosamente", updatedProduct);
    } catch (err) {
        console.error("Error updating product:", err);
        return res.sendServerError("Error al actualizar producto: " + err.message);
    }
};

const deleteProduct = async(req, res) => {
    const { pid } = req.params;
    const result = await ProductsService.deleteProduct(pid);
    if (!result) {
        return res.sendServerError("No se pudo eliminar el producto");
    }
    return res.sendPayload("Producto eliminado con éxito");
};

export default {
    createProduct,
    deleteProduct,
    getProducts,
    getProductsByCategory,
    getProductById,
    updateProduct,
};