import { BlockRegistry } from "../block/BlockRegistry";
import { ChunkManager } from "../chunk/ChunkManager";
import { Position } from "../types/chunk.type";
import { BlockDefinition } from "../types/block.type";

export class LiquidManager {
    private static instance: LiquidManager;
    private updateQueue: Set<string> = new Set();
    private readonly updateInterval: number = 100; // 更新间隔（毫秒）
    private lastUpdateTime: number = 0;
    private readonly MAX_FLOW_DISTANCE = 8; // 最大流动距离
    private sourceBlocks: Map<string, Position> = new Map(); // 记录液体源方块

    private constructor() {
        // 私有构造函数，确保单例模式
    }

    public static get Instance(): LiquidManager {
        if (!LiquidManager.instance) {
            LiquidManager.instance = new LiquidManager();
        }
        return LiquidManager.instance;
    }

    /**
     * 添加液体方块到更新队列
     */
    public addToUpdateQueue(position: Position) {
        const key = `${position.x},${position.y},${position.z}`;
        this.updateQueue.add(key);

        // 如果是新放置的液体方块，将其标记为源方块
        if (!this.sourceBlocks.has(key)) {
            this.sourceBlocks.set(key, position);
        }
    }

    /**
     * 更新液体状态
     */
    public update(deltaTime: number) {
        const currentTime = Date.now();
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        this.lastUpdateTime = currentTime;

        // 处理更新队列中的液体方块
        const queueCopy = new Set(this.updateQueue);
        this.updateQueue.clear();

        for (const key of queueCopy) {
            const [x, y, z] = key.split(',').map(Number);
            this.updateLiquidBlock({ x, y, z });
        }
    }

    /**
     * 计算到最近源方块的距离
     */
    private getDistanceToSource(position: Position): number {
        let minDistance = Infinity;
        for (const sourcePos of this.sourceBlocks.values()) {
            const distance = Math.abs(position.x - sourcePos.x) + 
                           Math.abs(position.y - sourcePos.y) + 
                           Math.abs(position.z - sourcePos.z);
            minDistance = Math.min(minDistance, distance);
        }
        return minDistance;
    }

    /**
     * 更新单个液体方块
     */
    private updateLiquidBlock(position: Position) {
        const { x, y, z } = position;
        const blockId = ChunkManager.getBlockAt(x, y, z);
        const block = BlockRegistry.Instance.getById(blockId);

        if (!block?.metaData?.flowable) {
            return;
        }

        const viscosity = block.metaData.viscosity || 1;
        const flowDelay = Math.floor(viscosity * 1000); // 根据粘度计算流动延迟

        // 检查下方方块
        const belowBlock = ChunkManager.getBlockAt(x, y - 1, z);
        if (belowBlock === 0) {
            // 如果下方是空的，液体向下流动
            this.scheduleBlockUpdate({ x, y: y - 1, z });
            return;
        }

        // 检查周围方块
        const directions = [
            { x: 1, y: 0, z: 0 },
            { x: -1, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: -1 }
        ];

        for (const dir of directions) {
            const nx = x + dir.x;
            const ny = y + dir.y;
            const nz = z + dir.z;
            
            // 检查是否超过最大流动距离
            const distanceToSource = this.getDistanceToSource({ x: nx, y: ny, z: nz });
            if (distanceToSource > this.MAX_FLOW_DISTANCE) {
                continue;
            }

            const neighborBlock = ChunkManager.getBlockAt(nx, ny, nz);
            if (neighborBlock === 0) {
                // 如果周围有空位，调度该位置的方块更新
                this.scheduleBlockUpdate({ x: nx, y: ny, z: nz });
            }
        }
    }

    /**
     * 调度方块更新
     */
    private scheduleBlockUpdate(position: Position) {
        const key = `${position.x},${position.y},${position.z}`;
        this.updateQueue.add(key);
    }

    /**
     * 清理指定位置的液体方块
     */
    public removeLiquid(position: Position) {
        const key = `${position.x},${position.y},${position.z}`;
        this.sourceBlocks.delete(key);
        this.updateQueue.delete(key);
    }
} 