// // ============================================================================
// // [tab-pattern-search.js] 패턴별 번호 검색
// // ============================================================================

// // [추가] 모든 번호 입력 필드에 포커스 시 초기화 및 엔터키 이벤트 할당
// const fieldIds = ["num1", "num2", "num3", "num4", "num5", "num6", "bonus"];
// fieldIds.forEach((id) => {
//   const el = document.getElementById(id);
//   if (el) {
//     el.addEventListener("focus", function () {
//       this.value = ""; // 클릭 시 기존 데이터 지우기
//     });
//     el.addEventListener("keypress", (e) => {
//       if (e.key === "Enter")
//         document.getElementById("pattern-search-btn").click();
//     });
//   }
// });

// document.getElementById("pattern-search-btn").addEventListener("click", () => {
//   const fieldIds = ["num1", "num2", "num3", "num4", "num5", "num6", "bonus"];
//   const searchNums = fieldIds.map((id) => {
//     const val = document.getElementById(id).value;
//     return val ? parseInt(val) : null;
//   });

//   if (!searchNums.some((v) => v !== null)) {
//     showToast("최소 1개 이상의 번호를 입력하세요.");
//     return;
//   }

//   renderTotalPatternSearch(searchNums);
// });

// function renderTotalPatternSearch(searchNums) {
//   const container = document.getElementById("pattern-result-container");
//   const countDisplay = document.getElementById("total-result-count");

//   if (!container) return;
//   container.innerHTML = "";

//   const matches = lottoData
//     .filter((row) => {
//       const rowDataValues = [
//         parseInt(row["1번"]),
//         parseInt(row["2번"]),
//         parseInt(row["3번"]),
//         parseInt(row["4번"]),
//         parseInt(row["5번"]),
//         parseInt(row["6번"]),
//         parseInt(row["보너스"]),
//       ];
//       return searchNums.every((inputVal, index) => {
//         return inputVal === null || rowDataValues[index] === inputVal;
//       });
//     })
//     .sort((a, b) => parseInt(b["회차"]) - parseInt(a["회차"]));

//   countDisplay.textContent = matches.length;

//   if (matches.length === 0) {
//     container.innerHTML =
//       '<p class="no-data-message">일치하는 데이터가 없습니다.</p>';
//     return;
//   }

//   const listDiv = document.createElement("div");
//   listDiv.className = "result-list";

//   matches.forEach((row, index) => {
//     const currentRoundNum = parseInt(row["회차"]);
//     const prevRound = lottoData.find(
//       (r) => parseInt(r["회차"]) === currentRoundNum - 1,
//     );
//     const nextRound = lottoData.find(
//       (r) => parseInt(r["회차"]) === currentRoundNum + 1,
//     );

//     const wrapper = document.createElement("div");
//     wrapper.className = "result-wrapper";

//     // 회차 데이터를 한 줄로 렌더링하는 내부 헬퍼
//     const renderRow = (data, label) => {
//       if (!data) return `<div class="no-next-data">${label} 데이터 없음</div>`;

//       const nums = [
//         data["1번"],
//         data["2번"],
//         data["3번"],
//         data["4번"],
//         data["5번"],
//         data["6번"],
//       ].map(Number);
//       const p = `${data["1~9"]} - ${data["10~19"]} - ${data["20~29"]} - ${data["30~39"]} - ${data["40~45"]}`;

//       // 이월 번호 계산 (전회차 당첨번호+보너스 기준)
//       const prevData = lottoData.find(
//         (r) => parseInt(r["회차"]) === parseInt(data["회차"]) - 1,
//       );
//       let carryOverHtml = "";

//       if (prevData) {
//         const prevNums = [
//           prevData["1번"],
//           prevData["2번"],
//           prevData["3번"],
//           prevData["4번"],
//           prevData["5번"],
//           prevData["6번"],
//           prevData["보너스"],
//         ].map(Number);

