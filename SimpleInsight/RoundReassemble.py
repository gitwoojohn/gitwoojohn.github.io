import pandas as pd
import itertools

def get_reassembled_nums(round_num):
    digits = [d for d in str(round_num)]
    possible = set()
    for d in digits:
        val = int(d); (1 <= val <= 45) and possible.add(val)
    for combo in itertools.permutations(digits, 2):
        val = int(combo[0] + combo[1]); (1 <= val <= 45) and possible.add(val)
    return sorted(list(possible))

def process_lotto_data(file_path):
    df = pd.read_csv(file_path)
    main_cols, reassemble_data = ['1번','2번','3번','4번','5번','6번'], []

    for _, row in df.iterrows():
        r_num = int(row['회차'])
        win_nums = [int(row[c]) for c in main_cols]
        reassembled = get_reassembled_nums(r_num)
        matches = [n for n in reassembled if n in win_nums]
        
        item = [r_num] + win_nums + [sum(win_nums)]
        item += [reassembled[i] if i < len(reassembled) else "" for i in range(15)]
        item += [matches[i] if i < len(matches) else "" for i in range(6)]
        item += [len(matches)]
        reassemble_data.append(item)

    cols = ['회차','당첨1','당첨2','당첨3','당첨4','당첨5','당첨6','합계'] + \
           [f'재{i}' for i in range(1, 16)] + [f'적{i}' for i in range(1, 7)] + ['적중개수']
    return pd.DataFrame(reassemble_data, columns=cols)

def main():
    try:
        result_df = process_lotto_data('ReadWeb-WinningNumbers.csv')
        num_rows = len(result_df)
        
        with pd.ExcelWriter('reassemble_results.xlsx', engine='xlsxwriter') as writer:
            result_df.to_excel(writer, index=False, startrow=1, header=False)
            wb, ws = writer.book, writer.sheets['Sheet1']
            
            # 포맷 정의
            h_fmt = wb.add_format({'bold':True, 'align':'center', 'border':1, 'bg_color':'#D3D3D3'})
            c_fmt = wb.add_format({'align':'center', 'border':1})
            blue_fmt = wb.add_format({'bg_color': '#0070C0', 'font_color': 'white', 'align':'center', 'border':1})
            sum_col_fmt = wb.add_format({'align':'center', 'border':1, 'right':2})

            # 헤더 작성
            headers = [('회차',0,0), ('당첨번호',1,6), ('합계',7,7), ('재조립번호',8,22), ('적중번호',23,28), ('적중개수',29,29)]
            for lab, s, e in headers:
                if s == e: ws.write(0, s, lab, h_fmt)
                else: ws.merge_range(0, s, 0, e, lab, h_fmt)

            # --- Auto-fit 및 H열 굵은 선 적용 ---
            for i, col in enumerate(result_df.columns):
                # 데이터 최대 길이 계산 (헤더 포함)
                max_len = max(result_df.iloc[:, i].astype(str).map(len).max(), len(col)) + 2
                
                # H열(7번 인덱스)은 굵은 선 포맷 적용, 나머지는 기본 포맷
                fmt = sum_col_fmt if i == 7 else c_fmt
                ws.set_column(i, i, max_len, fmt)

            # 조건부 서식
            ws.conditional_format(1, 1, num_rows, 6, {
                'type': 'formula', 'criteria': '=COUNTIF($I2:$W2, B2)>0', 'format': blue_fmt
            })
            ws.conditional_format(1, 8, num_rows, 22, {
                'type': 'formula', 'criteria': '=COUNTIF($B2:$G2, I2)>0', 'format': blue_fmt
            })

            ws.freeze_panes(1, 0)
        
        print("완료: Auto-fit 및 H열 오른쪽 굵은 선 적용")
        
    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == "__main__":
    # 테스트 코드 
    roundNumber = 1208        
    print(get_reassembled_nums(roundNumber))
    
    #main()
