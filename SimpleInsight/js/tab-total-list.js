/**
 * [tab-total-list.js]
 * 특징: 테마 일관성을 위한 버튼 디자인 수정 및 웹 접근성 강화
 */
let isLatestFirst = true;
let filteredData = null;
let currentDisplayLimit = 100;

function renderTotalList() {
  const container = document.getElementById("total-list-container");
  const countDisplay = document.getElementById("total-list-count");
  if (!container) return;

  const source =
    filteredData || (typeof lottoData !== "undefined" ? lottoData : []);
  if (source.length === 0) return;

  const sortedData = [...source].sort((a, b) => {
    const valA = parseInt(a["회차"] || 0);
    const valB = parseInt(b["회차"] || 0);
    return isLatestFirst ? valB - valA : valA - valB;
  });

  if (countDisplay) countDisplay.textContent = sortedData.length;
  const limitedData = sortedData.slice(0, currentDisplayLimit);

  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  limitedData.forEach((row) => {
    const patternStr = [
      row["1~9"] || "0",
      row["10~19"] || "0",
      row["20~29"] || "0",
      row["30~39"] || "0",
      row["40~45"] || "0",
    ].join("-");

    const wrap = document.createElement("div");
    wrap.className = "result-wrapper";
    wrap.innerHTML = `
            <div class="result-item" role="article" aria-label="${row["회차"]}회 결과">
                <div class="result-info">
                    <div class="result-numbers-row">
                        <span class="result-round small">${row["회차"]}회</span>
                        <div class="balls-container">
                            ${[1, 2, 3, 4, 5, 6]
                              .map((i) => {
                                const n = row[i + "번"];
                                return `<div class="ball ${getRangeClass(parseInt(n))}" title="번호 ${n}">${n}</div>`;
                              })
                              .join("")}
                            <span class="divider" aria-hidden="true">|</span>
                            <div class="ball bonus ${getRangeClass(parseInt(row["보너스"]))}" title="보너스 ${row["보너스"]}">${row["보너스"]}</div>
                        </div>
                    </div>
                    <div class="analysis-stats-compact">
                        <span class="stat-badge">합계: <strong>${row["합계"]}</strong></span>
                        <span class="divider" aria-hidden="true">|</span>
                        <span class="stat-badge">AC: <strong>${row["AC"]}</strong></span>
                        <span class="divider" aria-hidden="true">|</span>
                        <span class="stat-badge">편차: <strong>${parseFloat(row["편차"]).toFixed(1)}</strong></span>
                        <span class="divider" aria-hidden="true">|</span>
                        <span class="stat-badge">홀짝: <strong>${row["홀짝"]}</strong></span>
                        <span class="divider" aria-hidden="true">|</span>
                        <span class="stat-badge">패턴: <strong class="pattern-text">${patternStr}</strong></span>
                    </div>
                </div>
            </div>`;
    fragment.appendChild(wrap);
  });

  container.appendChild(fragment);
  renderMoreButton(sortedData.length);
}

/**
 * 더 보기 버튼 디자인 수정
 * 검색 버튼에 사용된 'btn-search' 또는 'btn-primary' 계열 클래스를 적용하여 테마 통일
 */
function renderMoreButton(totalLength) {
  let btn = document.getElementById("load-more-btn");

  if (currentDisplayLimit < totalLength) {
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "load-more-btn";
      // 검색 버튼과 동일한 디자인을 위해 btn-search 클래스 활용 (프로젝트 테마에 맞춤)
      btn.className = "btn-load-more btn-search";
      btn.setAttribute(
        "aria-label",
        `결과 100건 더 보기 (현재 ${currentDisplayLimit}건 표시 중)`,
      );
      btn.setAttribute("title", "데이터 더 보기");
      btn.onclick = () => {
        currentDisplayLimit += 100;
        renderTotalList();
      };
      document.getElementById("total-list-container").after(btn);
    }
    btn.innerHTML = `더 보기 (${currentDisplayLimit} / ${totalLength}) <span aria-hidden="true">↓</span>`;
  } else if (btn) {
    btn.remove();
  }
}

function initTotalList() {
  const searchInput = document.getElementById("round-search-input");
  if (searchInput) searchInput.setAttribute("aria-label", "회차 검색어 입력");

  document.getElementById("round-search-btn")?.addEventListener("click", () => {
    const val = searchInput?.value.trim();
    filteredData = val
      ? lottoData.filter((r) => String(r["회차"]) === val)
      : null;
    currentDisplayLimit = 100;
    renderTotalList();
  });

  document.getElementById("search-reset-btn")?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    filteredData = null;
    renderTotalList();
  });

  document
    .getElementById("sort-toggle-btn")
    ?.addEventListener("click", function () {
      isLatestFirst = !isLatestFirst;
      this.textContent = isLatestFirst ? "최신순 보기 ↓" : "과거순 보기 ↑";
      this.setAttribute(
        "aria-label",
        isLatestFirst ? "과거순 정렬로 변경" : "최신순 정렬로 변경",
      );
      renderTotalList();
    });

  document.addEventListener("click", (e) => {
    if (
      e.target.closest(".tab-btn")?.getAttribute("data-tab") ===
      "tab-total-list"
    ) {
      renderTotalList();
    }
  });
}

initTotalList();
