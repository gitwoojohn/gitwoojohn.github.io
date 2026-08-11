# SimpleInsight JS Folder Improvement Analysis

작성일: 2026-04-25

범위:
- 실제 로드 파일: `common.js`, `tab-analysis.js`, `tab-pattern.js`, `tab-stats.js`, `tab-analysis-sum.js`, `tab-stats-multi.js`, `tab-pattern-search.js`, `tab-custom-search.js`, `tab-round-flow.js`, `tab-carryover.js`, `tab-total-list.js`
- 미사용 또는 백업 성격 파일: `tab-ai.js`, `tab-total-list - 복사본.js`, `tab-carryover - 복사본.js`

전제:
- 이번 작업은 코드 수정이 아니라 개선점 분석과 문서화만 수행했다.
- 라인 번호는 현재 워크스페이스 기준이다.

## 핵심 요약

1. 전역 상태와 스크립트 로드 순서 의존성이 강하다.
2. CSV 로드 경로가 둘 이상인데 상태 동기화가 완전히 통일되지 않았다.
3. `innerHTML`, 인라인 `onclick`, 즉시 DOM 조회가 폴더 전반에 퍼져 있어 유지보수성이 낮다.
4. 같은 성격의 검색/분석 로직이 여러 파일에 흩어져 있어 성능 최적화와 버그 수정이 중복된다.
5. 레거시 주석 블록과 `복사본` 파일이 많아서 실제 동작 코드 파악 비용이 높다.

## 공통 개선 포인트

### 1. 전역 스코프 결합이 너무 강함

- `common.js`가 다른 파일의 함수를 `typeof ... === "function"`으로 호출하는 방식에 의존한다. `common.js:79`, `common.js:89-92`, `common.js:130-131`
- 여러 파일이 `createPatternRow`, `showToast`, `getRangeClass`, `lottoData`, `lottoIndex`를 암묵적으로 공유한다.
- `tab-custom-search.js`와 `tab-carryover.js`는 같은 이름의 `updateSidebarReport()`를 전역에 선언한다. `tab-custom-search.js:184-188`, `tab-carryover.js:532-534`

개선 방향:
- 최소한 "데이터 로드", "탭 초기화", "공통 렌더", "사이드바 업데이트"를 역할별로 분리해야 한다.
- 전역 함수 이름 충돌을 막기 위해 네임스페이스 또는 모듈 단위로 묶는 편이 낫다.

### 2. 데이터 로드 후 상태 초기화 규칙이 불완전함

- 자동 로드에서는 `lottoIndex`를 채우지만 수동 업로드에서는 채우지 않는다. `common.js:75-77`, `common.js:121-131`
- `tab-stats.js`와 `tab-stats-multi.js`는 `isStatsAnalyzed`, `isMultiStatsAnalyzed` 캐시 플래그를 쓰는데, 새 CSV 업로드 시 이 플래그를 리셋하지 않는다. `tab-stats.js:225-247`, `tab-stats-multi.js:124-145`
- 결과적으로 CSV를 다시 올린 뒤에도 일부 탭이 예전 결과를 유지할 가능성이 있다.

개선 방향:
- CSV 로드 완료 시점에 공통 초기화 함수를 하나 두고 `lottoData`, `lottoIndex`, 탭별 캐시를 한 번에 리셋해야 한다.

### 3. `innerHTML`과 인라인 이벤트 사용이 많음

- `common.js`, `tab-pattern.js`, `tab-pattern-search.js`, `tab-analysis-sum.js`, `tab-total-list.js`, `tab-round-flow.js`, `tab-carryover.js`가 모두 큰 HTML 문자열 렌더링에 의존한다.
- 인라인 `onclick`도 여러 곳에 남아 있다. `tab-pattern.js:359`, `tab-analysis-sum.js:168`, `tab-pattern-search.js:614`
- 현재는 CSV 숫자 위주라 크게 드러나지 않지만, 날짜나 텍스트 컬럼이 외부 입력으로 바뀌면 주입 리스크가 생긴다.

개선 방향:
- 숫자/텍스트 노드는 `textContent`, 반복 리스트는 `createElement` 기반으로 통일하는 편이 안전하다.
- 이벤트는 `addEventListener`로만 연결하는 편이 디버깅과 접근성 대응에 유리하다.

### 4. DOM 초기화 타이밍이 파일마다 제각각임