//         const carryOvers = nums.filter((n) => prevNums.includes(n));

//         if (carryOvers.length > 0) {
//           carryOverHtml = `
//                         <div class="carryover-unit">
//                             <div class="balls-container">
//                                 ${carryOvers.map((n) => `<div class="ball ${getRangeClass(n)}">${n}</div>`).join("")}
//                             </div>
//                         </div>`;
//         } else {
//           carryOverHtml = `<span class="carryover-label none">이월 없음</span>`;
//         }
//       }

//       return `
//                 <div class="info-row-item ${label === "대상" ? "target-row" : ""}">
//                     <div class="result-numbers-row">
//                         <span class="row-label">${label} [${data["회차"]}회]</span>
//                         <div class="balls-container">
//                             ${nums.map((n) => `<div class="ball ${getRangeClass(n)}">${n}</div>`).join("")}
//                             <span class="divider">|</span>
//                             <div class="ball bonus ${getRangeClass(data["보너스"])}">${data["보너스"]}</div>
//                         </div>
//                         <span class="divider">|</span>
//                         <span class="sum-value">${data["합계"]}</span>
//                         <span class="divider">|</span>
//                         <div class="pattern-badge-main">
//                             <span class="pattern-label-text">패턴:</span>
//                             <strong>${p}</strong>
//                         </div>
//                         <span class="divider">|</span>
//                         <div class="carryover-section">${carryOverHtml}</div>
//                     </div>
//                 </div>
//             `;
//     };

//     wrapper.innerHTML = `
//             <div class="result-item" onclick="toggleTotalSearchAccordion(this, ${index})">
//                 <div class="result-info">
//                     <div class="result-numbers-row">
//                         <span class="result-round">${row["회차"]}회</span>
//                         <div class="balls-container">
//                             ${[row["1번"], row["2번"], row["3번"], row["4번"], row["5번"], row["6번"]].map((n) => `<div class="ball ${getRangeClass(n)}">${n}</div>`).join("")}
//                             <span class="divider">|</span>
//                             <div class="ball bonus ${getRangeClass(row["보너스"])}">${row["보너스"]}</div>
//                         </div>
//                         <span class="divider">|</span>
//                         <span class="sum-value">${row["합계"]}</span>
//                         <span class="divider">|</span>
//                         <div class="pattern-badge-main">
//                             <span class="pattern-label-text">패턴:</span>
//                             <strong>${row["1~9"]} - ${row["10~19"]} - ${row["20~29"]} - ${row["30~39"]} - ${row["40~45"]}</strong>
//                         </div>
//                     </div>
//                 </div>
//                 <div class="expand-icon"><span>▼</span></div>
//             </div>
//             <div class="next-round-info" id="total-next-${index}">
//                 <div class="accordion-content-inner">
//                     ${renderRow(prevRound, "이전")}
//                     <div class="row-separator"></div>
//                     ${renderRow(row, "대상")}
//                     <div class="row-separator"></div>
//                     ${renderRow(nextRound, "다음")}
//                 </div>
//             </div>
//         `;
//     listDiv.appendChild(wrapper);
//   });

//   container.appendChild(listDiv);
// }

// function toggleTotalSearchAccordion(element, index) {
//   const nextInfo = document.getElementById(`total-next-${index}`);
//   const iconContainer = element.querySelector(".expand-icon");
//   const isExpanded = nextInfo.classList.toggle("expanded");

//   if (isExpanded) {
//     iconContainer.classList.add("rotate");
//   } else {
//     iconContainer.classList.remove("rotate");
//   }
// }

// ===============================================================================

// // ============================================================================
// // [tab-pattern-search.js] 패턴별 번호 검색 및 구간 검색 기능
// // ============================================================================

// /**
//  * [1] 입력 필드 초기화 및 이벤트 바인딩
//  */
// const fieldIds = ["num1", "num2", "num3", "num4", "num5", "num6", "bonus"];

