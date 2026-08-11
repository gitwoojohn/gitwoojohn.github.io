// document.addEventListener("DOMContentLoaded", () => {
//   const runBtn = document.getElementById("btn-run-carryover");
//   const startInput = document.getElementById("co-start-round");
//   const endInput = document.getElementById("co-end-round");

//   if (startInput && endInput) {
//     const handleEnter = (e) => {
//       if (e.key === "Enter") executeCarryoverAnalysis();
//     };
//     startInput.addEventListener("keypress", handleEnter);
//     endInput.addEventListener("keypress", handleEnter);
//   }

//   if (runBtn) runBtn.addEventListener("click", executeCarryoverAnalysis);
// });

// function executeCarryoverAnalysis() {
//   const startVal = document.getElementById("co-start-round").value.trim();
//   const endVal = document.getElementById("co-end-round").value.trim();
//   const targetCount = parseInt(
//     document.getElementById("co-count-select").value,
//   );
//   const includeBonus = document.getElementById("co-include-bonus").checked;
//   const listArea = document.getElementById("carryover-result-list");
//   const badge = document.getElementById("carryover-count-badge");

//   if (!lottoData || lottoData.length === 0) {
//     showToast("데이터를 로드해주세요.");
//     return;
//   }

//   const startRound = startVal ? parseInt(startVal) : 1;
//   const endRound = endVal
//     ? parseInt(endVal)
//     : Math.max(...lottoData.map((d) => d["회차"]));

//   const matches = [];
//   lottoData.forEach((current) => {
//     const curR = current["회차"];
//     if (curR < startRound || curR > endRound) return;

//     const prev = lottoData.find((d) => d["회차"] === curR - 1);
//     if (!prev) return;

//     const prevNums = [
//       prev["1번"],
//       prev["2번"],
//       prev["3번"],
//       prev["4번"],
//       prev["5번"],
//       prev["6번"],
//     ];
//     if (includeBonus) prevNums.push(prev["보너스"]);

//     const curNums = [
//       current["1번"],
//       current["2번"],
//       current["3번"],
//       current["4번"],
//       current["5번"],
//       current["6번"],
//     ];
//     const common = curNums.filter((n) => prevNums.includes(n));
//     const isMatch =
//       targetCount === 3 ? common.length >= 3 : common.length === targetCount;

//     if (isMatch) matches.push({ data: current, pb: prev["보너스"] });
//   });

//   badge.textContent = matches.length;
//   listArea.innerHTML = "";

//   if (matches.length === 0) {
//     updateSidebarReport("일치하는 패턴이 없습니다.");
//     return;
//   }

//   matches.sort((a, b) => b.data["회차"] - a.data["회차"]);
//   matches.forEach((m) => {
//     const current = m.data; // 기준 회차 (1200회)
//     const prev = lottoData.find((d) => d["회차"] === current["회차"] - 1); // 직전 (1199회)
//     const next = lottoData.find((d) => d["회차"] === current["회차"] + 1); // 다음 (1201회)

//     if (!prev) return;

//     // 1. [중간 섹션용] 1199회 -> 1200회 이월 계산
//     const prevNums = [
//       prev["1번"],
//       prev["2번"],
//       prev["3번"],
//       prev["4번"],
//       prev["5번"],
//       prev["6번"],
//       prev["보너스"],
//     ];
//     const curNums = [
//       current["1번"],
//       current["2번"],
//       current["3번"],
//       current["4번"],
//       current["5번"],
//       current["6번"],
//     ];
//     const carryFromPrev = curNums.filter((n) => prevNums.includes(n)); // 16, 32 추출됨

//     // 2. [하단 섹션용] 1200회 -> 1201회 이월 계산
//     let carryToNext = [];
//     if (next) {
//       const currentNums = [
//         current["1번"],
//         current["2번"],
//         current["3번"],
//         current["4번"],
//         current["5번"],
//         current["6번"],
//         current["보너스"],
//       ];
//       const nextNums = [
//         next["1번"],
//         next["2번"],
//         next["3번"],
//         next["4번"],
//         next["5번"],
//         next["6번"],
//       ];
//       carryToNext = nextNums.filter((n) => currentNums.includes(n)); // 실제 1201회와 비교하여 없음 추출됨
//     }

//     const rowData = {
//       r: current["회차"],
//       n1: current["1번"],
//       n2: current["2번"],
//       rest: [current["3번"], current["4번"], current["5번"], current["6번"]],
//       curBonus: current["보너스"],
//       totalSum: current["합계"],
//       pr: prev["회차"],
//       pb: prev["보너스"],
//       operator: "",
//     };

//     const row = createPatternRow(rowData);

