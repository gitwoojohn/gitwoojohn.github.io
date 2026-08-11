// // ============================================================================
// // PATTERN SEARCH TAB - 실제 데이터 분석 로직
// // ============================================================================

// const patternFields = [
//   "range-1-9",
//   "range-10-19",
//   "range-20-29",
//   "range-30-39",
//   "range-40-45",
// ];

// patternFields.forEach((id) => {
//   const el = document.getElementById(id);
//   if (el) {
//     // 기존 입력값 클릭 시 자동 삭제
//     el.addEventListener("focus", function () {
//       this.value = "";
//     });
//     // 엔터키 입력 시 즉시 검색
//     el.addEventListener("keydown", (e) => {
//       if (e.key === "Enter") executePatternSearch();
//     });
//   }
// });

// // [1] 편의 기능 유지: 클릭 시 비우기 및 엔터키 검색
// document
//   .getElementById("searchPattern")
//   .addEventListener("click", executePatternSearch);

// // [2] 검색 로직: 기존 레이아웃 유지하며 필드명 매핑만 수정
// function executePatternSearch() {
//   if (!lottoData || lottoData.length === 0) {
//     showToast("먼저 CSV 파일을 불러오세요.");
//     return;
//   }

//   const pattern = {
//     "1~9": document.getElementById("range-1-9").value,
//     "10~19": document.getElementById("range-10-19").value,
//     "20~29": document.getElementById("range-20-29").value,
//     "30~39": document.getElementById("range-30-39").value,
//     "40~45": document.getElementById("range-40-45").value,
//   };

//   const matches = lottoData.filter((row) => {
//     return Object.entries(pattern).every(([key, val]) => {
//       if (val === "") return true;
//       // CSV 헤더가 01월 09일 등으로 변해있을 경우를 대비한 매핑
//       const csvKey =
//         key === "1~9"
//           ? row["1~9"] !== undefined
//             ? "1~9"
//             : "01월 09일"
//           : key === "10~19"
//             ? row["10~19"] !== undefined
//               ? "10~19"
//               : "10월 19일"
//             : key;
//       return parseInt(row[csvKey]) === parseInt(val);
//     });
//   });

//   displayResults(matches);
//   updateSidebarInsight(matches);
// }

// // [수정] 더미 출력 제거 및 실제 계산 결과 출력
// function updateSidebarInsight(matches) {
//   const insightArea = document.getElementById("insight-content");
//   const dummyReport = document.getElementById("report-text");

//   if (dummyReport) {
//     dummyReport.innerHTML = "";
//   }

//   if (!insightArea) return;

//   if (matches.length === 0) {
//     insightArea.innerHTML =
//       '<p class="placeholder-text">일치하는 데이터가 없습니다.</p>';
//     return;
//   }

//   // 1. 차회차 데이터 확보
//   const nextRounds = matches
//     .map((m) => lottoData.find((d) => d["회차"] === parseInt(m["회차"]) + 1))
//     .filter(Boolean);

//   if (nextRounds.length === 0) {
//     insightArea.innerHTML =
//       '<p class="placeholder-text">분석 가능한 다음 회차 데이터가 없습니다.</p>';
//     return;
//   }

//   // 2. 실제 통계 계산 (더미 삭제)
//   const count = nextRounds.length;
//   let totalSum = 0;
//   const rangeStats = {
//     "1~9": {},
//     "10~19": {},
//     "20~29": {},
//     "30~39": {},
//     "40~45": {},
//   };
//   const patternFreq = {};

//   nextRounds.forEach((rd) => {
//     totalSum += parseInt(rd["합계"]);
//     // 구간별 빈도 계산
//     ["1~9", "10~19", "20~29", "30~39", "40~45"].forEach((r) => {
//       const val = rd[r];
//       rangeStats[r][val] = (rangeStats[r][val] || 0) + 1;
//     });
//     // 패턴 빈도 계산
//     const pStr = `${rd["1~9"]}-${rd["10~19"]}-${rd["20~29"]}-${rd["30~39"]}-${rd["40~45"]}`;
//     patternFreq[pStr] = (patternFreq[pStr] || 0) + 1;
//   });

//   const avgSum = Math.round(totalSum / count);
//   const sortedPatterns = Object.entries(patternFreq)
//     .sort((a, b) => b[1] - a[1])
//     .slice(0, 3);

