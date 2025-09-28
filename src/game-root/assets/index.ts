import blockTextureAtlas from "./textures/Blocks.webp";
import HumanMaleTexture1 from "./textures/HumanMale1.webp";

/* 方块 / 建筑 */
import Cactus from "./models/Cactus.glb"; // 仙人掌
import CraftingTable from "./models/CraftingTable.glb"; // 工作台
import Furnace from "./models/Furnace.glb"; // 熔炉
import Brick from "./models/Brick.glb"; // 砖块
import Slab from "./models/Slab.glb"; // 台阶
import Stairs from "./models/Stairs.glb"; // 楼梯
import Pumpkins from "./models/Pumpkins.glb"; // 南瓜
import ChristmasTree from "./models/ChristmasTree.glb"; // 圣诞树
import Graves from "./models/Graves.glb"; // 墓碑
/* 门/栅栏/开关 */
import WoodenDoor from "./models/WoodenDoor.glb"; // 木门
import CellDoor from "./models/CellDoor.glb"; // 铁牢门
import CellTrapdoor from "./models/CellTrapdoor.glb"; // 铁活板门
import IronDoor from "./models/IronDoor.glb"; // 铁门
import WoodenTrapdoor from "./models/WoodenTrapdoor.glb"; // 木活板门
import Gates from "./models/Gates.glb"; // 栅栏门
import WoodenFence from "./models/WoodenFence.glb"; // 木栅栏
import WoodenFenceGate from "./models/WoodenFenceGate.glb"; // 木栅栏门
import IronFence from "./models/IronFence.glb"; // 铁栅栏
import IronFenceGate from "./models/IronFenceGate.glb"; // 铁栅栏门
import StoneFence from "./models/StoneFence.glb"; // 石栅栏
import IronLadder from "./models/IronLadder.glb"; // 铁梯子
import WoodenLadder from "./models/WoodenLadder.glb"; // 木梯子
import IronSign from "./models/IronSign.glb"; // 铁告示牌
import WoodenSign from "./models/WoodenSign.glb"; // 木告示牌
import Button from "./models/Button.glb"; // 按钮
import Switch from "./models/Switch.glb"; // 开关
import PressurePlate from "./models/PressurePlate.glb"; // 压力板
/* 工具/武器 */
import Axe from "./models/Axe.glb"; // 斧头
import Pickaxe from "./models/Pickaxe.glb"; // 镐子
import Shovel from "./models/Shovel.glb"; // 铲子
import StoneAxe from "./models/StoneAxe.glb"; // 石斧
import WoodenClub from "./models/WoodenClub.glb"; // 木棒
import StoneClub from "./models/StoneClub.glb"; // 石棒
import Spear from "./models/Spear.glb"; // 长矛
import Hammer from "./models/Hammer.glb"; // 锤子
import Rake from "./models/Rake.glb"; // 耙子
import Machete from "./models/Machete.glb"; // 弯刀
import Musket from "./models/Musket.glb"; // 火枪
import Bows from "./models/Bows.glb"; // 弓
import Crossbows from "./models/Crossbows.glb"; // 弩
import Arrows from "./models/Arrows.glb"; // 箭矢
/* 玩家/人物 */
import HumanMale from "./models/HumanMale.glb"; // 男角色
import HumanFemale from "./models/HumanFemale.glb"; // 女角色
import OuterClothingMale from "./models/OuterClothingMale.glb"; // 男外衣
import OuterClothingFemale from "./models/OuterClothingFemale.glb"; // 女外衣
import FirstPersonHand from "./models/FirstPersonHand.glb"; // 第一人称手
import VrHand from "./models/VrHand.glb"; // VR手
/* 动物 */
import Cow from "./models/Cow.glb"; // 牛
import Donkey from "./models/Donkey.glb"; // 驴
import Horse from "./models/Horse.glb"; // 马
import Camel from "./models/Camel.glb"; // 骆驼
import Camel_Saddled from "./models/Camel_Saddled.glb"; // 骆驼（带鞍）
import Bison from "./models/Bison.glb"; // 野牛
import Zebra from "./models/Zebra.glb"; // 斑马
import Bear from "./models/Bear.glb"; // 熊
import PolarBear from "./models/PolarBear.glb"; // 北极熊
import Lion from "./models/Lion.glb"; // 狮子
import Tiger from "./models/Tiger.glb"; // 老虎
import Leopard from "./models/Leopard.glb"; // 豹子
import Jaguar from "./models/Jaguar.glb"; // 美洲豹
import Wolf from "./models/Wolf.glb"; // 狼
import Hyena from "./models/Hyena.glb"; // 鬣狗
import Wildboar from "./models/Wildboar.glb"; // 野猪
import Giraffe from "./models/Giraffe.glb"; // 长颈鹿
import Rhino from "./models/Rhino.glb"; // 犀牛
import Moose from "./models/Moose.glb"; // 驼鹿
import Reindeer from "./models/Reindeer.glb"; // 驯鹿
import Sparrow from "./models/Sparrow.glb"; // 麻雀
import Raven from "./models/Raven.glb"; // 乌鸦
import Seagull from "./models/Seagull.glb"; // 海鸥
import Pigeon from "./models/Pigeon.glb"; // 鸽子
import Bird from "./models/Bird.glb"; // 小鸟
import Cassowary from "./models/Cassowary.glb"; // 食火鸡
import Ostrich from "./models/Ostrich.glb"; // 鸵鸟
import Duck from "./models/Duck.glb"; // 鸭子
import Fish from "./models/Fish.glb"; // 鱼
import Bass from "./models/Bass.glb"; // 鲈鱼
import Barracuda from "./models/Barracuda.glb"; // 梭鱼
import Piranha from "./models/Piranha.glb"; // 食人鱼
import Orca from "./models/Orca.glb"; // 虎鲸
import Beluga from "./models/Beluga.glb"; // 白鲸
import Ray from "./models/Ray.glb"; // 鳐鱼
import Shark_Bull from "./models/Shark_Bull.glb"; // 牛鲨
import Shark_GreatWhite from "./models/Shark_GreatWhite.glb"; // 大白鲨
import Shark_Tiger from "./models/Shark_Tiger.glb"; // 虎鲨
import Starfish from "./models/Starfish.glb"; // 海星
import SeaUrchin from "./models/SeaUrchin.glb"; // 海胆
/* 道具/资源 */
import Bread from "./models/Bread.glb"; // 面包
import Meat from "./models/Meat.glb"; // 生肉
import Egg from "./models/Egg.glb"; // 鸡蛋
import RottenEgg from "./models/RottenEgg.glb"; // 坏蛋
import Stick from "./models/Stick.glb"; // 木棍
import Leather from "./models/Leather.glb"; // 皮革
import Fur from "./models/Fur.glb"; // 毛皮
import Diamond from "./models/Diamond.glb"; // 钻石
import Ingots from "./models/Ingots.glb"; // 锭
import Saddle from "./models/Saddle.glb"; // 马鞍
import EmptyBucket from "./models/EmptyBucket.glb"; // 空桶
import FullBucket from "./models/FullBucket.glb"; // 装水桶
import LargeGunpowderKeg from "./models/LargeGunpowderKeg.glb"; // 火药桶（大）
import MediumGunpowderKeg from "./models/MediumGunpowderKeg.glb"; // 火药桶（中）
import SmallGunpowderKeg from "./models/SmallGunpowderKeg.glb"; // 火药桶（小）
import Bomb from "./models/Bomb.glb"; // 炸弹
import Fireworks from "./models/Fireworks.glb"; // 烟花
import Torch from "./models/Torch.glb"; // 火把
import Compass from "./models/Compass.glb"; // 指南针
import Hygrometer from "./models/Hygrometer.glb"; // 湿度计
import Thermometer from "./models/Thermometer.glb"; // 温度计
import Magnet from "./models/Magnet.glb"; // 磁铁
import MotionDetector from "./models/MotionDetector.glb"; // 动作检测器
import Photodiode from "./models/Photodiode.glb"; // 光敏二极管
import Lightbulbs from "./models/Lightbulbs.glb"; // 灯泡
import Leds from "./models/Leds.glb"; // LED
import Whistle from "./models/Whistle.glb"; // 哨子
/* 装饰/环境 */
import Cairn from "./models/Cairn.glb"; // 石堆
import Campfire from "./models/Campfire.glb"; // 营火
import GrassTrap from "./models/GrassTrap.glb"; // 草陷阱
import SpikedPlanks from "./models/SpikedPlanks.glb"; // 钉板
/* 特殊/生物 */
import Werewolf from "./models/Werewolf.glb"; // 狼人
/* 载具 */
import Boat from "./models/Boat.glb"; // 船
import BoatItem from "./models/BoatItem.glb"; // 船道具
import IntroShip from "./models/IntroShip.glb"; // 初始船
/* 系统/Chunk */
import Chunk from "./models/Chunk.glb"; // 方块区块
import ChunkSmooth from "./models/ChunkSmooth.glb"; // 平滑区块
/* 其它 */
import Box from "./models/Box.glb"; // 箱子
import Pistons from "./models/Pistons.glb"; // 活塞
import Rod from "./models/Rod.glb"; // 杆子
import Detonator from "./models/Detonator.glb"; // 起爆器