//     // [수정] 1. 메인 영역 (기준 회차): 직전 회차에서 '받은' 번호 강조
//     // 사용자가 검색한 조건(이월된 결과)을 보여주는 것이 메인 영역의 목적입니다.
//     row.querySelectorAll(".pattern-balls-wrapper .ball").forEach((ball) => {
//       const num = parseInt(ball.textContent);
//       if (carryFromPrev.includes(num)) {
//         ball.classList.add("carryover-ball");
//       } else {
//         ball.classList.remove("carryover-ball");
//       }
//     });

//     const detailRows = row.querySelectorAll(".detail-row");
//     const detailDescs = row.querySelectorAll(".detail-desc");

//     // [수정] 2. 상세 영역 (직전/다음 회차) 테두리 매칭
//     if (detailRows.length >= 2) {
//       // [상단 섹션] 직전 회차: 메인 회차로 '보내준' 번호 강조
//       detailRows[0].querySelectorAll(".ball").forEach((ball) => {
//         const num = parseInt(ball.textContent);
//         if (carryFromPrev.includes(num)) {
//           ball.classList.add("carryover-ball");
//         } else {
//           ball.classList.remove("carryover-ball");
//         }
//       });

//       // [하단 섹션] 다음 회차: 메인 회차로부터 '받은' 번호 강조
//       detailRows[1].querySelectorAll(".ball").forEach((ball) => {
//         const num = parseInt(ball.textContent);
//         if (carryToNext.includes(num)) {
//           ball.classList.add("carryover-ball");
//         } else {
//           ball.classList.remove("carryover-ball");
//         }
//       });
//     }
//     if (detailDescs.length >= 2) {
//       // [수정 포인트] 숫자를 공 모양 HTML로 변환하는 헬퍼 함수 활용
//       const createBallHtml = (nums) => {
//         if (!nums || nums.length === 0) return "없음";
//         // 공들이 옆으로 나열되도록 display: inline-flex 스타일을 살짝 얹은 컨테이너로 감쌉니다.
//         const balls = nums
//           .map((n) => `<span class="ball ${getRangeClass(n)}">${n}</span>`)
//           .join("");
//         return `<span style="display: inline-flex; gap: 10px; align-items: center; vertical-align: middle;">${balls}</span>`;
//       };

//       // 1. 직전 회차 이월 표시 (2개 삭제, 공으로 표시)
//       detailDescs[0].innerHTML = `${createBallHtml(carryFromPrev)}`;

//       // 2. 기준/다음 회차 이월 표시 (2개 삭제, 공으로 표시)
//       detailDescs[1].innerHTML = `${createBallHtml(carryToNext)}`;
//     }

//     // 공 하이라이트 (기준 회차인 1200회 공들 중 1199회에서 넘어온 번호 강조)
//     const balls = row.querySelectorAll(".ball");
//     balls.forEach((ball) => {
//       if (carryFromPrev.includes(parseInt(ball.textContent))) {
//         ball.classList.add("carryover-ball");
//       }
//     });

//     listArea.appendChild(row);
//   });

//   analyzeCarryoverInsight(matches, targetCount, includeBonus);
// }

// function analyzeCarryoverInsight(matches, targetCount, includeBonus) {
//   const nextNums = [];
//   const appearedSet = new Set();
//   matches.forEach((m) => {
//     const next = lottoData.find((d) => d["회차"] === m.data["회차"] + 1);
//     if (next) {
//       for (let i = 1; i <= 6; i++) {
//         const n = next[`${i}번`];
//         nextNums.push(n);
//         appearedSet.add(n);
//       }
//     }
//   });

//   if (nextNums.length === 0) {
//     updateSidebarReport("데이터 부족으로 분석 불가");
//     return;
//   }

//   const freq = {};
//   nextNums.forEach((n) => (freq[n] = (freq[n] || 0) + 1));
//   const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
//   const top6 = sorted.slice(0, 6).map((n) => `${n}(${freq[n]}회)`);
//   const never = [];
//   for (let i = 1; i <= 45; i++) if (!appearedSet.has(i)) never.push(i);

//   const html = `
//         <strong>이월 패턴 리포트</strong><br>
//         조건: ${targetCount === 3 ? "3개 이상" : targetCount + "개"} 이월 ${includeBonus ? "(보너스 포함)" : ""}<br><br>
//         <strong>많이 나온 번호:</strong><br>
//         <span class="highlight-text">${top6.join(", ")}</span><br><br>
//         <strong>미출현(제외수):</strong><br>
//         <span class="no-data-text">${never.length > 0 ? never.join(", ") : "없음"}</span><br>
//         <small>(분석 대상: ${matches.length}개 사례)</small>
//     `;
//   updateSidebarReport(html);
// }