//   // 3. 결과 렌더링 (레이아웃 유지)
//   insightArea.innerHTML = `
//         <div class="insight-report">
//             <div class="insight-header">
//                 <p>실제 매칭 <span class="highlight">${count}건</span> 분석 결과</p>
//             </div>
//             <div class="insight-section">
//                 <h4>🔮 다음 회차 예측 패턴</h4>
//                 <div class="prediction-list">
//                     ${sortedPatterns
//                       .map(
//                         ([p, c], i) => `
//                         <div class="prediction-card ${i === 0 ? "best" : ""}">
//                             <div class="rank">TOP ${i + 1}</div>
//                             <div class="pattern-string">${p}</div>
//                             <div class="pattern-meta">출현 ${c}회 (${Math.round((c / count) * 100)}%)</div>
//                         </div>
//                     `,
//                       )
//                       .join("")}
//                 </div>
//             </div>
//             <div class="insight-section">
//                 <h4>🎯 구간별 최빈 출현</h4>
//                 <div class="insight-grid">
//                     ${Object.entries(rangeStats)
//                       .map(([range, counts]) => {
//                         const best = Object.keys(counts).reduce((a, b) =>
//                           counts[a] > counts[b] ? a : b,
//                         );
//                         const prob = Math.round((counts[best] / count) * 100);
//                         const status =
//                           best >= 2
//                             ? '<span class="status-hot">강세</span>'
//                             : best == 0
//                               ? '<span class="status-cold">미출</span>'
//                               : "<span>보통</span>";
//                         return `
//                             <div class="insight-row">
//                                 <span class="range-label">${range}</span>
//                                 <span class="range-val"><strong>${best}개</strong> (${prob}%)</span>
//                                 ${status}
//                             </div>`;
//                       })
//                       .join("")}
//                 </div>
//             </div>
//             <div class="insight-section">
//                 <h4>📊 권장 합계 범위</h4>
//                 <div class="sum-box">${avgSum - 15} ~ ${avgSum + 15}</div>
//                 <p class="tip">평균 합계 ${avgSum} 기준 (±15 오차)</p>
//             </div>
//         </div>
//     `;
// }

// // 기존 displayResults 함수 내의 리턴 부분을 아래와 같이 수정했습니다.
// function displayResults(matches) {
//   const resultCount = document.getElementById("result-count");
//   const resultList = document.getElementById("pattern-list");
//   if (resultCount) resultCount.textContent = matches.length;
//   if (!resultList) return;

//   if (matches.length === 0) {
//     resultList.innerHTML =
//       '<p class="no-data-message">일치하는 회차가 없습니다.</p>';
//     return;
//   }
//   //              <div class="result-item" onclick="toggleAccordion(this, ${index})">
//   resultList.innerHTML = matches
//     .map((row, index) => {
//       const nextRound = lottoData.find(
//         (r) => parseInt(r["회차"]) === parseInt(row["회차"]) + 1,
//       );
//       //  <span class="pattern-label-text">
//       return `
//             <div class="result-wrapper">
//                 <div class="result-item" onclick="toggleAccordion(this)">
//                     <div class="result-info">
//                         <div class="result-round">${row["회차"]}회</div>
//                         <div class="result-date">${row["추첨일"] || row["날짜"] || ""}</div>
//                         <div class="result-numbers-row">
//                             <div class="balls-container">
//                                 ${[1, 2, 3, 4, 5, 6].map((i) => `<div class="ball ${getRangeClass(row[i + "번"])}">${row[i + "번"]}</div>`).join("")}
//                                 <span class="divider">|</span>
//                                 <div class="ball bonus ${getRangeClass(row["보너스"])}">${row["보너스"]}</div>
//                             </div>
//                             <span class="divider">|</span>
//                             <span class="sum-value">${row["합계"]}</span>
//                             <span class="divider">|</span>
//                             <div class="pattern-badge-main">
//                             <span class="pattern-label-text">
//                             패턴: ${row["1~9"]} - ${row["10~19"]} - ${row["20~29"]} - ${row["30~39"]} - ${row["40~45"]}
//                         </span></div>
//                         </div>
//                     </div>
//                     <div class="expand-icon"><span>▼</span></div>
//                 </div>

//                 <div class="next-round-info" id="next-${index}">
//                     ${
//                       nextRound
//                         ? `
//                         <div class="next-header">
//                         <div class="result-numbers-row">
//                         <span class="next-label">다음 회차 [${nextRound["회차"]}회]</span>
//                         <span class="result-date">${nextRound["추첨일"] || nextRound["날짜"] || ""}</span>
//                         <span class="spacer"></span>
//                                 <div class="balls-container">
//                                     ${[1, 2, 3, 4, 5, 6].map((i) => `<div class="ball ${getRangeClass(nextRound[i + "번"])}">${nextRound[i + "번"]}</div>`).join("")}
//                                     <span class="divider">|</span>
//                                     <div class="ball bonus ${getRangeClass(nextRound["보너스"])}">${nextRound["보너스"]}</div>
//                                 </div>
//                                 <span class="divider">|</span>
//                                 <span class="sum-value">${nextRound["합계"]}</span>
//                                 <span class="divider">|</span>
//                                 <div class="pattern-badge-main">
//                                     <span class="pattern-label-text">패턴:</span>
//                                     <strong>${nextRound["1~9"]} - ${nextRound["10~19"]} - ${nextRound["20~29"]} - ${nextRound["30~39"]} - ${nextRound["40~45"]}</strong>
//                                 </div>
//                             </div>
//                         </div>
//                     `
//                         : '<p class="no-next-data">다음 회차 정보 없음</p>'
//                     }
//                 </div>
//             </div>
//         `;
//     })
//     .join("");
// }

