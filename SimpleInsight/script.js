let charts = {};
let lottoData = [];

const STRATEGY = {
  skip_threshold: 15,
  weights: { skip: 0.3, pair: 0.4, ending: 0.2 },
  sum_range: [100, 175],
};

document.getElementById("csvFile").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (results) => {
      const cleanData = results.data.filter((row) => row["1번"]);
      lottoData = cleanData;
      analyzeLotto(cleanData);
    },
  });
});

// 🔥 숫자에 따른 색상 클래스 반환 함수
function getRangeClass(n) {
  if (n <= 9) return "range-1";
  if (n <= 19) return "range-10";
  if (n <= 29) return "range-20";
  if (n <= 39) return "range-30";
  return "range-40";
}

function analyzeLotto(data) {
  const total = data.length;
  const stats = {
    freq: Array(46).fill(0),
    lastSeen: Array(46).fill(0),
    pairs: {},
    endings: Array(10).fill(0),
  };

  data.forEach((row, idx) => {
    const nums = [
      row["1번"],
      row["2번"],
      row["3번"],
      row["4번"],
      row["5번"],
      row["6번"],
    ].sort((a, b) => a - b);
    nums.forEach((n, i) => {
      stats.freq[n]++;
      stats.lastSeen[n] = idx + 1;
      stats.endings[n % 10]++;
      for (let j = i + 1; j < nums.length; j++) {
        const pair = `${n}-${nums[j]}`;
        stats.pairs[pair] = (stats.pairs[pair] || 0) + 1;
      }
    });
  });

  const skips = Array(46)
    .fill(0)
    .map((_, i) => (i === 0 ? 0 : total - stats.lastSeen[i]));
  const finalScores = Array(46).fill(0);

  for (let i = 1; i <= 45; i++) {
    const skipScore =
      (skips[i] / (Math.max(...skips) || 1)) * STRATEGY.weights.skip;
    let maxP = 0;
    Object.entries(stats.pairs).forEach(([p, count]) => {
      if (p.split("-").includes(String(i))) maxP = Math.max(maxP, count);
    });
    const pairScore = (maxP / total) * STRATEGY.weights.pair;
    const endScore =
      (stats.endings[i % 10] / (total * 6)) * STRATEGY.weights.ending;
    finalScores[i] = skipScore + pairScore + endScore;
  }

  const recommendation = finalScores
    .map((score, num) => ({ num, score }))
    .slice(1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.num)
    .sort((a, b) => a - b);

  const recSum = recommendation.reduce((a, b) => a + b, 0);
  renderDashboard(total, skips, stats, recommendation, recSum);
}

function renderDashboard(total, skips, stats, rec, sum) {
  Object.values(charts).forEach((c) => c.destroy());

  const skipNumbers = skips
    .map((count, num) =>
      num > 0 && count >= STRATEGY.skip_threshold ? num : null,
    )
    .filter((n) => n !== null);
  document.getElementById("kpi-skip-count").innerText =
    skipNumbers.length > 0 ? skipNumbers.join(", ") : "없음";

  const maxPairCount = Math.max(...Object.values(stats.pairs));
  const maxPairNumbers = Object.entries(stats.pairs)
    .filter(([pair, count]) => count === maxPairCount)
    .map(([pair, count]) => pair);
  document.getElementById("kpi-max-pair").innerText =
    maxPairNumbers.length > 0
      ? `${maxPairNumbers[0]} (${maxPairCount}회)`
      : "없음";

  const recContainer = document.getElementById("recommend-numbers");
  recContainer.innerHTML = rec
    .map((n) => `<span class="ball ${getRangeClass(n)}">${n}</span>`)
    .join("");

  const sumVal = document.getElementById("total-sum");
  const sumBadge = document.getElementById("sum-badge");
  sumVal.innerText = sum;

  if (sum >= STRATEGY.sum_range[0] && sum <= STRATEGY.sum_range[1]) {
    sumBadge.innerText = "안정적 합계";
    sumBadge.className = "badge-good";
  } else {
    sumBadge.innerText = "비정형 합계";
    sumBadge.className = "";
  }

  document.getElementById("report-text").innerHTML = `
        추천 조합: <b>${rec.join(", ")}</b> (합계: ${sum})<br><br>
        📍 <b>분석 포인트:</b><br>
        - 색상별 구간 분포를 통해 조합의 균형도를 시각화했습니다.<br>
        - 현재 조합 합계(${sum})는 당첨 확률이 높은 100~175 구간 내에 존재합니다.
    `;

  renderCharts(skips, stats);
}

