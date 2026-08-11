/**
 * POST /api/auth
 *
 * 로그인 엔드포인트입니다. 사용자가 입력한 비밀번호가 서버 환경변수
 * ACCESS_PASSWORD와 일치하면, 24시간짜리 인증 토큰을 발급해줍니다.
 * 이후 클라이언트는 이 토큰을 저장해뒀다가 /api/chat 호출할 때 같이 보냅니다.
 */

import { checkRateLimit, createToken, timingSafeCompare } from "./_shared.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 무차별 대입(브루트포스) 공격 방지 — 1분에 5번까지만 시도 가능
  if (!checkRateLimit(req, res)) return;

  // 배포 환경에 비밀번호가 설정 안 돼 있으면 애초에 로그인 자체를 막습니다
  const accessPassword = process.env.ACCESS_PASSWORD;
  if (!accessPassword) {
    return res.status(500).json({ error: "Server not configured." });
  }

  const { password } = req.body;
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Password is required." });
  }

  // 타이밍 공격에 안전하게 비밀번호를 비교합니다
  if (!timingSafeCompare(password, accessPassword)) {
    return res.status(401).json({ error: "Invalid password." });
  }

  // 비밀번호가 맞으면 토큰 발급 — 이후 요청부터는 비밀번호 대신 이 토큰만 사용
  const token = createToken(accessPassword);
  return res.status(200).json({ token });
}
