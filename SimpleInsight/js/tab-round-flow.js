// // [1] 입력 필드 편의 기능 추가
// const flowInput = document.getElementById("flow-round-input");
// if (flowInput) {
//   // 포커스 시 기존 입력 데이터 삭제
//   flowInput.addEventListener("focus", function () {
//     this.value = "";
//   });

//   // 엔터 키 입력 시 검색 실행 지원
//   flowInput.addEventListener("keypress", (e) => {
//     if (e.key === "Enter") {
//       document.getElementById("search-flow-btn").click();
//     }
//   });
// }

// document.getElementById("search-flow-btn").addEventListener("click", () => {
//   const roundInput = document.getElementById("flow-round-input").value;
//   const targetRound = parseInt(roundInput);

//   if (typeof lottoData === "undefined" || lottoData.length === 0) {
//     showToast("먼저 CSV 파일을 불러오세요.");
//     return;
//   }
//   if (!targetRound || targetRound < 1) {
//     showToast("올바른 회차 번호를 입력하세요.");
//     return;
//   }
//   renderRoundFlow(targetRound);
// });

// // function renderRoundFlow(targetRound) {
// //     const container = document.getElementById('flow-result-container');
// //     if (!container) return;
// //     container.innerHTML = '';

// //     const startRound = Math.max(1, targetRound - 5);
// //     const latestRound = Math.max(...lottoData.map(d => parseInt(d['회차'] || d['No'] || 0)));
// //     const endRound = Math.min(latestRound, targetRound + 5);

// //     const flowData = lottoData
// //         .filter(row => {
// //             const r = parseInt(row['회차'] || row['No']);
// //             return r >= startRound && r <= endRound;
// //         })
// //         .sort((a, b) => parseInt(a['회차'] || a['No']) - parseInt(b['회차'] || b['No']));

// //     if (flowData.length === 0) {
// //         container.innerHTML = '<p class="no-result">데이터를 찾을 수 없습니다.</p>';
// //         return;
// //     }

// //     const resultOuter = document.createElement('div');
// //     resultOuter.className = 'pattern-result';
// //     resultOuter.style.width = '100%';

// //     const flowList = document.createElement('div');
// //     flowList.className = 'result-list flow-list';
// //     flowList.style.display = 'flex';
// //     flowList.style.flexDirection = 'column';
// //     flowList.style.gap = '8px';

// //     flowData.forEach(row => {
// //         const currentRound = parseInt(row['회차'] || row['No']);
// //         const isTarget = currentRound === targetRound;

// //         // 데이터 필드명 유연하게 대응 (공백 제거 등)
// //         const numbers = [
// //             row['1번'] || row['1'], row['2번'] || row['2'],
// //             row['3번'] || row['3'], row['4번'] || row['4'],
// //             row['5번'] || row['5'], row['6번'] || row['6']
// //         ];
// //         const bonus = row['보너스'] || row['보너스번호'] || row['bonus'];
// //         const sum = row['합계'] || numbers.reduce((a, b) => a + (parseInt(b) || 0), 0);

// //         const wrapper = document.createElement('div');
// //         wrapper.className = `result-wrapper ${isTarget ? 'active' : ''}`;

// //         wrapper.style.margin = '0';
// //         wrapper.style.width = '100%';
// //         wrapper.style.boxSizing = 'border-box';

// //         if (isTarget) {
// //             wrapper.style.border = '2px solid #3182ce';
// //             wrapper.style.backgroundColor = '#2d3748';
// //             wrapper.style.borderRadius = '12px';
// //             wrapper.style.zIndex = '1';
// //             wrapper.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
// //         } else {
// //             wrapper.style.border = '1px solid transparent';
// //             wrapper.style.backgroundColor = 'transparent';
// //         }

