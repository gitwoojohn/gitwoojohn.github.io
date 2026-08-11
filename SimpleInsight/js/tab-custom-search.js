document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("btn-custom-search");
  const sortBtn = document.getElementById("btn-sort-toggle");
  const roundInput = document.getElementById("search-round");
  const sumInput = document.getElementById("search-total-sum");

  // 1. 입력 필드 자동 감지 및 교차 삭제
  if (roundInput && sumInput) {
    roundInput.addEventListener("focus", () => {
      if (sumInput.value !== "") sumInput.value = "";
    });
    sumInput.addEventListener("focus", () => {
      if (roundInput.value !== "") roundInput.value = "";
    });

    // [추가] 엔터 키 지원 로직
    const handleEnter = (e) => {
      if (e.key === "Enter") {
        executeCustomSearch();
      }
    };
    roundInput.addEventListener("keypress", handleEnter);
    sumInput.addEventListener("keypress", handleEnter);
  }

  if (searchBtn) searchBtn.addEventListener("click", executeCustomSearch);

  if (sortBtn) {
    sortBtn.addEventListener("click", function () {
      const roundVal = document.getElementById("search-round").value.trim();
      const sumVal = document.getElementById("search-total-sum").value.trim();

      // 1. 입력값이 둘 다 비어있으면 정렬 동작을 아예 수행하지 않음
      if (roundVal === "" && sumVal === "") {
        // 아무 작업도 하지 않고 종료
        return;
      }

      const listArea = document.getElementById("custom-search-list");
      const hasData =
        listArea &&
        listArea.children.length > 0 &&
        !listArea.querySelector(".no-data");

      const currentSort = this.getAttribute("data-sort");
      if (currentSort === "desc") {
        this.setAttribute("data-sort", "asc");
        this.textContent = "▲ 과거순";
      } else {
        this.setAttribute("data-sort", "desc");
        this.textContent = "▼ 최신순";
      }

      if (hasData) executeCustomSearch();
    });
  }
});

function executeCustomSearch() {
  const roundInput = document.getElementById("search-round").value.trim();
  const sumInput = document.getElementById("search-total-sum").value.trim();
  const sortBtn = document.getElementById("btn-sort-toggle");
  const sortMode = sortBtn ? sortBtn.getAttribute("data-sort") : "desc";

  if (!lottoData || lottoData.length === 0) {
    showToast("데이터를 먼저 로드해주세요.");
    return;
  }

  // [추가] 빈 값 체크: 회차와 합계 모두 비어있을 경우 중단
  if (roundInput === "" && sumInput === "") {
    showToast("회차 또는 합계를 입력해주세요.");
    return;
  }

  const roundVal = parseInt(roundInput);
  const sumVal = parseInt(sumInput);
  const listArea = document.getElementById("custom-search-list");
  const countDisplay = document.getElementById("custom-result-count");

  let matches = lottoData.filter((d) => {
    const matchRound = roundInput !== "" ? d["회차"] === roundVal : true;
    const matchSum = sumInput !== "" ? d["합계"] === sumVal : true;
    return matchRound && matchSum;
  });

  matches.sort((a, b) => {
    return sortMode === "desc" ? b["회차"] - a["회차"] : a["회차"] - b["회차"];
  });

  countDisplay.textContent = matches.length;
  listArea.innerHTML = "";

  if (matches.length === 0) {
    updateSidebarReport("일치하는 데이터가 없습니다.");
    return;
  }

  if (sumInput !== "") {
    analyzeNextRoundInsight(matches, sumVal);
  } else {
    updateSidebarReport(`${matches.length}개의 회차 정보를 찾았습니다.`);
  }

  matches.forEach((m) => {
    const prevRound = m["회차"] - 1;
    const prevData = lottoData.find((d) => d["회차"] === prevRound);
    const actualPrevBonus = prevData ? prevData["보너스"] : 0;

    const rowData = {
      r: m["회차"],
      n1: m["1번"],
      n2: m["2번"],
      rest: [m["3번"], m["4번"], m["5번"], m["6번"]],
      curBonus: m["보너스"],
      totalSum: m["합계"],
      pr: prevRound,
      pb: actualPrevBonus,
      operator: "+",
    };
    listArea.appendChild(createPatternRow(rowData));
  });
}

/**
 * [업데이트] 특정 합계의 다음 회차 빈도 분석 + 미출현 번호 포함
 */
function analyzeNextRoundInsight(matches, targetSum) {
  const nextNumbers = [];
  const appearedSet = new Set();

  matches.forEach((m) => {
    const nextRound = m["회차"] + 1;
    const nextData = lottoData.find((d) => d["회차"] === nextRound);
    if (nextData) {
      for (let i = 1; i <= 6; i++) {
        const num = nextData[`${i}번`];
        nextNumbers.push(num);
        appearedSet.add(num); // 출현한 번호 기록
      }
    }
  });

  if (nextNumbers.length === 0) {
    updateSidebarReport(
      `합계 ${targetSum}의 다음 회차 데이터가 존재하지 않습니다.`,
    );
    return;
  }

  // 1. 최다 출현 번호 계산
  const frequency = {};
  nextNumbers.forEach((num) => {
    frequency[num] = (frequency[num] || 0) + 1;
  });
  const sortedNums = Object.keys(frequency).sort(
    (a, b) => frequency[b] - frequency[a],
  );
  const top6WithCount = sortedNums
    .slice(0, 6)
    .map((num) => `${num}(${frequency[num]}회)`);

  // 2. 미출현 번호(제외수) 계산 (1~45 중 appearedSet에 없는 번호)
  const neverAppeared = [];
  for (let i = 1; i <= 45; i++) {
    if (!appearedSet.has(i)) {
      neverAppeared.push(i);
    }
  }

  // 3. 리포트 생성 (innerHTML 유지)
  const insightMsg = `
        <strong>합계 ${targetSum} 분석 결과</strong><br>
        다음 회차 최다 출현:<br>
        <span class="highlight-text">${top6WithCount.join(", ")}</span><br><br>
        다음 회차 미출현(제외수):<br>
        <span style="color: #8b949e; font-size: 0.85em;">${neverAppeared.length > 0 ? neverAppeared.join(", ") : "없음"}</span><br>
        <small>(총 ${matches.length}회 사례 분석됨)</small>
    `;

  updateSidebarReport(insightMsg);
}

function updateSidebarReport(htmlContent) {
  const reportText = document.getElementById("report-text");
  if (reportText) {
    reportText.innerHTML = htmlContent;
  }
}
