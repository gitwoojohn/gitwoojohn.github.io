// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
let lottoData = [];
const lottoIndex = new Map(); // 빠른 검색을 위한 인덱스 저장소

// ============================================================================
// CSV LOADING WITH AUTO FETCH
// ============================================================================
// document.addEventListener('DOMContentLoaded', () => {
//     // 1. 서버에 올린 CSV 파일의 경로 (파일명 대소문자 주의!)
//     const csvUrl = './ReadWeb-WinningNumbers.csv';

//     Papa.parse(csvUrl, {
//         download: true,
//         header: true,
//         skipEmptyLines: true,
//         dynamicTyping: true,
//         complete: function(results) {
//             //console.log("CSV 로드 성공:", results.data);
//             console.log("CSV 자동 로딩 성공");

//             // [핵심] 전역 변수 lottoData에 데이터 저장
//             lottoData = results.data.filter(row => row['회차']);

//             if (lottoData.length > 0) {
//                 // 1. 사이드바 리포트 텍스트 업데이트
//                 const reportText = document.getElementById('report-text');
//                 if (reportText) reportText.textContent = `${lottoData.length}개의 회차 데이터를 자동으로 불러왔습니다.`;

//                 // 2. [중요] 타 파일(tab-analysis.js 등)에 있는 분석 함수들 호출
//                 if (typeof analyzeData === 'function') analyzeData();       // 전체 분석
//                 if (typeof analyzePatterns === 'function') analyzePatterns(); // 패턴 분석

//                 // 3. 첫 화면(analysis 탭) 강제 업데이트
//                 if (typeof updateSidebarInfo === 'function') {
//                     updateSidebarInfo('analysis');
//                 }
//             }
//         },
//         error: function(err) {
//             console.error("CSV 자동 로딩 실패:", err);
//             const reportText = document.getElementById('report-text');
//             if (reportText) reportText.textContent = "CSV 파일을 찾을 수 없습니다. (파일명 확인 필요)";
//         }
//     });
// });

//------------------------------------------------------------------------------------
// 개선 포인트

// 인덱스 사전 생성: lottoIndex에 데이터를 미리 담아두면,
// 나중에 패턴 검색 결과에서 "다음 회차" 정보를 찾을 때 find() 루프를 돌지 않고
// 즉시 호출할 수 있어 성능이 크게 향상됩니다.

// 상태 표시 가독성: 로딩 실패 시 텍스트 색상을 변경하여 사용자에게 명확한 피드백을 줍니다.

// 안정성: lottoIndex.clear()를 통해 데이터가 중복으로 쌓이는 것을 방지했습니다.

document.addEventListener("DOMContentLoaded", () => {
  const csvUrl = "https://gitwoojohn.github.io/ReadWeb-WinningNumbers.csv";

  Papa.parse(csvUrl, {
    download: true,
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    complete: function (results) {
      console.log("CSV 자동 로딩 성공");

      // 데이터 필터링 및 저장
      lottoData = results.data.filter((row) => row["회차"]);

      if (lottoData.length > 0) {
        // 1. [최적화] 회차별 데이터 인덱싱 (O(1) 접근 가능)
        lottoIndex.clear();
        lottoData.forEach((row) => lottoIndex.set(parseInt(row["회차"]), row));

        if (typeof renderTotalList === "function") renderTotalList();

        // 2. UI 업데이트 (웹 접근성 title 추가 권장)
        const reportText = document.getElementById("report-text");
        if (reportText) {
          reportText.textContent = `${lottoData.length}개의 회차 데이터를 로드했습니다.`;
          reportText.setAttribute("title", "데이터 로드 완료 상태");
        }

        // 3. 분석 함수 호출 (함수 존재 여부 체크)
        if (typeof analyzeData === "function") analyzeData();
        if (typeof analyzePatterns === "function") analyzePatterns();
        if (typeof updateSidebarInfo === "function")
          updateSidebarInfo("analysis");
      }
    },
    error: function (err) {
      console.error("CSV 자동 로딩 실패:", err);
      const reportText = document.getElementById("report-text");
      if (reportText) {
        reportText.textContent = "CSV 로딩 실패: 파일명을 확인하세요.";
        reportText.style.color = "red"; // 오류 시각화
      }
    },
  });
});
//-------------------------------------------------------------------------------