function renderCharts(skips, stats) {
  const skipWithIndex = skips
    .slice(1)
    .map((count, idx) => ({ num: idx + 1, count }));
  const top5Numbers = skipWithIndex
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((item) => item.num);

  const pointColors = Array.from({ length: 45 }, (_, i) =>
    top5Numbers.includes(i + 1) ? "#ff7b72" : "#58a6ff",
  );

  const pointRadius = Array.from({ length: 45 }, (_, i) =>
    top5Numbers.includes(i + 1) ? 6 : 3,
  );

  const ctx1 = document.getElementById("skipChart").getContext("2d");
  charts.c1 = new Chart(ctx1, {
    type: "line",
    data: {
      labels: Array.from({ length: 45 }, (_, i) => i + 1),
      datasets: [
        {
          label: "미출현 기간",
          data: skips.slice(1),
          borderColor: "#58a6ff",
          fill: true,
          backgroundColor: "rgba(88,166,255,0.1)",
          tension: 0.3,
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          pointRadius: pointRadius,
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        annotation: {
          annotations: {
            thresholdLine: {
              type: "line",
              yMin: 15,
              yMax: 15,
              borderColor: "#ff7b72",
              borderWidth: 2,
              borderDash: [5, 5],
              label: {
                content: "15회 임계선",
                enabled: true,
                position: "end",
                backgroundColor: "rgba(255,123,114,0.8)",
                color: "#fff",
                font: { size: 11 },
              },
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 35,
          grid: {
            color: "#30363d",
          },
        },
        x: {
          grid: {
            color: "#30363d",
          },
        },
      },
    },
  });

  const topPairs = Object.entries(stats.pairs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  const ctx2 = document.getElementById("pairChart").getContext("2d");
  charts.c2 = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: topPairs.map((p) => p[0]),
      datasets: [
        {
          label: "동반 출현",
          data: topPairs.map((p) => p[1]),
          backgroundColor: "#58a6ff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        annotation: {
          annotations: {
            thresholdLine: {
              type: "line",
              yMin: 25,
              yMax: 25,
              borderColor: "#ff7b72",
              borderWidth: 2,
              borderDash: [5, 5],
              label: {
                content: "25회 임계선",
                enabled: true,
                position: "end",
                backgroundColor: "rgba(255,123,114,0.8)",
                color: "#fff",
                font: { size: 11 },
              },
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#63676bff",
            font: { size: 11 },
          },
          grid: {
            color: "#30363d",
          },
        },
        y: {
          ticks: {
            color: "#63676bff",
          },
          grid: {
            color: "#30363d",
          },
        },
      },
    },
  });

  const ctx3 = document.getElementById("endingChart").getContext("2d");
  charts.c3 = new Chart(ctx3, {
    type: "bar",
    data: {
      labels: Array.from(
        { length: 10 },
        (_, i) => `${i}끝 (${stats.endings[i]}개)`,
      ),
      datasets: [
        {
          label: "출현 횟수",
          data: stats.endings,
          backgroundColor: "#58a6ff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        annotation: {
          annotations: {
            thresholdLine: {
              type: "line",
              yMin: 700,
              yMax: 700,
              borderColor: "#ff7b72",
              borderWidth: 2,
              borderDash: [5, 5],
              label: {
                content: "700개 임계선",
                enabled: true,
                position: "end",
                backgroundColor: "rgba(255,123,114,0.8)",
                color: "#fff",
                font: { size: 11 },
              },
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// 개발 모드: 자동 CSV 로드
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  fetch("https://gitwoojohn.github.io/ReadWeb-WinningNumbers.csv")
    .then((response) => response.text())
    .then((csvText) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const cleanData = results.data.filter((row) => row["회차"]);
          lottoData = cleanData;
          analyzeLotto(cleanData);
        },
      });
    })
    .catch((error) => console.error("CSV 자동 로드 실패:", error));
}

// 탭 전환 기능
document.addEventListener("DOMContentLoaded", () => {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;

      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(targetTab).classList.add("active");
    });
  });
});

// 패턴 검색 기능
document.getElementById("searchPattern").addEventListener("click", () => {
  if (lottoData.length === 0) {
    showToast("먼저 CSV 파일을 불러오세요.");
    return;
  }

  const pattern = {
    "1-9": parseInt(document.getElementById("range-1-9").value) || 0,
    "10-19": parseInt(document.getElementById("range-10-19").value) || 0,
    "20-29": parseInt(document.getElementById("range-20-29").value) || 0,
    "30-39": parseInt(document.getElementById("range-30-39").value) || 0,
    "40-45": parseInt(document.getElementById("range-40-45").value) || 0,
  };

  const total = Object.values(pattern).reduce((a, b) => a + b, 0);
  if (total !== 6) {
    showToast("패턴의 합계가 6이 되어야 합니다.");
    return;
  }

  const matches = lottoData.filter((row) => {
    return (
      row["1-9"] === pattern["1-9"] &&
      row["10-19"] === pattern["10-19"] &&
      row["20-29"] === pattern["20-29"] &&
      row["30-39"] === pattern["30-39"] &&
      row["40-45"] === pattern["40-45"]
    );
  });

  displayResults(matches);
});

function displayResults(matches) {
  const resultCount = document.getElementById("result-count");
  const resultList = document.getElementById("pattern-list");

  resultCount.textContent = matches.length;

  if (matches.length === 0) {
    resultList.innerHTML =
      '<p style="color: #8b949e; text-align: center; padding: 40px;">일치하는 회차가 없습니다.</p>';
    return;
  }

  resultList.innerHTML = matches
    .map((row, index) => {
      const numbers = [
        row["1번"],
        row["2번"],
        row["3번"],
        row["4번"],
        row["5번"],
        row["6번"],
      ];
      const bonus = row["보너스"];
      const sum = row["합계"];

      // 다음 회차 찾기
      const nextRound = lottoData.find((r) => r["회차"] === row["회차"] + 1);

      return `
            <div class="result-wrapper">
                <div class="result-item" onclick="toggleNextRound(${index})">
                    <div class="result-info">
                        <div class="result-round">${row["회차"]}회</div>
                        <div class="result-date">${row["추첨일"]}</div>
                        <div class="result-numbers">
                            ${numbers.map((n) => `<div class="result-ball ${getRangeClass(n)}">${n}</div>`).join("")}
                            <span class="divider">|</span>
                            <div class="result-ball bonus ${getRangeClass(bonus)}">${bonus}</div>
                            <span class="divider">|</span>
                            <span class="sum-value">${sum}</span>
                        </div>
                    </div>
                    <div class="expand-icon">
                        <span>▼</span>
                    </div>
                </div>
                
               ${
                 nextRound
                   ? `
<div class="next-round-info" id="next-${index}">
    <div class="next-header">
        <span class="next-label">다음 회차</span>
        <span class="next-round-num">${nextRound["회차"]}회</span>
        <span class="next-date">${nextRound["추첨일"]}</span>
        <div class="result-numbers">
            ${[nextRound["1번"], nextRound["2번"], nextRound["3번"], nextRound["4번"], nextRound["5번"], nextRound["6번"]].map((n) => `<div class="result-ball ${getRangeClass(n)}">${n}</div>`).join("")}
            <span class="divider">|</span>
            <div class="result-ball bonus ${getRangeClass(nextRound["보너스"])}">${nextRound["보너스"]}</div>
            <span class="divider">|</span>
            <span class="sum-value">${nextRound["합계"]}</span>
        </div>
    </div>
    <div class="pattern-compare">
        <span class="pattern-label">패턴:</span>
        <span class="pattern-item">1-9 <strong>${nextRound["1-9"]}</strong></span>
        <span class="pattern-item">10-19 <strong>${nextRound["10-19"]}</strong></span>
        <span class="pattern-item">20-29 <strong>${nextRound["20-29"]}</strong></span>
        <span class="pattern-item">30-39 <strong>${nextRound["30-39"]}</strong></span>
        <span class="pattern-item">40-45 <strong>${nextRound["40-45"]}</strong></span>
    </div>
</div>
`
                   : `<div class="next-round-info" id="next-${index}"><p style="color: #8b949e; padding: 15px; text-align: center;">다음 회차 정보 없음</p></div>`
               }

            </div>
        `;
    })
    .join("");
}

function toggleNextRound(index) {
  const nextInfo = document.getElementById(`next-${index}`);
  const icon = event.currentTarget.querySelector(".expand-icon span");

  if (nextInfo.classList.contains("expanded")) {
    nextInfo.classList.remove("expanded");
    icon.textContent = "▼";
  } else {
    nextInfo.classList.add("expanded");
    icon.textContent = "▲";
  }
}
