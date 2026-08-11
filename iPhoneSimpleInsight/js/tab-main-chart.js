// ============================================================================
// [FINAL] MAIN CHART TAB LOGIC - KPI & CHART 통합본
// ============================================================================

const mainCharts = { skip: null, pair: null, ending: null };
let cachedStats = null;

window.analyzeMainChart = function() {
    if (!window.lottoData || window.lottoData.length === 0) return;
    try {
        cachedStats = calculateRealStats(window.lottoData);
        updateDashboardUI(cachedStats);
        renderAllCharts(cachedStats);
    } catch (error) {
        console.error("[CRITICAL ERROR]", error);
    }
};

window.updateChartsVisibility = function() {
    if (cachedStats) {
        setTimeout(() => renderAllCharts(cachedStats), 100);
    }
};

// [수정] 실제 데이터를 분석하도록 보강된 통계 함수
function calculateRealStats(data) {
    const total = data.length;
    const lastSeen = Array(46).fill(0); 
    const endings = Array(10).fill(0);
    const pairs = {};

    data.forEach((row, idx) => {
        const nums = [row['1번'], row['2번'], row['3번'], row['4번'], row['5번'], row['6번']].map(Number);
        
        nums.forEach((n, i) => {
            if (n >= 1 && n <= 45) {
                lastSeen[n] = idx + 1; 
                endings[n % 10]++; // 끝수 계산
                
                // 궁합수(Pair) 계산
                for(let j = i + 1; j < nums.length; j++) {
                    const p = nums[j] >= 1 && nums[j] <= 45 ? [n, nums[j]].sort((a,b)=>a-b).join('-') : null;
                    if(p) pairs[p] = (pairs[p] || 0) + 1;
                }
            }
        });
    });

    const allSkipData = lastSeen.slice(1).map(ls => ls === 0 ? total : total - ls);
    
    // 궁합수 상위 15개 추출
    const topPairs = Object.entries(pairs).sort((a,b)=>b[1]-a[1]).slice(0, 15);

    return {
        allSkipData: allSkipData,
        // 2번 차트용 실제 데이터
        pairLabels: topPairs.map(p => p[0]),
        pairData: topPairs.map(p => p[1]),
        // 3번 차트용 실제 데이터
        endingLabels: Array.from({length:10}, (_,i)=>`${i}끝 (${endings[i]}개)`),
        endingData: endings
    };
}

// [수정] KPI 카드 <label> 제거 및 숫자만 표시 로직
function updateDashboardUI(stats) {
    // 1. KPI 카드 업데이트 (숫자 리스트만 출력, 임의 색상 제거)
    const elSkip = document.getElementById('kpi-skip-count');
    if (elSkip && stats.allSkipData) {
        const warningNumbers = stats.allSkipData
            .map((v, i) => ({ num: i + 1, count: v }))
            .filter(item => item.count >= 15)
            .map(item => item.num);

        if (warningNumbers.length > 0) {
            // 요청하신 형식: "1, 2, 3" (글자 강조 없이 데이터만 삽입)
            elSkip.textContent = warningNumbers.join(', ');
            elSkip.className = 'text-3xl font-bold tracking-tight'; // 주황색(orange-500) 삭제
        } else {
            elSkip.textContent = '-'; 
            elSkip.className = 'text-3xl font-bold text-gray-400';
        }
    }

    // 2. 최신 회차 번호 및 숫자공 UI (원본 유지)
    if (window.lottoData && window.lottoData.length > 0) {
        const lastRow = window.lottoData[window.lottoData.length - 1];
        const numbers = [
            lastRow['1번'], lastRow['2번'], lastRow['3번'], 
            lastRow['4번'], lastRow['5번'], lastRow['6번']
        ].map(Number);

        const balls = document.querySelectorAll('#recommend-numbers .ball');
        balls.forEach((ball, i) => {
            const n = numbers[i]; 
            if (n) {
                ball.textContent = n;
                ball.className = 'ball'; 
                const range = n < 10 ? 1 : Math.floor(n / 10) * 10;
                ball.classList.add(`range-${range}`);
            }
        });

        // 3. 합계 업데이트
        const totalSum = numbers.reduce((a, b) => a + b, 0);
        const sumEl = document.getElementById('total-sum');
        if (sumEl) sumEl.textContent = totalSum;
    }
}

