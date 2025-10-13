/**
 * 音频配置
 * 管理游戏音频相关的配置
 */
export class AudioConfig {
	/**
	 * 背景音乐配置
	 */
	public static readonly BACKGROUND_MUSIC = {
		// 是否启用背景音乐
		enabled: false,

		// 默认音量 (0.0 - 1.0)
		defaultVolume: 0.3,

		// 延迟播放时间（秒）
		playDelay: 60 * 5,

		// 是否循环播放
		loop: true,

		// 是否随机播放
		shuffle: true,
	};

	/**
	 * 音效配置
	 */
	public static readonly SOUND_EFFECTS = {
		// 是否启用音效
		enabled: true,

		// 默认音量 (0.0 - 1.0)
		defaultVolume: 1.0,

		// 音效类型
		types: {
			buttonClick: true,
			blockPlaced: true,
			itemMoved: true,
			message: true,
		},
	};

	/**
	 * 获取背景音乐是否启用
	 */
	public static isMusicEnabled(): boolean {
		return this.BACKGROUND_MUSIC.enabled;
	}

	/**
	 * 设置背景音乐启用状态
	 */
	public static setMusicEnabled(enabled: boolean): void {
		this.BACKGROUND_MUSIC.enabled = enabled;
		console.log(`[AudioConfig] Background music ${enabled ? "enabled" : "disabled"}`);
	}

	/**
	 * 设置背景音乐音量
	 */
	public static setMusicVolume(volume: number): void {
		this.BACKGROUND_MUSIC.defaultVolume = Math.max(0, Math.min(1, volume));
		console.log(
			`[AudioConfig] Music volume set to ${(this.BACKGROUND_MUSIC.defaultVolume * 100).toFixed(0)}%`
		);
	}

	/**
	 * 获取音效是否启用
	 */
	public static isSoundEffectsEnabled(): boolean {
		return this.SOUND_EFFECTS.enabled;
	}

	/**
	 * 设置音效启用状态
	 */
	public static setSoundEffectsEnabled(enabled: boolean): void {
		this.SOUND_EFFECTS.enabled = enabled;
		console.log(`[AudioConfig] Sound effects ${enabled ? "enabled" : "disabled"}`);
	}
}

// 导出便捷访问
export const MusicConfig = AudioConfig.BACKGROUND_MUSIC;
export const SoundConfig = AudioConfig.SOUND_EFFECTS;