// fieldIds.forEach((id) => {
//   const el = document.getElementById(id);
//   if (el) {
//     // 웹 접근성 강화
//     el.setAttribute("aria-label", `${id.replace("num", "")}번째 번호 입력`);

//     // 포커스 시 기존 입력값 삭제
//     el.addEventListener("focus", function () {
//       this.value = "";
//     });

//     // 엔터 키 입력 시 검색 실행
//     el.addEventListener("keypress", (e) => {
//       if (e.key === "Enter") {
//         document.getElementById("pattern-search-btn").click();
//       }
//     });
//   }
// });

// /**
//  * [2] 검색 버튼 클릭 이벤트
//  */
// document.getElementById("pattern-search-btn").addEventListener("click", () => {
//   // 구간 검색 체크박스 상태 확인
//   const isRangeSearch = document.getElementById("range-search-check")?.checked;

//   const searchNums = fieldIds.map((id) => {
//     const val = document.getElementById(id).value;
//     return val ? parseInt(val) : null;
//   });

//   // 유효성 검사: 최소 하나는 입력해야 함
//   if (!searchNums.some((v) => v !== null)) {
//     if (typeof showToast === "function") {
//       showToast("최소 1개 이상의 번호를 입력하세요.");
//     }
//     return;
//   }

//   renderTotalPatternSearch(searchNums, isRangeSearch);
// });

// /**
//  * [3] 메인 검색 및 결과 렌더링
//  * @param {Array} searchNums - 사용자가 입력한 번호 배열
//  * @param {Boolean} isRangeSearch - 구간 검색 모드 활성화 여부
//  */
// function renderTotalPatternSearch(searchNums, isRangeSearch) {
//   const container = document.getElementById("pattern-result-container");
//   const countDisplay = document.getElementById("total-result-count");

//   if (!container) return;
//   container.innerHTML = "";

//   // 데이터 필터링 로직
//   const matches = lottoData
//     .filter((row) => {
//       // DB의 번호 데이터 추출 (다양한 키값 대응)
//       const rowDataValues = [
//         parseInt(row["1번"] || row["1"]),
//         parseInt(row["2번"] || row["2"]),
//         parseInt(row["3번"] || row["3"]),
//         parseInt(row["4번"] || row["4"]),
//         parseInt(row["5번"] || row["5"]),
//         parseInt(row["6번"] || row["6"]),
//         parseInt(row["보너스"] || row["보너스번호"] || row["bonus"]),
//       ];

//       return searchNums.every((inputVal, index) => {
//         if (inputVal === null) return true; // 입력되지 않은 필드는 무시

//         const dbVal = rowDataValues[index];

//         if (isRangeSearch) {
//           // 구간 검색 로직: 10단위 묶음 계산 (예: 20 입력 시 20~29)
//           const start = Math.floor(inputVal / 10) * 10;
//           let end = start + 9;

//           // 예외 처리: 0번대(1~9) 및 40번대(40~45)
//           const finalStart = start === 0 ? 1 : start;
//           if (start >= 40) end = 45;

//           return dbVal >= finalStart && dbVal <= end;
//         } else {
//           // 정확히 일치하는 번호 검색
//           return dbVal === inputVal;
//         }
//       });
//     })
//     .sort(
//       (a, b) => parseInt(b["회차"] || b["No"]) - parseInt(a["회차"] || a["No"]),
//     );

//   // 검색 결과 수 업데이트
//   if (countDisplay) countDisplay.textContent = matches.length;

//   if (matches.length === 0) {
//     container.innerHTML =
//       '<p class="no-data-message" role="alert">일치하는 데이터가 없습니다.</p>';
//     return;
//   }

//   const listDiv = document.createElement("div");
//   listDiv.className = "result-list";

//   matches.forEach((row, index) => {
//     const currentRoundNum = parseInt(row["회차"] || row["No"]);
//     const prevRound = lottoData.find(
//       (r) => parseInt(r["회차"] || r["No"]) === currentRoundNum - 1,
//     );
//     const nextRound = lottoData.find(
//       (r) => parseInt(r["회차"] || r["No"]) === currentRoundNum + 1,
//     );

