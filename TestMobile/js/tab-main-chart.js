/**
 * ============================================================================
 * TAB MAIN CHART - 원본 tab-analysis.js 로직 완전 이식
 * ============================================================================
 */

let charts = {
    skip: null,
    pair: null,
    ending: null
};

const STRATEGY = {
    skipThreshold: 15,
    weights: { skip: 0.3, pair: 0.4, ending: 0.2 },
    sumRange: [100, 175]
};

function initMainChartAnalysis() {
    if (!window.lottoData || window.lottoData.length === 0) return;
    analyzeLotto(window.lottoData);
}

function analyzeLotto(data) {
    const total = data.length;
    const stats = {
        freq: Array(46).fill(0),
        lastSeen: Array(46).fill(0),
        pairs: {},
        endings: Array(10).fill(0)
    };

    // 1. 원본 데이터 분석 로직
    data.forEach((row, idx) => {
        const nums = [row['1번'], row['2번'], row['3번'], row['4번'], row['5번'], row['6번']].sort((a,b)=>a-b);
        nums.forEach((n, i) => {
            stats.freq[n]++;
            stats.lastSeen[n] = idx + 1;
            stats.endings[n % 10]++;

            for(let j = i+1; j < nums.length; j++) {
                const pair = `${n}-${nums[j]}`;
                stats.pairs[pair] = (stats.pairs[pair] || 0) + 1;
            }
        });
    });

    // 2. Skip Count 및 점수 계산
    const skips = Array(46).fill(0).map((_, i) => i === 0 ? 0 : total - stats.lastSeen[i]);
    const finalScores = Array(46).fill(0);
    for(let i = 1; i <= 45; i++) {
        const skipScore = (skips[i] / Math.max(...skips)) * STRATEGY.weights.skip;
        let maxP = 0;
        Object.entries(stats.pairs).forEach(([p, count]) => {
            if(p.split('-').includes(String(i))) maxP = Math.max(maxP, count);
        });
        const pairScore = (maxP / total) * STRATEGY.weights.pair;
        const endScore = (stats.endings[i % 10] / total / 6) * STRATEGY.weights.ending;
        finalScores[i] = skipScore + pairScore + endScore;
    }

    // 3. 추천 번호 추출
    const recommendation = finalScores
        .map((score, num) => ({num, score}))
        .slice(1)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(x => x.num)
        .sort((a, b) => a - b);

    const recSum = recommendation.reduce((a, b) => a + b, 0);

    // 4. UI 업데이트 및 차트 렌더링
    updateMainRecommendUI(recommendation, recSum);
    updateSkipNumberUI(skips);
    renderCharts(skips, stats);
    generateInsights(skips, stats, recommendation, recSum);
}

// UI 업데이트 (기존과 동일)
function updateMainRecommendUI(rec, sum) {
    const balls = document.querySelectorAll('.ball');
    const sumDisplay = document.getElementById('summary-total');
    const alertIcon = document.querySelector('[data-lucide="triangle-alert"]');
    rec.forEach((num, idx) => {
        if (balls[idx]) {
            balls[idx].innerText = num;
            balls[idx].className = `ball ${getBallColor(num)}`;
        }
    });
    if (sumDisplay) {
        sumDisplay.innerText = sum;
        const isGood = sum >= STRATEGY.sumRange[0] && sum <= STRATEGY.sumRange[1];
        sumDisplay.style.color = isGood ? '#ffffff' : '#f2cc60';
        if (alertIcon) {
            alertIcon.setAttribute('data-lucide', isGood ? 'check-circle-2' : 'triangle-alert');
            alertIcon.style.color = isGood ? '#3fb950' : '#f2cc60';
            if (window.lucide) lucide.createIcons();
        }
    }
}

function updateSkipNumberUI(skips) {
    const section = document.getElementById('skip-number-section');
    const list = document.getElementById('skip-number-list');
    if (!section || !list) return;
    const skipData = [];
    for (let i = 1; i <= 45; i++) {
        if (skips[i] >= STRATEGY.skipThreshold) skipData.push({ num: i, count: skips[i] });
    }
    skipData.sort((a, b) => b.count - a.count);
    if (skipData.length > 0) {
        section.classList.remove('hidden');
        list.innerHTML = skipData.map(item => `
            <div class="bg-[#161b22] border border-[#30363d] px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <span class="text-sm font-black ${getBallColor(item.num)}">${item.num}</span>
                <span class="text-[10px] text-gray-500 font-bold">(${item.count})</span>
            </div>`).join('');
    } else { section.classList.add('hidden'); }
}