// 기존에 파일 업로드 시 실행되던 로직을 함수로 분리해두면 관리가 편합니다.
function processData(data) {
  // 예: 전체 분석 업데이트, 차트 그리기 등
  // updateAllVisuals(data);
  document.getElementById("report-text").textContent =
    "데이터가 자동으로 로드되었습니다.";
}
// ============================================================================
// CSV LOADING
// ============================================================================
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    encoding: "UTF-8",
    complete: function (results) {
      lottoData = results.data.filter((row) => row["회차"]);
      showToast(`${lottoData.length}개의 회차 데이터를 불러왔습니다.`);

      // 각 탭의 분석 함수 호출
      if (typeof analyzeData === "function") analyzeData();
      if (typeof analyzePatterns === "function") analyzePatterns();
    },
    error: function (error) {
      console.error("CSV 파싱 오류:", error);
      showToast("CSV 파일을 읽는 중 오류가 발생했습니다.");
    },
  });
}

// ============================================================================
// localhost에서만 자동 로딩
// ============================================================================
// if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
//     fetch('ReadWeb-WinningNumbers.csv')
//         .then(response => response.text())
//         .then(csvText => {
//             Papa.parse(csvText, {
//                 header: true,
//                 dynamicTyping: true,
//                 skipEmptyLines: true,
//                 complete: (results) => {
//                     lottoData = results.data.filter(row => row['회차']);
//                     // 분석 함수 자동 호출
//                     if (typeof analyzeData === 'function') analyzeData();
//                     if (typeof analyzePatterns === 'function') analyzePatterns();
//                 }
//             });
//         });
// }

// ============================================================================
// TAB SWITCHING
// ============================================================================
document.addEventListener("DOMContentLoaded", function () {
  // CSV 파일 업로드
  const csvFileInput = document.getElementById("csvFile");
  if (csvFileInput) {
    csvFileInput.addEventListener("change", handleFileUpload);
  }

  // 탭 전환
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const targetTab = this.getAttribute("data-tab");

      // 모든 탭 버튼 비활성화
      document
        .querySelectorAll(".tab-btn")
        .forEach((btn) => btn.classList.remove("active"));

      // 클릭된 탭 활성화
      this.classList.add("active");

      // 모든 탭 컨텐츠 숨기기
      document
        .querySelectorAll(".tab-content")
        .forEach((content) => content.classList.remove("active"));

      // 선택된 탭 컨텐츠 표시
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add("active");
      }

      // [수정 포인트] 클릭 시 사이드바 정보 업데이트 함수 호출
      if (typeof updateSidebarInfo === "function") {
        updateSidebarInfo(targetTab);
      }
    });
  });
});
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function getRangeClass(number) {
  const v = Number(number);
  if (v >= 1 && v <= 9) return "range-1";
  if (v >= 10 && v <= 19) return "range-10";
  if (v >= 20 && v <= 29) return "range-20";
  if (v >= 30 && v <= 39) return "range-30";
  if (v >= 40 && v <= 45) return "range-40";
  return "";
}

/**
 * 번호에 해당하는 구간 인덱스 반환 (0~4)
 * @param {number} number
 * @returns {number} 0: 1-9, 1: 10-19, 2: 20-29, 3: 30-39, 4: 40-45
 */
function getRangeIndex(number) {
  const v = Number(number);
  if (v >= 1 && v <= 9) return 0;
  if (v >= 10 && v <= 19) return 1;
  if (v >= 20 && v <= 29) return 2;
  if (v >= 30 && v <= 39) return 3;
  if (v >= 40 && v <= 45) return 4;
  return -1;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return dateString;
}

// ============================================================================
// COMMON PATTERN FUNCTIONS (3번째, 4번째 탭 공통)
// ============================================================================

/**
 * 패턴 문자열 생성 (예: "3 - 1 - 1 - 1 - 0")
 * @param {Array} numbers - 6개의 로또 번호 배열
 * @returns {string} 구간별 개수 문자열
 */
