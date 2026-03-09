import axios from "axios";

const hostname = window.location.hostname;
const isLocal = 
  hostname === "localhost" || 
  hostname === "127.0.0.1" || 
  /^192\.168\./.test(hostname) || 
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) || 
  /^10\./.test(hostname) ||
  !hostname.includes(".");

const API = axios.create({
  baseURL: isLocal 
    ? `http://${hostname}:5001/api/` 
    : "https://cab-booking1.onrender.com/api/"
});

API.interceptors.request.use((req) => {
  const token = sessionStorage.getItem("authToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