/**
 * 차트 렌더링 (tab-analysis.js 설정 100% 반영)
 */
function renderCharts(skips, stats) {
    Object.values(charts).forEach(c => { if(c) c.destroy(); });

    // 1. Skip Chart
    const skipWithIndex = skips.slice(1).map((count, idx) => ({num: idx+1, count}));
    const top5Numbers = skipWithIndex.sort((a, b) => b.count - a.count).slice(0, 5).map(item => item.num);
    const pointColors = Array.from({length:45}, (_, i) => top5Numbers.includes(i+1) ? '#ff7b72' : '#58a6ff');
    const pointRadius = Array.from({length:45}, (_, i) => top5Numbers.includes(i+1) ? 6 : 3);

    const ctx1 = document.getElementById('mainChart').getContext('2d');
    charts.skip = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: Array.from({length:45}, (_,i)=>i+1),
            datasets: [{
                label: '미출현 횟수',
                data: skips.slice(1),
                borderColor: '#58a6ff',
                fill: true,
                backgroundColor: 'rgba(88,166,255,0.1)',
                tension: 0.3,
                pointBackgroundColor: Array.from({length:45}, (_, i) => skips[i+1] >= 15 ? '#ff7b72' : '#58a6ff'),
                pointRadius: Array.from({length:45}, (_, i) => skips[i+1] >= 15 ? 6 : 3)
            }]
        },
        plugins: [ChartDataLabels], // 플러그인 활성화
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                // --- 복구된 datalabels 설정 ---
                datalabels: {
                    display: (ctx) => ctx.dataset.data[ctx.dataIndex] >= 15,
                    align: 'top',
                    offset: 8,
                    color: '#ff7b72',
                    font: { weight: 'bold', size: 11 },
                    formatter: (v, ctx) => `${ctx.chart.data.labels[ctx.dataIndex]}(${v})`
                },
                // ----------------------------
                annotation: {
                    annotations: {
                        thresholdLine: {
                            type: 'line', yMin: 15, yMax: 15, borderColor: '#ff7b72', borderWidth: 2, borderDash: [5, 5],
                            label: { content: '임계값 15회', enabled: true, position: 'end', backgroundColor: 'rgba(255,123,114,0.8)', color: '#fff', font: { size: 11 } }
                        }
                    }
                }
            },
            scales: { y: { beginAtZero: true, max: 35, grid: { color: '#30363d' } }, x: { grid: { color: '#30363d' } } }
        }
    });

    // 2. Pair Chart (가로축 15개 전부 표시 수정)
    const topPairs = Object.entries(stats.pairs).sort((a,b)=>b[1]-a[1]).slice(0, 15);
    const ctx2 = document.getElementById('pairChart').getContext('2d');
    charts.pair = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: topPairs.map(p => p[0]),
            datasets: [{ label: '동반 출현', data: topPairs.map(p => p[1]), backgroundColor: '#58a6ff' }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false },
                annotation: { annotations: { thresholdLine: { type: 'line', yMin: 25, yMax: 25, borderColor: '#ff7b72', borderWidth: 2, borderDash: [5, 5] } } }
            },
            scales: { 
                x: { 
                    ticks: { 
                        autoSkip: false, // 건너뛰기 없이 15개 강제 표시
                        color: '#63676bff', 
                        font: { size: 11 } 
                    }, 
                    grid: { color: '#30363d' } 
                }, 
                y: { ticks: { color: '#63676bff' }, grid: { color: '#30363d' } } 
            }
        }
    });

    // 3. Ending Chart
    const ctx3 = document.getElementById('endingChart').getContext('2d');
    charts.ending = new Chart(ctx3, {
        type: 'bar',
        data: {  
            labels: Array.from({length:10}, (_,i)=>`${i}끝 (${stats.endings[i]})`),
            datasets: [{ label: '출현 횟수', data: stats.endings, backgroundColor: '#58a6ff' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false },
                annotation: { annotations: { thresholdLine: { type: 'line', yMin: 700, yMax: 700, borderColor: '#ff7b72', borderWidth: 2, borderDash: [5, 5] } } }
            },
            scales: { y: { beginAtZero: true } }
        }
    });
}