- 어떤 파일은 `DOMContentLoaded` 안에서 초기화하고, 어떤 파일은 파일 로드 즉시 DOM을 조회한다.
- 예를 들어 `tab-pattern-search.js`와 `tab-round-flow.js`는 버튼을 바로 조회하고 이벤트를 붙인다. `tab-pattern-search.js:460-477`, `tab-round-flow.js:247-258`
- 지금은 `index.html` 하단에서 스크립트를 로드해서 우연히 안전하지만, 스크립트 위치가 바뀌면 쉽게 깨진다.

개선 방향:
- 탭별 `init...()` 함수를 만들고 한 곳에서 초기화 순서를 관리하는 구조가 낫다.

### 5. CSV 스키마 fallback이 여러 파일에 흩어져 있음

- `"회차"`, `"No"`, `"보너스"`, `"보너스번호"`, `"bonus"`, `"날짜"`, `"추첨일"` 같은 fallback이 파일마다 다르게 흩어져 있다.
- 예: `tab-pattern-search.js:494-500`, `tab-round-flow.js:312-318`, `tab-total-list.js:49-66`

개선 방향:
- CSV 로드 직후 표준 필드명으로 정규화한 뒤, 이후 코드는 정규화된 필드만 쓰는 구조가 유지보수에 유리하다.

### 6. 레거시 코드와 백업 파일이 너무 많음

- `common.js`, `tab-stats.js`, `tab-stats-multi.js`, `tab-pattern.js`, `tab-round-flow.js`, `tab-analysis-sum.js`, `tab-carryover.js`, `tab-pattern-search.js`에 대형 주석 블록이 남아 있다.
- `tab-total-list - 복사본.js`, `tab-carryover - 복사본.js`는 전역 변수와 함수명까지 겹친다.

개선 방향:
- 동작 이력은 Git에 맡기고, 런타임 폴더에는 현재 버전만 남기는 편이 낫다.

## 파일별 분석

### `common.js`

- 탭 클릭 핸들러가 두 번 등록되어 있다. `common.js:164-201`, `common.js:496-520`
- `processData()`가 정의돼 있지만 실제로 쓰이지 않는다. `common.js:107-113`
- `lottoIndex`를 도입했는데도 상세 패널에서는 다시 `lottoData.find()`를 사용한다. `common.js:535-536`
- 공통 레이아웃 함수가 고정 `id`를 생성해 탭 간 중복 DOM id를 만든다. `common.js:744-770`
- 스타일을 JS에서 직접 지정하는 부분이 적지 않다. `common.js:409-411`, `common.js:576-583`, `common.js:670`, `common.js:736`

개선 방향:
- 탭 초기화 중복 제거, 데이터 로드 공통화, 공통 레이아웃의 `id` 제거 또는 컨테이너 스코프 조회가 필요하다.

### `tab-analysis.js`

- 점수 계산 루프 안에서 `Math.max(...skips)`와 전체 pair 탐색을 반복한다. `tab-analysis.js:65-74`
- 전략 상수와 실제 판정 기준이 분리되어 있다. `tab-analysis.js:11-14`, `tab-analysis.js:131-144`, `tab-analysis.js:210-216`
- 차트 캔버스 조회에 대한 방어 코드가 없다. `tab-analysis.js:168`, `tab-analysis.js:241`, `tab-analysis.js:304`
- 결과 리포트를 HTML 문자열로 바로 만든다. `tab-analysis.js:123-125`, `tab-analysis.js:140-144`

개선 방향:
- 점수 계산용 전처리 맵을 따로 만들고, 상수는 한 군데에서만 관리하는 편이 낫다.

### `tab-pattern.js`

- 상단의 과거 버전 주석 블록이 길어서 실제 코드 가독성을 해친다. `tab-pattern.js:1-262`
- 입력 이벤트 바인딩이 파일 로드 즉시 수행된다. `tab-pattern.js:285-298`
- 결과 렌더링이 큰 `innerHTML` 문자열과 인라인 `onclick`에 의존한다. `tab-pattern.js:350-410`
- `lottoIndex`를 일부만 활용하고, 통계/사이드바 계산은 여전히 문자열 조합과 반복 루프에 많이 의존한다. `tab-pattern.js:309-312`, `tab-pattern.js:430-467`

개선 방향:
- 패턴 검색용 데이터 정규화와 렌더 분리를 먼저 하는 편이 좋다.

### `tab-stats.js`

