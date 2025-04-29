// 可交互的方块
export interface IInteractableBlock{
    readonly guid:string;
    onInteract(): void;
}