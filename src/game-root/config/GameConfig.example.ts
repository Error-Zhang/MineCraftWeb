/**
 * GameConfig 使用示例
 * 
 * 这个文件展示了如何使用GameConfig来控制游戏特性
 */

import { GameConfig } from "./GameConfig";
import { AudioConfig } from "./AudioConfig";

// ============================================
// 示例1: 在游戏启动时检查配置
// ============================================
export function initializeGame() {
    if (GameConfig.isAnimalSystemEnabled()) {
        console.log("动物系统已启用");
        // 初始化动物系统...
    } else {
        console.log("动物系统已禁用，跳过初始化");
    }
}

// ============================================
// 示例2: 动态切换功能
// ============================================
export function toggleAnimalSystem() {
    const currentState = GameConfig.isAnimalSystemEnabled();
    GameConfig.setAnimalSystemEnabled(!currentState);
    
    if (!currentState) {
        console.log("动物系统已启用");
        // 重新加载动物...
    } else {
        console.log("动物系统已禁用");
        // 清理动物...
    }
}

// ============================================
// 示例3: 性能模式切换
// ============================================
export function setPerformanceMode(mode: "high" | "medium" | "low") {
    switch (mode) {
        case "high":
            GameConfig.ANIMAL_SYSTEM.performance.maxUpdatePerFrame = 100;
            GameConfig.ANIMAL_SYSTEM.performance.chunkLoadRadius = 4;
            GameConfig.ANIMAL_SYSTEM.performance.syncInterval = 100;
            break;
        case "medium":
            GameConfig.ANIMAL_SYSTEM.performance.maxUpdatePerFrame = 50;
            GameConfig.ANIMAL_SYSTEM.performance.chunkLoadRadius = 3;
            GameConfig.ANIMAL_SYSTEM.performance.syncInterval = 200;
            break;
        case "low":
            GameConfig.ANIMAL_SYSTEM.performance.maxUpdatePerFrame = 20;
            GameConfig.ANIMAL_SYSTEM.performance.chunkLoadRadius = 2;
            GameConfig.ANIMAL_SYSTEM.performance.syncInterval = 500;
            break;
    }
    console.log(`性能模式已设置为: ${mode}`);
}

// ============================================
// 示例4: 调试模式
// ============================================
export function enableDebugMode() {
    GameConfig.setDebugMode(true);
    GameConfig.DEBUG.showFPS = true;
    GameConfig.DEBUG.showPosition = true;
    GameConfig.DEBUG.showAnimalPaths = true;
    console.log("调试模式已启用");
}

export function disableDebugMode() {
    GameConfig.setDebugMode(false);
    GameConfig.DEBUG.showAnimalPaths = false;
    console.log("调试模式已禁用");
}

// ============================================
// 示例5: 音乐控制
// ============================================
export function toggleMusic() {
	const currentState = AudioConfig.isMusicEnabled();
	AudioConfig.setMusicEnabled(!currentState);
	console.log(`音乐已${!currentState ? "启用" : "禁用"}`);
}

export function setMusicVolume(volume: number) {
	AudioConfig.setMusicVolume(volume);
}

export function toggleSoundEffects() {
	const currentState = AudioConfig.isSoundEffectsEnabled();
	AudioConfig.setSoundEffectsEnabled(!currentState);
	console.log(`音效已${!currentState ? "启用" : "禁用"}`);
}

// ============================================
// 示例6: 暴露到全局控制台
// ============================================
// 将这些函数暴露到全局，方便在控制台调用
if (typeof window !== "undefined") {
	(window as any).GameConfig = GameConfig;
	(window as any).AudioConfig = AudioConfig;
	(window as any).toggleAnimalSystem = toggleAnimalSystem;
	(window as any).setPerformanceMode = setPerformanceMode;
	(window as any).enableDebugMode = enableDebugMode;
	(window as any).disableDebugMode = disableDebugMode;
	(window as any).toggleMusic = toggleMusic;
	(window as any).setMusicVolume = setMusicVolume;
	(window as any).toggleSoundEffects = toggleSoundEffects;
	
	console.log(`
==============================================
游戏配置工具已加载！
在控制台中可以使用以下命令：

【动物系统】
1. 查看配置:
   GameConfig.ANIMAL_SYSTEM

2. 切换动物系统:
   toggleAnimalSystem()

3. 设置性能模式:
   setPerformanceMode("high")   // 高性能
   setPerformanceMode("medium") // 中等
   setPerformanceMode("low")    // 低性能

4. 启用/禁用调试:
   enableDebugMode()
   disableDebugMode()

5. 单独控制:
   GameConfig.setAnimalSystemEnabled(false)
   GameConfig.setAnimalAIEnabled(false)

【音频系统】
6. 查看音频配置:
   AudioConfig.BACKGROUND_MUSIC

7. 切换音乐:
   toggleMusic()

8. 设置音量:
   setMusicVolume(0.5)  // 0.0 - 1.0

9. 切换音效:
   toggleSoundEffects()

10. 音乐控制（需要先获取game实例）:
    game.getMusicManager().pause()
    game.getMusicManager().resume()
    game.getMusicManager().next()
    game.getMusicManager().previous()
==============================================
    `);
}
