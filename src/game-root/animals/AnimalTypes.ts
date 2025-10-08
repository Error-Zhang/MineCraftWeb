/**
 * 动物类型定义 - 基于Assets中的实际模型
 */

/**
 * 陆地动物类型
 */
export enum LandAnimalType {
    // 温和食草动物
    Cow = "Cow",
    Donkey = "Donkey",
    Horse = "Horse",
    Camel = "Camel",
    Bison = "Bison",
    Zebra = "Zebra",
    Giraffe = "Giraffe",
    Rhino = "Rhino",
    Moose = "Moose",
    Reindeer = "Reindeer",
    
    // 肉食动物
    Bear = "Bear",
    PolarBear = "PolarBear",
    Lion = "Lion",
    Tiger = "Tiger",
    Leopard = "Leopard",
    Jaguar = "Jaguar",
    Wolf = "Wolf",
    Hyena = "Hyena",
    Wildboar = "Wildboar",
}

/**
 * 鸟类类型
 */
export enum BirdAnimalType {
    Sparrow = "Sparrow",
    Raven = "Raven",
    Seagull = "Seagull",
    Pigeon = "Pigeon",
    Bird = "Bird",
    Cassowary = "Cassowary",
    Ostrich = "Ostrich",
    Duck = "Duck",
}

/**
 * 海洋动物类型
 */
export enum SeaAnimalType {
    Fish = "Fish",
    Bass = "Bass",
    Barracuda = "Barracuda",
    Piranha = "Piranha",
    Orca = "Orca",
    Beluga = "Beluga",
    Ray = "Ray",
    Shark_Bull = "Shark_Bull",
    Shark_GreatWhite = "Shark_GreatWhite",
    Shark_Tiger = "Shark_Tiger",
}

/**
 * 所有动物类型联合
 */
export type AnimalType = LandAnimalType | BirdAnimalType | SeaAnimalType;

/**
 * 所有动物类型数组
 */
export const ALL_ANIMAL_TYPES = [
    ...Object.values(LandAnimalType),
    ...Object.values(BirdAnimalType),
    ...Object.values(SeaAnimalType),
];

/**
 * 动物分类
 */
export const ANIMAL_CATEGORIES = {
    land: Object.values(LandAnimalType),
    birds: Object.values(BirdAnimalType),
    sea: Object.values(SeaAnimalType),
};

/**
 * 动物生态类型分类
 */
export const ANIMAL_ECOLOGY = {
    // 食草动物
    herbivores: [
        LandAnimalType.Cow,
        LandAnimalType.Donkey,
        LandAnimalType.Horse,
        LandAnimalType.Camel,
        LandAnimalType.Bison,
        LandAnimalType.Zebra,
        LandAnimalType.Giraffe,
        LandAnimalType.Rhino,
        LandAnimalType.Moose,
        LandAnimalType.Reindeer,
    ],
    
    // 肉食动物
    carnivores: [
        LandAnimalType.Bear,
        LandAnimalType.PolarBear,
        LandAnimalType.Lion,
        LandAnimalType.Tiger,
        LandAnimalType.Leopard,
        LandAnimalType.Jaguar,
        LandAnimalType.Wolf,
        LandAnimalType.Hyena,
        SeaAnimalType.Shark_Bull,
        SeaAnimalType.Shark_GreatWhite,
        SeaAnimalType.Shark_Tiger,
        SeaAnimalType.Orca,
        SeaAnimalType.Piranha,
        SeaAnimalType.Barracuda,
    ],
    
    // 杂食动物
    omnivores: [
        LandAnimalType.Wildboar,
        BirdAnimalType.Raven,
        BirdAnimalType.Seagull,
    ],
    
    // 鸟类
    birds: Object.values(BirdAnimalType),
    
    // 水生动物
    aquatic: Object.values(SeaAnimalType),
};

/**
 * 气候偏好
 */
export const CLIMATE_PREFERENCES = {
    // 极寒
    arctic: [LandAnimalType.PolarBear, LandAnimalType.Reindeer],
    
    // 寒冷
    cold: [LandAnimalType.Wolf, LandAnimalType.Bear, LandAnimalType.Moose, LandAnimalType.Reindeer, LandAnimalType.Bison],
    
    // 温带
    temperate: [
        LandAnimalType.Cow,
        LandAnimalType.Horse,
        LandAnimalType.Donkey,
        LandAnimalType.Bear,
        LandAnimalType.Wolf,
        LandAnimalType.Wildboar,
    ],
    
    // 炎热
    hot: [
        LandAnimalType.Camel,
        LandAnimalType.Lion,
        LandAnimalType.Tiger,
        LandAnimalType.Leopard,
        LandAnimalType.Jaguar,
        LandAnimalType.Hyena,
        LandAnimalType.Giraffe,
        LandAnimalType.Zebra,
        LandAnimalType.Rhino,
    ],
    
    // 沙漠
    desert: [LandAnimalType.Camel, LandAnimalType.Hyena],
    
    // 热带雨林
    jungle: [LandAnimalType.Tiger, LandAnimalType.Jaguar, LandAnimalType.Leopard],
    
    // 草原
    savanna: [LandAnimalType.Lion, LandAnimalType.Giraffe, LandAnimalType.Zebra, LandAnimalType.Rhino, LandAnimalType.Hyena],
    
    // 湿地
    wetland: [LandAnimalType.Moose, BirdAnimalType.Duck, LandAnimalType.Wildboar],
};

/**
 * 检查是否为有效的动物类型
 */
export function isValidAnimalType(type: string): type is AnimalType {
    return ALL_ANIMAL_TYPES.includes(type as AnimalType);
}

/**
 * 获取动物的分类
 */
export function getAnimalCategory(type: AnimalType): 'land' | 'birds' | 'sea' | null {
    if (ANIMAL_CATEGORIES.land.includes(type as LandAnimalType)) return 'land';
    if (ANIMAL_CATEGORIES.birds.includes(type as BirdAnimalType)) return 'birds';
    if (ANIMAL_CATEGORIES.sea.includes(type as SeaAnimalType)) return 'sea';
    return null;
}

/**
 * 获取动物的生态类型
 */
export function getAnimalEcology(type: AnimalType): 'herbivore' | 'carnivore' | 'omnivore' | 'bird' | 'aquatic' | null {
    if (ANIMAL_ECOLOGY.herbivores.includes(type as LandAnimalType)) return 'herbivore';
    if (ANIMAL_ECOLOGY.carnivores.includes(type as any)) return 'carnivore';
    if (ANIMAL_ECOLOGY.omnivores.includes(type as any)) return 'omnivore';
    if (ANIMAL_ECOLOGY.birds.includes(type as BirdAnimalType)) return 'bird';
    if (ANIMAL_ECOLOGY.aquatic.includes(type as SeaAnimalType)) return 'aquatic';
    return null;
}