// function getPatternString(numbers) {
//   let counts = [0, 0, 0, 0, 0];
//   numbers.forEach((n) => {
//     if (n < 10) counts[0]++;
//     else if (n < 20) counts[1]++;
//     else if (n < 30) counts[2]++;
//     else if (n < 40) counts[3]++;
//     else counts[4]++;
//   });
//   return counts.join(" - ");
// }

//개선된 패턴 문자열 생성 함수
function getPatternString(numbers) {
  // 1. 객체이고 이미 패턴 정보가 있는 경우 (CSV 원본 데이터 활용)
  if (
    !Array.isArray(numbers) &&
    numbers["1~9"] !== undefined &&
    numbers["10~19"] !== undefined
  ) {
    return [
      numbers["1~9"],
      numbers["10~19"],
      numbers["20~29"],
      numbers["30~39"],
      numbers["40~45"],
    ].join(" - ");
  }

  // 2. 번호 배열 또는 번호 필드만 있는 객체인 경우 (계산 필요)
  const nums = Array.isArray(numbers)
    ? numbers
    : [
        numbers["1번"] || numbers["1"],
        numbers["2번"] || numbers["2"],
        numbers["3번"] || numbers["3"],
        numbers["4번"] || numbers["4"],
        numbers["5번"] || numbers["5"],
        numbers["6번"] || numbers["6"],
      ];

  const counts = [0, 0, 0, 0, 0];

  // 구간별 개수 집계
  for (const n of nums) {
    const index = Math.floor((Number(n) - 1) / 10);
    counts[index]++;
  }

  return counts.join(" - ");
}

// function getPatternString(row) {
//   if (!row) return "0-0-0-0-0";

//   // 객체에서 1~6번 번호 추출
//   const nums = [1, 2, 3, 4, 5, 6]
//     .map((i) => parseInt(row[`${i}번`] || row[i]))
//     .filter((n) => !isNaN(n));

//   if (nums.length < 6) return "0-0-0-0-0";

//   const counts = [0, 0, 0, 0, 0]; // [1-9, 10-19, 20-29, 30-39, 40-45]

//   nums.forEach((n) => {
//     // 1-9: 0, 10-19: 1, 20-29: 2, 30-39: 3, 40-45: 4
//     let idx = Math.floor(n / 10);
//     if (idx > 4) idx = 4; // 40번대 이상은 모두 마지막 인덱스
//     counts[idx]++;
//   });

//   return counts.join("-");
// }

/**
 * 공(Ball) 요소 생성
 * @param {number} number - 로또 번호
 * @param {boolean} isDashed - 보너스 볼 여부 (점선 테두리)
 * @returns {HTMLElement} 공 요소
 */
function createBallElement(number, isDashed = false) {
  const ball = document.createElement("div");
  ball.className = `ball ${getRangeClass(number)}`;
  ball.textContent = number;

  if (isDashed) {
    ball.classList.add("bonus");
  }

  return ball;
}

/**
 * 상세 패널 구분선 생성
 * @returns {HTMLElement} 구분선 요소
 */
function createDetailSeparator() {
  const separator = document.createElement("div");
  separator.className = "detail-separator";
  return separator;
}

/**
 * 상세 행(Detail Row) 생성
 * @param {Object} roundData - 회차 데이터
 * @param {string} title - 제목 (예: "직전 회차 (원인)")
 * @param {string} desc - 설명
 * @returns {HTMLElement} 상세 행 요소
 */
