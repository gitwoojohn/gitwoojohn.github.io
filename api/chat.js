/**
 * POST /api/chat
 *
 * 사용자의 프롬프트를 받아서 DeepSeek API로 그대로 전달하고,
 * 받은 응답을 클라이언트에 반환하는 프록시 역할입니다.
 * DeepSeek API 키가 클라이언트에 노출되지 않도록 서버를 한 번 거치게 만든 구조입니다.
 */

import { checkRateLimit, verifyToken } from "./_shared.js";

const MAX_PROMPT_LENGTH = 8000;  // 너무 긴 프롬프트로 API 비용이 새는 것 방지

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const accessPassword = process.env.ACCESS_PASSWORD;
  if (!accessPassword) {
    return res.status(500).json({ error: "Server not configured." });
  }

  // 로그인 시 발급받은 토큰을 검증합니다 (서명 + 만료시간 체크)
  const token = req.headers["x-auth-token"] || "";
  if (!token || !verifyToken(token, accessPassword)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  // 인증된 사용자라도 과도한 요청은 제한합니다
  if (!checkRateLimit(req, res)) return;

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required and must be a string." });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: "Prompt is too long." });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key is not configured on the server." });
  }

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
}
