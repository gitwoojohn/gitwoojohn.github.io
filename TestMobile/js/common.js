/**
 * [공통] common.js
 * 데이터 자동/수동 로드, 탭 제어, 공 색상 클래스 관리
 */

window.lottoData = []; // 전역 데이터 저장소

document.addEventListener('DOMContentLoaded', () => {
    // 1. 페이지 로드 시 자동 로딩 실행
    autoLoadCSV('https://gitwoojohn.github.io/ReadWeb-WinningNumbers.csv'); 

    // 2. [사용자 기존 코드] 아이콘 생성 및 탭 제어 로직 보존
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');

            // 모든 버튼/콘텐츠 초기화 및 활성화
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add('active');
            
            window.scrollTo(0, 0);
        });
    });
});

/**
 * [중복 제거] 데이터 파싱 및 초기화 통합 함수
 */
function processLottoData(csvData, fileName = "데이터") {
    Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: function(results) {
            // 전역 변수 할당 및 분석 함수 실행
            window.lottoData = results.data; 
            
            if (typeof initMainChartAnalysis === 'function') {
                initMainChartAnalysis(); 
            }
            
            if (typeof showToast === 'function') {
                showToast(`"${fileName}" 분석 완료!`, 'success');
            }
        }
    });
}

/**
 * 1. 자동 로딩 함수 (Auto Fetch)
 */
async function autoLoadCSV(url) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.text();
            processLottoData(data, url);
        }
    } catch (e) { console.error("자동 로드 실패:", e); }
}

/**
 * 2. 수동 업로드 함수 (File Input)
 */
function handleFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            processLottoData(event.target.result, file.name);
        };
        reader.readAsText(file);
    };
    input.click();
}

/**
 * 3. 공 색상 반환 함수
 */
function getBallColor(number) {
    const num = parseInt(number);
    if (num >= 1 && num <= 9) return 'range-1';
    if (num >= 10 && num <= 19) return 'range-10';
    if (num >= 20 && num <= 29) return 'range-20';
    if (num >= 30 && num <= 39) return 'range-30';
    if (num >= 40 && num <= 45) return 'range-40';
    return 'empty';
}

/**
 * 공통 아코디언 토글 함수
 * @param {HTMLElement} element - .result-wrapper 요소
 */
window.toggleAccordion = function(element) {
    if (!element) return;
    
    // active 클래스 토글 (CSS와 연동)
    element.classList.toggle('active');
};