function createDetailRow(roundData, title, desc) {
  const row = document.createElement("div");
  row.className = "detail-row";

  if (!roundData) {
    const descDiv = document.createElement("div");
    descDiv.className = "detail-desc";
    descDiv.textContent = `${title}: 데이터가 없습니다.`;
    row.appendChild(descDiv);
    return row;
  }

  // 1. 타이틀 섹션
  const titleSection = document.createElement("div");
  titleSection.className = "detail-title-section";
  const titleDiv = document.createElement("div");
  titleDiv.className = "detail-title";
  titleDiv.textContent = title;
  const roundDiv = document.createElement("div");
  roundDiv.className = "detail-round";
  roundDiv.textContent = `${roundData["회차"]}회`;
  titleSection.appendChild(titleDiv);
  titleSection.appendChild(roundDiv);
  row.appendChild(titleSection);

  // 2. 공 섹션
  const ballsSection = document.createElement("div");
  ballsSection.className = "detail-balls-section";

  const ballsContainer = document.createElement("div");
  ballsContainer.className = "balls-container";
  const nums = [
    roundData["1번"],
    roundData["2번"],
    roundData["3번"],
    roundData["4번"],
    roundData["5번"],
    roundData["6번"],
  ];
  nums.forEach((n) => ballsContainer.appendChild(createBallElement(n)));
  ballsSection.appendChild(ballsContainer);

  // 보너스 구분선 및 공
  const divider1 = document.createElement("span");
  divider1.className = "divider";
  divider1.textContent = "|";
  ballsSection.appendChild(divider1);
  ballsSection.appendChild(createBallElement(roundData["보너스"], true));

  // [추가] 합계 섹션 (| 숫자)
  const dividerSum = document.createElement("span");
  dividerSum.className = "divider";
  dividerSum.textContent = "|";

  ballsSection.appendChild(dividerSum);

  const sumValue = document.createElement("strong");
  sumValue.style.marginLeft = "1px"; // 숫자 왼쪽 간격을 4px로 축소 (기존 8px에서 변경)
  sumValue.style.marginRight = "1px"; // 숫자 오른쪽 간격도 4px로 설정
  sumValue.textContent = roundData["합계"] || nums.reduce((a, b) => a + b, 0);
  ballsSection.appendChild(sumValue);

  // [복구] 패턴 섹션 (| 패턴)
  const dividerPattern = document.createElement("span");
  dividerPattern.className = "divider";
  dividerPattern.textContent = "|";
  ballsSection.appendChild(dividerPattern);

  const patternBadge = document.createElement("div");
  patternBadge.className = "detail-pattern-badge";
  const patternLabel = document.createElement("span");
  patternLabel.className = "label";
  patternLabel.textContent = "패턴";
  const patternValue = document.createElement("strong");
  patternValue.textContent = getPatternString(nums);

  patternBadge.appendChild(patternLabel);
  patternBadge.appendChild(patternValue);
  ballsSection.appendChild(patternBadge);

  row.appendChild(ballsSection);

  // 3. 설명 섹션
  const descSection = document.createElement("div");
  descSection.className = "detail-desc";
  descSection.textContent = desc;
  row.appendChild(descSection);

  return row;
}

const tabInfoMessages = {
  analysis:
    "<strong>전체 통계 분석</strong>: 장기 미출현 번호 및 끝수 분포 등 전체적인 흐름을 분석합니다.",
  pattern:
    "<strong>구간 패턴 분석</strong>: 현재 설정된 구간별 공 개수 조합이 과거에 언제 나타났는지 찾아냅니다.",
  "pattern-stats-add":
    "<strong>이월합 분석</strong>: 직전 회차 보너스 번호와 당첨 번호의 합산 규칙 패턴을 분석합니다.",
  "pattern-stats-multiple":
    "<strong>이월곱 분석</strong>: 직전 회차 보너스 번호와 당첨 번호의 곱셈 규칙 패턴을 분석합니다.",
  "custom-search":
    "<strong>회차/합계 검색</strong>: 특정 회차 이후의 흐름이나 특정 합계 범위를 가진 회차들을 필터링하여 분석합니다.",
  "round-flow":
    "<strong>회차 흐름 분석</strong>: 입력한 회차를 중심으로 전후 5회차씩 총 11회의 당첨 흐름을 분석합니다.",
  "total-search-pattern":
    "<strong>종합 패턴 검색</strong>: AI 기반 알고리즘을 통해 복합적인 패턴 흐름을 예측합니다.",
};

