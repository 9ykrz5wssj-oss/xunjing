import { Rarity, NORMAL_CHEST_DROP_WEIGHTS, ADVANCED_CHEST_DROP_WEIGHTS, ChestType, RARITY_ORDER } from "../config/constants";
import { Item, IItem } from "../models/Item";
import { DropConfig } from "../models/DropConfig";
import { weightedRandom } from "../utils/randomGen";

async function getDropWeights(chestType: ChestType): Promise<Record<string, number>> {
  const defaults = chestType === ChestType.ADVANCED ? ADVANCED_CHEST_DROP_WEIGHTS : NORMAL_CHEST_DROP_WEIGHTS;
  try {
    const cfg = await DropConfig.findOne({ chestType });
    if (cfg?.weights) return { ...defaults, ...cfg.weights };
  } catch {}
  return defaults;
}

async function rollRarity(chestType: ChestType): Promise<Rarity> {
  const weights = await getDropWeights(chestType);
  const rarities = RARITY_ORDER;
  const weightsArr = rarities.map((r) => weights[r] || 0);
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
  const rolledRarity = await rollRarity(chestType);
  const item = await pickItemByRarity(rolledRarity);

  if (!item) return null;

  return { item, rarity: item.rarity };
}
