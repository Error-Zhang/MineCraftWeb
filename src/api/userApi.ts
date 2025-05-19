import { get, post } from "./request";

export interface IUser {
	id?: number;
	userName: string;
	passWord: string;
}

// 封装成 userApi 对象
const userApi = {
	// 登录
	login(user: IUser) {
		return get<IUser>("/user", user);
	},

	// 注册
	register(user: IUser) {
		return post<IUser>("/user", user);
	},
};

export default userApi;
