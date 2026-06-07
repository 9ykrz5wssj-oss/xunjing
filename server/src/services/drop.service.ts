import { Rarity, NORMAL_CHEST_DROP_WEIGHTS, ADVANCED_CHEST_DROP_WEIGHTS, ChestType, RARITY_ORDER } from "../config/constants";
import { Item, IItem } from "../models/Item";
import { weightedRandom } from "../utils/randomGen";

/**
 * 根据宝箱类型，按权重随机选择一个稀有度
 */
function rollRarity(chestType: ChestType): Rarity {
  const weights =
    chestType === ChestType.ADVANCED
      ? ADVANCED_CHEST_DROP_WEIGHTS
      : NORMAL_CHEST_DROP_WEIGHTS;

  const rarities = RARITY_ORDER;
  const weightsArr = rarities.map((r) => weights[r]);

  return weightedRandom(rarities, weightsArr);
}

/**
 * 从指定稀有度的活跃藏品中，按个体权重随机选一个
 */
async function pickItemByRarity(rarity: Rarity): Promise<IItem | null> {
  const items = await Item.find({ rarity, isActive: true });

  if (items.length === 0) {
    // 回退：从所有活跃藏品中选
    const allItems = await Item.find({ isActive: true });
    if (allItems.length === 0) return null;
    return allItems[Math.floor(Math.random() * allItems.length)];
  }

  const weights = items.map((i) => i.dropWeight);
  return weightedRandom(items, weights);
}

/**
 * 开箱掉落：随机稀有度 → 随机藏品
 */
export async function rollDrop(chestType: ChestType): Promise<{
  item: IItem;
  rarity: Rarity;
} | null> {
  const rarity = rollRarity(chestType);
  const item = await pickItemByRarity(rarity);

  if (!item) return null;

  return { item, rarity };
}
