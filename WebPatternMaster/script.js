/**
 * script.js — 프론트엔드 전체 로직
 *
 * 이 파일이 하는 일:
 * 1. 페이지 열자마자 로그인 여부 확인하고, 로그인 안 돼있으면
 *    비밀번호 입력창을 띄웁니다.
 * 2. 파일 첨부 시 선택한 파일 이름을 화면에 표시합니다.
 * 3. 질문(+첨부파일 내용)을 서버로 보내고 DeepSeek 답변을 받아옵니다.
 */

/* ── 로그인 처리 ─────────────────────────────────────────────
   페이지가 열리자마자 즉시 실행됩니다(IIFE).
   sessionStorage에 토큰이 남아있으면 로그인 화면을 건너뛰고,
   없으면 비밀번호를 입력받아 서버에서 토큰을 발급받습니다.
────────────────────────────────────────────────────────────── */
(function () {
  const authOverlay = document.getElementById("authOverlay");
  const mainContainer = document.getElementById("mainContainer");
  const passwordInput = document.getElementById("passwordInput");
  const authBtn = document.getElementById("authBtn");
  const authError = document.getElementById("authError");

  // 이미 로그인된 상태라면 바로 메인 화면으로
  if (sessionStorage.getItem("token")) {
    authOverlay.classList.add("hidden");
    mainContainer.classList.add("visible");
    return;
  }

  authBtn.addEventListener("click", async () => {
    const password = passwordInput.value.trim();
    if (!password) {
      authError.textContent = "비밀번호를 입력해주세요.";
      return;
    }

    // 응답 오기 전까지 버튼 연타 방지
    authBtn.disabled = true;
    authBtn.textContent = "확인 중...";
    authError.textContent = "";

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // 로그인 성공 — 서버가 발급한 토큰을 저장해두고 이후 요청에 사용합니다
        const data = await res.json();
        sessionStorage.setItem("token", data.token);
        authOverlay.classList.add("hidden");
        mainContainer.classList.add("visible");
      } else {
        const data = await res.json();
        authError.textContent = data.error || "잘못된 비밀번호입니다.";
      }
    } catch {
      authError.textContent = "서버 연결에 실패했습니다.";
    } finally {
      authBtn.disabled = false;
      authBtn.textContent = "확인";
    }
  });

  // 비밀번호 입력 후 Enter로도 로그인되게
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") authBtn.click();
  });
})();

/**
 * 첨부파일이 바뀔 때마다 파일명 표시를 갱신합니다.
 */
function updateFileName(input) {
  const fileNameSpan = document.getElementById("fileName");
  if (input.files.length > 0) {
    fileNameSpan.innerText = input.files[0].name;
  } else {
    fileNameSpan.innerText = "파일 선택하기";
  }
}

/**
 * 질문(+첨부파일 있으면 그 내용까지)을 서버로 보내고 답변을 화면에 표시합니다.
 * 인증 토큰이 만료됐으면(401) 자동으로 로그아웃시키고 로그인창을 다시 띄웁니다.
 */
async function callDeepSeek() {
  const promptInput = document.getElementById("prompt");
  const fileInput = document.getElementById("fileInput");
  const resultDiv = document.getElementById("result");
  const sendBtn = document.getElementById("sendBtn");

  let prompt = promptInput.value.trim();

  if (!prompt) {
    alert("질문을 입력해주세요.");
    promptInput.focus();
    return;
  }

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    try {
      const fileContent = await file.text();
      prompt = `[첨부 파일: ${file.name}]\n${fileContent}\n\n[질문]\n${prompt}`;
    } catch (e) {
      alert("파일을 읽는 중 오류가 발생했습니다.");
      return;
    }
  }

  sendBtn.disabled = true;
  sendBtn.innerText = "답변 생성 중...";
  resultDiv.innerText = "AI가 답변을 생각하고 있습니다...";

  try {
    const token = sessionStorage.getItem("token") || "";
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        sessionStorage.removeItem("token");
        document.getElementById("authOverlay").classList.remove("hidden");
        document.getElementById("mainContainer").classList.remove("visible");
        throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
      }
      throw new Error(data.error || `서버 오류 발생 (${response.status})`);
    }

    if (data.choices && data.choices.length > 0) {
      resultDiv.innerText = data.choices[0].message.content;
    } else {
      resultDiv.innerText = "응답을 받아오지 못했습니다.";
    }
  } catch (error) {
    resultDiv.innerText = `에러 발생: ${error.message}`;
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerText = "전송하기";
  }
}
