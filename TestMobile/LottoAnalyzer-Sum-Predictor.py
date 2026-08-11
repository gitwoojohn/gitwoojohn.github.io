import pandas as pd
import numpy as np
from collections import Counter

class LottoSumPredictor:
    def __init__(self, filepath):
        try:
            self.df = pd.read_csv(filepath)
        except UnicodeDecodeError:
            self.df = pd.read_csv(filepath, encoding='cp949')

        # 회차 정제 및 정렬
        self.df['회차'] = pd.to_numeric(self.df['회차'], errors='coerce')
        self.df = self.df.dropna(subset=['회차']).sort_values('회차').reset_index(drop=True)

        # 차기 회차 계산 (최신 회차 + 1)
        self.next_round = int(self.df['회차'].max() + 1)

    def _check_digit_assembly(self, target, src1, src2):
        """숫자 조립 가능 여부 체크"""
        target_str = str(target)
        source_str = str(src1) + str(src2)
        t_cnt = Counter(target_str)
        s_cnt = Counter(source_str)
        for digit, count in t_cnt.items():
            if s_cnt[digit] < count:
                return "X"
        return "O"

    def save_analysis_to_excel(self):
        print(f"--- {self.next_round}회 대비 분석 및 엑셀 생성 중 ---")
        
        results = []
        total_error = 0
        count = 0

        for i in range(len(self.df) - 2):
            round_t2 = self.df.iloc[i]
            round_t1 = self.df.iloc[i+1]
            round_current = self.df.iloc[i+2]

            sum_prev2, sum_prev1 = round_t2['합계'], round_t1['합계']
            actual = round_current['합계']
            
            predicted = (sum_prev2 + sum_prev1) / 2
            diff = abs(actual - predicted)
            total_error += diff
            count += 1

            # 상태 및 패턴 판별
            if diff <= 1: status = "🎯 대적중"
            elif diff <= 10: status = "🟢 근접"
            else: status = "⚪ 보통"

            trend = "🔺 상승" if actual > predicted else "🔻 하락"
            pattern = self._check_digit_assembly(actual, sum_prev1, sum_prev2)

            results.append({
                '회차': int(round_current['회차']),
                '실제합계': actual,
                '예측합계': predicted,
                '오차': diff,
                '상태': status,
                '변동': trend,
                '숫자조립(패턴)': pattern,
                '참고(직전)': sum_prev1,
                '참고(전전)': sum_prev2
            })

        avg_error = total_error / count if count > 0 else 0

        # 미래 예측 행 추가
        last_1, last_2 = self.df.iloc[-2]['합계'], self.df.iloc[-1]['합계']
        forecast = (last_1 + last_2) / 2
        
        results.append({
            '회차': self.next_round,
            '실제합계': '미정',
            '예측합계': forecast,
            '오차': '-',
            '상태': '🔮 예측구간',
            '변동': '-',
            '숫자조립(패턴)': '-',
            '참고(직전)': last_2,
            '참고(전전)': last_1
        })

        # 저장 실행
        result_df = pd.DataFrame(results)
        file_name = f"LottoAnalyzer-Sum-Predictor_{self.next_round}회예측.xlsx"
        
        with pd.ExcelWriter(file_name, engine='openpyxl') as writer:
            result_df.to_excel(writer, sheet_name='전체분석', index=False)
            result_df[result_df['상태'] == "🎯 대적중"].to_excel(writer, sheet_name='적중사례모음', index=False)
            result_df[result_df['숫자조립(패턴)'] == "O"].to_excel(writer, sheet_name='숫자조립패턴', index=False)

            # 서식 적용
            for sheet_name in writer.sheets:
                ws = writer.sheets[sheet_name]
                ws.freeze_panes = 'A2' # 1행 틀 고정 (A2 기준 위쪽 고정)
                
                for col in ws.columns:
                    max_length = 0
                    column = col[0].column_letter
                    for cell in col:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except: pass
                    ws.column_dimensions[column].width = (max_length + 2) * 1.2

        print(f"✅ 저장 완료: {file_name}")
        print(f"   - 추천 범위: {int(forecast - avg_error)} ~ {int(forecast + avg_error)}")

if __name__ == "__main__":
    predictor = LottoSumPredictor('ReadWeb-WinningNumbers.csv')
    predictor.save_analysis_to_excel()
