// // ============================================================================
// // [tab-stats.js] 이월합 분석 (인라인 CSS 제거 버전)
// // - 모든 스타일을 tab-stats.css로 이동
// // - DOM 생성 로직은 유지하되 className 기반으로 스타일 적용
// // ============================================================================

// let isStatsAnalyzed = false;

// // 1. 메인 분석 함수
// function analyzePatterns() {
//     if (!lottoData || lottoData.length === 0) return;
//     if (isStatsAnalyzed) return;

//     renderStatsLayout();
//     updateBasicStats();
//     updateSpecialPattern();
//     createRangeChart();

//     isStatsAnalyzed = true;
// }

// // 2. 탭 클릭 리스너
// document.addEventListener('DOMContentLoaded', () => {
//     const patternTabBtn = document.querySelector('button[data-tab="pattern-stats-add"]');
//     if (patternTabBtn) {
//         patternTabBtn.addEventListener('click', () => {
//             if (lottoData.length > 0 && !isStatsAnalyzed) {
//                 analyzePatterns();
//             }
//         });
//     }
// });

// // ----------------------------------------------------------------------------
// // [Layout] 2번째 탭과 동일한 Flex 구조 생성
// // ----------------------------------------------------------------------------
// // function renderStatsLayout() {
// //     const container = document.getElementById('pattern-stats-add');
// //     if (!container) return;

// //     container.innerHTML = `
// //         <div class="stats-summary-container">
// //             <div class="stats-title-row">
// //                 <h3>패턴 통계 요약</h3>
// //                 <span id="total-rounds-badge" class="badge-good">총 0회 분석</span>
// //             </div>

// //             <div class="pattern-stats-grid">
// //                 <div class="stat-card">
// //                     <label>최다 출현 패턴</label>
// //                     <div id="most-common-pattern">-</div>
// //                     <div id="pattern-frequency">0회</div>
// //                 </div>
// //                 <div class="stat-card chart-card">
// //                     <canvas id="rangeAverageChart"></canvas>
// //                 </div>
// //             </div>
// //         </div>

// //         <div class="pattern-results">
// //             <h3>특별 패턴 분석 <small>(1번+2번 합 = 전회 보너스)</small></h3>
// //             <div id="special-pattern-list" class="result-list">
// //                 <!-- 리스트 아이템 동적 생성 -->
// //             </div>
// //         </div>
// //     `;
// // }

// function renderStatsLayout() {
//     renderPatternLayout('pattern-stats-add', '패턴 통계 요약', '특별 패턴 분석 <small>(1번+2번 합 = 전회 보너스)</small>');
// }

// // ----------------------------------------------------------------------------
// // [Logic] 기본 통계 업데이트
// // ----------------------------------------------------------------------------
// // function updateBasicStats() {
// //     const totalEl = document.getElementById('total-rounds-badge');
// //     if (totalEl) totalEl.textContent = `총 ${lottoData.length}회 분석`;

// //     const patternFreq = {};
// //     const rangeSum = { '1-9': 0, '10-19': 0, '20-29': 0, '30-39': 0, '40-45': 0 };

// //     lottoData.forEach(row => {
// //         const nums = [row['1번'], row['2번'], row['3번'], row['4번'], row['5번'], row['6번']];
// //         const patternStr = getPatternString(nums);

// //         // 패턴 빈도
// //         patternFreq[patternStr] = (patternFreq[patternStr] || 0) + 1;

// //         // 구간별 합계 (차트용)
// //         let counts = [0,0,0,0,0];
// //         nums.forEach(n => {
// //             if(n<10) counts[0]++;
// //             else if(n<20) counts[1]++;
// //             else if(n<30) counts[2]++;
// //             else if(n<40) counts[3]++;
// //             else counts[4]++;
// //         });

// //         rangeSum['1-9'] += counts[0];
// //         rangeSum['10-19'] += counts[1];
// //         rangeSum['20-29'] += counts[2];
// //         rangeSum['30-39'] += counts[3];
// //         rangeSum['40-45'] += counts[4];
// //     });

// //     const sorted = Object.entries(patternFreq).sort((a, b) => b[1] - a[1]);
// //     if (sorted.length > 0) {
// //         const [best, count] = sorted[0];
// //         const bestEl = document.getElementById('most-common-pattern');
// //         const freqEl = document.getElementById('pattern-frequency');

// //         if (bestEl) bestEl.textContent = best;
// //         if (freqEl) freqEl.textContent = `${count}회 (${(count / lottoData.length * 100).toFixed(2)}%)`;
// //     }

// //     window.currentRangeSum = rangeSum;
// // }
// function updateBasicStats() {
//     const totalEl = document.getElementById('total-rounds-badge');
//     if (totalEl) totalEl.textContent = `총 ${lottoData.length}회 분석`;

