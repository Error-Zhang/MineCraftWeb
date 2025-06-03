import { Color3 } from "@babylonjs/core";

function parseHexColor(hex: string): Color3 {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	return new Color3(r, g, b);
}

function lerpColor(a: Color3, b: Color3, t: number): Color3 {
	return new Color3(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}

// 季节基础色
const grassSeasonColors = [
	parseHexColor("#b3e85d"), // 春：亮绿
	parseHexColor("#5cb531"), // 夏：中绿
	parseHexColor("#d79b3d"), // 秋：土黄
	parseHexColor("#d8f0ff"), // 冬：浅青白
];

// 简化的湿润度影响
const biomeWet = parseHexColor("#4df267"); // 湿润绿
const biomeDry = parseHexColor("#d4c18a"); // 干旱黄褐

export function getGrassColor(temperature: number, humidity: number, season: number): Color3 {
	const tempNorm = Math.max(0, Math.min(temperature / 15, 1));
	const humidNorm = Math.max(0, Math.min(humidity / 15, 1));
	const wetness = (tempNorm + humidNorm) / 2;

	const base = grassSeasonColors[season % 4];
	const biomeBlend = lerpColor(biomeDry, biomeWet, wetness);
	return lerpColor(base, biomeBlend, 0.25); // 25% 环境色影响
}

const foliageSeasonColors = [
	parseHexColor("#78c850"), // 春：鲜绿
	parseHexColor("#5cb531"), // 夏：深绿
	parseHexColor("#cc7733"), // 秋：橙褐
	parseHexColor("#f0f8ff"), // 冬：雪白偏蓝
];

function varyColor(color: Color3, seed: number): Color3 {
	const offset = ((seed % 1000) / 1000 - 0.5) * 0.2 + 1; // ±10%
	return new Color3(
		Math.min(1, color.r * offset),
		Math.min(1, color.g * offset),
		Math.min(1, color.b * offset)
	);
}

export function getFoliageColor(value: number, season: number): Color3 {
	const seed = (value * 16807 + 233) % 9973; // 与草分开扰动
	const base = foliageSeasonColors[season % 4];
	return varyColor(base, seed);
}
