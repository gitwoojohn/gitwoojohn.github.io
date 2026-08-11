import pandas as pd
import numpy as np

# 1. 분석 도구 설계 (Class 정의)
class LottoAnalyzer:
    def __init__(self, filepath):
        # CSV 파일 읽기
        self.df = pd.read_csv(filepath)
        self.current_round = int(self.df['회차'].max())

    def get_start_number_rounds(self, number=1):
        # 특정 번호로 시작하는 회차 찾기
        rounds = self.df[self.df['1번'] == number]['회차'].tolist()
        return [int(r) for r in rounds]

    def find_start_pattern_sequence(self, sequence):
        # 특정 패턴(예: 8->1->1) 찾기
        matches = []
        seq_len = len(sequence)
        first_nums = self.df['1번'].values
        rounds = self.df['회차'].values
        
        for i in range(len(self.df) - seq_len + 1):
            if np.array_equal(first_nums[i:i+seq_len], sequence):
                matches.append(int(rounds[i]))
        return matches

    def get_cold_numbers(self, threshold=15):
        # 오랫동안 안 나온 번호 찾기
        cold_nums = {}
        num_cols = ['1번', '2번', '3번', '4번', '5번', '6번']
        
        for num in range(1, 46):
            mask = (self.df[num_cols] == num).any(axis=1)
            if mask.any():
                last_seen = self.df.loc[mask, '회차'].max()
                gap = self.current_round - last_seen
                if gap >= threshold:
                    cold_nums[int(num)] = int(gap)
        
        return sorted(cold_nums.items(), key=lambda x: x[1], reverse=True)

    def analyze_combination(self, numbers):
        # 내 번호 조합 분석하기
        last_30 = self.df.tail(30).iloc[:, 2:8].values.flatten()
        # 최근 30회 다출현 번호(Hot)
        hot_nums = pd.Series(last_30).value_counts().head(10).index.tolist()
        hot_nums = [int(n) for n in hot_nums]
        
        # 미출현 번호(Cold)
        cold_data = self.get_cold_numbers(15)
        cold_list = [n for n, gap in cold_data]
        
        results = {
            '번호': numbers,
            '총합': int(sum(numbers)),
            '홀짝': f"{sum(1 for n in numbers if n%2!=0)}:{sum(1 for n in numbers if n%2==0)}",
            '포함된 핫넘버': [n for n in numbers if n in hot_nums],
            '포함된 콜드넘버': [n for n in numbers if n in cold_list],
            '시작번호': numbers[0]
        }
        return results

    def generate_insight_report(self, numbers):
        """사용자 번호에 대한 상세 인사이트 보고서 생성"""
        
        # 1. 기초 데이터 계산
        numbers = sorted(numbers)
        cold_data = dict(self.get_cold_numbers(15)) # {번호: 미출현기간}
        
        last_30 = self.df.tail(30).iloc[:, 2:8].values.flatten()
        hot_nums = set([int(n) for n in pd.Series(last_30).value_counts().head(10).index])
        
        my_cold = {n: cold_data[n] for n in numbers if n in cold_data}
        my_hot = [n for n in numbers if n in hot_nums]
        
        odd = sum(1 for n in numbers if n % 2 != 0)
        low = sum(1 for n in numbers if n <= 23)
        start_num = numbers[0]
        
        # 2. 리포트 작성
        report = []
        
        # [포인트 1] 미출현수 분석
        if my_cold:
            names = ", ".join([f"{n}번({gap}회 쉼)" for n, gap in my_cold.items()])
            risk_level = "하이 리스크 하이 리턴" if len(my_cold) >= 2 else "전략적 포함"
            report.append(f"1. 🥶 미출현수의 귀환 ({', '.join(map(str, my_cold.keys()))})\n"
                          f"   - 현재 장기 미출현수인 **{names}**을 포함했습니다.\n"
                          f"   - 이는 상위 당첨을 노리는 **'{risk_level}'** 구조입니다.")
        else:
            report.append("1. 🥶 미출현수 미포함: 최근 추세를 따르는 안정적인 선택입니다.")

        # [포인트 2] 시작 번호(단번대) 분석
        start_count = len(self.df[self.df['1번'] == start_num])
        if start_num >= 10:
            report.append(f"2. 🚫 단번대(1~9) 과감한 삭제\n"
                          f"   - 시작수: {start_num}번.\n"
                          f"   - **'1번대 전멸'**을 가정한 과감한 전략입니다.\n"
                          f"   - 역사적으로 {start_num}번으로 시작한 회차는 총 **{start_count}회** 있었습니다.")
        else:
            report.append(f"2. ✅ 안정적인 단번대 시작\n"
                          f"   - 시작수: {start_num}번. 통계적으로 가장 무난한 출발입니다.")

        # [포인트 3] 밸런스 분석
        report.append(f"3. ⚖️ 균형 분석 (Odd/Even & Low/High)\n"
                      f"   - 홀짝 비율: {odd}:{6-odd} ({'황금 비율' if odd == 3 else '일반적 패턴'})\n"
                      f"   - 저고 비율: {low}:{6-low}\n"
                      f"   - 합계: {sum(numbers)} (평균 138 대비 {'높음' if sum(numbers)>145 else '낮음' if sum(numbers)<130 else '적정'})")

        # [포인트 4] 핫 넘버 분석
        if my_hot:
            report.append(f"4. 🔥 핫 넘버의 지원사격\n"
                          f"   - {', '.join(map(str, my_hot))}번: 최근 자주 등장하는 'Hot' 번호로 리스크를 상쇄했습니다.")

        # [최종 의견]
        report.append(f"\n💡 최종 의견\n"
                      f"   **\"{start_num}번으로 시작하는 {'과감한' if start_num >= 10 else '안정적인'} 전략!\"**\n"
                      f"   - 강점: {f'미출현수 {len(my_cold)}개 포함' if my_cold else '트렌드 반영'} + 밸런스 조절.\n"
                      f"   - 추천: 그대로 구매하시기에 {'아주 훌륭한' if odd==3 and low==3 else '무난한'} 조합입니다.")

        return "\n\n".join(report)

    def export_odd_even_analysis(self):
            """홀짝 비율 분석: 화면 출력 및 엑셀 저장"""
            # 1. 데이터 가공
            cols = ['1번', '2번', '3번', '4번', '5번', '6번']
            temp_df = self.df[['회차'] + cols].copy()
            
            # 홀수 개수 계산
            temp_df['홀수개수'] = temp_df[cols].apply(lambda row: sum(1 for n in row if n % 2 != 0), axis=1)
            temp_df['짝수개수'] = 6 - temp_df['홀수개수']
            temp_df['패턴'] = temp_df.apply(lambda row: f"홀{row['홀수개수']}:짝{row['짝수개수']}", axis=1)

            # 2. 요약 통계 생성 (화면 출력용)
            summary = temp_df['패턴'].value_counts().sort_index().reset_index()
            summary.columns = ['패턴', '횟수']
            summary['확률(%)'] = round((summary['횟수'] / len(temp_df)) * 100, 2)
            
            print(f"\n📊 [전체 {self.current_round}회 기준 홀짝 비율 분석]")
            print("=" * 40)
            print(summary.to_string(index=False))
            print("=" * 40)

            # 3. 엑셀 저장
            file_name = f"로또_홀짝분석_총{self.current_round}회.xlsx"
            
            with pd.ExcelWriter(file_name) as writer:
                # 시트 1: 요약 통계
                summary.to_excel(writer, sheet_name='분석요약', index=False)
                
                # 시트 2: 전체 상세 내역
                temp_df.to_excel(writer, sheet_name='전체내역', index=False)
                
                # 시트 3~: 각 패턴별 회차 목록 분리 저장
                patterns = sorted(temp_df['패턴'].unique())
                for pat in patterns:
                    # 시트 이름에 콜론(:) 사용 불가하므로 변경
                    sheet_safe_name = pat.replace(':', '대')
                    subset = temp_df[temp_df['패턴'] == pat][['회차'] + cols]
                    subset.to_excel(writer, sheet_name=sheet_safe_name, index=False)

            print(f"\n💾 엑셀 저장 완료: {file_name}")
            print("   - 시트1: 분석요약")
            print("   - 시트2: 전체내역")
            print("   - 시트3~: 패턴별 상세 회차 리스트")