// function updateSidebarReport(htmlContent) {
//   const rt = document.getElementById("report-text");
//   if (rt) rt.innerHTML = htmlContent;
// }

/**
 * [tab-carryover.js]
 * 특징: 대량 데이터 처리 시 부하 방지를 위해 100개 단위 페이징(더 보기) 적용
 */
let cachedMatches = []; // 검색된 전체 결과 캐시
let currentCoLimit = 100; // 현재 표시 개수

document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("btn-run-carryover");
  const startInput = document.getElementById("co-start-round");
  const endInput = document.getElementById("co-end-round");

  if (startInput && endInput) {
    const handleEnter = (e) => {
      if (e.key === "Enter") executeCarryoverAnalysis();
    };
    startInput.addEventListener("keypress", handleEnter);
    endInput.addEventListener("keypress", handleEnter);
  }

  if (runBtn) runBtn.addEventListener("click", executeCarryoverAnalysis);
});

function executeCarryoverAnalysis() {
  const startVal = document.getElementById("co-start-round").value.trim();
  const endVal = document.getElementById("co-end-round").value.trim();
  const targetCount = parseInt(
    document.getElementById("co-count-select").value,
  );
  const includeBonus = document.getElementById("co-include-bonus").checked;
  const badge = document.getElementById("carryover-count-badge");

  if (!lottoData || lottoData.length === 0) {
    showToast("데이터를 로드해주세요.");
    return;
  }

  const startRound = startVal ? parseInt(startVal) : 1;
  const endRound = endVal
    ? parseInt(endVal)
    : Math.max(...lottoData.map((d) => d["회차"]));

  const matches = [];
  lottoData.forEach((current) => {
    const curR = current["회차"];
    if (curR < startRound || curR > endRound) return;

    const prev = lottoData.find((d) => d["회차"] === curR - 1);
    if (!prev) return;

    const prevNums = [
      prev["1번"],
      prev["2번"],
      prev["3번"],
      prev["4번"],
      prev["5번"],
      prev["6번"],
    ];
    if (includeBonus) prevNums.push(prev["보너스"]);

    const curNums = [
      current["1번"],
      current["2번"],
      current["3번"],
      current["4번"],
      current["5번"],
      current["6번"],
    ];
    const common = curNums.filter((n) => prevNums.includes(n));
    const isMatch =
      targetCount === 3 ? common.length >= 3 : common.length === targetCount;

    if (isMatch) matches.push({ data: current, pb: prev["보너스"] });
  });

  badge.textContent = matches.length;

  // 데이터 캐싱 및 초기화
  matches.sort((a, b) => b.data["회차"] - a.data["회차"]);
  cachedMatches = matches;
  currentCoLimit = 100;

  if (matches.length === 0) {
    document.getElementById("carryover-result-list").innerHTML = "";
    updateSidebarReport("일치하는 패턴이 없습니다.");
    removeCoMoreButton();
    return;
  }

  renderCarryoverResults();
  analyzeCarryoverInsight(matches, targetCount, includeBonus);
}

