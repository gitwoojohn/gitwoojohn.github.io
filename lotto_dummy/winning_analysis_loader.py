from PySide6.QtCore import QThread, Signal
from openpyxl import load_workbook

from winning_analysis_constants import SHEET_DATA


def cell_fill_rgb(cell):
    try:
        rgb = cell.fill.fgColor.rgb
    except Exception:
        return ""
    if rgb is None:
        return ""
    return str(rgb).upper()


def compute_stats(numbers, win, bonus):
    win_sorted = sorted(win)
    if not win_sorted:
        return {
            "total": 0, "ac": 0, "sd": 0, "odd": 0, "even": 0,
            "group_counts": [0, 0, 0],
        }
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


class SheetLister(QThread):
    listed = Signal(list)
    failed = Signal(str)

    def __init__(self, filepath, parent=None):
        super().__init__(parent)
        self.filepath = filepath

    def run(self):
        try:
            wb = load_workbook(self.filepath, data_only=True, read_only=True)
            sheets = wb.sheetnames
            wb.close()
            self.listed.emit(sheets)
        except Exception as e:
            self.failed.emit(f"파일을 읽을 수 없습니다: {e}")


class DataLoader(QThread):
    loaded = Signal(dict)
    failed = Signal(str)

    def __init__(self, filepath, sheet_name=SHEET_DATA, parent=None):
        super().__init__(parent)
        self.filepath = filepath
        self.sheet_name = sheet_name

    @staticmethod
    def _round_columns(ws):
        cols = []
        for c in range(1, ws.max_column + 1):
            header = ws.cell(row=1, column=c).value
            if isinstance(header, (int, float)) and not isinstance(header, bool):
                nums = [ws.cell(row=r, column=c).value for r in range(2, ws.max_row + 1)]
                cnt = sum(1 for v in nums if isinstance(v, (int, float)))
                if cnt >= 40:
                    cols.append((c, int(header)))
        return cols

    @classmethod
    def _is_data_sheet(cls, ws):
        return len(cls._round_columns(ws)) > 0

    @classmethod
    def _detect_colors(cls, ws, cols):
        from collections import Counter
        counter = Counter()
        for col_idx, _ in cols:
            for r in range(2, ws.max_row + 1):
                fill = cell_fill_rgb(ws.cell(row=r, column=col_idx))[-6:]
                if fill and fill != "000000":
                    counter[fill] += 1
        top = counter.most_common(2)
        win_color = top[0][0] if top else None
        bonus_color = top[1][0] if len(top) > 1 else None
        return win_color, bonus_color

    def run(self):
        try:
            wb = load_workbook(self.filepath, data_only=True)
        except Exception as e:
            self.failed.emit(f"파일을 읽을 수 없습니다: {e}")
            return
        try:
            sheets = [s for s in wb.sheetnames if self._is_data_sheet(wb[s])]
            if not sheets:
                sheets = wb.sheetnames
            if self.sheet_name in sheets:
                ws = wb[self.sheet_name]
            else:
                ws = wb[sheets[0]]

            cols = self._round_columns(ws)
            if not cols:
                raise ValueError("회차 열을 찾을 수 없습니다 (첫 행에 회차 번호 필요)")
            round_ids = [r for _, r in cols]
            rounds = len(round_ids)
            win_color, bonus_color = self._detect_colors(ws, cols)

            numbers_by_round = {}
            win_by_round = {}
            bonus_by_round = {}
            for col_idx, round_id in cols:
                numbers = [
                    ws.cell(row=r, column=col_idx).value
                    for r in range(2, ws.max_row + 1)
                    if ws.cell(row=r, column=col_idx).value is not None
                ]
                win = set()
                bonus = set()
                for r in range(2, ws.max_row + 1):
                    fill = cell_fill_rgb(ws.cell(row=r, column=col_idx))[-6:]
                    v = ws.cell(row=r, column=col_idx).value
                    if fill == win_color:
                        win.add(v)
                    elif fill == bonus_color:
                        bonus.add(v)
                numbers_by_round[round_id] = numbers
                win_by_round[round_id] = win
                bonus_by_round[round_id] = bonus

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
        except Exception as e:
            self.failed.emit(f"데이터를 분석하는 중 오류가 발생했습니다: {e}")
            return

        self.loaded.emit({
            "rounds": rounds,
            "round_ids": round_ids,
            "numbers": numbers_by_round,
            "win": win_by_round,
            "bonus": bonus_by_round,
            "ratio": ratio,
            "group_headers": headers,
            "group": group,
            "sheets": sheets,
            "sheet_name": ws.title,
        })