// // function toggleNextRound(element, index) {
// //     const nextInfo = document.getElementById(`next-${index}`);
// //     if (nextInfo) nextInfo.classList.toggle('expanded');
// // }

// ============================================================================
// PATTERN SEARCH TAB - 최적화 및 접근성 개선 버전
// ============================================================================

// [전역 설정]
const patternFields = [
  "range-1-9",
  "range-10-19",
  "range-20-29",
  "range-30-39",
  "range-40-45",
];
const patternKeys = ["1~9", "10~19", "20~29", "30~39", "40~45"];

// [도움 함수] 볼 HTML 생성 (웹 접근성 title 포함)
function createBallHTML(num, isBonus = false) {
  if (num === undefined || num === null) return "";
  const label = isBonus ? "보너스 번호" : "당첨 번호";
  return `<div class="ball ${getRangeClass(num)} ${isBonus ? "bonus" : ""}" title="${label} ${num}">${num}</div>`;
}

// [이벤트 리스너 등록]
patternFields.forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("focus", function () {
      this.value = "";
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") executePatternSearch();
    });
  }
});

const searchBtn = document.getElementById("searchPattern");
if (searchBtn) searchBtn.addEventListener("click", executePatternSearch);

/**
 * [1] 패턴 검색 실행
 */
function executePatternSearch() {
  if (!lottoData || lottoData.length === 0) {
    showToast("먼저 CSV 파일을 불러오세요.");
    return;
  }

  // 인덱스 맵이 비어있다면 생성 (성능 최적화)
  if (typeof lottoIndex !== "undefined" && lottoIndex.size === 0) {
    lottoData.forEach((row) => lottoIndex.set(parseInt(row["회차"]), row));
  }

  // 입력값 수집
  const searchPattern = {};
  patternFields.forEach((id, idx) => {
    searchPattern[patternKeys[idx]] = document.getElementById(id).value;
  });

  const matches = lottoData.filter((row) => {
    return Object.entries(searchPattern).every(([key, val]) => {
      if (val === "") return true;
      // CSV 헤더 유연한 매핑 (1~9 또는 01월 09일)
      const csvKey =
        row[key] !== undefined ? key : key.replace("~", "월 ") + "일";
      return parseInt(row[csvKey]) === parseInt(val);
    });
  });

  displayResults(matches);
  updateSidebarInsight(matches);
}

/**
 * [2] 검색 결과 리스트 렌더링
 */
function displayResults(matches) {
  const resultCount = document.getElementById("result-count");
  const resultList = document.getElementById("pattern-list");

  if (resultCount) resultCount.textContent = matches.length;
  if (!resultList) return;

  if (matches.length === 0) {
    resultList.innerHTML =
      '<p class="no-data-message">일치하는 회차가 없습니다.</p>';
    return;
  }

  resultList.innerHTML = matches
    .map((row, index) => {
      const nextRoundNum = parseInt(row["회차"]) + 1;
      // Map 인덱스 사용으로 성능 최적화 (O(1))
      const nextRound =
        typeof lottoIndex !== "undefined" ? lottoIndex.get(nextRoundNum) : null;

      return `
            <div class="result-wrapper"> 
                <div class="result-item" onclick="toggleAccordion(this)" title="${row["회차"]}회 상세 정보 보기" role="button" aria-expanded="false">
                    <div class="result-info">
                        <div class="result-round">${row["회차"]}회</div>
                        <div class="result-date">${row["추첨일"] || row["날짜"] || ""}</div>
                        <div class="result-numbers-row">
                            <div class="balls-container">
                                ${[1, 2, 3, 4, 5, 6].map((i) => createBallHTML(row[i + "번"])).join("")}
                                <span class="divider">|</span>
                                ${createBallHTML(row["보너스"], true)}
                            </div>
                            <span class="divider">|</span>
                            <span class="sum-value" title="합계">합: ${row["합계"]}</span>
                            <span class="divider">|</span>
                            <div class="pattern-badge-main">
                                <span class="pattern-label-text">
                                    패턴: ${patternKeys.map((k) => row[k]).join(" - ")}
                                </span>
                            </div>
                        </div>
                    </div> 
                    <div class="expand-icon"><span>▼</span></div>
                </div>
                
                <div class="next-round-info" id="next-${index}">
                    ${
                      nextRound
                        ? ` 
                        <div class="next-header">
                            <div class="result-numbers-row">
                                <span class="next-label">다음 회차 [${nextRound["회차"]}회]</span>
                                <span class="result-date">${nextRound["추첨일"] || nextRound["날짜"] || ""}</span>
                                <span class="spacer"></span>
                                <div class="balls-container">
                                    ${[1, 2, 3, 4, 5, 6].map((i) => createBallHTML(nextRound[i + "번"])).join("")}
                                    <span class="divider">|</span>
                                    ${createBallHTML(nextRound["보너스"], true)}
                                </div>
                                <span class="divider">|</span>
                                <span class="sum-value">합: ${nextRound["합계"]}</span>
                                <span class="divider">|</span>
                                <div class="pattern-badge-main">
                                    <strong>${patternKeys.map((k) => nextRound[k]).join(" - ")}</strong>
                                </div>
                            </div>
                        </div>`
                        : '<p class="no-next-data">분석 가능한 다음 회차 데이터가 없습니다.</p>'
                    }
                </div>
            </div>
        `;
    })
    .join("");
}

