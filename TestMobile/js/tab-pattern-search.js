// ============================================================================
// PATTERN SEARCH TAB - 실제 데이터 분석 로직
// ============================================================================

const patternFields = ['range-1-9', 'range-10-19', 'range-20-29', 'range-30-39', 'range-40-45'];

patternFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        // 기존 입력값 클릭 시 자동 삭제
        el.addEventListener('focus', function() { this.value = ''; });
        // 엔터키 입력 시 즉시 검색
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') executePatternSearch(); });
    }
});

// [1] 검색 버튼 이벤트 연결
const searchBtn = document.getElementById('searchPattern');
if (searchBtn) {
    searchBtn.addEventListener('click', executePatternSearch);
}

// [2] 검색 로직: 기존 레이아웃 유지하며 함수명 매핑 수정
function executePatternSearch() {
    if (!window.lottoData || window.lottoData.length === 0) {
        showToast('먼저 CSV 파일을 불러오세요.');
        return;
    }

    const pattern = {
        '1-9':   document.getElementById('range-1-9').value,
        '10-19': document.getElementById('range-10-19').value,
        '20-29': document.getElementById('range-20-29').value,
        '30-39': document.getElementById('range-30-39').value,
        '40-45': document.getElementById('range-40-45').value
    };

    const matches = window.lottoData.filter(row => {
        return Object.entries(pattern).every(([key, val]) => {
            if (val === '') return true;
            // CSV 헤더 날짜 변환 대응 매핑
            const csvKey = key === '1-9' ? (row['1-9'] !== undefined ? '1-9' : '01월 09일') :
                           key === '10-19' ? (row['10-19'] !== undefined ? '10-19' : '10월 19일') : key;
            return parseInt(row[csvKey]) === parseInt(val);
        });
    });

    displayResults(matches);
    updateSidebarInsight(matches);
}

