// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
let lottoData = [];

// ============================================================================
// CSV LOADING (자동 및 수동 통합)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. 자동 로딩: 저장소 내의 CSV 파일 읽기
    const csvUrl = 'https://gitwoojohn.github.io/ReadWeb-WinningNumbers.csv'; 

    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: function(results) {
            console.log("CSV 자동 로드 성공:", results.data.length);
            processAndInitialize(results.data);
        },
        error: function(err) {
            console.warn("자동 로드 실패 (수동 업로드 대기):", err);
            document.getElementById('report-text').textContent = "CSV 파일을 업로드해주세요.";
        }
    });

    // 2. 수동 업로드 이벤트 바인딩
    const csvFileInput = document.getElementById('csvFile');
    if (csvFileInput) {
        csvFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                complete: (results) => processAndInitialize(results.data)
            });
        });
    }
});

// 데이터 필터링 및 초기 분석 실행
function processAndInitialize(data) {
    lottoData = data.filter(row => row['회차']);
    document.getElementById('report-text').textContent = "데이터가 성공적으로 로드되었습니다.";
    
    // 첫 번째 탭(전체 분석) 실행
    if (typeof analyzeData === 'function') {
        analyzeData();
    }
}

// ============================================================================
// UI & UTILITY FUNCTIONS
// ============================================================================
function getRangeClass(number) {
    if (number >= 1 && number <= 9) return 'range-1';
    if (number >= 10 && number <= 19) return 'range-10';
    if (number >= 20 && number <= 29) return 'range-20';
    if (number >= 30 && number <= 39) return 'range-30';
    if (number >= 40 && number <= 45) return 'range-40';
    return '';
}

// 탭 전환 로직
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) targetContent.classList.add('active');
            if (typeof updateSidebarInfo === 'function') updateSidebarInfo(targetTab);
        });
    });
});