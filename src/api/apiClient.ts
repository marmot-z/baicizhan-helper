import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";
import { UnauthorizedError, ForbiddenError } from "./errors";
import { ApiResponse } from "./types";
import { useAuthStore } from "../stores/useAuthStore";

const API_BASE_URL = 'http://www.baicizhan-helper.cn';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.access_token = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 检查响应数据中的 code 字段
    if (response.data?.code === 401) {      
      window.location.hash = '/user-info';
      return Promise.reject(new UnauthorizedError('Token expired'));
    }
    
    if (response.data?.code === 403) {  
      return Promise.reject(new ForbiddenError(response.data?.message || 'Forbidden access'));
    }
    
    if (response.data?.code === 500) {
      // 处理500错误（服务器内部错误）
      return Promise.reject(new Error(response.data?.message));
    }
    
    return response;
  },
  async (error) => {
    // 处理网络错误或其他HTTP错误
    if (error.response?.status === 401) {
      // 自动清理登录状态
      // useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// API请求方法封装
export class ApiService {
  static async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  static async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  static async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  static async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data;
  }
}

export default apiClient;