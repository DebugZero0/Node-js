import axios from "axios";

const productApiInstance = axios.create({
    baseURL: "/api/products",
    withCredentials: true,
});

export async function createProduct(formData) {
    try {
        const response = await productApiInstance.post("/", formData);
        return response.data;
    } catch (error) {
        const message =
            error?.response?.data?.message ||
            error?.message ||
            'Failed to create product. Please try again.';
        throw new Error(message);
    }
}

export async function getSellerProducts() {
    const response = await productApiInstance.get("/seller");
    return response.data;
}