import csv
import argparse
from collections import Counter
from pathlib import Path

DEFAULT_CSV = r"G:\Summary-Lotto645\BinaryData.csv"

# Bucket schemes

def bucket_old(g):
    if g <= 2: return '0-2'
    if g <= 5: return '3-5'
    if g <= 8: return '6-8'
    if g <= 12: return '9-12'
    if g <= 16: return '13-16'
    return '17+'


def bucket_fine(g):
    if g == 0: return '0'
    if g == 1: return '1'
    if g == 2: return '2'
    if g == 3: return '3'
    if g == 4: return '4'
    if g == 5: return '5'
    if g <= 7: return '6-7'
    if g <= 9: return '8-9'
    if g <= 12: return '10-12'
    if g <= 15: return '13-15'
    if g <= 20: return '16-20'
    return '21+'


SCHEMES = {
    'old': (bucket_old, '0-2 / 3-5 / 6-8 / 9-12 / 13-16 / 17+'),
    'fine': (bucket_fine, '0 / 1 / 2 / 3 / 4 / 5 / 6-7 / 8-9 / 10-12 / 13-15 / 16-20 / 21+'),
}


def load_binary_csv(path):
    rows = []
    with open(path, newline='', encoding='utf-8-sig', errors='ignore') as f:
        reader = csv.reader(f)
        for r in reader:
            if not r:
                continue
            clean = [int(x.strip()) for x in r if x.strip() != '']
            if clean:
                rows.append(clean)
    if not rows:
        raise ValueError('No rows loaded')

    # transpose columns
    cols = list(zip(*rows))
    # drop trailing all-zero columns
    while cols and sum(cols[-1]) == 0:
        cols.pop()
    return rows, cols


def build_gap_patterns(cols, bucket_fn):
    patterns = []
    for col in cols:
        ones = [i + 1 for i, v in enumerate(col) if v == 1]
        gaps = [ones[i + 1] - ones[i] - 1 for i in range(len(ones) - 1)]
        patterns.append(tuple(bucket_fn(g) for g in gaps))
    return patterns


def build_transition_probs(patterns):
    trans = Counter()
    for i in range(len(patterns) - 1):
        trans[(patterns[i], patterns[i + 1])] += 1

    # conditional distributions
    cond = {}
    for (p1, p2), cnt in trans.items():
        if p1 not in cond:
            cond[p1] = Counter()
        cond[p1][p2] += cnt

    # normalize
    cond_probs = {}
    for p1, cnts in cond.items():
        total = sum(cnts.values())
        cond_probs[p1] = [(p2, cnt / total) for p2, cnt in cnts.most_common()]
    return trans, cond_probs


def top_overall_next(trans, top_n=5):
    next_counts = Counter()
    for (_, p2), cnt in trans.items():
        next_counts[p2] += cnt
    total = sum(next_counts.values())
    return [(p2, cnt / total) for p2, cnt in next_counts.most_common(top_n)]


def write_markdown(out_path, scheme_name, scheme_desc, patterns, trans, cond_probs):
    last_pattern = patterns[-1]
    unique_patterns = len(set(patterns))
    total_cols = len(patterns)

    lines = []
    lines.append('# 패턴 전이 기반 다음 패턴 예측')
    lines.append('')
    lines.append('## 설정')
    lines.append(f'- 구간 방식: {scheme_name}')
    lines.append(f'- 구간 정의: {scheme_desc}')
    lines.append(f'- 총 열: {total_cols}')
    lines.append(f'- 유니크 패턴: {unique_patterns}')
    lines.append('')

    lines.append('## 최근 패턴')
    lines.append(f'- 마지막 패턴: {last_pattern}')
    lines.append('')

    lines.append('## 다음 패턴 예측 (전이 확률)')
    if last_pattern in cond_probs:
        lines.append('- 기준: 마지막 패턴 → 다음 패턴')
        for p2, prob in cond_probs[last_pattern][:5]:
            lines.append(f'  - {p2} : {prob:.3f}')
    else:
        lines.append('- 마지막 패턴의 과거 전이가 없어서 전체 전이 분포로 대체')
        for p2, prob in top_overall_next(trans, 5):
            lines.append(f'  - {p2} : {prob:.3f}')

    lines.append('')
    lines.append('## 참고')
    lines.append('- 본 예측은 패턴 전이 빈도에 기반한 통계적 모델입니다.')
    lines.append('- 전이 데이터가 희소하면 예측은 불안정해질 수 있습니다.')

    out_path.write_text('\n'.join(lines), encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--csv', default=DEFAULT_CSV)
    parser.add_argument('--scheme', choices=SCHEMES.keys(), default='fine')
    parser.add_argument('--out', default='TestInsight/pattern_predict.md')
    args = parser.parse_args()

    bucket_fn, scheme_desc = SCHEMES[args.scheme]
    _, cols = load_binary_csv(args.csv)
    patterns = build_gap_patterns(cols, bucket_fn)
    trans, cond_probs = build_transition_probs(patterns)

    out_path = Path(args.out)
    write_markdown(out_path, args.scheme, scheme_desc, patterns, trans, cond_probs)
    print(f'WROTE {out_path}')
