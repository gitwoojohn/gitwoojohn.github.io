import pandas as pd
import numpy as np
from openpyxl.styles import Alignment

class LottoStdAnalyzer:
    def __init__(self, filepath):
        self.df = pd.read_csv(filepath)
        
        # 1207회차 수동 추가 (보너스, 합계 포함)
        if self.df['회차'].max() < 1207:
            new_row = {
                '회차': 1207,
                '1번': 10, '2번': 22, '3번': 24, '4번': 27, '5번': 38, '6번': 45, 
                '보너스': 11, '합계': 166
            }
            self.df = pd.concat([self.df, pd.DataFrame([new_row])], ignore_index=True)

    def _get_interpretation(self, sd):
        if sd < 10: return "낮음 (몰림)"
        elif 10 <= sd < 12: return "약간 낮음"
        elif 12 <= sd <= 14: return "🟢 평균 (이상적)"
        elif 14 < sd <= 16: return "약간 높음"
        else: return "높음 (퍼짐)"

    def run_analysis(self):
        print("--- 표준편차 분석 및 엑셀 저장 시작 ---")

        # 1. 데이터 계산
        nums_cols = ['1번', '2번', '3번', '4번', '5번', '6번']
        
        # 합계가 혹시 없으면 계산
        if '합계' not in self.df.columns:
            self.df['합계'] = self.df[nums_cols].sum(axis=1)

        # 표준편차 및 해석 계산
        self.df['표준편차'] = self.df[nums_cols].std(axis=1, ddof=1)
        self.df['해석'] = self.df['표준편차'].apply(self._get_interpretation)

        # 2. 엑셀 데이터 준비
        # (A) 분석가이드
        guide_df = pd.DataFrame([
            {'구분': '낮음', '범위(SD)': '10 미만', '설명': '번호들이 특정 구간에 몰려 있음'},
            {'구분': '평균', '범위(SD)': '12 ~ 14', '설명': '가장 이상적인 밀집도 (추천)'},
            {'구분': '높음', '범위(SD)': '16 초과', '설명': '번호 간격이 극단적으로 퍼짐'},
        ])

        # (B) 구간별 통계
        bins = [0, 10, 12, 14, 16, 100]
        labels = ['10 미만', '10~12', '12~14 (평균)', '14~16', '16 초과']
        counts = pd.cut(self.df['표준편차'], bins=bins, labels=labels).value_counts().sort_index()
        stats_df = pd.DataFrame(counts).rename(columns={'count': '횟수'})
        stats_df['비율(%)'] = (stats_df['횟수'] / len(self.df) * 100).round(1)

        # 3. 엑셀 저장
        file_name = "로또_표준편차_분석.xlsx"
        
        # [요청] 컬럼 순서 재배치
        final_cols = ['회차'] + nums_cols + ['보너스', '합계', '표준편차', '해석']
        
        with pd.ExcelWriter(file_name, engine='openpyxl') as writer:
            guide_df.to_excel(writer, sheet_name='분석가이드', index=False)
            self.df[final_cols].to_excel(writer, sheet_name='전체내역', index=False)
            stats_df.to_excel(writer, sheet_name='구간별통계')

            # 스타일 적용
            center_align = Alignment(horizontal='center', vertical='center')

            for sheet_name in writer.sheets:
                ws = writer.sheets[sheet_name]
                ws.freeze_panes = 'A2' # 틀 고정
                
                # [요청] 1행(헤더) 행 높이 키우기
                ws.row_dimensions[1].height = 50 
                
                # 표준편차 컬럼 인덱스 찾기
                std_col_idx = None
                for cell in ws[1]:
                    if cell.value == '표준편차':
                        std_col_idx = cell.column

                for col in ws.columns:
                    # 너비 자동 맞춤
                    max_len = 0
                    col_letter = col[0].column_letter
                    for cell in col:
                        try:
                            val_len = len(str(cell.value))
                            if val_len > max_len: max_len = val_len
                        except: pass
                    ws.column_dimensions[col_letter].width = (max_len + 2) * 1.2
                    
                    # 가운데 정렬 및 서식
                    for cell in col:
                        cell.alignment = center_align
                        if col[0].column == std_col_idx and cell.row > 1:
                            cell.number_format = '0.00'

        print(f"💾 엑셀 저장 완료: {file_name}")

if __name__ == "__main__":
    analyzer = LottoStdAnalyzer('ReadWeb-WinningNumbers.csv')
    analyzer.run_analysis()
