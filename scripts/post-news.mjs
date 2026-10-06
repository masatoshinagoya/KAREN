#!/usr/bin/env node
/**
 * 新着情報の同時投稿スクリプト
 *
 * Bluesky には AT Protocol API で自動投稿します（ハッシュタグ付き）。
 * リラクシィ（rx-sns.jp）と 02（m-sns.net）は外部投稿用の公開APIが
 * 見当たらないため、コピペ用の投稿文を生成するだけに留めています
 * （リラクシィはハッシュタグ付き、02はハッシュタグなし）。
 *
 * 使い方:
 *   node scripts/post-news.mjs --title "タイトル" --text "本文" [--image images/news/xxx.jpg] [--dry-run]
 *
 * 認証情報は .env（gitには含めない）に以下の形式で用意してください:
 *   BLUESKY_HANDLE=mensesthe-hyakka.bsky.social
 *   BLUESKY_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
 *
 * --dry-run を付けると Bluesky には投稿せず、3サービス分の投稿文のプレビューだけ表示します。
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

const HASHTAGS = [
  "#メンズエステ福岡",
  "#メンエス福岡",
  "#メンズアロマ博多",
  "#メンズアロマ福岡",
  "#メンエス",
  "#メンズエステ",
  "#マッサージ博多",
  "#博多",
  "#福岡",
  "#メンエス博多",
  "#メンズエステ博多",
  "#マッサージ福岡",
];

const BLUESKY_MAX_GRAPHEMES = 300;
const BLUESKY_SERVICE = "https://bsky.social";

function parseArgs(argv) {
  const args = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--title") args.title = argv[++i];
    else if (a === "--text") args.text = argv[++i];
    else if (a === "--image") args.image = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  if (!args.title || !args.text) {
    throw new Error("--title と --text は必須です");
  }
  return args;
}

async function loadEnv() {
  try {
    const content = await readFile(new URL("../.env", import.meta.url), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env が無ければ環境変数のみを使う
  }
}

function countGraphemes(text) {
  const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
  return [...segmenter.segment(text)].length;
}

function truncateToGraphemes(text, max) {
  const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
  const segments = [...segmenter.segment(text)].map((s) => s.segment);
  if (segments.length <= max) return text;
  return segments.slice(0, Math.max(0, max - 1)).join("") + "…";
}

function buildPostText({ title, body, hashtags, maxGraphemes }) {
  const hashtagLine = hashtags.length ? hashtags.join(" ") : "";
  const assemble = (b) => {
    const parts = [title, b];
    if (hashtagLine) parts.push(hashtagLine);
    return parts.join("\n\n");
  };

  if (!maxGraphemes) return assemble(body);

  const full = assemble(body);
  if (countGraphemes(full) <= maxGraphemes) return full;

  const overhead = countGraphemes(assemble(""));
  const bodyBudget = Math.max(0, maxGraphemes - overhead);
  return assemble(truncateToGraphemes(body, bodyBudget));
}

function buildFacets(text, hashtags) {
  const encoder = new TextEncoder();
  const facets = [];
  for (const tag of hashtags) {
    let searchFrom = 0;
    while (true) {
      const idx = text.indexOf(tag, searchFrom);
      if (idx === -1) break;
      const before = text.slice(0, idx);
      const byteStart = encoder.encode(before).length;
      const byteEnd = byteStart + encoder.encode(tag).length;
      facets.push({
        index: { byteStart, byteEnd },
        features: [
          {
            $type: "app.bsky.richtext.facet#tag",
            tag: tag.replace(/^#/, ""),
          },
        ],
      });
      searchFrom = idx + tag.length;
    }
  }
  return facets;
}

async function postToBluesky({ title, body, imagePath }) {
  const handle = process.env.BLUESKY_HANDLE;
  const appPassword = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !appPassword) {
    throw new Error(
      ".env に BLUESKY_HANDLE と BLUESKY_APP_PASSWORD を設定してください"
    );
  }

  const text = buildPostText({
    title,
    body,
    hashtags: HASHTAGS,
    maxGraphemes: BLUESKY_MAX_GRAPHEMES,
  });
  const facets = buildFacets(text, HASHTAGS);

  const sessionRes = await fetch(
    `${BLUESKY_SERVICE}/xrpc/com.atproto.server.createSession`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: handle, password: appPassword }),
    }
  );
  if (!sessionRes.ok) {
    throw new Error(`Bluesky ログイン失敗: ${sessionRes.status} ${await sessionRes.text()}`);
  }
  const session = await sessionRes.json();

  let embed;
  if (imagePath) {
    const absPath = path.resolve(REPO_ROOT, imagePath);
    const bytes = await readFile(absPath);
    const ext = path.extname(absPath).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

    const blobRes = await fetch(`${BLUESKY_SERVICE}/xrpc/com.atproto.repo.uploadBlob`, {
      method: "POST",
      headers: {
        "Content-Type": mime,
        Authorization: `Bearer ${session.accessJwt}`,
      },
      body: bytes,
    });
    if (!blobRes.ok) {
      throw new Error(`画像アップロード失敗: ${blobRes.status} ${await blobRes.text()}`);
    }
    const blobJson = await blobRes.json();
    embed = {
      $type: "app.bsky.embed.images",
      images: [{ image: blobJson.blob, alt: title }],
    };
  }

  const record = {
    $type: "app.bsky.feed.post",
    text,
    facets,
    langs: ["ja"],
    createdAt: new Date().toISOString(),
    ...(embed ? { embed } : {}),
  };

  const createRes = await fetch(`${BLUESKY_SERVICE}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessJwt}`,
    },
    body: JSON.stringify({
      repo: session.did,
      collection: "app.bsky.feed.post",
      record,
    }),
  });
  if (!createRes.ok) {
    throw new Error(`Bluesky 投稿失敗: ${createRes.status} ${await createRes.text()}`);
  }
  return { text, result: await createRes.json() };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnv();

  const blueskyText = buildPostText({
    title: args.title,
    body: args.text,
    hashtags: HASHTAGS,
    maxGraphemes: BLUESKY_MAX_GRAPHEMES,
  });
  const relaxiText = buildPostText({
    title: args.title,
    body: args.text,
    hashtags: HASHTAGS,
    maxGraphemes: null,
  });
  const text02 = buildPostText({
    title: args.title,
    body: args.text,
    hashtags: [],
    maxGraphemes: null,
  });

  console.log("========== Bluesky（自動投稿）==========");
  console.log(blueskyText);
  console.log(`\n(${countGraphemes(blueskyText)} / ${BLUESKY_MAX_GRAPHEMES} 文字)`);

  console.log("\n========== リラクシィ（手動コピペ用）==========");
  console.log(relaxiText);

  console.log("\n========== 02（手動コピペ用・ハッシュタグなし）==========");
  console.log(text02);

  if (args.dryRun) {
    console.log("\n--dry-run のため Bluesky への投稿はスキップしました。");
    return;
  }

  console.log("\nBluesky に投稿しています...");
  const { result } = await postToBluesky({
    title: args.title,
    body: args.text,
    imagePath: args.image,
  });
  console.log("Bluesky 投稿完了:", result.uri);
}

main().catch((err) => {
  console.error("エラー:", err.message);
  process.exit(1);
});
