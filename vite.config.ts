import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": "/src", // 设置@指向src文件夹
			"@engine": "/src/engine",
		},
	},
	assetsInclude: ['**/*.gltf', '**/*.glb'],
	/*server: {
		proxy: {
			// 代理 API 请求
			"/api": {
				target: "http://localhost:5110/api", // 后端服务地址
				changeOrigin: true,
				rewrite: path => path.replace(/^\/api/, ""),
			},
		},
	},*/
});
