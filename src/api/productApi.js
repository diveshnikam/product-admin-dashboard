import api from "./axios";

export const getProducts = async (params) => {
  const response = await api.get("/products", {
    params,
  });

  return response.data;
};

export const searchProducts = async (params) => {
  const response = await api.get("/products/search", {
    params,
  });

  return response.data;
};