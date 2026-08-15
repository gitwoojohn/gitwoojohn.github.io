from PySide6.QtCore import Qt
from PySide6.QtGui import QBrush, QColor
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QTableWidget, QTableWidgetItem, QHeaderView, QLabel,
)


class NumericTableItem(QTableWidgetItem):
    def __init__(self, text, value):
        super().__init__(text)
        self.setData(Qt.UserRole, value)

    def __lt__(self, other):
        if isinstance(other, NumericTableItem):
            return self.data(Qt.UserRole) < other.data(Qt.UserRole)
        return super().__lt__(other)


class RatioTab(QWidget):
    def __init__(self, data, round_id=None, parent=None):
        super().__init__(parent)
        self.data = data
        self.round_ids = data.get("round_ids", [])
        self.last_round = self.round_ids[-1] if self.round_ids else 0

        layout = QVBoxLayout(self)

        self.rangeLabel = QLabel("", self)
        self.rangeLabel.setAlignment(Qt.AlignCenter)
        self.rangeLabel.setObjectName("loading")
        layout.addWidget(self.rangeLabel)

        table = QTableWidget(45, 4, self)
        table.setHorizontalHeaderLabels(["번호", "누적 당첨 횟수", "누적 당첨 비율", "다음 회차 출현"])
        table.setAlternatingRowColors(True)
        table.verticalHeader().setVisible(False)
        table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        for i, num in enumerate(range(1, 46)):
            table.setItem(i, 0, NumericTableItem(str(num), num))
            table.setItem(i, 1, NumericTableItem("0", 0))
            table.setItem(i, 2, NumericTableItem("0.00%", 0.0))
            table.setItem(i, 3, QTableWidgetItem("미출현"))
            for c in range(4):
                table.item(i, c).setTextAlignment(Qt.AlignCenter)
        table.setSortingEnabled(True)
        layout.addWidget(table)

        self.table = table
        self.update_for_round(round_id if round_id is not None else self.last_round)

    def update_for_round(self, round_id):
        prev_rounds = [rid for rid in self.round_ids if rid < round_id]
        used = len(prev_rounds)
        counts = {n: 0 for n in range(1, 46)}
        for rid in prev_rounds:
            for n in self.data["win"].get(rid, ()):
                if n is not None and 1 <= n <= 45:
                    counts[n] += 1
        win_next = self.data["win"].get(round_id, set())
        bonus_next = self.data["bonus"].get(round_id, set())
        for i, num in enumerate(range(1, 46)):
            pct = counts[num] / used if used else 0.0
            self.table.item(i, 1).setText(str(counts[num]))
            self.table.item(i, 1).setData(Qt.UserRole, counts[num])
            self.table.item(i, 2).setText(f"{pct:.2%}")
            self.table.item(i, 2).setData(Qt.UserRole, pct)
            item3 = self.table.item(i, 3)
            if num in win_next:
                item3.setText("당첨")
                item3.setBackground(QColor("#00c0ff"))
                item3.setForeground(QColor("#000000"))
            elif num in bonus_next:
                item3.setText("보너스")
                item3.setBackground(QColor("#ffbb00"))
                item3.setForeground(QColor("#000000"))
            else:
                item3.setText("미출현")
                item3.setBackground(QBrush())
                item3.setForeground(QBrush())
        self.table.horizontalHeaderItem(3).setText(f"다음 회차 출현 ({round_id}회차)")
        start = self.round_ids[0] if self.round_ids else round_id
        prev = max(prev_rounds) if prev_rounds else None
        if prev is not None:
            self.rangeLabel.setText(f"누적 {start}회차 ~ {prev}회차 | 다음 회차: {round_id}회차")
        else:
            self.rangeLabel.setText(f"이전 데이터 없음 | 다음 회차: {round_id}회차")
