import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

export const BASE_URL = "http://localhost:5110";

// 可选：定义统一的响应格式接口
interface ApiResponse<T> {
	code: number;
	message: string;
	data: T;
}

// 创建 Axios 实例
const request: AxiosInstance = axios.create({
	baseURL: BASE_URL + "/api", // 可根据环境变量设置
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
});

// 请求拦截器
request.interceptors.request.use(
	config => {
		return config;
	},
	error => {
		return Promise.reject(error);
	}
);

// 响应拦截器
request.interceptors.response.use(
	(response: AxiosResponse) => {
		const res = response.data;
		// 可根据实际的 code 字段做处理
		if (res.code !== 200) {
			console.error("接口报错：", res.message, res.data);
			return Promise.reject(res);
		}
		return res.data;
	},
	error => {
		console.error("网络/服务器错误：", error);
		return Promise.reject(error);
	}
);

// 导出泛型请求函数
export const get = <T>(url: string, params?: any, config?: AxiosRequestConfig) =>
	request.get<any, T>(url, { params, ...config });

export const post = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
	request.post<any, T>(url, data, config);

export const put = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
	request.put<any, T>(url, data, config);

export const del = <T>(url: string, config?: AxiosRequestConfig) =>
	request.delete<any, T>(url, config);

export default request;