//     const patternFreq = {};
//     const rangeSum = { '1-9': 0, '10-19': 0, '20-29': 0, '30-39': 0, '40-45': 0 };

//     lottoData.forEach(row => {
//         // 1. 사용자님이 확정한 함수로 패턴 문자열 생성
//         const patternStr = getPatternString(row);
//         patternFreq[patternStr] = (patternFreq[patternStr] || 0) + 1;

//         // 2. 차트용 데이터도 사용자님의 핵심 로직(Math.floor)을 그대로 활용
//         const nums = [row['1번'], row['2번'], row['3번'], row['4번'], row['5번'], row['6번']];
//         const keys = ['1-9', '10-19', '20-29', '30-39', '40-45'];

//         nums.forEach(n => {
//             const idx = Math.floor((Number(n) - 1) / 10);
//             rangeSum[keys[idx]]++; // 별도의 if-else 없이 인덱스로 직접 접근
//         });
//     });

//     // 최빈 패턴 출력 (기존 레이아웃 유지)
//     const sorted = Object.entries(patternFreq).sort((a, b) => b[1] - a[1]);
//     if (sorted.length > 0) {
//         const [best, count] = sorted[0];
//         const bestEl = document.getElementById('most-common-pattern');
//         const freqEl = document.getElementById('pattern-frequency');
//         if (bestEl) bestEl.textContent = best;
//         if (freqEl) freqEl.textContent = `${count}회 (${(count / lottoData.length * 100).toFixed(2)}%)`;
//     }

//     window.currentRangeSum = rangeSum;
// }
// // ----------------------------------------------------------------------------
// // [Logic] 차트 생성
// // ----------------------------------------------------------------------------
// function createRangeChart() {
//     const canvas = document.getElementById('rangeAverageChart');
//     if (!canvas || typeof Chart === 'undefined' || !window.currentRangeSum) return;

//     const averages = Object.values(window.currentRangeSum).map(sum => (sum / lottoData.length).toFixed(2));

//     new Chart(canvas.getContext('2d'), {
//         type: 'bar',
//         data: {
//             labels: ['1~9', '10~19', '20~29', '30~39', '40~45'],
//             datasets: [{
//                 data: averages,
//                 backgroundColor: ['#f2cc60', '#58a6ff', '#ff7b72', '#8b949e', '#3fb950'],
//                 barThickness: 10
//             }]
//         },
//         options: {
//             responsive: true, maintainAspectRatio: false,
//             plugins: { legend: { display: false } },
//             scales: { y: { display: false, beginAtZero: true }, x: { grid: { display: false }, ticks: { color: '#8b949e', font: {size: 9} } } }
//         }
//     });
// }

// // ----------------------------------------------------------------------------
// // [Logic] 특별 패턴 업데이트 (메인 함수)
// // ----------------------------------------------------------------------------
// function updateSpecialPattern() {
//     if (lottoData.length < 2) return;
//     const listContainer = document.getElementById('special-pattern-list');

//     const listTitle = document.querySelector('#pattern-stats-add h3 small');

//     if (!listContainer) return;

//     const sortedData = [...lottoData].sort((a, b) => a['회차'] - b['회차']);
//     const matches = [];

//     for (let i = 1; i < sortedData.length; i++) {
//         const cur = sortedData[i];
//         const prev = sortedData[i-1];
//         const n1 = cur['1번'], n2 = cur['2번'], pb = prev['보너스'];

//         if (n1 && n2 && pb && (n1 + n2 === pb)) {
//             matches.push({
//                 r: cur['회차'], n1, n2,
//                 rest: [cur['3번'], cur['4번'], cur['5번'], cur['6번']],
//                 curBonus: cur['보너스'],
//                 pr: prev['회차'], pb,
//                 operator: '+' // ← 추가
//             });
//         }
//     }

//     // 제목 옆 건수 표시
//     if (listTitle) {
//         listTitle.innerHTML = `(1번+2번 합 = 전회 보너스) <span class="badge-count">총 ${matches.length}건</span>`;
//     }

//     listContainer.innerHTML = '';
//     const fragment = document.createDocumentFragment();
//     matches.reverse().forEach(data => fragment.appendChild(createPatternRow(data)));
//     listContainer.appendChild(fragment);
// }

// ============================================================================
// [tab-stats.js] 패턴 통계 및 특별 패턴 분석
// ============================================================================

let isStatsAnalyzed = false;

// 1. 메인 분석 함수
function analyzePatterns() {
  if (!lottoData || lottoData.length === 0 || isStatsAnalyzed) return;

  renderStatsLayout();
  const stats = computeLottoStats(); // 데이터 연산 분리
  updateBasicStatsUI(stats);
  updateSpecialPattern();
  createRangeChart(stats.rangeSum);

  isStatsAnalyzed = true;
}

