import itertools
import pandas as pd
from openpyxl.styles import Alignment, Font

class LottoSumAssembler:
    def __init__(self):
        self.min_sum = 50   # 최소 합계
        self.max_sum = 230  # 최대 합계

    def run(self):
        # 1. 사용자 입력 받기
        print("--- 합계 조립기 (Digit Assembler) ---")
        user_input = input("재료로 사용할 합계들을 입력하세요 (예: 116 166 50): ")
        
        # 입력값 파싱 (공백, 콤마 등 처리)
        try:
            input_sums = [int(s.strip()) for s in user_input.replace(',', ' ').split() if s.strip()]
        except ValueError:
            print("❌ 숫자만 입력해주세요.")
            return

        if not input_sums:
            print("❌ 입력된 숫자가 없습니다.")
            return

        # 2. 재료 분해 및 조립
        pool = []
        for s in input_sums:
            pool.extend(list(str(s)))
            
        print(f"🛠️ 재료 숫자: {input_sums}")
        print(f"🧬 추출 유전자: {pool}")
        
        results = set()
        
        # 3자리 숫자 조립
        for p in itertools.permutations(pool, 3):
            if p[0] == '0': continue
            num = int("".join(p))
            if self.min_sum <= num <= self.max_sum:
                results.add(num)
                
        # 2자리 숫자 조립
        for p in itertools.permutations(pool, 2):
            if p[0] == '0': continue
            num = int("".join(p))
            if self.min_sum <= num <= self.max_sum:
                results.add(num)
                
        sorted_results = sorted(list(results))
        
        print(f"✅ 조립 결과: 총 {len(sorted_results)}개 생성됨")

        # 3. 엑셀 저장
        df = pd.DataFrame({'생성된합계': sorted_results})
        
        # 간단한 분석 추가 (짝/홀)
        df['홀짝'] = df['생성된합계'].apply(lambda x: '짝수' if x % 2 == 0 else '홀수')
        
        file_name = "로또_합계조립결과.xlsx"
        
        with pd.ExcelWriter(file_name, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='조립결과', index=False)
            
            ws = writer.sheets['조립결과']
            
            # (1) 틀 고정
            ws.freeze_panes = 'A2'
            
            # (2) 헤더 높이 설정 (50)
            ws.row_dimensions[1].height = 50
            
            # 스타일 설정
            center_align = Alignment(horizontal='center', vertical='center')
            header_font = Font(bold=True, size=12)
            
            # (3) AutoFit 및 서식 적용
            for col in ws.columns:
                max_len = 0
                col_letter = col[0].column_letter
                
                # 헤더 폰트 적용
                col[0].font = header_font
                
                for cell in col:
                    try:
                        val_str = str(cell.value)
                        if len(val_str) > max_len: max_len = len(val_str)
                    except: pass
                    
                    # 가운데 정렬
                    cell.alignment = center_align
                
                # 너비 자동 조절
                ws.column_dimensions[col_letter].width = max((max_len + 2) * 1.3, 10)

        print(f"💾 엑셀 저장 완료: {file_name}")

if __name__ == "__main__":
    assembler = LottoSumAssembler()
    assembler.run()
