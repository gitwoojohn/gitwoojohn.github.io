import pandas as pd
import numpy as np
import sys
import glob
import re
import os

# ---------------------------------------------------------
# 설정 및 상수
# ---------------------------------------------------------
SHEET_NAME = '전체분석'
FILE_PATTERN = "LottoAnalyzer-Sum-Predictor_*회예측.xlsx"

# ---------------------------------------------------------
# 최신 파일 자동 검색 로직
# ---------------------------------------------------------
def get_latest_file():
    """파일명의 회차 숫자를 비교하여 가장 최신 파일을 선택"""
    file_list = glob.glob(FILE_PATTERN)
    
    if not file_list:
        print(f"❌ '{FILE_PATTERN}' 패턴과 일치하는 파일을 찾을 수 없습니다.")
        sys.exit(1)
        
    def extract_round(filename):
        numbers = re.findall(r'\d+', filename)
        return int(numbers[0]) if numbers else 0

    latest_file = max(file_list, key=extract_round)
    return latest_file

# ---------------------------------------------------------
# 데이터 분석 로직 (Core Logic)
# ---------------------------------------------------------
def load_data(file_path):
    try:
        df_dict = pd.read_excel(file_path, sheet_name=None, engine='openpyxl')
        if SHEET_NAME in df_dict:
            df = df_dict[SHEET_NAME]
        else:
            df = list(df_dict.values())[0]

        df['회차'] = pd.to_numeric(df['회차'], errors='coerce')
        df = df.dropna(subset=['회차']).sort_values('회차').reset_index(drop=True)
        return df
    except Exception as e:
        print(f"❌ 데이터 로드 오류: {e}")
        sys.exit(1)

def analyze_patterns(df):
    hit_mask = df['상태'].astype(str).str.contains('대적중')
    last_hit_idx = df[hit_mask].index[-1]
    last_hit_round = int(df.loc[last_hit_idx, '회차'])
    
    post_hit_df = df.loc[last_hit_idx+1:].copy()
    valid_streak_df = post_hit_df[~post_hit_df['상태'].astype(str).str.contains('예측구간|미정')]
    
    current_streak = len(valid_streak_df)
    last_update_round = int(valid_streak_df.iloc[-1]['회차']) if not valid_streak_df.empty else last_hit_round

    current_pattern = []
    if current_streak >= 3:
        raw_pattern = valid_streak_df['상태'].iloc[-3:].astype(str).tolist()
        current_pattern = [s.strip().split()[-1] for s in raw_pattern]

    hit_indices = df[hit_mask].index
    match_count = 0
    total_valid_hits = 0

    for idx in hit_indices:
        if idx < 3: continue
        total_valid_hits += 1
        past_pattern_raw = df.loc[idx-3:idx-1, '상태'].astype(str).tolist()
        past_pattern = [s.strip().split()[-1] for s in past_pattern_raw]
        
        if current_pattern and past_pattern == current_pattern:
            match_count += 1
            
    match_rate = (match_count / total_valid_hits * 100) if total_valid_hits > 0 else 0

    return {
        'last_hit_round': last_hit_round,
        'current_streak': current_streak,
        'last_update_round': last_update_round,
        'pattern_seq': " - ".join(current_pattern) if current_pattern else "데이터 수집 중",
        'match_count': match_count,
        'total_hits': total_valid_hits,
        'match_rate': match_rate,
        'hit_indices': hit_indices,
        'df': df
    }

def calculate_targets(res):
    last_hit = res['last_hit_round']
    intervals = res['df'].loc[res['hit_indices'], '회차'].diff().dropna()
    
    t1_start = last_hit + 14
    t1_end = last_hit + 16
    median_val = intervals.median()
    t2_target = last_hit + int(median_val)
    
    return t1_start, t1_end, t2_target

# ---------------------------------------------------------
# 리포트 출력 (Presentation) - 원본 복구
# ---------------------------------------------------------
def print_dashboard(res, t1_start, t1_end, t2_target):
    days_left = t1_start - (res['last_hit_round'] + res['current_streak'])
    d_day_str = f"{days_left}회차 남음" if days_left > 0 else "진입 구간 도달"

    print("\n" + "━" * 50)
    print(f"📊 [심층 분석 보고서] 기준 회차: {res['last_update_round']}회")
    print("━" * 50)
    
    print(f"\n1. 실시간 데이터 추세")
    print(f"   • 직전 대적중   : {res['last_hit_round']}회")
    print(f"   • 현재 경과     : +{res['current_streak']}회 (연속 미적중)")
    print(f"   • 발생 패턴     : [{res['pattern_seq']}] 흐름")
    
    print(f"\n2. 과거 패턴 대조 결과")
    print(f"   • 패턴 일치율   : {res['match_rate']:.1f}%")
    print(f"   • 분석 요약     : 과거 대적중 {res['total_hits']}건 중 {res['match_count']}건이")
    print(f"                   현재와 동일한 패턴 직후에 발생했습니다.")
    
    signal = "🔥 집중 관찰 필요 (유의미한 신호)" if res['match_rate'] >= 40 else "☁️ 일반적 흐름"
    print(f"   • 신호 강도     : {signal}")

    print(f"\n3. 예측 적중 구간")
    print(f"   🎯 1차 유력 구간 : {t1_start}회 ~ {t1_end}회")
    print(f"      └─ 상태 : 기술적 반등 임박 ({d_day_str})")
    
    print(f"   🛡️ 2차 보조 구간 : {t2_target}회 부근")
    print(f"      └─ 상태 : 통계적 평균 회귀 지점")
    
    print("-" * 50)
    print(f"💡 [대응 전략] 현재 출현 확률이 점점 높아지는 구간입니다.")
    print(f"   {t1_start}회차를 기점으로 진입 비중을 확대하는 것이 통계적으로 유리합니다.")
    print("━" * 50 + "\n")

# ---------------------------------------------------------
# 메인 실행 (Main)
# ---------------------------------------------------------
def main():
    target_file = get_latest_file()
    print(f"📂 분석 대상 파일: {target_file}")
    
    df = load_data(target_file)
    result = analyze_patterns(df)
    t1_s, t1_e, t2 = calculate_targets(result)
    
    print_dashboard(result, t1_s, t1_e, t2)

if __name__ == "__main__":
    main()
