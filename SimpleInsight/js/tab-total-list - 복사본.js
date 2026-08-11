/**
 * [tab-total-list.js]
 * 기능: 전체 회차 출력, 회차 검색(엔터 지원), 입력창 클릭 시 초기화
 */

let isLatestFirst = true;
let filteredData = null;

/** [분석 유틸] */
const calculateAC = (n) => {
  const d = new Set();
  for (let i = 0; i < n.length; i++) {
    for (let j = i + 1; j < n.length; j++) d.add(Math.abs(n[i] - n[j]));
  }
  return d.size - (n.length - 1);
};

const calculateSD = (n) => {
  const m = n.reduce((a, b) => a + b, 0) / n.length;
  const v = n.reduce((a, b) => a + Math.pow(b - m, 2), 0) / n.length;
  return Math.sqrt(v).toFixed(1);
};

const getOddEven = (n) => {
  const o = n.filter((x) => x % 2 !== 0).length;
  return `${o}:${n.length - o}`;
};

/** [유틸] 패턴 문자열 생성 함수 (구간: 1-9, 10-19, 20-29, 30-39, 40-45) */
function getPatternString(row) {
  if (!row) return "0-0-0-0-0";

  // 객체에서 1~6번 번호 추출
  const nums = [1, 2, 3, 4, 5, 6]
    .map((i) => parseInt(row[`${i}번`] || row[i]))
    .filter((n) => !isNaN(n));

  if (nums.length < 6) return "0-0-0-0-0";

  const counts = [0, 0, 0, 0, 0]; // [1-9, 10-19, 20-29, 30-39, 40-45]

  nums.forEach((n) => {
    // 1-9: 0, 10-19: 1, 20-29: 2, 30-39: 3, 40-45: 4
    let idx = Math.floor(n / 10);
    if (idx > 4) idx = 4; // 40번대 이상은 모두 마지막 인덱스
    counts[idx]++;
  });

  return counts.join("-");
}

/** [메인] 렌더링 함수 */
function renderTotalList() {
  const container = document.getElementById("total-list-container");
  const countDisplay = document.getElementById("total-list-count");
  if (!container) return;

  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  const sortedData =
    filteredData ||
    [...lottoData].sort((a, b) =>
      isLatestFirst
        ? (b["회차"] || b["No"]) - (a["회차"] || a["No"])
        : (a["회차"] || a["No"]) - (b["회차"] || b["No"]),
    );

  if (countDisplay) countDisplay.textContent = sortedData.length;

  sortedData.forEach((row) => {
    const round = row["회차"] || row["No"];
    const nums = [1, 2, 3, 4, 5, 6].map((i) =>
      parseInt(row[`${i}번`] || row[i]),
    );
    const bonus = parseInt(row["보너스"] || row["보너스번호"] || row["bonus"]);

    // 1. 분석 데이터 계산
    const ac = calculateAC(nums);
    const sd = calculateSD(nums);
    const oe = getOddEven(nums);

    // 2. 패턴 문자열 추출 (row 객체 전체 전달)
    const patternStr =
      typeof getPatternString === "function"
        ? getPatternString(row)
        : "0-0-0-0-0";

    // 3. 클래스명 확보 (n에 따른 range 클래스)
    const getCls = (n) =>
      typeof getRangeClass === "function" ? getRangeClass(n) : "";

    const wrap = document.createElement("div");
    wrap.className = "result-wrapper";
    wrap.innerHTML = `
            <div class="result-item" role="article">
                <div class="result-info">
                    <div class="result-numbers-row">
                        <span class="result-round small">${round}회</span>
                        <div class="balls-container">
                            ${nums.map((n) => `<div class="ball ${getCls(n)}" title="번호 ${n}">${n}</div>`).join("")}
                            <span class="divider small" aria-hidden="true">|</span>
                            <div class="ball bonus ${getCls(bonus)}" title="보너스 번호 ${bonus}">${bonus}</div>
                        </div>
                    </div>
                    <div class="analysis-stats-compact">
                        <span class="stat-badge">AC: <strong>${ac}</strong></span>
                        <span class="stat-badge">표준편차: <strong>${sd}</strong></span>
                        <span class="stat-badge">홀짝: <strong>${oe}</strong></span>
                        <span class="stat-badge">패턴: <strong class="pattern-text">${patternStr}</strong></span>
                    </div>
                </div>
            </div>`;
    fragment.appendChild(wrap);
  });
  container.appendChild(fragment);
}

/** [기능] 검색 및 초기화 */
function handleSearch() {
  const input = document.getElementById("round-search-input");
  const val = input ? input.value.trim() : "";
  if (!val) {
    resetSearch();
    return;
  }

  const sourceData =
    window.lottoData || (typeof lottoData !== "undefined" ? lottoData : []);
  filteredData = sourceData.filter(
    (r) => String(r["회차"] || r["No"]) === String(val),
  );
  renderTotalList();
}

function resetSearch() {
  const input = document.getElementById("round-search-input");
  if (input) input.value = "";
  filteredData = null;
  renderTotalList();
}

/** [초기화] */
function initTotalList() {
  const searchInput = document.getElementById("round-search-input");

  // 1. 엔터키 입력 지원
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  // 2. 마우스 클릭 시 기존 데이터 지우기 (초기화)
  searchInput?.addEventListener("click", () => {
    if (searchInput.value !== "" || filteredData !== null) {
      resetSearch();
    }
  });

  // 3. 버튼 이벤트
  document
    .getElementById("round-search-btn")
    ?.addEventListener("click", handleSearch);
  document
    .getElementById("search-reset-btn")
    ?.addEventListener("click", resetSearch);
  document
    .getElementById("sort-toggle-btn")
    ?.addEventListener("click", function () {
      isLatestFirst = !isLatestFirst;
      this.textContent = isLatestFirst ? "최신순 보기 ↓" : "과거순 보기 ↑";
      renderTotalList();
    });

  // 4. 탭 클릭 시 렌더링
  document.addEventListener("click", (e) => {
    if (
      e.target.closest(".tab-btn")?.getAttribute("data-tab") ===
      "tab-total-list"
    ) {
      renderTotalList();
    }
  });

  // 5. 데이터 로딩 감시
  const checkInterval = setInterval(() => {
    const data =
      window.lottoData || (typeof lottoData !== "undefined" ? lottoData : []);
    if (data && data.length > 0) {
      renderTotalList();
      clearInterval(checkInterval);
    }
  }, 500);
}

initTotalList();