// //         wrapper.innerHTML = `
// //             <div class="result-item" style="padding: 12px 16px;">
// //                 <div class="result-info" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
// //                     <div class="result-round" style="min-width: 70px; font-weight: 800; color: ${isTarget ? '#63b3ed' : '#a0aec0'}; font-size: 1.1rem;">
// //                         ${currentRound}회
// //                     </div>

// //                     <div class="result-numbers" style="flex: 1; display: flex; align-items: center; gap: 12px; justify-content: center;">
// //                         ${numbers.map(n => `<div class="ball ${getRangeClass(n)}" style="width:36px; height:36px; line-height:36px; font-size:1rem;">${n}</div>`).join('')}

// //                         <span class="divider" style="color: #4a5568; margin: 0 8px; font-size: 1.2rem;">|</span>
// //                         <div class="ball bonus ${getRangeClass(bonus)}" style="width:36px; height:36px; line-height:36px; font-size:1rem;">${bonus}</div>

// //                         <span class="divider" style="color: #4a5568; margin: 0 8px; font-size: 1.2rem;">|</span>
// //                         <span class="sum-value" style="font-weight: 800; color: #f6ad55; font-size: 1.2rem; min-width: 35px;">${sum}</span>

// //                         <span class="divider" style="color: #4a5568; margin: 0 8px; font-size: 1.2rem;">|</span>
// //                         <span class="pattern-text" style="font-size: 1.1rem; font-weight: 800; color: #e2e8f0; letter-spacing: 1px;">
// //                             <span style="color: #63b3ed; font-size: 0.85rem; margin-right: 6px; font-weight: 700;">패턴</span>${row['1-9'] || 0}-${row['10-19'] || 0}-${row['20-29'] || 0}-${row['30-39'] || 0}-${row['40-45'] || 0}
// //                         </span>
// //                     </div>
// //                 </div>
// //             </div>
// //         `;

// //         wrapper.addEventListener('mouseenter', () => {
// //             wrapper.style.backgroundColor = '#2d3748';
// //             wrapper.style.borderRadius = '12px';
// //         });
// //         wrapper.addEventListener('mouseleave', () => {
// //             wrapper.style.backgroundColor = isTarget ? '#2d3748' : 'transparent';
// //         });

// //         flowList.appendChild(wrapper);
// //     });

// //     resultOuter.appendChild(flowList);
// //     container.appendChild(resultOuter);
// // }

// function renderRoundFlow(targetRound) {
//   const container = document.getElementById("flow-result-container");
//   if (!container) return;

//   // 1. 기존 내용 비우기 및 클래스 설정 (중첩 제거)
//   container.innerHTML = "";
//   container.className = "result-list flow-list";

//   // 2. 출력 범위 계산 (targetRound ± 5)
//   const startRound = Math.max(1, targetRound - 5);
//   const latestRound = Math.max(
//     ...lottoData.map((d) => parseInt(d["회차"] || d["No"] || 0)),
//   );
//   const endRound = Math.min(latestRound, targetRound + 5);

//   // 3. 데이터 필터링 및 정렬
//   const flowData = lottoData
//     .filter((row) => {
//       const r = parseInt(row["회차"] || row["No"]);
//       return r >= startRound && r <= endRound;
//     })
//     .sort(
//       (a, b) => parseInt(a["회차"] || a["No"]) - parseInt(b["회차"] || b["No"]),
//     );

//   if (flowData.length === 0) {
//     container.innerHTML = '<p class="no-result">데이터를 찾을 수 없습니다.</p>';
//     return;
//   }

//   // 4. 리스트 생성 (인라인 스타일 제거)
//   flowData.forEach((row) => {
//     const currentRound = parseInt(row["회차"] || row["No"]);
//     const isTarget = currentRound === targetRound;

//     const numbers = [
//       row["1번"] || row["1"],
//       row["2번"] || row["2"],
//       row["3번"] || row["3"],
//       row["4번"] || row["4"],
//       row["5번"] || row["5"],
//       row["6번"] || row["6"],
//     ];
//     const bonus = row["보너스"] || row["보너스번호"] || row["bonus"];
//     const sum =
//       row["합계"] || numbers.reduce((a, b) => a + (parseInt(b) || 0), 0);

