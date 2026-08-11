import pandas as pd
import numpy as np

# =========================
# 1. 데이터 로드
# =========================
df = pd.read_csv('ReadWeb-WinningNumbers.csv', encoding='utf-8-sig')
all_sums = df['합계'].values

user_combinations = [130, 136, 160, 172, 96, 132, 102, 139, 141, 148, 
                     152, 114, 169, 123, 133, 97, 116, 118, 144, 147]

# =========================
# 2. 기본 통계 계산
# =========================
user_avg = np.mean(user_combinations)
user_std = np.std(user_combinations)
user_min = min(user_combinations)
user_max = max(user_combinations)
user_median = np.median(user_combinations)

# =========================
# 3. 범위별 분포 분석
# =========================
# 사용자 조합
low_count = sum(1 for s in user_combinations if s < 120)
mid_count = sum(1 for s in user_combinations if 120 <= s < 150)
high_count = sum(1 for s in user_combinations if s >= 150)

low_pct = low_count / 20 * 100
mid_pct = mid_count / 20 * 100
high_pct = high_count / 20 * 100

# =========================
# 4. 과거 데이터와 비교
# =========================
hist_avg = np.mean(all_sums)
hist_std = np.std(all_sums)

# 과거 범위별 분포
hist_low = sum(1 for s in all_sums if s < 120)
hist_mid = sum(1 for s in all_sums if 120 <= s < 150)
hist_high = sum(1 for s in all_sums if s >= 150)

hist_low_pct = hist_low / len(all_sums) * 100
hist_mid_pct = hist_mid / len(all_sums) * 100
hist_high_pct = hist_high / len(all_sums) * 100

# 차이 계산
diff_low = low_pct - hist_low_pct
diff_mid = mid_pct - hist_mid_pct
diff_high = high_pct - hist_high_pct

# =========================
# 5. 극값 분석
# =========================
extreme_low_count = sum(1 for s in user_combinations if s < 100)
extreme_high_count = sum(1 for s in user_combinations if s >= 170)

hist_extreme_low = sum(1 for s in all_sums if s < 100)
hist_extreme_high = sum(1 for s in all_sums if s >= 170)

hist_extreme_low_pct = hist_extreme_low / len(all_sums) * 100
hist_extreme_high_pct = hist_extreme_high / len(all_sums) * 100

# =========================
# 6. 점수 계산 (5점 만점)
# =========================
score = 0

# 1) 평균 적절성 (130-145)
if 130 <= user_avg <= 145:
    score += 1

# 2) 분산 적절성 (25-35)
if 25 <= user_std <= 35:
    score += 1

# 3) 범위 커버 (60+)
if user_max - user_min >= 60:
    score += 1

# 4) 중합계 비중 (35-50%)
if 35 <= mid_pct <= 50:
    score += 1

# 5) 극값 회피
if extreme_low_count + extreme_high_count == 0:
    score += 1

# =========================
# 7. 권장 분포 계산
# =========================
ideal_low = int(20 * (hist_low_pct / 100))
ideal_mid = int(20 * (hist_mid_pct / 100))
ideal_high = 20 - ideal_low - ideal_mid

# =========================
# 8. 결과 출력
# =========================
print(f"평균: {user_avg:.2f} (과거: {hist_avg:.2f})")
print(f"표준편차: {user_std:.2f} (과거: {hist_std:.2f})")
print(f"\n범위별 분포:")
print(f"  저합계: {low_count}개 ({low_pct:.1f}%) - 과거 {hist_low_pct:.1f}% ({diff_low:+.1f}%p)")
print(f"  중합계: {mid_count}개 ({mid_pct:.1f}%) - 과거 {hist_mid_pct:.1f}% ({diff_mid:+.1f}%p)")
print(f"  고합계: {high_count}개 ({high_pct:.1f}%) - 과거 {hist_high_pct:.1f}% ({diff_high:+.1f}%p)")
print(f"\n극값: 극저 {extreme_low_count}개, 극고 {extreme_high_count}개")
print(f"점수: {score}/5점")
print(f"\n권장 분포: 저{ideal_low}개, 중{ideal_mid}개, 고{ideal_high}개")