// 2. 사이드바 업데이트 함수
function updateSidebarInfo(tabId) {
  const infoArea = document.getElementById("insight-content");
  if (!infoArea) return;

  // [핵심] 구간 패턴(2번 탭) 복구 로직
  if (tabId === "pattern") {
    try {
      const resultList = document.getElementById("pattern-list");
      // 결과가 이미 화면에 그려져 있다면 인사이트 재호출
      if (resultList && resultList.querySelector(".result-wrapper")) {
        const roundElements = resultList.querySelectorAll(".result-round");
        const rounds = Array.from(roundElements).map((el) =>
          parseInt(el.textContent),
        );
        const matches = lottoData.filter((row) => rounds.includes(row["회차"]));

        // tab-pattern.js의 함수가 존재할 때만 실행
        if (matches.length > 0 && typeof updateSidebarInsight === "function") {
          updateSidebarInsight(matches);
          return; // 성공 시 아래 가이드 문구는 출력 안 함
        }
      }
    } catch (e) {
      console.warn("인사이트 복구 중 오류 발생:", e);
    }
  }

  // 기본 가이드 문구 출력
  if (tabInfoMessages[tabId]) {
    infoArea.innerHTML = `<div class="guide-msg"><p>${tabInfoMessages[tabId]}</p></div>`;
  }
}

// 3. 탭 전환 이벤트 리스너
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const targetTab = this.getAttribute("data-tab");

      // 버튼 active 교체
      document
        .querySelectorAll(".tab-btn")
        .forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      // 컨텐츠 active 교체
      document
        .querySelectorAll(".tab-content")
        .forEach((content) => content.classList.remove("active"));
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add("active");
      }

      // 사이드바 업데이트 실행
      updateSidebarInfo(targetTab);
    });
  });
});

/**
 * 상세 패널 생성
 * @param {Object} data - 패턴 데이터 {r, n1, n2, rest, curBonus, pr, pb}
 * @returns {HTMLElement} 상세 패널 요소
 */
function createDetailPanel(data) {
  const detailPanel = document.createElement("div");
  detailPanel.className = "detail-panel";
  detailPanel.style.display = "none"; // 아코디언 초기 상태

  const content = document.createElement("div");
  content.className = "detail-panel-content";

  const prevRoundData = lottoData.find((d) => d["회차"] === data.pr);
  const nextRoundData = lottoData.find((d) => d["회차"] === data.r + 1);

  // 1. 직전 회차
  const prevDesc =
    data.operator === "×"
      ? `보너스 ${data.pb} = ${data.n1} × ${data.n2}`
      : `보너스 ${data.pb} = ${data.n1} + ${data.n2}`;
  content.appendChild(createDetailRow(prevRoundData, "직전 회차", prevDesc));

  // 2. [추가] 2번째 탭 전용 예측 인사이트 (연산자가 없을 때 출력)
  // [롤백 및 수정] 이월합(+), 이월곱(×) 등 연산자가 있을 때만 예측 가이드 표시
  //if (data.operator && data.operator !== '') {
  if (!data.operator) {
    content.appendChild(createDetailSeparator());

    const insightBox = document.createElement("div");
    insightBox.className = "detail-prediction-box";

    const allNums = [data.n1, data.n2, ...data.rest];
    const curSum = data.totalSum || allNums.reduce((a, b) => a + b, 0);

    // 구간 개수 계산 (1-9, 10-19...)
    const counts = { "1-9": 0, "10-19": 0, "20-29": 0, "30-39": 0, "40-45": 0 };
    allNums.forEach((n) => {
      if (n <= 9) counts["1-9"]++;
      else if (n <= 19) counts["10-19"]++;
      else if (n <= 29) counts["20-29"]++;
      else if (n <= 39) counts["30-39"]++;
      else counts["40-45"]++;
    });

    // insightBox.innerHTML = `
    //     <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 0.85rem; line-height: 1.6;">
    //         <div style="font-weight: bold; color: #222; margin-bottom: 5px;">🔮 다음 회차 예측 가이드</div>
    //         • <strong>합계 예측:</strong> ${curSum - 15} ~ ${curSum + 15} 사이 권장<br>
    //         • <strong>구간 분포:</strong> ${counts['1-9']} : ${counts['10-19']} : ${counts['20-29']} : ${counts['30-39']} : ${counts['40-45']}<br>
    //         • <strong>강화 예상:</strong> ${Object.keys(counts).find(k => counts[k] === Math.min(...Object.values(counts)))} 구간 (미출현 보정)
    //     </div>
    // `;
    // 배경색과 글자색을 다크테마 변수로 변경
    insightBox.innerHTML = `
            <div style="padding: 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; font-size: 0.85rem; line-height: 1.6; color: var(--text);">
                <div style="font-weight: bold; color: var(--highlight); margin-bottom: 5px;">🔮 다음 회차 예측 가이드</div>
                • <strong style="color: var(--text);">합계 예측:</strong> ${curSum - 15} ~ ${curSum + 15} 사이 권장<br>
                • <strong style="color: var(--text);">구간 분포:</strong> ${counts["1-9"]} : ${counts["10-19"]} : ${counts["20-29"]} : ${counts["30-39"]} : ${counts["40-45"]}<br>
                • <strong style="color: var(--text);">강화 예상:</strong> ${Object.keys(counts).find((k) => counts[k] === Math.min(...Object.values(counts)))} 구간 (미출현 보정)
            </div>
        `;
    content.appendChild(insightBox);
  }

  // 구분선
  content.appendChild(createDetailSeparator());

  // 3. 다음 회차
  content.appendChild(
    createDetailRow(
      nextRoundData,
      "다음 회차",
      nextRoundData ? "이 패턴 이후 출현 번호" : "데이터 없음",
    ),
  );

  detailPanel.appendChild(content);
  return detailPanel;
}