//     const wrapper = document.createElement("div");
//     wrapper.className = `result-wrapper ${isTarget ? "active" : ""}`;

//     wrapper.innerHTML = `
//             <div class="result-item">
//                 <div class="result-info">
//                     <div class="result-round">${currentRound}회</div>
//                     <div class="result-numbers">
//                         ${numbers.map((n) => `<div class="ball ${getRangeClass(n)}">${n}</div>`).join("")}
//                         <span class="divider">|</span>
//                         <div class="ball bonus ${getRangeClass(bonus)}">${bonus}</div>
//                         <span class="divider">|</span>
//                         <span class="sum-value">${sum}</span>
//                         <span class="divider">|</span>
//                         <span class="pattern-text">
//                             <small class="pattern-label">패턴</small>${row["1~9"] || 0}-${row["10~19"] || 0}-${row["20~29"] || 0}-${row["30~39"] || 0}-${row["40~45"] || 0}
//                         </span>
//                     </div>
//                 </div>
//             </div>
//         `;
//     container.appendChild(wrapper);
//   });
// }

// // 붙여넣기 입력 처리
// document
//   .getElementById("flow-batch-input")
//   .addEventListener("input", function (e) {
//     // 줄바꿈 방지 처리
//     this.value = this.value.replace(/\r?\n|\r/g, " ");

//     const nums = this.value.match(/\d+/g);
//     const select = document.getElementById("flow-round-select");
//     select.innerHTML = '<option value="">회차 선택</option>';

//     if (nums) {
//       // 중복 제거 및 최신순 정렬
//       [...new Set(nums)]
//         .map(Number)
//         .sort((a, b) => b - a)
//         .forEach((n) => {
//           const opt = document.createElement("option");
//           opt.value = n;
//           opt.textContent = `${n}회 선택`;
//           select.appendChild(opt);
//         });
//     }
//   });

// // 콤보박스 선택 시 조회 실행
// document
//   .getElementById("flow-round-select")
//   .addEventListener("change", function (e) {
//     if (e.target.value) {
//       const input = document.getElementById("flow-round-input");
//       input.value = e.target.value;
//       document.getElementById("search-flow-btn").click();
//     }
//   });

// ============================================================================
// [tab-flow.js] 회차별 흐름 분석 (±5회차 출력)
// ============================================================================

// [1] 입력 필드 편의 기능 및 이벤트 바인딩
const flowInput = document.getElementById("flow-round-input");
if (flowInput) {
  flowInput.setAttribute("aria-label", "분석할 회차 번호 입력");
  flowInput.addEventListener("focus", function () {
    this.value = "";
  });
  flowInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("search-flow-btn").click();
  });
}

document.getElementById("search-flow-btn").addEventListener("click", () => {
  const roundInput = document.getElementById("flow-round-input").value;
  const targetRound = parseInt(roundInput);

  if (!lottoData || lottoData.length === 0) {
    showToast("먼저 CSV 파일을 불러오세요.");
    return;
  }
  if (!targetRound || targetRound < 1) {
    showToast("올바른 회차 번호를 입력하세요.");
    return;
  }
  renderRoundFlow(targetRound);
});

/**
 * [2] 회차 흐름 렌더링 (±5회차 범위)
 */