# -----------------------------------------------------------
# 실행 코드
# -----------------------------------------------------------
if __name__ == "__main__":
    analyzer = LottoAnalyzer('ReadWeb-WinningNumbers.csv')
    analyzer.export_odd_even_analysis()    
# -----------------------------------------------------------
# 2. 실행 코드 (이 부분이 있어야 결과가 출력됩니다)
# -----------------------------------------------------------
if __name__ == "__main__":
    analyzer = LottoAnalyzer('ReadWeb-WinningNumbers.csv')
    analyzer.export_odd_even_analysis()
    
    # 1. 시작 번호 동적 입력
    try:
        target_num = int(input("분석할 시작 회차를 입력하세요 (예: 1): "))
        start_rounds = analyzer.get_start_number_rounds(target_num)
        print(f"\n1. [{target_num}번]으로 시작한 총 횟수: {len(start_rounds)}회")
    except ValueError:
        print("잘못된 숫자 입력입니다.")

    # 2. 패턴 흐름 동적 입력
    try:
        pattern_input = input("찾을 패턴을 쉼표 또는 공백으로 구분해 입력하세요 (예: 8,1,1): ")
        # 입력 문자열 "8,1,1" -> 리스트 [8, 1, 1]로 변환
        user_pattern = [int(x.strip()) for x in pattern_input.replace(',', ' ')]
        
        pattern_rounds = analyzer.find_start_pattern_sequence(user_pattern)
        print(f"2. {user_pattern} 패턴 발생 회차: {pattern_rounds}")
    except ValueError:
        print("패턴은 '숫자,숫자' 형식으로 입력해야 합니다.")
    # 3. 15회 이상 안 나온 번호(Cold Number)
    cold_result = analyzer.get_cold_numbers(15)
    print(f"3. 15회 이상 미출현 번호(번호, 미출현기간): {cold_result}")

    # 4. 내 번호 조합 분석 동적 입력
    try:
        input_str = input("분석할 번호 6개를 입력하세요 (콤마 또는 공백 구분): ")
        # 콤마를 공백으로 치환 후 공백 기준으로 분리
        my_numbers = [int(x) for x in input_str.replace(',', ' ').split()]
        
        if len(my_numbers) != 6:
            print("주의: 6개의 번호를 입력하는 것이 좋습니다.")

        analysis = analyzer.analyze_combination(my_numbers)
        print("\n4. 내 번호 조합 분석 결과:")
        for key, value in analysis.items():
            print(f" - {key}: {value}")
    except ValueError:
        print("잘못된 입력입니다. 숫자만 입력해주세요.")

   # 실행 예시
    #my_numbers = [11, 14, 23, 34, 36, 41]
    print(analyzer.generate_insight_report(my_numbers))

    
