/**
 * tab-analysis-sum.js
 * 펼침 메뉴도 한 줄 표시 + 날짜 추가 완성 버전
 */

// document.addEventListener('DOMContentLoaded', () => {
//     const btnAnalyze = document.getElementById('btn-run-sum-analysis');
    
//     if (btnAnalyze) {
//         btnAnalyze.addEventListener('click', () => {
//             const inputEl = document.getElementById('target-sum-input');
//             const targetSum = parseInt(inputEl.value);
            
//             if (typeof lottoData === 'undefined' || !lottoData || lottoData.length === 0) {
//                 showToast('먼저 CSV 파일을 불러오세요.');
//                 return;
//             }
            
//             if (!targetSum) {
//                 showToast('기준 합계를 입력하세요.');
//                 return;
//             }

//             executeSumAnalysisPro(targetSum);
//         });
//     }
// });

document.addEventListener('DOMContentLoaded', () => {
    const btnAnalyze = document.getElementById('btn-run-sum-analysis');
    const inputEl = document.getElementById('target-sum-input');
    
    // [1] 입력 필드 포커스 시 데이터 삭제 및 엔터 키 지원 추가
    if (inputEl) {
        inputEl.addEventListener('focus', function() {
            this.value = ''; // 클릭 시 기존 숫자 지우기
        });

        // 엔터 키를 눌렀을 때도 분석 버튼이 클릭되도록 함
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && btnAnalyze) {
                btnAnalyze.click();
            }
        });
    }

    if (btnAnalyze) {
        btnAnalyze.addEventListener('click', () => {
            const targetSum = parseInt(inputEl.value);
            
            // [2] alert 대신 showToast 적용
            if (typeof lottoData === 'undefined' || !lottoData || lottoData.length === 0) {
                showToast('먼저 CSV 파일을 불러오세요.');
                return;
            }
            
            if (!targetSum) {
                showToast('기준 합계를 입력하세요.');
                return;
            }

            executeSumAnalysisPro(targetSum);
        });
    }
});

// executeSumAnalysisPro 이하 기존 로직 및 렌더링 코드는 그대로 유지

