import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5001/api"
});

API.interceptors.request.use((req) => {
  const token = sessionStorage.getItem("authToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