/**
 * 패턴 메인 행 생성
 * @param {Object} data - 패턴 데이터 {r, n1, n2, rest, curBonus, pr, pb, operator}
 * @returns {HTMLElement} 패턴 행 컨테이너
 */
function createPatternRow(data) {
  const container = document.createElement("div");

  // 전체 6개 번호로 패턴 및 합계 계산
  const allNums = [data.n1, data.n2, ...data.rest];
  const patternStr = getPatternString(allNums);
  const totalSum = data.totalSum || allNums.reduce((a, b) => a + b, 0);

  // 1. 메인 행 (클릭 대상)
  const row = document.createElement("div");
  row.className = "pattern-row";

  // 회차
  const roundInfo = document.createElement("div");
  roundInfo.className = "pattern-round-info";

  const roundText = document.createElement("span");
  roundText.className = "pattern-round-text";
  roundText.textContent = `${data.r}회`;
  roundInfo.appendChild(roundText);
  row.appendChild(roundInfo);

  // 공 Wrapper
  const ballsWrapper = document.createElement("div");
  ballsWrapper.className = "pattern-balls-wrapper";

  // 1+2번 or 1×2번 그룹
  const group1 = document.createElement("div");
  group1.className = "pattern-group-main";
  group1.appendChild(createBallElement(data.n1));

  const sign = document.createElement("span");
  sign.className = "pattern-plus-sign";
  sign.textContent = data.operator || "+";
  group1.appendChild(sign);

  group1.appendChild(createBallElement(data.n2));
  ballsWrapper.appendChild(group1);

  const divider1 = document.createElement("span");
  divider1.className = "divider";
  divider1.textContent = "|";
  ballsWrapper.appendChild(divider1);

  // 나머지 공
  const groupRest = document.createElement("div");
  groupRest.className = "balls-container";
  data.rest.forEach((num) => groupRest.appendChild(createBallElement(num)));
  ballsWrapper.appendChild(groupRest);

  const divider2 = document.createElement("span");
  divider2.className = "divider";
  divider2.textContent = "|";
  ballsWrapper.appendChild(divider2);

  // 보너스 공
  ballsWrapper.appendChild(createBallElement(data.curBonus, true));

  // [수정] ▶ 삭제하고 | 합계(1px 간격) 추가
  const dividerSum = document.createElement("span");
  dividerSum.className = "divider";
  dividerSum.textContent = "|";
  dividerSum.style.margin = "0"; // 간격 최소화
  ballsWrapper.appendChild(dividerSum);

  const sumValue = document.createElement("strong");
  sumValue.style.marginLeft = "1px";
  sumValue.style.marginRight = "1px";
  sumValue.textContent = totalSum;
  ballsWrapper.appendChild(sumValue);

  // [수정] 패턴 앞에도 구분선 추가
  const dividerPattern = document.createElement("span");
  dividerPattern.className = "divider";
  dividerPattern.textContent = "|";
  dividerPattern.style.margin = "0";
  ballsWrapper.appendChild(dividerPattern);

  const patternBadge = document.createElement("div");
  patternBadge.className = "pattern-badge-main";

  const patternLabel = document.createElement("span");
  patternLabel.className = "label";
  patternLabel.textContent = "패턴:";

  const patternValue = document.createElement("strong");
  patternValue.textContent = patternStr;

  patternBadge.appendChild(patternLabel);
  patternBadge.appendChild(patternValue);
  ballsWrapper.appendChild(patternBadge);

  row.appendChild(ballsWrapper);

  // 우측 정보 (직전 회차 보너스)
  const rightInfo = document.createElement("div");
  rightInfo.className = "pattern-right-info";

  const prevText = document.createElement("div");
  prevText.className = "pattern-prev-text";
  prevText.textContent = `직전 ${data.pr}회`;

  const bonusText = document.createElement("div");
  bonusText.className = "pattern-bonus-text";
  bonusText.innerHTML = `보너스 <strong class="pattern-bonus-number">${data.pb}</strong>`;

  rightInfo.appendChild(prevText);
  rightInfo.appendChild(bonusText);
  row.appendChild(rightInfo);

  // 화살표 아이콘
  const arrow = document.createElement("div");
  arrow.className = "accordion-arrow-icon";
  arrow.innerHTML = "▼";
  row.appendChild(arrow);

  container.appendChild(row);

  // 2. 상세 패널 (초기 display 설정 추가)
  const detailPanel = createDetailPanel(data);
  detailPanel.style.display = "none"; // 첫 클릭 즉시 작동 보장
  container.appendChild(detailPanel);

  // 3. 클릭 이벤트
  row.addEventListener("click", () => {
    const isHidden = detailPanel.style.display === "none";

    detailPanel.style.display = isHidden ? "block" : "none";
    arrow.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
    row.classList.toggle("active", isHidden);
  });

  return container;
}

