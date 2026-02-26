import axios from "axios";

const API = axios.create({
  baseURL: "https://cab-booking1-iota.vercel.app/api"
});

API.interceptors.request.use((req) => {
  const token = sessionStorage.getItem("authToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
