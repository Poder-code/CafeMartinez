import mongoose from "mongoose";

const collection = "Products";

const schema = new mongoose.Schema({
    title: String,
    description: String,
    code: String,
    price: {
        type: Number,
        default: 0,
        validate: {
            validator: function(v) {
                // Allow null/undefined for products with variations
                if (this.variations && this.variations.length > 0) {
                    return v === null || v === undefined || !isNaN(v);
                }
                // Require valid number for products without variations
                return v !== null && v !== undefined && !isNaN(v) && v >= 0;
            },
            message: 'Price must be a valid number'
        }
    },
    // Backward-compatible category display name
    category: String,
    // Hierarchical categorization
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Categories", default: null },
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Subcategories", default: null },
    image: String,
    status: {
        type: Boolean,
        default: true
    },
    variations: {
        type: Array,
        default: null
    }
});

// Ensure uniqueness by logical identity: title + category + subcategory
schema.index({ title: 1, categoryId: 1, subcategoryId: 1 }, { unique: true });

const productsModel = mongoose.model(collection, schema);

export default productsModel;