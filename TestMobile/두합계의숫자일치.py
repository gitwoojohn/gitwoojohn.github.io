import pandas as pd
from itertools import combinations

def solve_lotto_overlap(sum1, sum2):
    # 1. 각 합계에 해당하는 조합 생성
    nums = range(1, 46)
    list1 = [set(c) for c in combinations(nums, 6) if sum(c) == sum1]
    list2 = [set(c) for c in combinations(nums, 6) if sum(c) == sum2]
    
    results = {3: [], 4: [], 5: []}

    # 2. 유사성(겹치는 개수) 비교
    for combo1 in list1:
        for combo2 in list2:
            intersect_count = len(combo1.intersection(combo2))
            if intersect_count in results:
                results[intersect_count].append({
                    f'Sum_{sum1}': sorted(list(combo1)),
                    f'Sum_{sum2}': sorted(list(combo2)),
                    'Overlap_Count': intersect_count
                })

    # 3. 엑셀 저장
    with pd.ExcelWriter(f'lotto_overlap_{sum1}_{sum2}.xlsx') as writer:
        for n, data in results.items():
            df = pd.DataFrame(data)
            df.to_excel(writer, sheet_name=f'{n}_elements_overlap', index=False)
    
    return "Excel file saved successfully."

# 실행 예시 (합계 141, 146 입력)
# 주의: 조합의 수가 많아 실행 시간이 소요될 수 있습니다.
# solve_lotto_overlap(141, 146)
