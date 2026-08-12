from PySide6.QtCore import QThread, Signal
from openpyxl import load_workbook

from winning_analysis_constants import COLOR_SIX, COLOR_BONUS


def compute_stats(numbers, win, bonus):
    win_sorted = sorted(win)
    total = sum(win_sorted)
    diffs = {
        abs(win_sorted[j] - win_sorted[i])
        for i in range(len(win_sorted))
        for j in range(i + 1, len(win_sorted))
    }
    ac = len(diffs) - (len(win_sorted) - 1)
    mean = total / len(win_sorted)
    sd = (sum((n - mean) ** 2 for n in win_sorted) / len(win_sorted)) ** 0.5
    odd = sum(1 for n in win_sorted if n % 2 == 1)
    even = len(win_sorted) - odd
    marked = win | bonus
    group_counts = [
        sum(1 for i in range(0, 15) if numbers[i] in marked),
        sum(1 for i in range(15, 30) if numbers[i] in marked),
        sum(1 for i in range(30, 45) if numbers[i] in marked),
    ]
    return {
        "total": total,
        "ac": ac,
        "sd": sd,
        "odd": odd,
        "even": even,
        "group_counts": group_counts,
    }


class DataLoader(QThread):
    loaded = Signal(dict)

    def __init__(self, filepath, parent=None):
        super().__init__(parent)
        self.filepath = filepath

    def run(self):
        wb = load_workbook(self.filepath, data_only=True)
        ws = wb["당첨번호데이터"]
        rounds = ws.max_column

        numbers_by_round = {col: [] for col in range(1, rounds + 1)}
        win_by_round = {col: set() for col in range(1, rounds + 1)}
        bonus_by_round = {col: set() for col in range(1, rounds + 1)}
        for row in ws.iter_rows(min_row=2):
            for col, cell in enumerate(row, start=1):
                fill = cell.fill.fgColor.rgb or ""
                fill = fill[-6:].upper()
                numbers_by_round[col].append(cell.value)
                if fill == COLOR_SIX:
                    win_by_round[col].add(cell.value)
                elif fill == COLOR_BONUS:
                    bonus_by_round[col].add(cell.value)

        ratio = {}
        if "당첨 비율" in wb.sheetnames:
            wsr = wb["당첨 비율"]
            for row in wsr.iter_rows(min_row=2, max_col=3):
                num, cnt, pct = row
                ratio[num.value] = (cnt.value, pct.value)

        group = []
        headers = []
        if "그룹 당첨 개수" in wb.sheetnames:
            wsg = wb["그룹 당첨 개수"]
            headers = [c.value for c in next(wsg.iter_rows(min_row=1, max_row=1))]
            for row in wsg.iter_rows(min_row=2):
                group.append([c.value for c in row])

        self.loaded.emit({
            "rounds": rounds,
            "numbers": numbers_by_round,
            "win": win_by_round,
            "bonus": bonus_by_round,
            "ratio": ratio,
            "group_headers": headers,
            "group": group,
        })
