import {createProduct, getSellerProducts} from '../services/product.api.js';
import { useDispatch } from 'react-redux';
import { setSellerProducts } from '../state/product.slice.js';

export const useProduct = () => {
    const dispatch = useDispatch();

    async function handleCreateProduct(formData) {
        try {
            const data = await createProduct(formData);
            return data.product;
        } catch (error) {
            throw error;
        }
    }

    async function handleGetSellerProducts() {
        try {
            const data = await getSellerProducts();
            dispatch(setSellerProducts(data.products));
            return data.products;
        } catch (error) {
            throw error;
        }
    }
    return {
        handleCreateProduct,
        handleGetSellerProducts,
    };
}