// 2. 탭 클릭 리스너
document.addEventListener("DOMContentLoaded", () => {
  const patternTabBtn = document.querySelector(
    'button[data-tab="pattern-stats-add"]',
  );
  if (patternTabBtn) {
    patternTabBtn.addEventListener("click", () => {
      if (lottoData.length > 0 && !isStatsAnalyzed) analyzePatterns();
    });
  }
});

function renderStatsLayout() {
  renderPatternLayout(
    "pattern-stats-add",
    "패턴 통계 요약",
    "특별 패턴 분석 <small>(1번+2번 합 = 전회 보너스)</small>",
  );
}

// 3. 데이터 연산 로직 (UI와 분리하여 성능 최적화)
function computeLottoStats() {
  const patternFreq = {};
  const rangeSum = { "1-9": 0, "10-19": 0, "20-29": 0, "30-39": 0, "40-45": 0 };
  const keys = Object.keys(rangeSum);

  lottoData.forEach((row) => {
    // 패턴 빈도 계산
    const patternStr =
      typeof getPatternString === "function"
        ? getPatternString(row)
        : "0-0-0-0-0";
    patternFreq[patternStr] = (patternFreq[patternStr] || 0) + 1;

    // 구간별 출현 횟수 합계 (차트용)
    for (let i = 1; i <= 6; i++) {
      const num = Number(row[`${i}번`]);
      if (!num) continue;
      const idx = getRangeIndex(num);
      if (idx !== -1 && keys[idx]) rangeSum[keys[idx]]++;
    }
  });

  return { patternFreq, rangeSum };
}

// 4. UI 업데이트 로직
function updateBasicStatsUI({ patternFreq, rangeSum }) {
  const totalEl = document.getElementById("total-rounds-badge");
  if (totalEl) totalEl.textContent = `총 ${lottoData.length}회 분석`;

  const sorted = Object.entries(patternFreq).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    const [best, count] = sorted[0];
    const bestEl = document.getElementById("most-common-pattern");
    const freqEl = document.getElementById("pattern-frequency");
    if (bestEl) bestEl.textContent = best;
    if (freqEl)
      freqEl.textContent = `${count}회 (${((count / lottoData.length) * 100).toFixed(2)}%)`;
  }
  window.currentRangeSum = rangeSum;
}

// 5. 차트 생성
function createRangeChart(rangeSum) {
  const canvas = document.getElementById("rangeAverageChart");
  if (!canvas || typeof Chart === "undefined") return;

  const averages = Object.values(rangeSum).map((sum) =>
    (sum / lottoData.length).toFixed(2),
  );

  new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["1~9", "10~19", "20~29", "30~39", "40~45"],
      datasets: [
        {
          data: averages,
          backgroundColor: [
            "#f2cc60",
            "#58a6ff",
            "#ff7b72",
            "#8b949e",
            "#3fb950",
          ],
          barThickness: 12,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { display: false, beginAtZero: true },
        x: {
          grid: { display: false },
          ticks: { color: "#8b949e", font: { size: 10 } },
        },
      },
    },
  });
}

// 6. 특별 패턴 분석
function updateSpecialPattern() {
  if (lottoData.length < 2) return;
  const listContainer = document.getElementById("special-pattern-list");
  const listTitle = document.querySelector("#pattern-stats-add h3 small");
  if (!listContainer) return;

  // 회차순 정렬 후 1회 루프로 매칭 검색
  const sortedData = [...lottoData].sort((a, b) => a["회차"] - b["회차"]);
  const matches = [];

  for (let i = 1; i < sortedData.length; i++) {
    const cur = sortedData[i];
    const prev = sortedData[i - 1];
    if (Number(cur["1번"]) + Number(cur["2번"]) === Number(prev["보너스"])) {
      matches.push({
        r: cur["회차"],
        n1: cur["1번"],
        n2: cur["2번"],
        rest: [cur["3번"], cur["4번"], cur["5번"], cur["6번"]],
        curBonus: cur["보너스"],
        pr: prev["회차"],
        pb: prev["보너스"],
        operator: "+",
      });
    }
  }

  if (listTitle) {
    listTitle.innerHTML = `(1번+2번 합 = 전회 보너스) <span class="badge-count">총 ${matches.length}건</span>`;
  }

  listContainer.innerHTML = "";
  const fragment = document.createDocumentFragment();
  matches.reverse().forEach((data) => {
    if (typeof createPatternRow === "function") {
      fragment.appendChild(createPatternRow(data));
    }
  });
  listContainer.appendChild(fragment);
}
