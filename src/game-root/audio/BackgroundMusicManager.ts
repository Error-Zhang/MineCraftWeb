import { AudioConfig } from "@/game-root/config/AudioConfig";

/**
 * 背景音乐管理器
 * 负责游戏背景音乐的播放、停止、切换等功能
 */
export class BackgroundMusicManager {
	private audioElement: HTMLAudioElement | null = null;
	private musicList: string[] = [];
	private currentIndex: number = 0;
	private isPlaying: boolean = false;
	private volume: number = AudioConfig.BACKGROUND_MUSIC.defaultVolume;
	private playDelayTimer?: NodeJS.Timeout;
	private needsUserInteraction: boolean = true;

	/**
	 * 初始化音乐管理器
	 * 加载音乐列表并设置用户交互监听
	 */
	public async initialize(): Promise<void> {
		await this.loadMusicList();
		this.setupUserInteractionListener();
		console.log(`[BackgroundMusic] Initialized with ${this.musicList.length} tracks`);
	}

	/**
	 * 播放背景音乐
	 * @param delaySeconds 延迟播放时间（秒），默认使用配置值
	 */
	public play(delaySeconds: number = AudioConfig.BACKGROUND_MUSIC.playDelay): void {
		// 检查配置是否启用
		if (!AudioConfig.isMusicEnabled()) {
			console.log("[BackgroundMusic] Music is disabled by config");
			return;
		}

		if (this.musicList.length === 0) {
			console.warn("[BackgroundMusic] No music tracks available");
			return;
		}

		if (this.needsUserInteraction) {
			console.log("[BackgroundMusic] Waiting for user interaction before playing");
			return;
		}

		// 清除之前的延迟定时器
		if (this.playDelayTimer) {
			clearTimeout(this.playDelayTimer);
		}

		// 延迟播放
		this.playDelayTimer = setTimeout(() => {
			this.playTrack(this.currentIndex);
		}, delaySeconds * 1000);

		console.log(`[BackgroundMusic] Scheduled to play in ${delaySeconds} seconds`);
	}

	/**
	 * 立即播放音乐（无延迟）
	 */
	public playImmediately(): void {
		if (this.musicList.length === 0 || this.needsUserInteraction) {
			return;
		}
		this.playTrack(this.currentIndex);
	}

	/**
	 * 停止播放
	 */
	public stop(): void {
		// 清除延迟定时器
		if (this.playDelayTimer) {
			clearTimeout(this.playDelayTimer);
			this.playDelayTimer = undefined;
		}

		// 停止当前音轨
		this.stopCurrentTrack();
		this.isPlaying = false;

		console.log("[BackgroundMusic] Stopped");
	}

	/**
	 * 暂停播放
	 */
	public pause(): void {
		if (this.audioElement) {
			this.audioElement.pause();
			this.isPlaying = false;
			console.log("[BackgroundMusic] Paused");
		}
	}

	/**
	 * 恢复播放
	 */
	public resume(): void {
		if (this.audioElement && !this.isPlaying) {
			this.audioElement.play().catch(error => {
				console.error("[BackgroundMusic] Failed to resume:", error);
			});
			this.isPlaying = true;
			console.log("[BackgroundMusic] Resumed");
		}
	}

	/**
	 * 播放下一首
	 */
	public next(): void {
		const nextIndex = (this.currentIndex + 1) % this.musicList.length;
		this.playTrack(nextIndex);
	}

	/**
	 * 播放上一首
	 */
	public previous(): void {
		const prevIndex = (this.currentIndex - 1 + this.musicList.length) % this.musicList.length;
		this.playTrack(prevIndex);
	}

	/**
	 * 设置音量
	 * @param volume 音量值 (0.0 - 1.0)
	 */
	public setVolume(volume: number): void {
		this.volume = Math.max(0, Math.min(1, volume));
		if (this.audioElement) {
			this.audioElement.volume = this.volume;
		}
		console.log(`[BackgroundMusic] Volume set to ${(this.volume * 100).toFixed(0)}%`);
	}

	/**
	 * 获取当前音量
	 */
	public getVolume(): number {
		return this.volume;
	}

	/**
	 * 获取播放状态
	 */
	public getIsPlaying(): boolean {
		return this.isPlaying;
	}

	/**
	 * 获取当前音轨信息
	 */
	public getCurrentTrackInfo(): { index: number; total: number; url: string } | null {
		if (this.musicList.length === 0) return null;
		return {
			index: this.currentIndex,
			total: this.musicList.length,
			url: this.musicList[this.currentIndex],
		};
	}

	/**
	 * 销毁音乐管理器
	 * 释放所有资源
	 */
	public dispose(): void {
		this.stop();
		this.musicList = [];
		console.log("[BackgroundMusic] Disposed");
	}

	/**
	 * 加载音乐列表
	 * 从assets目录动态导入所有音乐文件
	 */
	private async loadMusicList(): Promise<void> {
		try {
			const modules = import.meta.glob("/src/game-root/assets/musics/*", {
				eager: true,
			}) as Record<string, { default: string }>;

			this.musicList = Object.entries(modules).map(([_, mod]) => mod.default);
			console.log(`[BackgroundMusic] Loaded ${this.musicList.length} music tracks`);
		} catch (error) {
			console.error("[BackgroundMusic] Failed to load music list:", error);
		}
	}

	/**
	 * 设置用户交互监听
	 * 由于浏览器限制，音频需要在用户交互后才能播放
	 */
	private setupUserInteractionListener(): void {
		const handleUserInteraction = () => {
			if (this.needsUserInteraction && this.musicList.length > 0) {
				this.needsUserInteraction = false;
				console.log("[BackgroundMusic] User interaction detected, ready to play");
				window.removeEventListener("pointerdown", handleUserInteraction);
				window.removeEventListener("keydown", handleUserInteraction);
			}
		};

		window.addEventListener("pointerdown", handleUserInteraction, { once: true });
		window.addEventListener("keydown", handleUserInteraction, { once: true });
	}

	/**
	 * 播放指定索引的音轨
	 */
	private playTrack(index: number): void {
		if (index < 0 || index >= this.musicList.length) {
			console.error(`[BackgroundMusic] Invalid track index: ${index}`);
			return;
		}

		// 停止当前播放
		this.stopCurrentTrack();

		// 创建新的音频元素
		const audio = new Audio(this.musicList[index]);
		this.audioElement = audio;
		this.currentIndex = index;
		this.isPlaying = true;

		// 设置音量
		audio.volume = this.volume;

		// 监听播放结束事件，自动播放下一首
		audio.addEventListener("ended", () => {
			const nextIndex = (index + 1) % this.musicList.length;
			this.playTrack(nextIndex);
		});

		// 监听错误事件
		audio.addEventListener("error", e => {
			console.error(`[BackgroundMusic] Error playing track ${index}:`, e);
			// 尝试播放下一首
			const nextIndex = (index + 1) % this.musicList.length;
			if (nextIndex !== index) {
				this.playTrack(nextIndex);
			}
		});

		// 开始播放
		audio.play().catch(error => {
			console.error("[BackgroundMusic] Failed to play:", error);
			this.isPlaying = false;
		});

		console.log(`[BackgroundMusic] Playing track ${index + 1}/${this.musicList.length}`);
	}

	/**
	 * 停止当前音轨
	 */
	private stopCurrentTrack(): void {
		if (this.audioElement) {
			this.audioElement.pause();
			this.audioElement.src = "";
			this.audioElement = null;
		}
	}
}
