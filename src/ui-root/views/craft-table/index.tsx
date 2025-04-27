import React, {useEffect, useRef, useState} from "react";
import Slot, {createEmptySlots, SlotType} from "../../components/slot";
import "./index.less";
import InventoryGrid from "@/ui-root/components/inventory-grid";
import gameEventBus from "@/game-root/events/GameEventBus.ts";
import {GameEvents} from "@/game-root/events/GameEvents.ts";
import {GameProps} from "@/ui-root/GameUI.tsx";
import blockFactory from "@/blocks/core/BlockFactory.ts";
import {BlockRecipe} from "@/blocks/core/BlockTypes.ts";
import {Blocks} from "@/blocks/core/Blocks.ts";
import {matchesPattern} from "@/ui-root/views/craft-table/match.ts";
import {useInventorySlots} from "@/ui-root/hooks/useInventorySlots.tsx";
import slot from "../../components/slot";

const CraftTable: React.FC<GameProps> = ({game, blockIconMap}) => {
    const [isShow, setIsShow] = useState(false);
    const blockRecipeMap = useRef<Record<Blocks, BlockRecipe[]>>()
    const [gridSlots, setGridSlots] = useState<SlotType[]>(createEmptySlots(9));
    const [resultSlot, setResultSlot] = useState<SlotType[]>(createEmptySlots(1));
    useEffect(() => {
        const interactWithCraftTable = () => {
            setIsShow(true);
            game.togglePointerLock();
        }
        const hiddenPanel = () => setIsShow(false);

        gameEventBus.on(GameEvents.interactWithCraftTable, interactWithCraftTable);
        gameEventBus.on(GameEvents.hiddenPanel, hiddenPanel);

        return () => {
            gameEventBus.off(GameEvents.interactWithCraftTable, interactWithCraftTable);
            gameEventBus.off(GameEvents.hiddenPanel, hiddenPanel);
        }
    }, [setIsShow]);

    // 加载所有配方
    useEffect(() => {
        blockRecipeMap.current = blockFactory.getAllBlockRecipes()
    }, []);

    function reshapeTo3x3<T>(array: T[]): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < 9; i += 3) {
            result.push(array.slice(i, i + 3));
        }
        return result;
    }

    const updateResultSlot = () => {
        const result = Object.entries(blockRecipeMap.current!).flatMap(([block, recipes]) => {
            return recipes.map(recipe => ({
                block: block as Blocks,
                recipe
            }));
        }).find(({recipe}) =>
            matchesPattern(
                reshapeTo3x3(gridSlots.map(item => item ? item.key : Blocks.Air)),
                recipe
            )
        );

        if (result) {
            const output = result.recipe.output;
            setResultSlot([{
                key: output.item,
                value: output.count,
                icon: blockIconMap[output.item],
                source: "CraftTableResult"
            }])
            console.log(resultSlot)
        } else {
            setResultSlot([null]);
        }
    }

    const updateTable = () => {
        if(dropFinish.current) {
            dropFinish.current = false;
            return;
        }
        gridSlots.forEach((slot: SlotType) => {
            slot && slot.value--;
        })
        setGridSlots([...gridSlots]);
    }

    // 监听工作台变化自动更新结果，无需手动触发
    useEffect(() => {
        updateResultSlot();
    }, [gridSlots]);

    const dropFinish = useRef(false);

    const onDropTable = (droppedSlot: SlotType, current: number) => {
        if(droppedSlot!.source === "CraftTableResult") {
            if(gridSlots[current] && gridSlots[current].value-1>0) return true;
            gridSlots.forEach((slot: SlotType) => {
                slot && slot.value--;
            })
            gridSlots[current] = droppedSlot;
            // 后面会自动更新，所以不用set
            dropFinish.current = true;
            return true;
        }
        return false;
    }

    const {setDroppedIndex, onDrop:onDropResult} = useInventorySlots("CraftTableResult", resultSlot, setResultSlot, { onDropOver:updateTable})

    return isShow && (
        <div className="crafting-panel absolute-center">
            <InventoryGrid source="CraftTable" slots={gridSlots} setSlots={setGridSlots} onDrop={onDropTable}
                           columns={3} rows={3}/>
            <div className="crafting-arrow">→</div>
            <Slot slot={resultSlot[0]} draggable onDragStart={() => setDroppedIndex(0)}
                  onDrop={(droppedSlot) => onDropResult(droppedSlot, 0)}/>
        </div>
    );
};

export default CraftTable;
