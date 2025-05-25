import { Blocks } from "@/block/core/Blocks.ts";
import { BlockRecipe } from "@/block/core/BlockTypes.ts";
import { Nullable } from "@babylonjs/core";

// 滑动匹配算法
export function matchesPattern(playerGrid: Nullable<Blocks>[][], recipe: BlockRecipe): boolean {
	const pattern = recipe.pattern;

	const patternHeight = pattern.length;
	const patternWidth = pattern[0].length;

	const gridHeight = playerGrid.length;
	const gridWidth = playerGrid[0].length;

	const maxYOffset = gridHeight - patternHeight;
	const maxXOffset = gridWidth - patternWidth;

	for (let offsetY = 0; offsetY <= maxYOffset; offsetY++) {
		for (let offsetX = 0; offsetX <= maxXOffset; offsetX++) {
			// 正向匹配
			if (matchAtOffset(playerGrid, pattern, offsetX, offsetY)) {
				return true;
			}
			// 镜像匹配
			if (
				recipe.allowMirrored &&
				matchAtOffset(playerGrid, mirrorPattern(pattern), offsetX, offsetY)
			) {
				return true;
			}
		}
	}

	return false;
}

// 在某个偏移量检查是否匹配
function matchAtOffset(
	grid: Nullable<Blocks>[][],
	pattern: Nullable<Blocks>[][],
	offsetX: number,
	offsetY: number
): boolean {
	for (let y = 0; y < grid.length; y++) {
		for (let x = 0; x < grid[0].length; x++) {
			const inPatternArea =
				y >= offsetY &&
				y < offsetY + pattern.length &&
				x >= offsetX &&
				x < offsetX + pattern[0].length;

			if (inPatternArea) {
				const expected = pattern[y - offsetY][x - offsetX];
				const actual = grid[y][x];
				if (expected !== actual) {
					return false;
				}
			} else {
				// 不在配方区域的地方必须为空
				if (grid[y][x]) {
					return false;
				}
			}
		}
	}
	return true;
}

// 生成左右镜像版本的 pattern
function mirrorPattern(pattern: Nullable<Blocks>[][]) {
	return pattern.map(row => [...row].reverse());
}