function renderRoundFlow(targetRound) {
  const container = document.getElementById("flow-result-container");
  if (!container) return;

  container.innerHTML = "";
  container.className = "result-list flow-list";

  // 데이터 범위 계산 (최적화: 전체 배열 순회 최소화)
  const latestRound = Math.max(
    ...lottoData.map((d) => parseInt(d["회차"] || d["No"] || 0)),
  );
  const startRound = Math.max(1, targetRound - 5);
  const endRound = Math.min(latestRound, targetRound + 5);

  // 필터링 및 정렬
  const flowData = lottoData
    .filter((row) => {
      const r = parseInt(row["회차"] || row["No"]);
      return r >= startRound && r <= endRound;
    })
    .sort(
      (a, b) => parseInt(a["회차"] || a["No"]) - parseInt(b["회차"] || b["No"]),
    );

  if (flowData.length === 0) {
    container.innerHTML =
      '<p class="no-result" role="alert">데이터를 찾을 수 없습니다.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  flowData.forEach((row) => {
    const currentRound = parseInt(row["회차"] || row["No"]);
    const isTarget = currentRound === targetRound;

    const numbers = [1, 2, 3, 4, 5, 6].map((i) => row[`${i}번`] || row[i]);
    const bonus = row["보너스"] || row["보너스번호"] || row["bonus"];
    const sum =
      row["합계"] || numbers.reduce((a, b) => a + (parseInt(b) || 0), 0);

    // 패턴 필드 매핑 (CSV 헤더 호환성)
    const p1 = row["1~9"] ?? 0,
      p2 = row["10~19"] ?? 0,
      p3 = row["20~29"] ?? 0,
      p4 = row["30~39"] ?? 0,
      p5 = row["40~45"] ?? 0;

    const wrapper = document.createElement("div");
    wrapper.className = `result-wrapper ${isTarget ? "active" : ""}`;
    if (isTarget) wrapper.setAttribute("title", "조회하신 대상 회차입니다.");

    wrapper.innerHTML = `
            <div class="result-item" role="article">
                <div class="result-info">
                    <div class="result-round">${currentRound}회</div>
                    <div class="result-numbers-row">
                        <div class="balls-container">
                            ${numbers.map((n) => `<div class="ball ${getRangeClass(n)}" title="당첨번호 ${n}">${n}</div>`).join("")}
                            <span class="divider" aria-hidden="true">|</span>
                            <div class="ball bonus ${getRangeClass(bonus)}" title="보너스번호 ${bonus}">${bonus}</div>
                        </div>
                        <span class="divider" aria-hidden="true">|</span>
                        <span class="sum-value" title="번호 합계">합: ${sum}</span>
                        <span class="divider" aria-hidden="true">|</span>
                        <div class="pattern-badge-main">
                            <span class="pattern-label-text" title="구간별 출현 개수">
                                패턴: ${p1}-${p2}-${p3}-${p4}-${p5}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    fragment.appendChild(wrapper);
  });

  container.appendChild(fragment);

  // 타겟 회차로 스크롤 이동 (사용자 편의)
  const activeEl = container.querySelector(".result-wrapper.active");
  if (activeEl)
    activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * [3] 대량 회차 붙여넣기 및 셀렉트박스 업데이트
 */
const batchInput = document.getElementById("flow-batch-input");
if (batchInput) {
  batchInput.setAttribute("title", "여러 회차 번호를 붙여넣으세요.");
  batchInput.addEventListener("input", function (e) {
    this.value = this.value.replace(/\r?\n|\r/g, " ");
    const nums = this.value.match(/\d+/g);
    const select = document.getElementById("flow-round-select");
    if (!select) return;

    select.innerHTML = '<option value="">회차 선택</option>';

    if (nums) {
      [...new Set(nums)]
        .map(Number)
        .sort((a, b) => b - a) // 최신순 정렬
        .forEach((n) => {
          const opt = document.createElement("option");
          opt.value = n;
          opt.textContent = `${n}회 분석하기`;
          select.appendChild(opt);
        });
    }
  });
}

// 콤보박스 선택 이벤트
const roundSelect = document.getElementById("flow-round-select");
if (roundSelect) {
  roundSelect.setAttribute("aria-label", "분석할 회차를 선택하세요");
  roundSelect.addEventListener("change", function (e) {
    if (e.target.value) {
      const input = document.getElementById("flow-round-input");
      input.value = e.target.value;
      document.getElementById("search-flow-btn").click();
    }
  });
}