//     const wrapper = document.createElement("div");
//     wrapper.className = "result-wrapper";

//     // 행 렌더링 내부 헬퍼 함수
//     const renderRow = (data, label) => {
//       if (!data) return `<div class="no-next-data">${label} 데이터 없음</div>`;

//       const roundNum = data["회차"] || data["No"];
//       const nums = [1, 2, 3, 4, 5, 6].map((i) =>
//         parseInt(data[`${i}번`] || data[i]),
//       );
//       const bns = data["보너스"] || data["보너스번호"] || data["bonus"];
//       const sum = data["합계"] || nums.reduce((a, b) => a + b, 0);

//       // 패턴 데이터 (키값 호환성 처리)
//       const p = `${data["1~9"] ?? row["1-9"] ?? 0} - ${data["10~19"] ?? row["10-19"] ?? 0} - ${data["20~29"] ?? row["20-29"] ?? 0} - ${data["30~39"] ?? row["30-39"] ?? 0} - ${data["40~45"] ?? row["40-45"] ?? 0}`;

//       // 이월 번호 계산 로직
//       const prevForCarry = lottoData.find(
//         (r) => parseInt(r["회차"] || r["No"]) === parseInt(roundNum) - 1,
//       );
//       let carryOverHtml = '<span class="carryover-label none">이월 없음</span>';

//       if (prevForCarry) {
//         const prevNums = [1, 2, 3, 4, 5, 6, "보너스"].map((k) =>
//           parseInt(
//             prevForCarry[
//               k === "보너스"
//                 ? prevForCarry["보너스"]
//                   ? "보너스"
//                   : "보너스번호"
//                 : `${k}번`
//             ],
//           ),
//         );
//         const carryOvers = nums.filter((n) => prevNums.includes(n));
//         if (carryOvers.length > 0) {
//           carryOverHtml = `<div class="balls-container">${carryOvers.map((n) => `<div class="ball ${getRangeClass(n)}">${n}</div>`).join("")}</div>`;
//         }
//       }

//       return `
//                 <div class="info-row-item ${label === "대상" ? "target-row" : ""}">
//                     <div class="result-numbers-row">
//                         <span class="row-label">${label} [${roundNum}회]</span>
//                         <div class="balls-container">
//                             ${nums.map((n) => `<div class="ball ${getRangeClass(n)}">${n}</div>`).join("")}
//                             <span class="divider" aria-hidden="true">|</span>
//                             <div class="ball bonus ${getRangeClass(bns)}">${bns}</div>
//                         </div>
//                         <span class="divider" aria-hidden="true">|</span>
//                         <span class="sum-value" title="합계">합: ${sum}</span>
//                         <span class="divider" aria-hidden="true">|</span>
//                         <div class="pattern-badge-main">
//                             <span class="pattern-label-text">패턴: <strong>${p}</strong></span>
//                         </div>
//                         <span class="divider" aria-hidden="true">|</span>
//                         <div class="carryover-section" title="이전 회차 대비 이월 번호">${carryOverHtml}</div>
//                     </div>
//                 </div>
//             `;
//     };

