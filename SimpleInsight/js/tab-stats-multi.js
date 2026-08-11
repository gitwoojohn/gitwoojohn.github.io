// // ============================================================================
// // [tab-stats-multi.js] 이월곱 분석 (1번 * 2번 = 전회 보너스)
// // - 1구와 2구의 곱이 직전 회차 보너스 번호와 일치하는 패턴 분석
// // - tab-stats.js와 동일한 UI 구조 및 아코디언 기능 제공
// // ============================================================================

// let isMultiStatsAnalyzed = false;

// // 1. 메인 분석 함수
// function analyzeMultiPatterns() {
//     if (!lottoData || lottoData.length === 0) return;
//     if (isMultiStatsAnalyzed) return;

//     renderMultiStatsLayout();
//     updateMultiSpecialPattern();

//     isMultiStatsAnalyzed = true;
// }

// // 2. 탭 클릭 리스너
// document.addEventListener('DOMContentLoaded', () => {
//     const multiTabBtn = document.querySelector('button[data-tab="pattern-stats-multiple"]');
//     if (multiTabBtn) {
//         multiTabBtn.addEventListener('click', () => {
//             if (lottoData.length > 0 && !isMultiStatsAnalyzed) {
//                 analyzeMultiPatterns();
//             }
//         });
//     }
// });

// // ----------------------------------------------------------------------------
// // [Layout] 레이아웃 생성
// // ----------------------------------------------------------------------------
// // function renderMultiStatsLayout() {
// //     const container = document.getElementById('pattern-stats-multiple');
// //     if (!container) return;

// //     container.innerHTML = `
// //         <div class="stats-summary-container" style="flex-direction: column; align-items: stretch; gap: 20px;">
// //             <div style="display: flex; justify-content: space-between; align-items: center;">
// //                 <h3 style="margin:0;">이월곱(×) 패턴 요약</h3>
// //                 <span id="multi-total-badge" class="badge-good" style="font-size: 1rem;">분석 대기</span>
// //             </div>

// //             <div class="pattern-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
// //                 <div class="stat-card" style="background: var(--bg); padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
// //                     <label style="color: var(--accent); font-size: 0.8rem; font-weight: bold;">최다 출현 곱 패턴</label>
// //                     <div id="multi-common-pattern" style="font-size: 1.2rem; font-weight: 800; color: #fff; margin-top: 5px;">-</div>
// //                 </div>
// //                 <div class="stat-card" style="background: var(--bg); padding: 15px; border-radius: 8px; border: 1px solid var(--border); display:flex; align-items:center; justify-content:center;">
// //                     <div style="color: #8b949e; font-size: 0.9rem;">1번 × 2번 = 전회 보너스</div>
// //                 </div>
// //             </div>
// //         </div>

// //         <div class="pattern-results" style="display: flex; flex-direction: column; flex: 1; min-height: 0; margin-top: 0;">
// //             <h3 style="flex-shrink: 0;">특별 패턴 분석 <small style="color: #8b949e; font-size: 0.8rem;">(곱하기 연산)</small></h3>
// //             <div id="multi-pattern-list" class="result-list" style="flex: 1; overflow-y: auto;">
// //                 <!-- 리스트 동적 생성 -->
// //             </div>
// //         </div>
// //     `;
// // }

// function renderMultiStatsLayout() {
//     renderPatternLayout('pattern-stats-multiple', '패턴 통계 요약', '특별 패턴 분석 <small>(1번*2번 곱 = 전회 보너스)</small>');
// }

// // ----------------------------------------------------------------------------
// // [Logic] 이월곱 패턴 분석 및 업데이트
// // ----------------------------------------------------------------------------
// function updateMultiSpecialPattern() {
//     if (lottoData.length < 2) return;
//     const listContainer = document.getElementById('multi-pattern-list');
//     const listTitle = document.querySelector('#pattern-stats-multiple h3 small');

//     if (!listContainer) return;

//     const sortedData = [...lottoData].sort((a, b) => a['회차'] - b['회차']);
//     const matches = [];

//     for (let i = 1; i < sortedData.length; i++) {
//         const cur = sortedData[i];
//         const prev = sortedData[i-1];
//         const n1 = cur['1번'], n2 = cur['2번'], pb = prev['보너스'];