/**
 * [3] 사이드바 통계 분석 리포트
 */
function updateSidebarInsight(matches) {
  const insightArea = document.getElementById("insight-content");
  const dummyReport = document.getElementById("report-text");

  if (dummyReport) dummyReport.innerHTML = "";
  if (!insightArea) return;

  if (matches.length === 0) {
    insightArea.innerHTML =
      '<p class="placeholder-text">일치하는 데이터가 없습니다.</p>';
    return;
  }

  // 차회차 데이터 확보
  const nextRounds = matches
    .map((m) =>
      typeof lottoIndex !== "undefined"
        ? lottoIndex.get(parseInt(m["회차"]) + 1)
        : null,
    )
    .filter(Boolean);

  if (nextRounds.length === 0) {
    insightArea.innerHTML =
      '<p class="placeholder-text">다음 회차 데이터가 부족하여 분석할 수 없습니다.</p>';
    return;
  }

  const count = nextRounds.length;
  let totalSum = 0;
  const rangeStats = {
    "1~9": {},
    "10~19": {},
    "20~29": {},
    "30~39": {},
    "40~45": {},
  };
  const patternFreq = {};

  nextRounds.forEach((rd) => {
    totalSum += parseInt(rd["합계"]);
    patternKeys.forEach((k) => {
      const val = rd[k];
      rangeStats[k][val] = (rangeStats[k][val] || 0) + 1;
    });
    const pStr = patternKeys.map((k) => rd[k]).join("-");
    patternFreq[pStr] = (patternFreq[pStr] || 0) + 1;
  });

  const avgSum = Math.round(totalSum / count);
  const sortedPatterns = Object.entries(patternFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  insightArea.innerHTML = `
        <div class="insight-report">
            <div class="insight-header">
                <p>실제 매칭 <span class="highlight">${count}건</span> 분석 결과</p>
            </div>
            <div class="insight-section">
                <h4>🔮 다음 회차 예측 패턴 (TOP 3)</h4>
                <div class="prediction-list">
                    ${sortedPatterns
                      .map(
                        ([p, c], i) => `
                        <div class="prediction-card ${i === 0 ? "best" : ""}" title="가장 많이 출현한 패턴">
                            <div class="rank">TOP ${i + 1}</div>
                            <div class="pattern-string">${p}</div>
                            <div class="pattern-meta">출현 ${c}회 (${Math.round((c / count) * 100)}%)</div>
                        </div>`,
                      )
                      .join("")}
                </div>
            </div>
            <div class="insight-section">
                <h4>🎯 구간별 최빈 출현 개수</h4>
                <div class="insight-grid">
                    ${Object.entries(rangeStats)
                      .map(([range, counts]) => {
                        const best = Object.keys(counts).reduce((a, b) =>
                          counts[a] > counts[b] ? a : b,
                        );
                        const prob = Math.round((counts[best] / count) * 100);
                        const status =
                          best >= 2
                            ? '<span class="status-hot">강세</span>'
                            : best == 0
                              ? '<span class="status-cold">미출</span>'
                              : "<span>보통</span>";
                        return `
                            <div class="insight-row">
                                <span class="range-label">${range}</span>
                                <span class="range-val"><strong>${best}개</strong> (${prob}%)</span>
                                ${status}
                            </div>`;
                      })
                      .join("")}
                </div>
            </div>
            <div class="insight-section">
                <h4>📊 권장 합계 범위</h4>
                <div class="sum-box" title="예상 평균 합계">${avgSum - 15} ~ ${avgSum + 15}</div>
                <p class="tip">평균 합계 ${avgSum} 기준 (±15 오차 적용)</p>
            </div>
        </div>
    `;
}