//     wrapper.innerHTML = `
//             <div class="result-item" onclick="toggleTotalSearchAccordion(this, ${index})" role="button" aria-expanded="false" title="상세 정보 보기">
//                 <div class="result-info">
//                     <div class="result-numbers-row">
//                         <span class="result-round">${currentRoundNum}회</span>
//                         <div class="balls-container">
//                             ${[1, 2, 3, 4, 5, 6]
//                               .map((i) => {
//                                 const n = row[`${i}번`] || row[i];
//                                 return `<div class="ball ${getRangeClass(n)}">${n}</div>`;
//                               })
//                               .join("")}
//                             <span class="divider">|</span>
//                             <div class="ball bonus ${getRangeClass(row["보너스"] || row["보너스번호"])}">${row["보너스"] || row["보너스번호"]}</div>
//                         </div>
//                         <span class="divider">|</span>
//                         <span class="sum-value">합: ${row["합계"] || 0}</span>
//                         <span class="divider">|</span>
//                         <div class="pattern-badge-main">
//                             <span class="pattern-label-text">패턴: <strong>${row["1~9"] ?? row["1-9"] ?? 0}-${row["10~19"] ?? row["10-19"] ?? 0}-${row["20~29"] ?? row["20-29"] ?? 0}-${row["30~39"] ?? row["30-39"] ?? 0}-${row["40~45"] ?? row["40-45"] ?? 0}</strong></span>
//                         </div>
//                     </div>
//                 </div>
//                 <div class="expand-icon" aria-hidden="true">▼</div>
//             </div>
//             <div class="next-round-info" id="total-next-${index}">
//                 <div class="accordion-content-inner">
//                     ${renderRow(prevRound, "이전")}
//                     <div class="row-separator"></div>
//                     ${renderRow(row, "대상")}
//                     <div class="row-separator"></div>
//                     ${renderRow(nextRound, "다음")}
//                 </div>
//             </div>
//         `;
//     listDiv.appendChild(wrapper);
//   });

//   container.appendChild(listDiv);
// }

// /**
//  * [4] 아코디언 토글 제어
//  */
// function toggleTotalSearchAccordion(element, index) {
//   const nextInfo = document.getElementById(`total-next-${index}`);
//   if (!nextInfo) return;

//   const iconContainer = element.querySelector(".expand-icon");
//   const isExpanded = nextInfo.classList.toggle("expanded");

//   // 상태 업데이트
//   element.setAttribute("aria-expanded", isExpanded);
//   if (iconContainer) {
//     iconContainer.style.transform = isExpanded
//       ? "rotate(180deg)"
//       : "rotate(0deg)";
//   }
// }

// ============================================================================
// [tab-pattern-search.js] 패턴별 번호 검색 및 구간 검색 기능
// ============================================================================

let currentPatternDisplayLimit = 100;
let lastPatternMatches = [];

/**
 * [1] 입력 필드 초기화 및 이벤트 바인딩
 */
const fieldIds = ["num1", "num2", "num3", "num4", "num5", "num6", "bonus"];

fieldIds.forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.setAttribute("aria-label", `${id.replace("num", "")}번째 번호 입력`);
    el.addEventListener("focus", function () {
      this.value = "";
    });
    el.addEventListener("keypress", (e) => {
      if (e.key === "Enter")
        document.getElementById("pattern-search-btn").click();
    });
  }
});

/**
 * [2] 검색 버튼 클릭 이벤트
 */
document.getElementById("pattern-search-btn").addEventListener("click", () => {
  const isRangeSearch = document.getElementById("range-search-check")?.checked;
  const searchNums = fieldIds.map((id) => {
    const val = document.getElementById(id).value;
    return val ? parseInt(val) : null;
  });

  if (!searchNums.some((v) => v !== null)) {
    if (typeof showToast === "function")
      showToast("최소 1개 이상의 번호를 입력하세요.");
    return;
  }

  // 필터링 및 정렬 수행
  lastPatternMatches = lottoData
    .filter((row) => {
      const rowDataValues = [
        parseInt(row["1번"] || row["1"]),
        parseInt(row["2번"] || row["2"]),
        parseInt(row["3번"] || row["3"]),
        parseInt(row["4번"] || row["4"]),
        parseInt(row["5번"] || row["5"]),
        parseInt(row["6번"] || row["6"]),
        parseInt(row["보너스"] || row["보너스번호"] || row["bonus"]),
      ];

      return searchNums.every((inputVal, index) => {
        if (inputVal === null) return true;
        const dbVal = rowDataValues[index];
        if (isRangeSearch) {
          const start = Math.floor(inputVal / 10) * 10;
          let end = start + 9;
          const finalStart = start === 0 ? 1 : start;
          if (start >= 40) end = 45;
          return dbVal >= finalStart && dbVal <= end;
        }
        return dbVal === inputVal;
      });
    })
    .sort(
      (a, b) => parseInt(b["회차"] || b["No"]) - parseInt(a["회차"] || a["No"]),
    );

  currentPatternDisplayLimit = 100;
  renderTotalPatternSearch();
});

