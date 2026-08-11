// ============================================================================
// GLOBAL VARIABLES (전역 변수)
// ============================================================================
window.lottoData = []; // 어디서든 접근 가능하도록 window 객체에 할당

// ============================================================================
// INITIALIZATION & EVENTS
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. 탭 전환 기능 초기화
    initTabNavigation();

    // 2. 파일 업로드 이벤트 리스너 등록
    const fileInput = document.getElementById('csvFile');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    } else {
        console.warn("경고: id가 'csvFile'인 input 요소를 찾을 수 없습니다.");
    }
});

// ============================================================================
// FILE UPLOAD HANDLER (CSV 파싱 & 디버깅)
// ============================================================================
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    updateMobileReport("데이터 분석 중...", true);

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // 숫자를 자동으로 Number 타입으로 변환
        complete: function(results) {
            
            // [DEBUG] 파싱 결과 정밀 분석
            console.group("📂 CSV 데이터 파싱 정밀 점검");
            console.log("1. 파일명:", file.name);
            console.log("2. 발견된 헤더(Column Names):", results.meta.fields);
            
            if (results.data.length === 0) {
                console.error("❌ 데이터가 비어있습니다!");
                console.groupEnd();
                return;
            }

            const firstRow = results.data[0];
            const lastRow = results.data[results.data.length - 1];

            console.log(`3. 총 데이터 개수: ${results.data.length}개`);
            console.log("4. 첫 번째 행 샘플:", firstRow);
            console.log("5. 마지막 행 샘플:", lastRow);

            // 중요: 필수 필드 검사
            const requiredFields = ['회차', '1번', '2번', '3번', '4번', '5번', '6번', '보너스'];
            const missingFields = requiredFields.filter(field => firstRow[field] === undefined);

            if (missingFields.length > 0) {
                console.error(`❌ 필수 필드 누락됨! 다음 필드가 안 보입니다: ${missingFields.join(', ')}`);
                console.warn("팁: CSV 파일의 헤더가 'No', 'Num1' 등 영어로 되어 있는지 확인하세요. 코드는 한글('회차', '1번')을 찾고 있습니다.");
            } else {
                console.log("✅ 필수 필드('회차', '1번' 등) 확인 완료.");
                console.log(`   - '1번'의 데이터 타입: ${typeof firstRow['1번']} (number여야 함)`);
            }
            console.groupEnd();
            // [DEBUG END]

            // 실제 데이터 저장 로직
            window.lottoData = results.data.filter(row => row['회차'] && row['1번']);
            
            if (window.lottoData.length > 0) {
                updateMobileReport(`${window.lottoData.length}개 회차 데이터 로드 완료`);
                document.querySelector('.report-panel-mobile')?.remove();
                
                // 분석 함수 실행
                if (typeof window.analyzeMainChart === 'function') window.analyzeMainChart();
                
                activateTab('main-chart');
            } else {
                updateMobileReport("유효한 데이터가 없습니다. 콘솔(F12)을 확인하세요.");
            }
        },
        error: function(err) {
            console.error("CSV 파싱 치명적 에러:", err);
            updateMobileReport("파일 읽기 실패");
        }
    });
}

// ============================================================================
// TAB NAVIGATION LOGIC
// ============================================================================
function initTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            activateTab(targetId);
        });
    });
}

function activateTab(targetId) {
    // 1. 모든 버튼 및 컨텐츠 비활성화
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    // 2. 타겟 버튼 및 컨텐츠 활성화
    const targetBtn = document.querySelector(`.tab-btn[data-tab="${targetId}"]`);
    const targetContent = document.getElementById(targetId);

    if (targetBtn && targetContent) {
        targetBtn.classList.add('active');
        targetContent.classList.add('active');
        
        // ★ 중요: 탭 전환 시 화면 스크롤 맨 위로
        window.scrollTo(0, 0);

        // ★ 중요: 숨겨져 있던 차트는 탭이 보일 때 리사이즈 해줘야 함
        // main-chart 탭으로 왔다면 차트 업데이트 트리거
        if (targetId === 'main-chart' && typeof window.updateChartsVisibility === 'function') {
            window.updateChartsVisibility();
        }
    }
}

// [수정] 모바일 리포트 텍스트 업데이트 (Inline Style 제거 -> Class 제어)
function updateMobileReport(message, isLoading = false) {
    const reportEl = document.getElementById('report-text');
    if (reportEl) {
        reportEl.textContent = message;
        
        // 기존: reportEl.style.color = ... (삭제함)
        // 변경: 클래스 추가/제거로 제어
        if (isLoading) {
            reportEl.classList.add('loading');
            reportEl.classList.remove('success');
        } else {
            reportEl.classList.add('success');
            reportEl.classList.remove('loading');
        }
    }
}