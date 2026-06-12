import { Response } from "express";
import { AuthRequest } from "../types";
import { Item } from "../models/Item";
import { UserCollection } from "../models/UserCollection";
import { Rarity, RARITY_ORDER } from "../config/constants";
import mongoose from "mongoose";

/**
 * 从 imageUrl 推导缩略图 URL
 * /uploads/items/abc.jpg → /uploads/items/thumb_abc.jpg
 */
function getThumbnailUrl(imageUrl: string): string {
  const parts = imageUrl.split("/");
  const filename = parts[parts.length - 1];
  parts[parts.length - 1] = `thumb_${filename}`;
  return parts.join("/");
}

/**
 * GET /api/v1/items
 * [管理员] 获取全部藏品列表
 */
export async function listItems(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page = "1", limit = "20", rarity } = req.query;
    const filter: any = {};
    if (rarity) filter.rarity = rarity;

    const items = await Item.find(filter)
      .sort({ rarity: 1, createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const total = await Item.countDocuments(filter);

    res.json({ success: true, data: { items, total, page: +page, limit: +limit } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/v1/items
 * [管理员] 创建新藏品
 */
export async function createItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description, rarity, imageUrl, dropWeight } = req.body;
    const item = await Item.create({ name, description, rarity, imageUrl, dropWeight });
    res.status(201).json({ success: true, data: item, message: "藏品创建成功" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/v1/items/:id
 * 获取单个藏品详情
 */
export async function getItemDetail(req: AuthRequest, res: Response): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, error: "藏品不存在" });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PUT /api/v1/items/:id
 * [管理员] 更新藏品
 */
export async function updateItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) {
      res.status(404).json({ success: false, error: "藏品不存在" });
      return;
    }
    res.json({ success: true, data: item, message: "藏品更新成功" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * DELETE /api/v1/items/:id
 * [管理员] 停用藏品（绝版）。已拥有的用户不受影响，但宝箱不再掉落。
 */
export async function deleteItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, error: "藏品不存在" });
      return;
    }
    if (!item.isActive) {
      res.status(400).json({ success: false, error: "藏品已经是停用状态" });
      return;
    }
    item.isActive = false;
    await item.save();
    res.json({ success: true, message: "藏品已停用（绝版），不再从宝箱掉落" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/v1/user/collections
 * 获取当前用户的藏品列表（按稀有度分组）
 */
export async function getUserCollections(req: AuthRequest, res: Response): Promise<void> {
  try {
    const collections = await UserCollection.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user!.userId), count: { $gt: 0 } } },
      {
        $lookup: {
          from: "items",
          localField: "itemId",
          foreignField: "_id",
          as: "item",
        },
      },
      { $unwind: "$item" },
      {
        $project: {
          _id: 0,
          collectionId: "$_id",
          itemId: "$item._id",
          name: "$item.name",
          imageUrl: "$item.imageUrl",
          rarity: "$item.rarity",
          description: "$item.description",
          count: "$count",
          acquiredAt: 1,
          lastAcquiredAt: 1,
        },
      },
      { $sort: { rarity: 1, acquiredAt: -1 } },
    ]);

    // 按稀有度分组并合并相同藏品，同时推导缩略图URL
    const merged: Record<string, any> = {};
    for (const c of collections) {
      const key = c.itemId.toString();
      if (merged[key]) {
        merged[key].count += c.count;
        if (c.lastAcquiredAt > merged[key].lastAcquiredAt) merged[key].lastAcquiredAt = c.lastAcquiredAt;
      } else {
        merged[key] = {
          ...c,
          thumbnailUrl: getThumbnailUrl(c.imageUrl),
        };
      }
    }
    const mergedList = Object.values(merged);
    const grouped: Record<string, any[]> = {};
    for (const c of mergedList) {
      if (!grouped[c.rarity]) grouped[c.rarity] = [];
      grouped[c.rarity].push(c);
    }

    res.json({ success: true, data: { collections: mergedList, grouped } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/v1/user/:userId/collections
 * 查看其他用户的藏品（只读）
 */
export async function getOtherUserCollections(req: AuthRequest, res: Response): Promise<void> {
  try {
    const targetUser = await import("../models/User").then(m => m.User.findOne({ userId: parseInt(req.params.userId as string) }));
    if (!targetUser) {
      res.status(404).json({ success: false, error: "用户不存在" });
      return;
    }

    const collections = await UserCollection.aggregate([
      { $match: { userId: targetUser._id, count: { $gt: 0 } } },
      {
        $lookup: {
          from: "items",
          localField: "itemId",
          foreignField: "_id",
          as: "item",
        },
      },
      { $unwind: "$item" },
      {
        $project: {
          _id: 0,
          itemId: "$item._id",
          name: "$item.name",
          imageUrl: "$item.imageUrl",
          rarity: "$item.rarity",
          count: "$count",
        },
      },
    ]);

    const merged: Record<string, any> = {};
    for (const c of collections) {
      const key = c.itemId.toString();
      if (merged[key]) { merged[key].count += c.count; } else {
        merged[key] = { ...c, thumbnailUrl: getThumbnailUrl(c.imageUrl) };
      }
    }
    const mergedList = Object.values(merged);
    const grouped: Record<string, any[]> = {};
    for (const c of mergedList) {
      if (!grouped[c.rarity]) grouped[c.rarity] = [];
      grouped[c.rarity].push(c);
    }

    res.json({ success: true, data: { collections: mergedList, grouped } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