/**
 * [3] 메인 검색 및 결과 렌더링
 */
function renderTotalPatternSearch() {
  const container = document.getElementById("pattern-result-container");
  const countDisplay = document.getElementById("total-result-count");

  if (!container) return;
  container.innerHTML = "";

  if (countDisplay) countDisplay.textContent = lastPatternMatches.length;

  if (lastPatternMatches.length === 0) {
    container.innerHTML =
      '<p class="no-data-message" role="alert">일치하는 데이터가 없습니다.</p>';
    renderPatternMoreButton(0);
    return;
  }

  const limitedData = lastPatternMatches.slice(0, currentPatternDisplayLimit);
  const listDiv = document.createElement("div");
  listDiv.className = "result-list";

  limitedData.forEach((row, index) => {
    const currentRoundNum = parseInt(row["회차"] || row["No"]);
    const prevRound = lottoData.find(
      (r) => parseInt(r["회차"] || r["No"]) === currentRoundNum - 1,
    );
    const nextRound = lottoData.find(
      (r) => parseInt(r["회차"] || r["No"]) === currentRoundNum + 1,
    );

    const wrapper = document.createElement("div");
    wrapper.className = "result-wrapper";

    const renderRow = (data, label) => {
      if (!data) return `<div class="no-next-data">${label} 데이터 없음</div>`;
      const roundNum = data["회차"] || data["No"];
      const nums = [1, 2, 3, 4, 5, 6].map((i) =>
        parseInt(data[`${i}번`] || data[i]),
      );
      const bns = data["보너스"] || data["보너스번호"] || data["bonus"];
      const sum = data["합계"] || nums.reduce((a, b) => a + b, 0);
      const p = `${data["1~9"] ?? data["1-9"] ?? 0} - ${data["10~19"] ?? data["10-19"] ?? 0} - ${data["20~29"] ?? data["20-29"] ?? 0} - ${data["30~39"] ?? data["30-39"] ?? 0} - ${data["40~45"] ?? data["40-45"] ?? 0}`;

      const prevForCarry = lottoData.find(
        (r) => parseInt(r["회차"] || r["No"]) === parseInt(roundNum) - 1,
      );
      let carryOverHtml = '<span class="carryover-label none">이월 없음</span>';

      if (prevForCarry) {
        const prevNums = [1, 2, 3, 4, 5, 6, "보너스"].map((k) =>
          parseInt(
            prevForCarry[
              k === "보너스"
                ? prevForCarry["보너스"]
                  ? "보너스"
                  : "보너스번호"
                : `${k}번`
            ],
          ),
        );
        const carryOvers = nums.filter((n) => prevNums.includes(n));
        if (carryOvers.length > 0) {
          carryOverHtml = `<div class="balls-container">${carryOvers.map((n) => `<div class="ball ${getRangeClass(n)}">${n}</div>`).join("")}</div>`;
        }
      }

      return `
        <div class="info-row-item ${label === "대상" ? "target-row" : ""}">
            <div class="result-numbers-row">
                <span class="row-label">${label} [${roundNum}회]</span>
                <div class="balls-container">
                    ${nums.map((n) => `<div class="ball ${getRangeClass(n)}">${n}</div>`).join("")}
                    <span class="divider" aria-hidden="true">|</span>
                    <div class="ball bonus ${getRangeClass(bns)}">${bns}</div>
                </div>
                <span class="divider" aria-hidden="true">|</span>
                <span class="sum-value" title="합계">합: ${sum}</span>
                <span class="divider" aria-hidden="true">|</span>
                <div class="pattern-badge-main">
                    <span class="pattern-label-text">패턴: <strong>${p}</strong></span>
                </div>
                <span class="divider" aria-hidden="true">|</span>
                <div class="carryover-section" title="이전 회차 대비 이월 번호">${carryOverHtml}</div>
            </div>
        </div>`;
    };

    wrapper.innerHTML = `
      <div class="result-item" onclick="toggleTotalSearchAccordion(this, ${index})" role="button" aria-expanded="false" title="상세 정보 보기">
          <div class="result-info">
              <div class="result-numbers-row">
                  <span class="result-round">${currentRoundNum}회</span>
                  <div class="balls-container">
                      ${[1, 2, 3, 4, 5, 6]
                        .map((i) => {
                          const n = row[`${i}번`] || row[i];
                          return `<div class="ball ${getRangeClass(n)}">${n}</div>`;
                        })
                        .join("")}
                      <span class="divider">|</span>
                      <div class="ball bonus ${getRangeClass(row["보너스"] || row["보너스번호"])}">${row["보너스"] || row["보너스번호"]}</div>
                  </div>
                  <span class="divider">|</span>
                  <span class="sum-value">합: ${row["합계"] || 0}</span>
                  <span class="divider">|</span>
                  <div class="pattern-badge-main">
                      <span class="pattern-label-text">패턴: <strong>${row["1~9"] ?? row["1-9"] ?? 0}-${row["10~19"] ?? row["10-19"] ?? 0}-${row["20~29"] ?? row["20-29"] ?? 0}-${row["30~39"] ?? row["30-39"] ?? 0}-${row["40~45"] ?? row["40-45"] ?? 0}</strong></span>
                  </div>
              </div>
          </div>
          <div class="expand-icon" aria-hidden="true">▼</div>
      </div>
      <div class="next-round-info" id="total-next-${index}">
          <div class="accordion-content-inner">
              ${renderRow(prevRound, "이전")}
              <div class="row-separator"></div>
              ${renderRow(row, "대상")}
              <div class="row-separator"></div>
              ${renderRow(nextRound, "다음")}
          </div>
      </div>`;
    listDiv.appendChild(wrapper);
  });

  container.appendChild(listDiv);
  renderPatternMoreButton(lastPatternMatches.length);
}