// [유지] 1번 원본 로직 + 2, 3번 통합 렌더링
function renderAllCharts(stats) {
    if (!stats || !stats.allSkipData) return;

    // 1. Skip Chart (원본 로직 보존)
    drawChart('skipChart', 'line', mainCharts, 'skip', {
        labels: Array.from({length: 45}, (_, i) => i + 1),
        datasets: [{
            label: '미출현 횟수',
            data: stats.allSkipData,
            datalabels: {
                display: (ctx) => ctx.dataset.data[ctx.dataIndex] >= 15,
                align: 'top',
                offset: 5,
                formatter: (value, ctx) => `${ctx.chart.data.labels[ctx.dataIndex]}(${value})`,
                font: { size: 10, weight: 'bold' },
                color: '#ff7b72'
            },
            borderColor: '#58a6ff', backgroundColor: 'rgba(88, 166, 255, 0.1)', fill: true, tension: 0.3, pointRadius: 2.5,
            pointBackgroundColor: stats.allSkipData.map(v => v >= 15 ? '#ff7b72' : '#58a6ff'),
            pointBorderColor: stats.allSkipData.map(v => v >= 15 ? '#ff7b72' : '#58a6ff')
        }]
    }, {
        scales: {
            y: { beginAtZero: true, max: 35, grid: { color: '#30363d' }, ticks: { color: '#8b949e' } },
            x: { grid: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 15, font: { size: 9 }, color: '#8b949e' } }
        },
        plugins: {
            annotation: {
                annotations: {
                    thresholdLine: {
                        type: 'line', yMin: 15, yMax: 15, borderColor: '#ff7b72', borderWidth: 2, borderDash: [5, 5],
                        label: { content: '임계값 15회', enabled: true, position: 'end', backgroundColor: 'rgba(255,123,114,0.9)', color: '#fff' }
                    }
                }
            }
        }
    });

    // 2. Pair Chart (datalabels 비활성화)
    if (stats.pairLabels && stats.pairData) {
        drawChart('pairChart', 'bar', mainCharts, 'pair', {
            labels: stats.pairLabels,
            datasets: [{ label: '동반 출현', data: stats.pairData, backgroundColor: '#58a6ff', datalabels: { display: false } }]
        }, {
            plugins: {
                annotation: {
                    annotations: {
                        thresholdLine: {
                            type: 'line', yMin: 25, yMax: 25, borderColor: '#ff7b72', borderWidth: 2, borderDash: [5, 5],
                            label: { content: '25회 임계선', enabled: true, position: 'end', backgroundColor: 'rgba(255,123,114,0.8)', color: '#fff' }
                        }
                    }
                }
            },
            scales: { x: { ticks: { color: '#63676bff', font: { size: 11 } } }, y: { ticks: { color: '#63676bff' } } }
        });
    }

    // 3. Ending Chart (datalabels 비활성화)
    if (stats.endingLabels && stats.endingData) {
        drawChart('endingChart', 'bar', mainCharts, 'ending', {
            labels: stats.endingLabels,
            datasets: [{ label: '출현 횟수', data: stats.endingData, backgroundColor: '#58a6ff', datalabels: { display: false } }]
        }, {
            plugins: {
                annotation: {
                    annotations: {
                        thresholdLine: {
                            type: 'line', yMin: 700, yMax: 700, borderColor: '#ff7b72', borderWidth: 2, borderDash: [5, 5],
                            label: { content: '700개 임계선', enabled: true, position: 'end', backgroundColor: 'rgba(255,123,114,0.8)', color: '#fff' }
                        }
                    }
                }
            }
        });
    }
}

// 6. 헬퍼 함수 (유지)
function drawChart(id, type, storage, key, data, extraOptions = {}) {
    const el = document.getElementById(id);
    if (!el) return;
    const ctx = el.getContext('2d');
    if (storage[key]) storage[key].destroy();
    const isPluginAvailable = typeof ChartDataLabels !== 'undefined';
    storage[key] = new Chart(ctx, {
        type: type,
        data: data,
        plugins: isPluginAvailable ? [ChartDataLabels] : [],
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, ...extraOptions.plugins },
            scales: extraOptions.scales || {}
        }
    });
}