const Assets = {
	blocks: {
		models: {
			Cactus, // 仙人掌
			CraftingTable, // 工作台
			Box, // 箱子
			Furnace, // 熔炉
			Brick, // 砖块
			Slab, // 半砖
			Stairs, // 楼梯
			Pumpkins, // 南瓜
			ChristmasTree, // 圣诞树
			Graves, // 墓碑

			WoodenDoor, // 木门
			CellDoor, // 铁栏门
			CellTrapdoor, // 铁栏活板门
			IronDoor, // 铁门
			WoodenTrapdoor, // 木活板门
			Gates, // 栅栏门
			WoodenFence, // 木栅栏
			WoodenFenceGate, // 木栅栏门
			IronFence, // 铁栅栏
			IronFenceGate, // 铁栅栏门
			StoneFence, // 石栅栏
			IronLadder, // 铁梯子
			WoodenLadder, // 木梯子
			IronSign, // 铁告示牌
			WoodenSign, // 木告示牌
			Button, // 按钮
			Switch, // 拉杆开关
			PressurePlate, // 压力板
			Pistons, // 活塞
			Rod, // 杆
			Detonator, // 起爆器

			Axe, // 斧子
			Pickaxe, // 镐子
			Shovel, // 铲子
			StoneAxe, // 石斧
			WoodenClub, // 木棒
			StoneClub, // 石棒
			Spear, // 长矛
			Hammer, // 锤子
			Rake, // 耙子
			Machete, // 弯刀

			Musket, // 火枪
			Bows, // 弓
			Crossbows, // 弩
			Arrows, // 箭
			Bomb, // 炸弹

			Bread, // 面包
			Meat, // 肉
			Egg, // 鸡蛋
			RottenEgg, // 坏鸡蛋
			Stick, // 木棍
			Leather, // 皮革
			Fur, // 毛皮
			Diamond, // 钻石
			Ingots, // 锭
			Saddle, // 马鞍
			EmptyBucket, // 空桶
			FullBucket, // 装满的桶
			LargeGunpowderKeg, // 大火药桶
			MediumGunpowderKeg, // 中火药桶
			SmallGunpowderKeg, // 小火药桶
			Fireworks, // 烟花
			Torch, // 火把
			Compass, // 罗盘
			Hygrometer, // 湿度计
			Thermometer, // 温度计
			Magnet, // 磁铁
			MotionDetector, // 动作探测器
			Photodiode, // 光敏二极管
			Lightbulbs, // 灯泡
			Leds, // 发光二极管
			Whistle, // 哨子

			Cairn, // 石堆
			Campfire, // 篝火
			GrassTrap, // 草丛陷阱
			SpikedPlanks, // 带刺木板

			Boat, // 小船
			BoatItem, // 船物品
			IntroShip, // 开场大船

			Chunk, // 区块
			ChunkSmooth, // 平滑区块
		},
		atlas: blockTextureAtlas, // 方块纹理图集
	},
	player: {
		models: {
			HumanMale, // 男性角色
			HumanFemale, // 女性角色
			OuterClothingMale, // 男性外套
			OuterClothingFemale, // 女性外套
			FirstPersonHand, // 第一人称手
			VrHand, // VR 手
		},
		textures: {
			HumanMaleTexture1, // 男性角色贴图1
		},
	},
	animals: {
		land: {
			Cow, // 牛
			Donkey, // 驴
			Horse, // 马
			Camel, // 骆驼
			Camel_Saddled, // 加鞍骆驼
			Bison, // 野牛
			Zebra, // 斑马
			Bear, // 熊
			PolarBear, // 北极熊
			Lion, // 狮子
			Tiger, // 老虎
			Leopard, // 豹
			Jaguar, // 美洲豹
			Wolf, // 狼
			Hyena, // 鬣狗
			Wildboar, // 野猪
			Giraffe, // 长颈鹿
			Rhino, // 犀牛
			Moose, // 驼鹿
			Reindeer, // 驯鹿
		},
		birds: {
			Sparrow, // 麻雀
			Raven, // 乌鸦
			Seagull, // 海鸥
			Pigeon, // 鸽子
			Bird, // 小鸟
			Cassowary, // 食火鸡
			Ostrich, // 鸵鸟
			Duck, // 鸭子
		},
		sea: {
			Fish, // 鱼
			Bass, // 鲈鱼
			Barracuda, // 梭子鱼
			Piranha, // 食人鱼
			Orca, // 虎鲸
			Beluga, // 白鲸
			Ray, // 鳐鱼
			Shark_Bull, // 牛鲨
			Shark_GreatWhite, // 大白鲨
			Shark_Tiger, // 虎鲨
			Starfish, // 海星
			SeaUrchin, // 海胆
		},

		special: {
			Werewolf, // 狼人
		},
	},
};

export default Assets;