//         // ★ 핵심 로직: 곱하기(*)
//         if (n1 && n2 && pb && (n1 * n2 === pb)) {
//             matches.push({
//                 r: cur['회차'], n1, n2,
//                 rest: [cur['3번'], cur['4번'], cur['5번'], cur['6번']],
//                 curBonus: cur['보너스'],
//                 pr: prev['회차'], pb,
//                 operator: '×' // ← 추가
//             });
//         }
//     }

//     // 리스트 제목 옆에 건수 표시
//     if (listTitle) {
//         listTitle.innerHTML = `(곱하기 연산) <span style="color:var(--accent); margin-left:8px; font-weight:bold;">총 ${matches.length}건</span>`;
//     }

//     // 최신순 정렬 후 렌더링
//     listContainer.innerHTML = '';
//     const fragment = document.createDocumentFragment();

//     if (matches.length === 0) {
//         listContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#8b949e;">해당하는 곱 패턴(1구×2구=전회보너스)이 없습니다.</div>';
//         return;
//     }

//     matches.reverse().forEach(data => fragment.appendChild(createPatternRow(data)));
//     listContainer.appendChild(fragment);
// }

//-----------------------------------------------------------------------------------------------

// ============================================================================
// [tab-stats-multi.js] 이월곱 분석 (1번 * 2번 = 전회 보너스)
// ============================================================================

let isMultiStatsAnalyzed = false;

// 1. 메인 분석 함수
function analyzeMultiPatterns() {
  if (!lottoData || lottoData.length === 0 || isMultiStatsAnalyzed) return;

  renderMultiStatsLayout();
  updateMultiSpecialPattern();

  isMultiStatsAnalyzed = true;
}

// 2. 탭 클릭 리스너
document.addEventListener("DOMContentLoaded", () => {
  const multiTabBtn = document.querySelector(
    'button[data-tab="pattern-stats-multiple"]',
  );
  if (multiTabBtn) {
    multiTabBtn.addEventListener("click", () => {
      if (lottoData.length > 0 && !isMultiStatsAnalyzed) {
        analyzeMultiPatterns();
      }
    });
  }
});

// 3. 레이아웃 생성 (공통 레이아웃 함수 활용)
function renderMultiStatsLayout() {
  renderPatternLayout(
    "pattern-stats-multiple",
    "이월곱(×) 패턴 요약",
    "특별 패턴 분석 <small>(1번*2번 곱 = 전회 보너스)</small>",
  );
}

// 4. 이월곱 패턴 분석 로직
function updateMultiSpecialPattern() {
  if (lottoData.length < 2) return;

  const listContainer = document.getElementById("multi-pattern-list");
  const listTitle = document.querySelector("#pattern-stats-multiple h3 small");
  if (!listContainer) return;

  // 회차순 정렬 후 곱셈 패턴 매칭 (1회 루프)
  const sortedData = [...lottoData].sort((a, b) => a["회차"] - b["회차"]);
  const matches = [];

  for (let i = 1; i < sortedData.length; i++) {
    const cur = sortedData[i];
    const prev = sortedData[i - 1];

    const n1 = Number(cur["1번"]);
    const n2 = Number(cur["2번"]);
    const pb = Number(prev["보너스"]);

    // ★ 핵심 로직: 1구 * 2구 = 전회 보너스
    if (n1 && n2 && pb && n1 * n2 === pb) {
      matches.push({
        r: cur["회차"],
        n1,
        n2,
        rest: [cur["3번"], cur["4번"], cur["5번"], cur["6번"]],
        curBonus: cur["보너스"],
        pr: prev["회차"],
        pb,
        operator: "×",
      });
    }
  }

  // 통계 배지 업데이트 (접근성 고려)
  if (listTitle) {
    listTitle.innerHTML = `(곱하기 연산) <span class="badge-count" title="검색된 패턴 건수">총 ${matches.length}건</span>`;
  }

  // 리스트 초기화 및 렌더링
  listContainer.innerHTML = "";

  if (matches.length === 0) {
    listContainer.innerHTML =
      '<div class="no-data-message">해당하는 곱 패턴이 없습니다.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();
  // 최신순으로 역순 정렬하여 추가
  matches.reverse().forEach((data) => {
    if (typeof createPatternRow === "function") {
      fragment.appendChild(createPatternRow(data));
    }
  });
  listContainer.appendChild(fragment);

  // 요약 카드 업데이트 (필요 시)
  const summaryBadge = document.getElementById("multi-total-badge");
  if (summaryBadge)
    summaryBadge.textContent = `총 ${lottoData.length}회 분석 완료`;
}