/**
 * [4] 더 보기 버튼 렌더링
 */
function renderPatternMoreButton(totalLength) {
  let btn = document.getElementById("pattern-load-more-btn");
  if (totalLength > currentPatternDisplayLimit) {
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "pattern-load-more-btn";
      btn.className = "load-more-btn btn-search";
      btn.setAttribute(
        "aria-label",
        `결과 100건 더 보기 (현재 ${currentPatternDisplayLimit}건 표시 중)`,
      );
      btn.setAttribute("title", "데이터 더 보기");
      btn.onclick = () => {
        currentPatternDisplayLimit += 100;
        renderTotalPatternSearch();
      };
      document.getElementById("pattern-result-container").after(btn);
    }
    btn.innerHTML = `더 보기 (${currentPatternDisplayLimit} / ${totalLength}) <span aria-hidden="true">↓</span>`;
  } else if (btn) {
    btn.remove();
  }
}

/**
 * [5] 아코디언 토글 제어
 */
function toggleTotalSearchAccordion(element, index) {
  const nextInfo = document.getElementById(`total-next-${index}`);
  if (!nextInfo) return;
  const iconContainer = element.querySelector(".expand-icon");
  const isExpanded = nextInfo.classList.toggle("expanded");
  element.setAttribute("aria-expanded", isExpanded);
  if (iconContainer)
    iconContainer.style.transform = isExpanded
      ? "rotate(180deg)"
      : "rotate(0deg)";
}
