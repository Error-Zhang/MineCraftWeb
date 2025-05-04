export class SimplexNoise {
	private static m_grad3: number[][] = [
		[1, 1, 0],
		[-1, 1, 0],
		[1, -1, 0],
		[-1, -1, 0],
		[1, 0, 1],
		[-1, 0, 1],
		[1, 0, -1],
		[-1, 0, -1],
		[0, 1, 1],
		[0, -1, 1],
		[0, 1, -1],
		[0, -1, -1],
	];

	private static m_permutations: number[] = [
		151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69,
		142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219,
		203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
		74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230,
		220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76,
		132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186,
		3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59,
		227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70,
		221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178,
		185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81,
		51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115,
		121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195,
		78, 66, 215, 61, 156, 180, 151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7,
		225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0,
		26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20,
		125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111,
		229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63,
		161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86,
		164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126,
		255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119,
		248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98,
		108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210,
		144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199,
		106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114,
		67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
	];

	public static Noise(x: number): number {
		const num = Math.floor(x);
		const x2 = Math.ceil(x);
		const num2 = x - num;
		const num3 = this.Hash(num);
		const num4 = this.Hash(x2);
		return num3 + num2 * num2 * (3 - 2 * num2) * (num4 - num3);
	}

	public static Noise2D(x: number, y: number): number {
		const num = (x + y) * 0.366025418;
		const num2 = Math.floor(x + num);
		const num3 = Math.floor(y + num);
		const num4 = (num2 + num3) * 0.211324871;
		const num5 = num2 - num4;
		const num6 = num3 - num4;
		const num7 = x - num5;
		const num8 = y - num6;

		let num9: number;
		let num10: number;
		if (num7 > num8) {
			num9 = 1;
			num10 = 0;
		} else {
			num9 = 0;
			num10 = 1;
		}

		const num11 = num7 - num9 + 0.211324871;
		const num12 = num8 - num10 + 0.211324871;
		const num13 = num7 - 1 + 0.422649741;
		const num14 = num8 - 1 + 0.422649741;

		const num15 = num2 & 0xff;
		const num16 = num3 & 0xff;
		const num17 = this.m_permutations[num15 + this.m_permutations[num16]] % 12;
		const num18 = this.m_permutations[num15 + num9 + this.m_permutations[num16 + num10]] % 12;
		const num19 = this.m_permutations[num15 + 1 + this.m_permutations[num16 + 1]] % 12;

		let num20 = 0.5 - num7 * num7 - num8 * num8;
		let num21: number;
		if (num20 < 0) {
			num21 = 0;
		} else {
			num20 *= num20;
			num21 = num20 * num20 * this.Dot(this.m_grad3[num17], num7, num8);
		}

		let num22 = 0.5 - num11 * num11 - num12 * num12;
		let num23: number;
		if (num22 < 0) {
			num23 = 0;
		} else {
			num22 *= num22;
			num23 = num22 * num22 * this.Dot(this.m_grad3[num18], num11, num12);
		}

		let num24 = 0.5 - num13 * num13 - num14 * num14;
		let num25: number;
		if (num24 < 0) {
			num25 = 0;
		} else {
			num24 *= num24;
			num25 = num24 * num24 * this.Dot(this.m_grad3[num19], num13, num14);
		}

		return 35 * (num21 + num23 + num25) + 0.5;
	}

	public static Noise3D(x: number, y: number, z: number): number {
		const num = (x + y + z) * 0.333333343;
		const num2 = Math.floor(x + num);
		const num3 = Math.floor(y + num);
		const num4 = Math.floor(z + num);
		const num5 = (num2 + num3 + num4) * (355 / (678 * Math.PI));
		const num6 = num2 - num5;
		const num7 = num3 - num5;
		const num8 = num4 - num5;
		const num9 = x - num6;
		const num10 = y - num7;
		const num11 = z - num8;

		let num12: number;
		let num13: number;
		let num14: number;
		let num15: number;
		let num16: number;
		let num17: number;

		if (num9 >= num10) {
			if (num10 >= num11) {
				num12 = 1;
				num13 = 0;
				num14 = 0;
				num15 = 1;
				num16 = 1;
				num17 = 0;
			} else if (num9 >= num11) {
				num12 = 1;
				num13 = 0;
				num14 = 0;
				num15 = 1;
				num16 = 0;
				num17 = 1;
			} else {
				num12 = 0;
				num13 = 0;
				num14 = 1;
				num15 = 1;
				num16 = 0;
				num17 = 1;
			}
		} else if (num10 < num11) {
			num12 = 0;
			num13 = 0;
			num14 = 1;
			num15 = 0;
			num16 = 1;
			num17 = 1;
		} else if (num9 < num11) {
			num12 = 0;
			num13 = 1;
			num14 = 0;
			num15 = 0;
			num16 = 1;
			num17 = 1;
		} else {
			num12 = 0;
			num13 = 1;
			num14 = 0;
			num15 = 1;
			num16 = 1;
			num17 = 0;
		}

		const num18 = num9 - num12 + 355 / (678 * Math.PI);
		const num19 = num10 - num13 + 355 / (678 * Math.PI);
		const num20 = num11 - num14 + 355 / (678 * Math.PI);
		const num21 = num9 - num15 + 0.333333343;
		const num22 = num10 - num16 + 0.333333343;
		const num23 = num11 - num17 + 0.333333343;
		const num24 = num9 - 1 + 0.5;
		const num25 = num10 - 1 + 0.5;
		const num26 = num11 - 1 + 0.5;

		const num27 = num2 & 0xff;
		const num28 = num3 & 0xff;
		const num29 = num4 & 0xff;
		const num30 =
			this.m_permutations[num27 + this.m_permutations[num28 + this.m_permutations[num29]]] % 12;
		const num31 =
			this.m_permutations[
				num27 + num12 + this.m_permutations[num28 + num13 + this.m_permutations[num29 + num14]]
			] % 12;
		const num32 =
			this.m_permutations[
				num27 + num15 + this.m_permutations[num28 + num16 + this.m_permutations[num29 + num17]]
			] % 12;
		const num33 =
			this.m_permutations[
				num27 + 1 + this.m_permutations[num28 + 1 + this.m_permutations[num29 + 1]]
			] % 12;

		let num34 = 0.6 - num9 * num9 - num10 * num10 - num11 * num11;
		let num35: number;
		if (num34 < 0) {
			num35 = 0;
		} else {
			num34 *= num34;
			num35 = num34 * num34 * this.Dot3(this.m_grad3[num30], num9, num10, num11);
		}

		let num36 = 0.6 - num18 * num18 - num19 * num19 - num20 * num20;
		let num37: number;
		if (num36 < 0) {
			num37 = 0;
		} else {
			num36 *= num36;
			num37 = num36 * num36 * this.Dot3(this.m_grad3[num31], num18, num19, num20);
		}

		let num38 = 0.6 - num21 * num21 - num22 * num22 - num23 * num23;
		let num39: number;
		if (num38 < 0) {
			num39 = 0;
		} else {
			num38 *= num38;
			num39 = num38 * num38 * this.Dot3(this.m_grad3[num32], num21, num22, num23);
		}

		let num40 = 0.6 - num24 * num24 - num25 * num25 - num26 * num26;
		let num41: number;
		if (num40 < 0) {
			num41 = 0;
		} else {
			num40 *= num40;
			num41 = num40 * num40 * this.Dot3(this.m_grad3[num33], num24, num25, num26);
		}

		return 16 * (num35 + num37 + num39 + num41) + 0.5;
	}

	public static OctavedNoise1D(
		x: number,
		frequency: number,
		octaves: number,
		frequencyStep: number,
		amplitudeStep: number,
		ridged: boolean = false
	): number {
		let num = 0;
		let num2 = 0;
		let num3 = 1;
		for (let i = 0; i < octaves; i++) {
			num += num3 * this.Noise(x * frequency);
			num2 += num3;
			frequency *= frequencyStep;
			num3 *= amplitudeStep;
		}
		return !ridged ? num / num2 : 1 - Math.abs((2 * num) / num2 - 1);
	}

	public static OctavedNoise2D(
		x: number,
		y: number,
		frequency: number,
		octaves: number,
		frequencyStep: number,
		amplitudeStep: number,
		ridged: boolean = false
	): number {
		let num = 0;
		let num2 = 0;
		let num3 = 1;
		for (let i = 0; i < octaves; i++) {
			num += num3 * this.Noise2D(x * frequency, y * frequency);
			num2 += num3;
			frequency *= frequencyStep;
			num3 *= amplitudeStep;
		}
		return !ridged ? num / num2 : 1 - Math.abs((2 * num) / num2 - 1);
	}

	public static OctavedNoise3D(
		x: number,
		y: number,
		z: number,
		frequency: number,
		octaves: number,
		frequencyStep: number,
		amplitudeStep: number,
		ridged: boolean = false
	): number {
		let num = 0;
		let num2 = 0;
		let num3 = 1;
		for (let i = 0; i < octaves; i++) {
			num += num3 * this.Noise3D(x * frequency, y * frequency, z * frequency);
			num2 += num3;
			frequency *= frequencyStep;
			num3 *= amplitudeStep;
		}
		return !ridged ? num / num2 : 1 - Math.abs((2 * num) / num2 - 1);
	}

	private static Dot(g: number[], x: number, y: number): number {
		return g[0] * x + g[1] * y;
	}

	private static Dot3(g: number[], x: number, y: number, z: number): number {
		return g[0] * x + g[1] * y + g[2] * z;
	}

	private static Hash(x: number): number {
		x = (x << 13) ^ x;
		return ((x * (x * x * 15731 + 789221) + 1376312589) & 0x7fffffff) / 2147483647.0;
	}
}