- `isStatsAnalyzed` 플래그 때문에 새 데이터 업로드 후 재계산이 막힐 수 있다. `tab-stats.js:225-247`
- `window.currentRangeSum`를 통해 상태를 전역에 노출한다. `tab-stats.js:300`
- `renderPatternLayout()`가 만든 공통 id에 직접 접근한다. `tab-stats.js:252-305`, `common.js:748-761`
- 차트 인스턴스를 보관하거나 정리하지 않는다. `tab-stats.js:304-342`

개선 방향:
- 이 파일은 계산 함수와 UI 함수 분리가 시작되어 있어서, 같은 방향으로 더 밀어붙이면 가장 빨리 좋아질 수 있다.

### `tab-stats-multi.js`

- `isMultiStatsAnalyzed`도 동일한 재분석 문제를 가진다. `tab-stats-multi.js:124-145`
- 공통 레이아웃을 쓰지만 요약 카드 데이터를 제대로 채우지 않는다. `tab-stats-multi.js:150-156`
- 존재하지 않는 `multi-total-badge`를 갱신하려고 한다. `tab-stats-multi.js:217-220`
- 파일 상단의 긴 주석 버전이 남아 있다. `tab-stats-multi.js:1-123`

개선 방향:
- `tab-stats.js`와 공통화하려면 레이아웃뿐 아니라 요약 데이터 구조까지 같이 맞춰야 한다.

### `tab-analysis-sum.js`

- 과거 버전 코드가 파일 상단에 그대로 남아 있다. `tab-analysis-sum.js:6-27`
- `lottoData.forEach()` 안에서 다음 회차를 `find()`로 찾는다. `tab-analysis-sum.js:81-94`
- `getPattern()`이 `history.map()` 내부에 중첩 선언되어 반복 생성된다. `tab-analysis-sum.js:135-164`
- 결과 리스트가 거대한 HTML 문자열과 인라인 `onclick`에 의존한다. `tab-analysis-sum.js:166-226`
- 입력창 포커스 시 값을 무조건 지우는 UX는 오입력을 유발할 수 있다. `tab-analysis-sum.js:33-37`

개선 방향:
- 검색 결과 전처리, 패턴 계산, 렌더링을 분리하면 파일 복잡도가 많이 내려간다.

### `tab-pattern-search.js`

- 버튼 클릭 리스너를 null guard 없이 바로 등록한다. `tab-pattern-search.js:477`
- 상단의 긴 주석 버전과 실제 구현이 함께 있어 읽기 어렵다. `tab-pattern-search.js:1-451`
- 행 하나를 렌더링할 때 이전/다음/이월 계산을 위해 `find()`를 여러 번 수행한다. `tab-pattern-search.js:547-570`
- 메인 렌더가 큰 `innerHTML`과 인라인 `onclick`에 묶여 있다. `tab-pattern-search.js:613-646`
- 더 보기 버튼도 `btn.onclick`을 사용한다. `tab-pattern-search.js:657-675`

개선 방향:
- 이 파일은 기능이 많아서 "검색 조건 수집", "데이터 조회", "행 렌더링"을 별도 함수로 더 잘게 나눌 필요가 있다.

### `tab-custom-search.js`

- `updateSidebarReport()`가 전역 함수로 중복 선언된다. `tab-custom-search.js:184-188`, `tab-carryover.js:532-534`
- 각 결과마다 직전 회차를 `find()`로 다시 찾는다. `tab-custom-search.js:105-108`
- 다음 회차 분석도 `matches` 루프 안에서 다시 `find()`를 돈다. `tab-custom-search.js:132-139`
- `rowData.operator = "+"`는 실제 연산 의미보다 UI 제어용 플래그처럼 쓰이고 있다. `tab-custom-search.js:110-119`

개선 방향:
- 이 파일은 `lottoIndex`를 직접 재사용하면 바로 단순해질 수 있다.

### `tab-round-flow.js`

- `search-flow-btn`에 null guard 없이 바로 이벤트를 붙인다. `tab-round-flow.js:258`
- 조회할 때마다 `Math.max(...lottoData.map(...))`로 최신 회차를 다시 계산한다. `tab-round-flow.js:283-288`
- 결과 렌더링이 HTML 문자열 중심이다. `tab-round-flow.js:300-349`
- 렌더 후 항상 `scrollIntoView()`를 호출해 사용자가 놀랄 수 있다. `tab-round-flow.js:355-358`

개선 방향:
- 이 파일은 단순 조회 탭이므로 데이터 계산을 더 줄이고 렌더만 안정화해도 효과가 크다.

