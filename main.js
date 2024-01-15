const fs = require("fs").promises;

class ProductManager {
    static ultId = 0;

    constructor(path) {
        this.products = [];
        this.path = path;
    }

    async addProduct({ title, description, price, img, code, stock }) {
        if (!title || !description || !price || !img || !code || !stock) {
            console.log("Todos los campos son obligatorios");
            return;
        }

        if (this.products.some(item => item.code === code)) {
            console.log("El código debe ser único.. o todos moriremos!");
            return;
        }

        const newProduct = {
            id: ++ProductManager.ultId,
            title,
            description,
            price,
            img,
            code,
            stock
        };

        this.products.push(newProduct);

        await this.guardarArchivo(this.products);
    }

    async getProducts() {
        try {
            const arrayProductos = await this.leerArchivo();
            return arrayProductos;
        } catch (error) {
            console.error("Error al obtener productos", error);
            throw error;
        }
    }

    async getProductById(id) {
        try {
            const arrayProductos = await this.leerArchivo();
            const buscado = arrayProductos.find(item => item.id === id);

            if (buscado) {
                return buscado;
            } else {
                throw new Error(`Producto con ID ${id} no encontrado`);
            }
        } catch (error) {
            console.error(error);
            throw new Error('Error al obtener el producto por ID');
        }
    }

    async updateProduct(id, updatedProduct) {
        try {
            const arrayProductos = await this.leerArchivo();
            const index = arrayProductos.findIndex(item => item.id === id);

            if (index !== -1) {
                arrayProductos[index] = { ...arrayProductos[index], ...updatedProduct };
                await this.guardarArchivo(arrayProductos);
                return arrayProductos[index];
            } else {
                throw new Error(`Producto con ID ${id} no encontrado`);
            }
        } catch (error) {
            console.error(error);
            throw new Error('Error al actualizar el producto');
        }
    }

    async deleteProduct(id) {
        try {
            const arrayProductos = await this.leerArchivo();
            const filteredProducts = arrayProductos.filter(item => item.id !== id);

            if (filteredProducts.length < arrayProductos.length) {
                await this.guardarArchivo(filteredProducts);
                return true;
            } else {
                throw new Error(`Producto con ID ${id} no encontrado`);
            }
        } catch (error) {
            console.error(error);
            throw new Error('Error al eliminar el producto');
        }
    }

    async leerArchivo() {
        try {
            const respuesta = await fs.readFile(this.path, "utf-8");
            const arrayProductos = JSON.parse(respuesta);
            return arrayProductos;
        } catch (error) {
            console.error("Error al leer el archivo", error);
            throw error;
        }
    }

    async guardarArchivo(arrayProductos) {
        try {
            await fs.writeFile(this.path, JSON.stringify(arrayProductos, null, 2));
        } catch (error) {
            console.error("Error al guardar el archivo", error);
            throw error;
        }
    }
}

module.exports = ProductManager;

async function runTests() {
    try {
        // Prueba 1: Se creará una instancia de la clase “ProductManager”
        const productManager = new ProductManager('./prueba.json'); // Reemplaza con la ruta correcta

        console.log('Prueba 1: Se creó una instancia de la clase "ProductManager" con éxito.');
        console.log('Instancia de ProductManager:', productManager);

        // Prueba 2: Se llamará “getProducts” recién creada la instancia, debe devolver un arreglo vacío []
        const productsBeforeAdd = await productManager.getProducts();

        console.log('Prueba 2: Se llamó a "getProducts" y devolvió:', productsBeforeAdd);
        if (Array.isArray(productsBeforeAdd) && productsBeforeAdd.length === 0) {
            console.log('La prueba 2 pasó con éxito.');
        } else {
            throw new Error('La prueba 2 no pasó. La función "getProducts" no devolvió un arreglo vacío.');
        }

        // Prueba 3: Se llamará al método “addProduct” con los campos especificados
        await productManager.addProduct({
            title: 'producto prueba',
            description: 'Este es un producto prueba',
            price: 200,
            img: 'Sin imagen',
            code: 'abc123',
            stock: 25
        });

        const productsAfterAdd = await productManager.getProducts();
        console.log('Prueba 3: Se llamó a "addProduct" y se añadió un producto. Lista de productos después de agregar:', productsAfterAdd);

        // Prueba 4: El objeto debe agregarse satisfactoriamente con un id generado automáticamente SIN REPETIRSE
        const addedProduct = productsAfterAdd.find(product => product.code === 'abc123');
        if (addedProduct && typeof addedProduct.id === 'number') {
            console.log('La prueba 4 pasó con éxito. El objeto se agregó satisfactoriamente con un ID generado automáticamente.');
        } else {
            throw new Error('La prueba 4 no pasó. El objeto no se agregó correctamente o no tiene un ID generado automáticamente.');
        }

        // Prueba 5: Se llamará el método “getProducts” nuevamente, esta vez debe aparecer el producto recién agregado
        console.log('Prueba 5: Se llamó a "getProducts" después de agregar un producto. Lista de productos:', productsAfterAdd);

        // Prueba 6: Se llamará al método “getProductById” y se corroborará que devuelva el producto con el id especificado
        const productIdToFind = addedProduct.id;
        const productById = await productManager.getProductById(productIdToFind);
        console.log('Prueba 6: Se llamó a "getProductById" y devolvió el producto con el ID especificado:', productById);

        // Prueba 7: Se llamará al método “updateProduct” y se intentará cambiar un campo de algún producto
        const updatedProduct = await productManager.updateProduct(productIdToFind, { price: 250 });
        console.log('Prueba 7: Se llamó a "updateProduct" y se intentó cambiar el precio del producto. Producto actualizado:', updatedProduct);

        // Verificación de la prueba 7
        if (updatedProduct && updatedProduct.id === productIdToFind && updatedProduct.price === 250) {
            console.log('La prueba 7 pasó con éxito. El campo se actualizó correctamente.');
        } else {
            throw new Error('La prueba 7 no pasó. La actualización no fue exitosa o se eliminó el ID.');
        }

        // Prueba 8: Se llamará al método “deleteProduct”, se evaluará que realmente se elimine el producto o que arroje un error en caso de no existir
        const isDeleted = await productManager.deleteProduct(productIdToFind);
        console.log('Prueba 8: Se llamó a "deleteProduct". Producto eliminado:', isDeleted);

        // Verificación de la prueba 8
        const productsAfterDelete = await productManager.getProducts();
        const deletedProductStillExists = productsAfterDelete.some(product => product.id === productIdToFind);

        if (!deletedProductStillExists) {
            console.log('La prueba 8 pasó con éxito. El producto se eliminó correctamente.');
        } else {
            throw new Error('La prueba 8 no pasó. El producto no se eliminó correctamente.');
        }

    } catch (error) {
        console.error('Error en las pruebas:', error.message);
    }
}

runTests();


