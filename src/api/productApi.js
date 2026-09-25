import api from "./axios";

export const getProducts = async (params) => {
  const response = await api.get("/products", {
    params,
  });

  return response.data;
};