export default class ProductsRepository {
    constructor(dao) {
        this.dao = dao;
    }

    getProducts() {
        return this.dao.get();
    }
    getProductsByCategory(category) {
        return this.dao.get({ category: category });
    }
    getProductById(id) {
        return this.dao.getById({ _id: id });
    }
    searchProduct(param) {
        return this.dao.getOne(param);
    }
    createProduct(product) {
        return this.dao.create(product);
    }
    updateProduct(id, data) {
        return this.dao.update(id, data);
    }
    deleteProduct(id) {
        return this.dao.delete(id);
    }
    deleteMany(filter) {
        return this.dao.deleteMany(filter);
    }
    find(query) {
        return this.dao.find(query);
    }
}