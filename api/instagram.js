export default async function handler(req, res) {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const userId = process.env.INSTAGRAM_USER_ID;
  
    if (!accessToken || !userId) {
      return res.status(500).json({
        error: "Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_USER_ID"
      });
    }
  
    const fields = [
      "id",
      "caption",
      "media_type",
      "media_product_type",
      "media_url",
      "thumbnail_url",
      "permalink",
      "timestamp"
    ].join(",");
  
    const url =
      `https://graph.facebook.com/v23.0/${userId}/media` +
      `?fields=${encodeURIComponent(fields)}` +
      `&limit=24&access_token=${encodeURIComponent(accessToken)}`;
  
    try {
      const response = await fetch(url);
      const json = await response.json();
  
      if (!response.ok) {
        return res.status(response.status).json(json);
      }
  
      const reels = (json.data || []).filter((item) =>
        item.media_product_type === "REELS" ||
        item.media_type === "VIDEO"
      );
  
      res.setHeader(
        "Cache-Control",
        "s-maxage=300, stale-while-revalidate=900"
      );
  
      return res.status(200).json({
        data: reels
      });
  
    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }