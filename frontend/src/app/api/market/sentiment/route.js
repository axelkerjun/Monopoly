// frontend/src/app/api/market/sentiment/route.js
import { getMarketSummary } from "@/app/utils/marketData";
import { InferenceClient } from "@huggingface/inference";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HF_MODEL = "ProsusAI/finbert";

function mapLabel(label) {
  const clean = String(label || "").toLowerCase();

  if (clean.includes("positive")) return "Bullish";
  if (clean.includes("negative")) return "Bearish";

  return "Neutral";
}

function getScore(label, confidence) {
  const mapped = mapLabel(label);

  if (mapped === "Bullish") return confidence;
  if (mapped === "Bearish") return -confidence;

  return 0;
}

async function analyzeText(text) {
  if (!process.env.HF_TOKEN) {
    throw new Error("Missing HF_TOKEN in .env.local");
  }

  const client = new InferenceClient(process.env.HF_TOKEN);

  const result = await client.textClassification({
    model: HF_MODEL,
    inputs: text,
    provider: "hf-inference",
  });

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error("No result returned from Hugging Face");
  }

  const best = result.reduce((top, item) => {
    return item.score > top.score ? item : top;
  }, result[0]);

  return {
    originalLabel: best.label,
    label: mapLabel(best.label),
    confidence: Number(best.score.toFixed(2)),
    score: Number(getScore(best.label, best.score).toFixed(2)),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return Response.json({ error: "Missing symbol" }, { status: 400 });
    }

    const marketData = await getMarketSummary(symbol);

    if (!marketData?.news || marketData.news.length === 0) {
      return Response.json(
        { error: "No recent news found for this stock." },
        { status: 404 }
      );
    }

    const articlesToAnalyze = marketData.news.slice(0, 5);

    const articles = await Promise.all(
      articlesToAnalyze.map(async (article) => {
        const text = article.title || "";

        const sentiment = await analyzeText(text);

        return {
          title: article.title,
          url: article.url,
          site: article.site,
          publishedDate: article.publishedDate,
          sentiment,
        };
      })
    );

    const totalScore = articles.reduce((sum, article) => {
      return sum + article.sentiment.score;
    }, 0);

    const averageScore =
      articles.length > 0
        ? Number((totalScore / articles.length).toFixed(2))
        : 0;

    let overallLabel = "Neutral";

    if (averageScore > 0.2) overallLabel = "Bullish";
    if (averageScore < -0.2) overallLabel = "Bearish";

    const counts = {
      bullish: articles.filter((a) => a.sentiment.label === "Bullish").length,
      neutral: articles.filter((a) => a.sentiment.label === "Neutral").length,
      bearish: articles.filter((a) => a.sentiment.label === "Bearish").length,
    };

    return Response.json({
      symbol,
      overall: {
        label: overallLabel,
        score: averageScore,
        articlesAnalyzed: articles.length,
        counts,
      },
      articles,
    });
  } catch (error) {
    console.error("Sentiment analysis error:", error);

    return Response.json(
      {
        error: "Failed to run sentiment analysis.",
        detail: error.message,
        cause: error.cause?.message || null,
      },
      { status: 500 }
    );
  }
}