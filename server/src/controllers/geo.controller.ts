import { Response } from "express";
import { AuthRequest } from "../types";
import md5 from "md5";

const AMAP_KEY = "ada79bfcdbc793de96a57533937ab067";
const AMAP_SECRET = "81fecb9d3d057e8df23374a76e5e01a7";

function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return md5(sorted + AMAP_SECRET);
}

// IP定位（粗精度，约30km）
export async function ipLocation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sig = sign({ key: AMAP_KEY });
    const resp = await fetch(`https://restapi.amap.com/v3/ip?key=${AMAP_KEY}&sig=${sig}`);
    const data = await resp.json();
    if (data.status === "1" && data.rectangle) {
      const [sw, ne] = data.rectangle.split(";");
      const [lng1, lat1] = sw.split(",").map(Number);
      const [lng2, lat2] = ne.split(",").map(Number);
      res.json({ success: true, data: { lat: (lat1 + lat2) / 2, lng: (lng1 + lng2) / 2, province: data.province, city: data.city, accuracy: "city" } });
    } else {
      res.json({ success: false, error: "定位失败" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
