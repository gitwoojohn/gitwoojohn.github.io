/**
 * _shared.js
 *
 * auth.js와 chat.js에서 공통으로 사용하는 보안 관련 유틸 모음입니다.
 * (rate limit 체크, 인증 토큰 발급/검증, 안전한 문자열 비교)
 *
 * ⚠️ 주의: Vercel 서버리스 환경에서는 요청마다 다른 함수 인스턴스가
 * 뜰 수 있어서, 아래 rateLimitMap이 모든 요청에서 공유된다는 보장이
 * 없습니다. 지금은 개인용 소규모 프로젝트라 이 정도로도 충분하지만,
 * 사용자가 늘어나면 Upstash Redis 같은 외부 저장소로 옮기는 게 좋습니다.
 */

import crypto from "node:crypto";

/* ── Rate Limit ──────────────────────────────────────────────
   같은 IP가 짧은 시간에 너무 많이 요청하면 막아주는 역할입니다.
   지금은 메모리(Map)에 저장하다 보니 서버가 재시작되거나 인스턴스가
   여러 개 뜨면 카운트가 초기화/분산될 수 있다는 한계가 있습니다.
────────────────────────────────────────────────────────────── */
const RATE_LIMIT_WINDOW = 60 * 1000;       // 1분 단위로 카운트를 리셋
const MAX_REQUESTS_PER_WINDOW = 5;         // 1분당 IP 하나에 허용하는 최대 요청 수
const rateLimitMap = new Map();            // key: IP, value: { windowStart, count }

/**
 * 해당 IP의 현재 rate limit 상태를 가져옵니다.
 * 마지막 윈도우가 시작된 지 1분이 지났으면 카운트를 0으로 새로 시작합니다.
 */
function getRateLimitInfo(ip) {
  const now = Date.now();
  let info = rateLimitMap.get(ip);
  if (!info || now - info.windowStart > RATE_LIMIT_WINDOW) {
    info = { windowStart: now, count: 0 };
    rateLimitMap.set(ip, info);
  }
  return info;
}

/**
 * 요청 IP를 뽑아서 rate limit을 초과했는지 검사합니다.
 * 초과했다면 여기서 바로 429 응답까지 보내버리고 false를 반환하므로,
 * 호출하는 쪽(auth.js, chat.js)에서는 false가 오면 그냥 return하면 됩니다.
 */
function checkRateLimit(req, res) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
    || req.socket.remoteAddress
    || "unknown";
  const info = getRateLimitInfo(ip);
  info.count++;
  if (info.count > MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return false;
  }
  return true;
}

/* ── 인증 토큰 발급 / 검증 ────────────────────────────────────
   비밀번호를 매 요청마다 보내는 대신, 로그인 성공 시 한 번만 확인하고
   그 이후로는 토큰만 주고받도록 하기 위한 부분입니다.
   토큰 자체는 서버 비밀번호(ACCESS_PASSWORD)를 키로 HMAC 서명을 하기
   때문에, 비밀번호를 모르면 위조할 수 없습니다.

   토큰 형식: base64url(JSON 페이로드) + "." + 서명(hex)
────────────────────────────────────────────────────────────── */

/**
 * 로그인 성공 시 호출되어, 24시간 동안 유효한 토큰을 만들어 반환합니다.
 * 페이로드에는 만료 시각(exp)만 담고, secret으로 서명해서 위변조를 막습니다.
 */
function createToken(secret) {
  const payload = JSON.stringify({ exp: Date.now() + 24 * 60 * 60 * 1000 });
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

/**
 * 클라이언트가 보낸 토큰이 유효한지 확인합니다.
 * 1) 서명이 secret으로 만든 것과 일치하는지
 * 2) 아직 만료되지 않았는지
 * 둘 다 통과해야 true를 반환합니다. 토큰 형식이 이상하거나 파싱에
 * 실패하는 등 예외가 나면 전부 "검증 실패(false)"로 처리합니다.
 */
function verifyToken(token, secret) {
  try {
    const [payloadB64, sig] = token.split(".");
    const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    // 문자열 비교(===) 대신 timingSafeEqual을 쓰는 이유:
    // ===는 앞자리부터 비교하다가 다르면 바로 멈추기 때문에,
    // 응답 속도 차이로 정답 서명을 한 글자씩 추측당할 수 있습니다.
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return false;
    }

    const data = JSON.parse(payload);
    if (Date.now() > data.exp) return false;  // 유효기간 지남
    return true;
  } catch {
    return false;
  }
}

/* ── 타이밍 공격에 안전한 문자열 비교 ──────────────────────────
   비밀번호를 비교할 때 쓰는 함수입니다. 위 timingSafeEqual과 이유는
   같습니다: 응답 시간 차이로 비밀번호를 유추당하지 않기 위함입니다.
   다만 crypto.timingSafeEqual은 두 버퍼의 길이가 다르면 예외를
   던지기 때문에, try/catch로 감싸서 길이가 다른 경우도 그냥
   "비밀번호 불일치"로 자연스럽게 처리되도록 했습니다.
────────────────────────────────────────────────────────────── */
function timingSafeCompare(a, b) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export { checkRateLimit, createToken, verifyToken, timingSafeCompare };