// tab-stast.js, tab-stats-multi.js 공통
function renderPatternLayout(containerId, mainTitle, subTitle) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
        <div class="stats-summary-container">
            <div class="stats-title-row">
                <h3>${mainTitle}</h3>
                <span id="total-rounds-badge" class="badge-good">총 0회 분석</span>
            </div>
            <div class="pattern-stats-grid">
                <div class="stat-card">
                    <label>최다 출현 패턴</label>
                    <div id="most-common-pattern">-</div>
                    <div id="pattern-frequency">0회</div>
                </div>
                <div class="stat-card chart-card">
                    <canvas id="rangeAverageChart"></canvas>
                </div>
            </div>
        </div>
        <div class="pattern-results">
            <h3>${subTitle}</h3>
            <div id="${containerId === "pattern-stats-add" ? "special-pattern-list" : "multi-pattern-list"}" class="result-list">
            </div>
        </div>
    `;
}

// 토스트 메시지 함수
function showToast(message) {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // 3초 후 삭제
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function toggleAccordion(element) {
  // 1. 가장 가까운 부모 컨테이너를 찾음
  const wrapper = element.closest(".result-wrapper");
  if (!wrapper) return;

  // 2. 부모에 active 클래스 토글 (CSS 제어용)
  wrapper.classList.toggle("active");

  // 3. 하위 요소(아이콘, 상세정보) 클래스 토글
  const icon = wrapper.querySelector(".expand-icon");
  const info = wrapper.querySelector(".next-round-info");

  if (icon) icon.classList.toggle("rotate");
  if (info) info.classList.toggle("expanded");
}

/**
 * 사이드바 토글 기능
 */
function initSidebarToggle() {
  const toggleBtn = document.getElementById("sidebar-toggle");
  const sidebar = document.querySelector(".sidebar");

  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");

    // 버튼 텍스트 변경 (선택 사항)
    const isCollapsed = sidebar.classList.contains("collapsed");
    toggleBtn.querySelector(".icon").textContent = isCollapsed ? "▶" : "☰";
  });
}

// 초기화 실행
document.addEventListener("DOMContentLoaded", initSidebarToggle);
