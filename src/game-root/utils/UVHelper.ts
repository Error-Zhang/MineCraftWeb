import {Vector4} from "@babylonjs/core";

export class UVHelper {
    static readonly tilesX = 16;
    static readonly tilesY = 16;

    /**
     * 获取指定贴图块的 UV 向量
     * @param uv
     */
    static getUV(uv: [number, number]): Vector4 {
        const [x, y] = uv;
        const tileSizeX = 1 / this.tilesX;
        const tileSizeY = 1 / this.tilesY;

        return new Vector4(
            x * tileSizeX,
            y * tileSizeY,
            (x + 1) * tileSizeX,
            (y + 1) * tileSizeY
        );
    }

    /**
     * 快速生成 6 个面的 faceUV 向量数组
     * @param all 所有面统一使用的贴图位置
     */
    static uniform(all: [number, number]): Vector4[] {
        const uv = this.getUV(all);
        return [uv, uv, uv, uv, uv, uv];
    }

    /**
     * 分别为顶面、底面、侧面指定贴图位置
     * @param top 顶面贴图坐标 [x, y]
     * @param bottom 底面贴图坐标 [x, y]
     * @param side 侧面贴图坐标 [x, y]
     */
    static topBottomSide(
        top: [number, number],
        bottom: [number, number],
        side: [number, number]
    ): Vector4[] {
        const topUV = this.getUV(top);
        const bottomUV = this.getUV(bottom);
        const sideUV = this.getUV(side);

        return [
            sideUV,    // front (Z+)
            sideUV,    // back (Z-)
            sideUV,    // right (X+)
            sideUV,    // left (X-)
            topUV,     // top (Y+)
            bottomUV   // bottom (Y-)
        ];
    }

}