/**
 * 차트 데이터를 기반으로 전략적 인사이트 생성 (상세 리스트 출력 수정)
 */
function generateInsights(skips, stats, rec, sum) {
    const section = document.getElementById('insight-section');
    if (!section) return;
    section.classList.remove('hidden');

    // 1. 미출현(Cold) 전략 - 전체 리스트 출력으로 변경
    const coldList = [];
    for (let i = 1; i <= 45; i++) {
        if (skips[i] >= STRATEGY.skipThreshold) {
            coldList.push({ num: i, count: skips[i] });
        }
    }
    // 많이 안 나온 순서대로 정렬 (내림차순)
    coldList.sort((a, b) => b.count - a.count);

    if (coldList.length > 0) {
        // 형식: 번호(횟수), 번호(횟수)...
        const coldStr = coldList.map(item => `<b>${item.num}</b>(${item.count})`).join(', ');
        document.getElementById('insight-cold').innerHTML = 
            `현재 15회 이상 장기 미출현 번호는 총 <b>${coldList.length}개</b>이며 목록은 다음과 같습니다:<br><span style="color:#c9d1d9; display:block; margin-top:4px;">${coldStr}</span>`;
    } else {
        document.getElementById('insight-cold').innerHTML = 
            `현재 15회 이상 장기 미출현 중인 번호가 없습니다. 최근 번호들이 골고루 출현하고 있습니다.`;
    }

    // 2. 궁합(Pairing) 가이드
    let bestPair = { pair: '', count: -1 };
    // 추천 번호 내에서의 최고 궁합 찾기
    for (let i = 0; i < rec.length; i++) {
        for (let j = i + 1; j < rec.length; j++) {
            const key = `${rec[i]}-${rec[j]}`;
            const count = stats.pairs[key] || 0;
            if (count > bestPair.count) bestPair = { pair: key, count: count };
        }
    }
    // 전체 데이터 중 최고 궁합
    const globalTopPair = Object.entries(stats.pairs).sort((a,b) => b[1]-a[1])[0];
    
    document.getElementById('insight-pair').innerHTML = 
        `역대 전체 1위 궁합은 <b>${globalTopPair[0]}</b>(${globalTopPair[1]}회)입니다. 이번 추천 번호 내에서는 <b>[${bestPair.pair.replace('-', ' & ')}]</b> 조합이 <b>${bestPair.count}회</b> 동반 출현으로 가장 강력합니다.`;

    // 3. 조합 균형(Balance)
    const oddCount = rec.filter(n => n % 2 !== 0).length;
    const isSumGood = sum >= STRATEGY.sumRange[0] && sum <= STRATEGY.sumRange[1];
    document.getElementById('insight-balance').innerHTML = 
        `합계는 <b>${sum}</b>(${isSumGood ? '안정권' : '주의'})이며, 홀짝 비율은 <b>${oddCount}:${6-oddCount}</b>입니다. ${isSumGood ? '전반적인 밸런스가 매우 양호합니다.' : '합계가 통계적 범위를 벗어나 주의가 필요합니다.'}`;

    // 4. 전략 요약
    const summaryEl = document.getElementById('insight-summary');
    let summaryText = '';
    
    // 미출현 번호 포함 여부 확인
    const includedCold = rec.filter(n => skips[n] >= STRATEGY.skipThreshold);
    
    if (isSumGood && (oddCount >= 2 && oddCount <= 4)) {
        summaryText = includedCold.length > 0 
            ? `안정적인 밸런스 속에 <b>미출현 번호 ${includedCold.length}개</b>를 포함하여 반등을 노리는 정석적인 전략입니다.`
            : `최근 흐름이 좋은 번호들과 이상적인 균형을 갖춘 <b>안전 지향형 조합</b>입니다.`;
    } else {
        summaryText = `통계적 패턴을 약간 벗어난 <b>이변을 노리는 고위험 전략</b>입니다. 과감한 베팅이 필요할 때 적합합니다.`;
    }
    
    summaryEl.innerHTML = `<span style="color:#f2cc60; font-weight:bold;">💡 AI 분석 요약:</span> ${summaryText}`;
}