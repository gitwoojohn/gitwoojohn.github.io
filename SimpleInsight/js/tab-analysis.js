// ============================================================================
// ANALYSIS TAB - 전체 분석 및 AI 추천
// ============================================================================

let charts = {
  c1: null,
  c2: null,
  c3: null,
};

const STRATEGY = {
  skipThreshold: 15,
  weights: { skip: 0.3, pair: 0.4, ending: 0.2 },
  sumRange: [100, 175],
};

function analyzeData() {
  if (!lottoData || lottoData.length === 0) {
    console.log("분석할 데이터가 없습니다.");
    return;
  }

  console.log("전체 분석 시작:", lottoData.length, "개 회차");
  analyzeLotto(lottoData);
}

function analyzeLotto(data) {
  const total = data.length;
  const stats = {
    freq: Array(46).fill(0),
    lastSeen: Array(46).fill(0),
    pairs: {},
    endings: Array(10).fill(0),
  };

  // 데이터 분석
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

  // Skip Count 계산
  const skips = Array(46)
    .fill(0)
    .map((_, i) => (i === 0 ? 0 : total - stats.lastSeen[i]));

  // 최종 점수 계산
  const finalScores = Array(46).fill(0);
  for (let i = 1; i <= 45; i++) {
    const skipScore = (skips[i] / Math.max(...skips)) * STRATEGY.weights.skip;

    let maxP = 0;
    Object.entries(stats.pairs).forEach(([p, count]) => {
      if (p.split("-").includes(String(i))) {
        maxP = Math.max(maxP, count);
      }
    });
    const pairScore = (maxP / total) * STRATEGY.weights.pair;

    const endScore =
      (stats.endings[i % 10] / total / 6) * STRATEGY.weights.ending;
    finalScores[i] = skipScore + pairScore + endScore;
  }

  // AI 추천 번호
  const recommendation = finalScores
    .map((score, num) => ({ num, score }))
    .slice(1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.num)
    .sort((a, b) => a - b);

  const recSum = recommendation.reduce((a, b) => a + b, 0);

  // 렌더링
  renderDashboard(total, skips, stats, recommendation, recSum);
}

function renderDashboard(total, skips, stats, rec, sum) {
  // 기존 차트 삭제
  Object.values(charts).forEach((c) => {
    if (c) c.destroy();
  });

  // KPI: 미출현 임계 번호
  const skipNumbers = skips
    .map((count, num) =>
      num > 0 && count >= STRATEGY.skipThreshold ? num : null,
    )
    .filter((n) => n !== null);
  document.getElementById("kpi-skip-count").innerText =
    skipNumbers.length > 0 ? skipNumbers.join(", ") : "-";

  // KPI: 최고 궁합수
  const maxPairCount = Math.max(...Object.values(stats.pairs));
  const maxPairNumbers = Object.entries(stats.pairs)
    .filter(([pair, count]) => count === maxPairCount)
    .map(([pair, count]) => pair);
  document.getElementById("kpi-max-pair").innerText =
    maxPairNumbers.length > 0
      ? `${maxPairNumbers[0]} (${maxPairCount}회)`
      : "-";

  // AI 추천 번호
  const recContainer = document.getElementById("recommend-numbers");
  recContainer.innerHTML = rec
    .map((n) => `<span class="ball ${getRangeClass(n)}">${n}</span>`)
    .join("");

  // 합계
  const sumVal = document.getElementById("total-sum");
  const sumBadge = document.getElementById("sum-badge");
  sumVal.innerText = sum;
  if (sum >= STRATEGY.sumRange[0] && sum <= STRATEGY.sumRange[1]) {
    sumBadge.innerText = "✓";
    sumBadge.className = "badge-good";
  } else {
    sumBadge.innerText = "⚠";
    sumBadge.className = "badge-warn";
  }

  // 리포트
  document.getElementById("report-text").innerHTML =
    `<b>${rec.join(", ")}</b><br>합: <b>${sum}</b><br><br>` +
    `<b>평가:</b><br>` +
    `- 합계: ${sum} (${sum >= 100 && sum <= 175 ? "✓" : "⚠"})<br>` +
    `- 미출현 ${skipNumbers.length}개<br>`;

  // 차트 렌더링
  renderCharts(skips, stats);
}

function renderCharts(skips, stats) {
  // Skip Count Chart
  const skipData = skips.slice(1);

  // 기존에 있던 상위 5개 포인트 강조 로직 유지
  const skipWithIndex = skipData.map((count, idx) => ({ num: idx + 1, count }));
  const top5Numbers = skipWithIndex
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
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
          label: "미출현 횟수",
          data: skipData,
          borderColor: "#58a6ff",
          fill: true,
          backgroundColor: "rgba(88,166,255,0.1)",
          tension: 0.3,
          // --- 기존 포인트 스타일 복구 ---
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          pointRadius: pointRadius,
          pointHoverRadius: 7,
          // ----------------------------
          datalabels: {
            display: (ctx) => ctx.dataset.data[ctx.dataIndex] >= 10,
            formatter: (v, ctx) =>
              `${ctx.chart.data.labels[ctx.dataIndex]}(${v})`,
            align: "top",
            anchor: "end",
            offset: 4,
            color: "#ff7b72",
            font: { size: 13, weight: "bold" },
          },
        },
      ],
    },
    plugins: [ChartDataLabels],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        annotation: {
          annotations: {
            thresholdLine: {
              type: "line",
              yMin: 10,
              yMax: 10,
              borderColor: "#ff7b72",
              borderWidth: 2,
              borderDash: [5, 5],
              label: {
                content: "임계값 10회",
                enabled: true,
                position: "end",
                backgroundColor: "rgba(255,123,114,0.8)",
                color: "#fff",
              },
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 35,
          grid: { color: "#30363d" },
        },
        x: { grid: { color: "#30363d" } },
      },
    },
  });

  // Pair Chart
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