function executeSumAnalysisPro(targetSum) {
    const insightContainer = document.getElementById('insight-content');
    const mainResult = document.getElementById('ai-sum-probability-result');
    const archiveList = document.getElementById('sum-round-archive');
    
    archiveList.innerHTML = '';

    const freq = {};
    for (let i = 1; i <= 45; i++) freq[i] = 0;
    const history = [];

    // 데이터 추출
    lottoData.forEach((row) => {
        if (parseInt(row['합계']) === targetSum) {
            const currentRound = parseInt(row['회차']);
            const next = lottoData.find(r => parseInt(r['회차']) === currentRound + 1);
            
            if (next) {
                history.push({ curr: row, next: next });
                for (let j = 1; j <= 6; j++) {
                    const n = parseInt(next[j + '번']);
                    if (!isNaN(n)) freq[n]++;
                }
            }
        }
    });

    if (history.length === 0) {
        mainResult.innerHTML = '<p class="placeholder-text">일치하는 과거 사례가 없습니다.</p>';
        insightContainer.innerHTML = '<div class="insight-section"><h4>📊 분석 결과</h4><p>합계 ' + targetSum + '에 해당하는 과거 데이터를 찾을 수 없습니다.</p></div>';
        return;
    }

    // 사이드바 리포트
    if (insightContainer) {
        const top3 = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3);
        
        insightContainer.innerHTML = `
            <div class="insight-section">
                <h4>🔮 다음 회차 최다 출현 번호</h4>
                <div class="prediction-list">
                    ${top3.map(([num, count], idx) => `
                        <div class="prediction-card ${idx === 0 ? 'best' : ''}">
                            <div class="rank">TOP ${idx + 1}</div>
                            <div class="pattern-string">${num}</div>
                            <div class="pattern-meta">출현 빈도: ${count}회</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="insight-section">
                <h4>📊 통계 요약</h4>
                <div class="sum-box">총 ${history.length}건의 데이터 분석 완료</div>
            </div>
        `;
    }

    // 중앙 예측 번호
    const top6 = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
    mainResult.innerHTML = `
        <div class="balls-container">
            ${top6.map(([num]) => `<span class="ball ${getRangeClass(parseInt(num))}">${num}</span>`).join('')}
        </div>
    `;

    // 리스트
    archiveList.innerHTML = history.map(item => {
        const curr = item.curr;
        const next = item.next;
        
        const getDate = (data) => {
            return data['날짜'] || data['추첨일'] || data['추첨날짜'] || data['date'] || '';
        };
        
        // const getPattern = (data) => {
        //     const p = [0, 0, 0, 0, 0];
        //     for (let i = 1; i <= 6; i++) {
        //         const val = parseInt(data[i + '번']);
        //         if (val <= 9) p[0]++;
        //         else if (val <= 19) p[1]++;
        //         else if (val <= 29) p[2]++;
        //         else if (val <= 39) p[3]++;
        //         else p[4]++;
        //     }
        //     return p.join(' - ');
        // };
        const getPattern = (data) => {
        const p = [0, 0, 0, 0, 0];
        for (let i = 1; i <= 6; i++) {
            const val = parseInt(data[`${i}번`]);
            // 1~9: 0, 10~19: 1, 20~29: 2, 30~39: 3, 40~45: 4
            const index = Math.min(Math.floor(val / 10), 4);
            p[index]++;
            }  
            return p.join(' - ');
        };

        return `
            <div class="result-wrapper">
                <div class="result-item" onclick="toggleAccordion(this)">
                    <div class="result-info">
                        <span class="result-round">${curr['회차']}회</span>
                        <span class="result-date">${getDate(curr)}</span>
                        
                        <div class="balls-container">
                            ${[1, 2, 3, 4, 5, 6].map(k => 
                                `<span class="ball ${getRangeClass(parseInt(curr[k+'번']))}">${curr[k+'번']}</span>`
                            ).join('')}
                        </div>
                        
                        <span class="divider">|</span>
                        
                        <div class="balls-container">
                            <span class="ball bonus ${getRangeClass(parseInt(curr['보너스']))}">${curr['보너스']}</span>
                        </div>
                        
                        <span class="divider">|</span>
                        <span class="sum-value">${curr['합계']}</span>
                        <span class="divider">|</span>
                        <div class="pattern-badge-main">                        
                            <span class="pattern-label-text">패턴:</span>
                            <strong>${getPattern(curr)}</strong>
                        </div>
                    </div>
                    
                    <span class="expand-icon">▼</span>
                </div>
                
                <div class="next-round-info">
                    <div class="result-info">
                        <span class="next-label">다음 회차 [${next['회차']}회]</span>
                        <span class="result-date">${getDate(next)}</span>
                        
                        <div class="balls-container">
                            ${[1, 2, 3, 4, 5, 6].map(k => 
                                `<span class="ball ${getRangeClass(parseInt(next[k+'번']))}">${next[k+'번']}</span>`
                            ).join('')}
                        </div>
                        
                        <span class="divider">|</span>
                        
                        <div class="balls-container">
                            <span class="ball bonus ${getRangeClass(parseInt(next['보너스']))}">${next['보너스']}</span>
                        </div>
                        
                        <span class="divider">|</span>
                        <span class="sum-value">${next['합계']}</span>
                        <span class="divider">|</span>
                        <div class="pattern-badge-main">
                            <span class="pattern-label-text">패턴</span>
                            <strong>${getPattern(next)}</strong>
                        </div>

                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// function toggleSumDetail(element) {
//     const wrapper = element.closest('.result-wrapper');
//     wrapper.classList.toggle('active');

//     const panel = wrapper.querySelector('.next-round-info');
//     const icon = element.querySelector('.expand-icon');
    
//     if (panel.classList.contains('expanded')) {
//         panel.classList.remove('expanded');
//         icon.classList.remove('rotate');
//     } else {
//         panel.classList.add('expanded');
//         icon.classList.add('rotate');
//     }
// }
