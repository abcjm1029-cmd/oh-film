export default async function handler(req, res) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  // 환경변수 확인
  if (!accessToken || !userId) {
    return res.status(500).json({
      success: false,
      error: "Instagram environment variables are missing."
    });
  }

  // Instagram API에서 받아올 항목
  const fields = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "thumbnail_url",
    "permalink",
    "timestamp"
  ].join(",");

  const apiUrl =
    `https://graph.instagram.com/${userId}/media` +
    `?fields=${encodeURIComponent(fields)}` +
    `&limit=24` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  try {
    const response = await fetch(apiUrl);

    const data = await response.json();

    // Instagram API 오류
    if (!response.ok) {
      console.error("Instagram API Error:", data);

      return res.status(response.status).json({
        success: false,
        error: "Instagram API request failed.",
        details: data
      });
    }

    /*
      Instagram에서 가져온 콘텐츠 중
      VIDEO만 남김.

      일반 영상 게시물 + 릴스가 VIDEO로 들어올 수 있음.
      현재 사이트 포트폴리오 목적에는 이 방식이 가장 단순함.
    */
    const videos = (data.data || [])
      .filter((item) => item.media_type === "VIDEO")
      .map((item) => ({
        id: item.id,

        caption:
          item.caption ||
          "OH FILM",

        media_type:
          item.media_type,

        // 릴스/영상의 실제 영상 주소
        media_url:
          item.media_url || null,

        // 릴스 썸네일
        thumbnail_url:
          item.thumbnail_url ||
          item.media_url ||
          null,

        // 클릭 시 Instagram 원본 게시물
        permalink:
          item.permalink ||
          "https://www.instagram.com/1.0_life/",

        timestamp:
          item.timestamp || null
      }));

    /*
      최신 게시물이 먼저 오지만
      혹시 몰라 날짜 기준으로 한 번 더 정렬
    */
    videos.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    /*
      Vercel CDN 캐시

      300초 = 5분
      따라서 새 릴스를 올리면
      최대 약 5분 정도 후 사이트에 반영
    */
    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=900"
    );

    return res.status(200).json({
      success: true,
      account: "@1.0_life",
      count: videos.length,
      data: videos
    });

  } catch (error) {

    console.error("Instagram function error:", error);

    return res.status(500).json({
      success: false,
      error: "Instagram API server error.",
      message: error.message
    });
  }
}
