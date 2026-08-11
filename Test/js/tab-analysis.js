// ============================================================================
// ANALYSIS TAB - 전체 분석 및 AI 추천
// ============================================================================

let charts = {
    c1: null,
    c2: null,
    c3: null
};

const STRATEGY = {
    skipThreshold: 15,
    weights: { skip: 0.3, pair: 0.4, ending: 0.2 },
    sumRange: [100, 175]
};

function analyzeData() {
    if (!lottoData || lottoData.length === 0) {
        console.log('분석할 데이터가 없습니다.');
        return;
    }

    console.log('전체 분석 시작:', lottoData.length, '개 회차');
    analyzeLotto(lottoData);
}

function analyzeLotto(data) {
    const total = data.length;
    const stats = {
        freq: Array(46).fill(0),
        lastSeen: Array(46).fill(0),
        pairs: {},
        endings: Array(10).fill(0)
    };

    // 데이터 분석 루프
    data.forEach((row, idx) => {
        const nums = [row['1번'], row['2번'], row['3번'], row['4번'], row['5번'], row['6번']]
                     .filter(n => n).sort((a,b)=>a-b);
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

    // 미출현 횟수 계산
    const skips = Array(46).fill(0).map((_, i) => i === 0 ? 0 : total - stats.lastSeen[i]);

    // AI 추천 번호 생성 (간략화된 로직)
    const recommendation = Array.from({length: 45}, (_, i) => i + 1)
        .sort(() => Math.random() - 0.5)
        .slice(0, 6)
        .sort((a, b) => a - b);
    
    const recSum = recommendation.reduce((a, b) => a + b, 0);

    // 화면 업데이트
    renderDashboard(total, skips, stats, recommendation, recSum);
    renderCharts(skips, stats);
}

function renderDashboard(total, skips, stats, rec, sum) {
    // KPI 및 추천 번호 표시
    const skipNumbers = skips.map((v, i) => v >= 15 ? i : null).filter(n => n);
    document.getElementById('kpi-skip-count').innerText = skipNumbers.length > 0 ? skipNumbers.join(', ') : '-';
    
    document.getElementById('total-sum').innerText = sum;
    const recContainer = document.getElementById('recommend-numbers');
    recContainer.innerHTML = rec.map(n => `<span class="ball ${getRangeClass(n)}">${n}</span>`).join('');
}

// [핵심] 누락되었던 차트 렌더링 함수 정의
function renderCharts(skips, stats) {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false, // 컨테이너 크기에 무조건 맞춤
        animation: { duration: 0 }, // 리사이즈 시 즉각 대응
        plugins: {
            legend: { labels: { color: '#94a3b8' } }
        },
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' }, beginAtZero: true }
        }
    };

    // Skip Chart (가로로 긴 데이터에 최적화)
    const ctx1 = document.getElementById('skipChart').getContext('2d');
    if (charts.c1) charts.c1.destroy();
    charts.c1 = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: Array.from({length: 45}, (_, i) => i + 1),
            datasets: [{
                label: '미출현 횟수',
                data: skips.slice(1),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.1, // PC에서 너무 굴곡지면 가독성 떨어짐
                pointRadius: 2
            }]
        },
        options: commonOptions
    });

    // 2. 궁합수 차트 (Bar)
    const topPairs = Object.entries(stats.pairs).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const ctx2 = document.getElementById('pairChart').getContext('2d');
    if (charts.c2) charts.c2.destroy();
    charts.c2 = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: topPairs.map(p => p[0]),
            datasets: [{
                label: '동반 출현 횟수',
                data: topPairs.map(p => p[1]),
                backgroundColor: '#2563eb'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 3. 끝수 차트 (Bar)
    const ctx3 = document.getElementById('endingChart').getContext('2d');
    if (charts.c3) charts.c3.destroy();
    charts.c3 = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: Array.from({length: 10}, (_, i) => `${i}끝`),
            datasets: [{
                label: '출현 횟수',
                data: stats.endings,
                backgroundColor: '#2563eb'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}