### `tab-carryover.js`

- 과거 버전 코드가 상단에 많이 남아 있다. `tab-carryover.js:1-257`
- `cachedMatches`, `currentCoLimit` 같은 전역 상태를 직접 관리한다. `tab-carryover.js:258-259`
- 검색/렌더/인사이트 계산 전반에서 `find()`를 반복 호출한다. `tab-carryover.js:301`, `tab-carryover.js:364-365`, `tab-carryover.js:498`
- `createPatternRow()`가 만든 DOM을 후처리로 수정하는 방식이라 결합도가 높다. `tab-carryover.js:422-455`
- 버튼 스타일을 JS에서 직접 지정한다. `tab-carryover.js:472`
- `updateSidebarReport()`가 또 전역에 선언된다. `tab-carryover.js:532-534`

개선 방향:
- 이 파일은 공통 패턴 행을 재사용하는 방향 자체는 괜찮지만, 후처리 의존이 커서 전용 렌더 계층을 검토할 가치가 있다.

### `tab-total-list.js`

- 검색 결과가 0건일 때 기존 목록을 비우지 않고 그냥 반환한다. `tab-total-list.js:14-16`, `tab-total-list.js:27`
- 현재 구현은 CSV에 `합계`, `AC`, `편차`, `홀짝`이 이미 있어야 한다고 가정한다. 누락되면 `NaN`이나 빈 값이 노출될 수 있다. `tab-total-list.js:58-66`
- 초기화가 `DOMContentLoaded` 없이 즉시 실행된다. `tab-total-list.js:107-148`
- 버튼 이벤트 일부가 `onclick`에 의존한다. `tab-total-list.js:95-98`

개선 방향:
- "필수 CSV 컬럼"과 "없으면 계산 가능한 컬럼"을 분리해서 처리하는 편이 안전하다.

### `tab-ai.js`

- 실제 기능 없이 `console.log()`만 남아 있다. `tab-ai.js:5-6`
- 현재 `index.html`에서 로드되지도 않는다.

개선 방향:
- 가까운 시일 내 구현 계획이 없다면 제거하거나, 계획이 있다면 명시적인 TODO 문서로 분리하는 편이 낫다.

### `tab-total-list - 복사본.js`

- 현재 파일과 전역 변수/함수명이 거의 동일하다. `isLatestFirst`, `filteredData`, `renderTotalList()`
- 실제 로드 파일이 아니더라도 같은 폴더에 두면 유지보수자가 혼동하기 쉽다.

개선 방향:
- Git 히스토리로 대체하고 런타임 폴더에서는 제거하는 편이 낫다.

### `tab-carryover - 복사본.js`

- 현재 `tab-carryover.js`와 거의 같은 책임을 가진 백업 파일이다.
- 전역 함수명 `updateSidebarReport()`까지 겹친다.

개선 방향:
- 런타임 폴더 밖으로 빼거나 제거하는 편이 낫다.

## 우선순위별 정리

### 우선순위 높음

- `common.js`의 탭 이벤트 중복 제거
- CSV 재업로드 시 캐시와 인덱스 상태 초기화 규칙 통일
- 전역 함수명 충돌 제거 (`updateSidebarReport`)
- 공통 레이아웃의 중복 `id` 제거
- `tab-total-list.js`의 "0건 검색 시 이전 결과 잔존" 문제 정리

### 우선순위 중간

- `innerHTML`/인라인 `onclick` 축소
- 반복 `find()`를 `lottoIndex` 또는 정규화된 맵 조회로 대체
- 즉시 DOM 바인딩 파일들을 공통 초기화 방식으로 통일
- CSV 필드 정규화 계층 도입

### 우선순위 낮음

- 상단의 대형 주석 블록 제거
- `복사본` 파일 정리
- 미사용 `tab-ai.js` 처리

## 권장 작업 순서

1. CSV 로드 완료 공통 함수를 만들고 `lottoData`, `lottoIndex`, 탭 캐시를 한 번에 정리
2. 탭 초기화 코드를 한 곳으로 모아 DOM 바인딩 방식을 통일
3. 공통 레이아웃의 고정 `id`와 전역 함수 충돌 제거
4. 성능 민감한 검색 탭부터 `find()` 반복을 맵 조회로 치환
5. `innerHTML` + 인라인 이벤트 비중을 줄이고 렌더 함수 구조를 단순화
6. 마지막으로 레거시 주석과 백업 파일 정리