function renderCarryoverResults() {
  const listArea = document.getElementById("carryover-result-list");
  if (!listArea) return;

  const limitedData = cachedMatches.slice(0, currentCoLimit);

  // 초기 렌더링 시에는 비우기, 더 보기 시에는 이어서 붙이기 위해 초기화 시점 제어
  if (currentCoLimit === 100) listArea.innerHTML = "";

  const fragment = document.createDocumentFragment();

  // 새로 추가될 데이터만 처리 (기존 데이터 유지하고 fragment에 새 데이터만 생성)
  const startIdx = currentCoLimit - 100;
  const currentViewData = cachedMatches.slice(startIdx, currentCoLimit);

  currentViewData.forEach((m) => {
    const current = m.data;
    const prev = lottoData.find((d) => d["회차"] === current["회차"] - 1);
    const next = lottoData.find((d) => d["회차"] === current["회차"] + 1);

    if (!prev) return;

    const prevNums = [
      prev["1번"],
      prev["2번"],
      prev["3번"],
      prev["4번"],
      prev["5번"],
      prev["6번"],
      prev["보너스"],
    ];
    const curNums = [
      current["1번"],
      current["2번"],
      current["3번"],
      current["4번"],
      current["5번"],
      current["6번"],
    ];
    const carryFromPrev = curNums.filter((n) => prevNums.includes(n));

    let carryToNext = [];
    if (next) {
      const currentNumsWithBonus = [
        current["1번"],
        current["2번"],
        current["3번"],
        current["4번"],
        current["5번"],
        current["6번"],
        current["보너스"],
      ];
      const nextNums = [
        next["1번"],
        next["2번"],
        next["3번"],
        next["4번"],
        next["5번"],
        next["6번"],
      ];
      carryToNext = nextNums.filter((n) => currentNumsWithBonus.includes(n));
    }

    const rowData = {
      r: current["회차"],
      n1: current["1번"],
      n2: current["2번"],
      rest: [current["3번"], current["4번"], current["5번"], current["6번"]],
      curBonus: current["보너스"],
      totalSum: current["합계"],
      pr: prev["회차"],
      pb: prev["보너스"],
      operator: "",
    };

    const row = createPatternRow(rowData);

    // 하이라이트 로직
    row.querySelectorAll(".pattern-balls-wrapper .ball").forEach((ball) => {
      if (carryFromPrev.includes(parseInt(ball.textContent))) {
        ball.classList.add("carryover-ball");
      }
    });

    const detailRows = row.querySelectorAll(".detail-row");
    const detailDescs = row.querySelectorAll(".detail-desc");

    if (detailRows.length >= 2) {
      detailRows[0].querySelectorAll(".ball").forEach((ball) => {
        if (carryFromPrev.includes(parseInt(ball.textContent)))
          ball.classList.add("carryover-ball");
      });
      detailRows[1].querySelectorAll(".ball").forEach((ball) => {
        if (carryToNext.includes(parseInt(ball.textContent)))
          ball.classList.add("carryover-ball");
      });
    }

    if (detailDescs.length >= 2) {
      const createBallHtml = (nums) => {
        if (!nums || nums.length === 0) return "없음";
        const balls = nums
          .map((n) => `<span class="ball ${getRangeClass(n)}">${n}</span>`)
          .join("");
        return `<span style="display: inline-flex; gap: 10px; align-items: center; vertical-align: middle;">${balls}</span>`;
      };
      detailDescs[0].innerHTML = `${createBallHtml(carryFromPrev)}`;
      detailDescs[1].innerHTML = `${createBallHtml(carryToNext)}`;
    }

    fragment.appendChild(row);
  });

  listArea.appendChild(fragment);
  renderCoMoreButton(cachedMatches.length);
}

function renderCoMoreButton(totalLength) {
  let btn = document.getElementById("co-load-more-btn");

  if (currentCoLimit < totalLength) {
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "co-load-more-btn";
      btn.className = "btn-load-more btn-search";
      btn.style.marginTop = "20px";
      btn.setAttribute(
        "aria-label",
        `결과 100건 더 보기 (현재 ${currentCoLimit}건 표시 중)`,
      );
      btn.setAttribute("title", "데이터 더 보기");
      btn.onclick = () => {
        currentCoLimit += 100;
        renderCarryoverResults();
      };
      document.getElementById("carryover-result-list").after(btn);
    }
    btn.innerHTML = `이월 결과 더 보기 (${Math.min(currentCoLimit, totalLength)} / ${totalLength}) <span aria-hidden="true">↓</span>`;
  } else if (btn) {
    btn.remove();
  }
}

function removeCoMoreButton() {
  document.getElementById("co-load-more-btn")?.remove();
}

function analyzeCarryoverInsight(matches, targetCount, includeBonus) {
  const nextNums = [];
  const appearedSet = new Set();
  matches.forEach((m) => {
    const next = lottoData.find((d) => d["회차"] === m.data["회차"] + 1);
    if (next) {
      for (let i = 1; i <= 6; i++) {
        const n = next[`${i}번`];
        nextNums.push(n);
        appearedSet.add(n);
      }
    }
  });

  if (nextNums.length === 0) {
    updateSidebarReport("데이터 부족으로 분석 불가");
    return;
  }

  const freq = {};
  nextNums.forEach((n) => (freq[n] = (freq[n] || 0) + 1));
  const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  const top6 = sorted.slice(0, 6).map((n) => `${n}(${freq[n]}회)`);
  const never = [];
  for (let i = 1; i <= 45; i++) if (!appearedSet.has(i)) never.push(i);

  const html = `
        <strong>이월 패턴 리포트</strong><br>
        조건: ${targetCount === 3 ? "3개 이상" : targetCount + "개"} 이월 ${includeBonus ? "(보너스 포함)" : ""}<br><br>
        <strong>많이 나온 번호:</strong><br>
        <span class="highlight-text">${top6.join(", ")}</span><br><br>
        <strong>미출현(제외수):</strong><br>
        <span class="no-data-text">${never.length > 0 ? never.join(", ") : "없음"}</span><br>
        <small>(분석 대상: ${matches.length}개 사례)</small>
    `;
  updateSidebarReport(html);
}

function updateSidebarReport(htmlContent) {
  const rt = document.getElementById("report-text");
  if (rt) rt.innerHTML = htmlContent;
}
