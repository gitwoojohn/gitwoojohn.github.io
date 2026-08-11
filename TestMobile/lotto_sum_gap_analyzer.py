import pandas as pd
import numpy as np
from openpyxl.styles import Alignment, Font

class LottoSumGapAnalyzer:
    def __init__(self, filepath):
        self.df = pd.read_csv(filepath)
        self.df = self.df.sort_values('회차').reset_index(drop=True)

    def run_analysis(self):
        print("--- 합계 변동폭(Gap) 및 통계 분석 중 ---")
        
        # 1. 합계 컬럼 확보 (없으면 계산)
        cols = ['1번', '2번', '3번', '4번', '5번', '6번']
        if '합계' not in self.df.columns:
            self.df['합계'] = self.df[cols].sum(axis=1)

        # 2. 직전 회차 합계와의 차이(Gap) 계산
        # diff() 함수: 현재행 - 이전행
        self.df['직전합계'] = self.df['합계'].shift(1)
        self.df['합계차이'] = self.df['합계'].diff()
        
        # 첫 번째 행은 차이가 없으므로 제외
        self.df = self.df.dropna(subset=['합계차이'])
        
        # 3. 통계 산출 (절대값 기준)
        abs_gaps = self.df['합계차이'].abs()
        mean_gap = abs_gaps.mean()
        std_gap = abs_gaps.std()
        
        print(f"📊 [합계 차이(Gap) 통계 분석]")
        print(f"   - 평균 변동폭: ±{mean_gap:.2f}")
        print(f"   - 표준편차: {std_gap:.2f}")
        
        # 4. 상태 판별 (평균+표준편차 넘어가면 '대격변')
        threshold = mean_gap + std_gap
        
        def get_status(gap):
            val = abs(gap)
            if val > threshold: return "🔥 대격변" # 변동폭 큼
            elif val < (mean_gap * 0.5): return "💤 정체" # 변동폭 작음
            else: return "보통"

        self.df['상태'] = self.df['합계차이'].apply(get_status)

        # 5. 엑셀 저장
        file_name = "로또_합계차이_정밀분석.xlsx"
        output_cols = ['회차', '직전합계', '합계', '합계차이', '상태']
        
        with pd.ExcelWriter(file_name, engine='openpyxl') as writer:
            self.df[output_cols].to_excel(writer, sheet_name='합계변동분석', index=False)
            
            ws = writer.sheets['합계변동분석']
            ws.freeze_panes = 'A2'
            ws.row_dimensions[1].height = 40
            
            center_align = Alignment(horizontal='center', vertical='center')
            red_font = Font(color="FF0000", bold=True)
            blue_font = Font(color="0000FF", bold=True)
            
            # 차이 컬럼 찾기
            diff_col_idx = None
            for cell in ws[1]:
                if cell.value == '합계차이': diff_col_idx = cell.column

            for col in ws.columns:
                # AutoFit (실수 소수점 고려)
                max_len = 0
                col_letter = col[0].column_letter
                for cell in col:
                    try:
                        val_str = str(cell.value)
                        if isinstance(cell.value, float):
                            val_str = f"{cell.value:.0f}"
                        if len(val_str) > max_len: max_len = len(val_str)
                    except: pass
                
                # 너비 조정 (최소 8칸 확보)
                ws.column_dimensions[col_letter].width = max((max_len + 2) * 1.3, 8)

                for cell in col:
                    cell.alignment = center_align
                    
                    # 합계차이에 화살표 및 색상 적용
                    if cell.column == diff_col_idx and cell.row > 1:
                        try:
                            val = float(cell.value)
                            if val > 0:
                                cell.value = f"🔺 +{int(val)}"
                                cell.font = red_font
                            elif val < 0:
                                cell.value = f"🔻 {int(val)}"
                                cell.font = blue_font
                            else:
                                cell.value = "-"
                        except: pass

        print(f"💾 엑셀 저장 완료: {file_name}")

if __name__ == "__main__":
    analyzer = LottoSumGapAnalyzer('ReadWeb-WinningNumbers.csv')
    analyzer.run_analysis()