// 통계 업데이트
function updateSidebarInsight(matches) {
    const insightArea = document.getElementById('insight-content'); 
    if (!insightArea || matches.length === 0) return;

    const nextRounds = matches
        .map(m => window.lottoData.find(d => parseInt(d['회차']) === parseInt(m['회차']) + 1))
        .filter(Boolean);

    if (nextRounds.length === 0) return;

    // 분석 로직 유지 (ballFreq, patternFreq, totalSum 계산)
    const ballFreq = {};
    const patternFreq = {};
    let totalSum = 0;

    nextRounds.forEach(rd => {
        [1,2,3,4,5,6].forEach(i => {
            const num = rd[i+'번'];
            ballFreq[num] = (ballFreq[num] || 0) + 1;
        });
        const pStr = `${rd['1-9']}-${rd['10-19']}-${rd['20-29']}-${rd['30-39']}-${rd['40-45']}`;
        patternFreq[pStr] = (patternFreq[pStr] || 0) + 1;
        totalSum += rd['합계'] ? parseInt(rd['합계']) : [1,2,3,4,5,6].reduce((s, i) => s + parseInt(rd[i+'번']), 0);
    });

    const avgSum = Math.round(totalSum / nextRounds.length); 
    const topBalls = Object.entries(ballFreq).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const topPatterns = Object.entries(patternFreq).sort((a, b) => b[1] - a[1]).slice(0, 2);

    // 모든 강조 색상 및 순서 엄격 준수
    insightArea.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 7px; font-weight: 600;">
            <div style="white-space: nowrap; font-size: 0.8rem;">
                <span style="color: var(--accent);">[다음회 번호]</span> 
                ${topBalls.map(b => `<span style="color: var(--text-main);">${b[0]}</span><span style="font-size:0.75rem; color:var(--text-muted);">(${b[1]})</span>`).join(' · ')}
            </div>
            
            <div style="white-space: nowrap; font-size: 0.8rem;">
                <span style="color: var(--highlight);">[다음회 패턴]</span> 
                ${topPatterns.map(p => `<span style="color: var(--text-main);">${p[0]}</span><span style="color: var(--highlight); font-size: 0.75rem;">(${Math.round(p[1]/nextRounds.length*100)}%)</span>`).join(' | ')}
            </div>

            <div style="white-space: nowrap; font-size: 0.8rem;">
                <span style="color: var(--accent);">[결과요약]</span> 
                검색 분석 대상 <span style="color: var(--highlight); font-weight: 800; font-size: 0.85rem;">${matches.length}</span>건 
                <span style="color: var(--border); margin: 0 4px;">|</span> 
                평균합: <span style="color: var(--text-main); font-weight: 700;">${avgSum}</span>
            </div>
        </div>
    `;
}

function displayResults(matches) {
    const resultCount = document.getElementById('result-count');
    const resultList = document.getElementById('pattern-list');
    
    if (resultCount) resultCount.textContent = matches.length;
    if (!resultList) return;

    if (matches.length === 0) {
        resultList.innerHTML = '<p class="no-data-message" style="text-align:center; padding:20px; color:#8b949e;">일치하는 회차가 없습니다.</p>';
        return;
    }

    // 결과 리스트 높이 및 스크롤 설정
    resultList.style.maxHeight = "calc(100vh - 220px)"; 
    resultList.style.overflowY = "auto";

    resultList.innerHTML = matches.map((row) => {
    const nextRound = window.lottoData.find(r => parseInt(r['회차']) === parseInt(row['회차']) + 1);
    
    // 번호 합계 계산 (1~6번)
    const currentSum = [1,2,3,4,5,6].reduce((acc, i) => acc + parseInt(row[i+'번']), 0);
    const nextSum = nextRound ? [1,2,3,4,5,6].reduce((acc, i) => acc + parseInt(nextRound[i+'번']), 0) : 0;

    return `
        <div class="result-wrapper" style="border: 1px solid var(--border); border-radius: 12px; margin-bottom: 8px; overflow: hidden; background: rgba(255, 255, 255, 0.02);"> 
            <div class="result-item" onclick="toggleAccordion(this.parentElement)" 
                 style="display: flex !important; flex-direction: row !important; align-items: center; padding: 12px 8px; gap: 8px; flex-wrap: nowrap; justify-content: flex-start; cursor: pointer;">
                
                <div class="result-round" style="color: var(--accent); font-weight: 800; font-size: 0.85rem; min-width: 42px; flex-shrink: 0;">
                    ${row['회차']}회
                </div>
                
                <div class="balls-container" style="display: flex !important; flex-direction: row !important; gap: 4px; flex-wrap: nowrap; align-items: center;">
                    ${[1,2,3,4,5,6].map(i => `
                        <div class="ball ${getBallColor(row[i+'번'])}" style="width: 28px; height: 28px; font-size: 0.95rem; flex-shrink: 0; line-height: 28px;">
                            ${row[i+'번']}
                        </div>
                    `).join('')}
                    <span style="color: var(--border); font-weight: bold; margin: 0 2px;">+</span>
                    <div class="ball bonus ${getBallColor(row['보너스'])}" style="width: 28px; height: 28px; font-size: 0.95rem; flex-shrink: 0; line-height: 28px; border-style: dashed !important; opacity: 0.8;">
                        ${row['보너스']}
                    </div>
                </div>

                <div style="margin-left: auto; margin-right: 10px; color: var(--highlight); font-weight: 800; font-size: 0.85rem;">
                    ${currentSum}
                </div>

                <div class="expand-icon" style="color: var(--accent); font-size: 0.7rem; flex-shrink: 0;">
                    <span>▼</span>
                </div>
            </div>

<div class="next-round-info">
    ${nextRound ? `
        <div class="next-header" style="padding: 12px 15px; display: flex !important; flex-wrap: nowrap !important; align-items: center; border-top: 1px dashed var(--border); gap: 4px;">
            
            <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex-shrink: 1;">
                <div style="color: var(--text-muted); font-weight: 700; font-size: 0.85rem; min-width: 38px; flex-shrink: 0;">
                    ${nextRound['회차']}회
                </div>
                <div class="balls-container" style="display: flex; gap: 3px; align-items: center;">
                    ${[1,2,3,4,5,6].map(i => `
                        <div class="ball ${getBallColor(nextRound[i+'번'])}" style="width: 26px; height: 26px; font-size: 0.9rem; line-height: 26px; flex-shrink: 0;">
                            ${nextRound[i+'번']}
                        </div>
                    `).join('')}
                    <span style="color: var(--border); font-weight: bold;">+</span>
                    <div class="ball bonus ${getBallColor(nextRound['보너스'])}" style="width: 26px; height: 26px; font-size: 0.9rem; line-height: 26px; border-style: dashed !important; opacity: 0.8; flex-shrink: 0;">
                        ${nextRound['보너스']}
                    </div>
                </div>
            </div>

            <div style="color: var(--highlight); font-weight: 800; font-size: 0.85rem; margin-left: auto; flex-shrink: 0;">
                ${nextSum}
            </div>
        </div>

        <div style="width: 100%; padding: 0 8px 10px 12px; display: flex; align-items: center; gap: 6px; box-sizing: border-box;">
            <span style="font-size: 0.7rem; color: var(--border); font-weight: 600; flex-shrink: 0;">패턴:</span>
            <div style="font-size: 0.8rem; font-weight: 700; letter-spacing: 0.5px;">
                ${(() => {
                    const counts = [0, 0, 0, 0, 0];
                    [1,2,3,4,5,6].forEach(i => {
                        const n = parseInt(nextRound[i+'번']);
                        if (n <= 10) counts[0]++;
                        else if (n <= 20) counts[1]++;
                        else if (n <= 30) counts[2]++;
                        else if (n <= 40) counts[3]++;
                        else counts[4]++;
                    });
                    return counts
                        .map(c => `<span style="color: var(--accent);">${c}</span>`)
                        .join(' <span style="color: var(--border); font-weight: normal;">-</span> ');
                })()}
            </div>
        </div>
    ` : ''}
</div>

        </div>
    `;
}).join('');
}