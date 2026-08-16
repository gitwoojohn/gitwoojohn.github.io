from PySide6.QtCore import Qt
from PySide6.QtGui import QBrush, QColor
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QHeaderView, QLabel, QPushButton, QApplication,
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

        top = QHBoxLayout()
        self.rangeLabel = QLabel("", self)
        self.rangeLabel.setAlignment(Qt.AlignCenter)
        self.rangeLabel.setObjectName("loading")
        top.addWidget(self.rangeLabel, 1)
        self.copyButton = QPushButton("복사", self)
        self.copyButton.setFixedWidth(60)
        self.copyButton.clicked.connect(self._copy)
        top.addWidget(self.copyButton)
        layout.addLayout(top)

        table = QTableWidget(45, 4, self)
        table.setHorizontalHeaderLabels(["번호", "누적 당첨 횟수", "누적 당첨 비율", "다음 회차 출현"])
        table.setAlternatingRowColors(True)
        table.verticalHeader().setVisible(False)
        table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self._num_items = {}
        for i, num in enumerate(range(1, 46)):
            it0 = NumericTableItem(str(num), num)
            it1 = NumericTableItem("0", 0)
            it2 = NumericTableItem("0.00%", 0.0)
            it3 = QTableWidgetItem("미출현")
            for it in (it0, it1, it2, it3):
                it.setTextAlignment(Qt.AlignCenter)
            table.setItem(i, 0, it0)
            table.setItem(i, 1, it1)
            table.setItem(i, 2, it2)
            table.setItem(i, 3, it3)
            self._num_items[num] = (it0, it1, it2, it3)
        table.setSortingEnabled(True)
        layout.addWidget(table)

        self.table = table
        self.update_for_round(round_id if round_id is not None else self.last_round)

    def _next_round(self, round_id):
        try:
            idx = self.round_ids.index(round_id)
        except ValueError:
            return None
        if idx + 1 < len(self.round_ids):
            return self.round_ids[idx + 1]
        return None

    def update_for_round(self, round_id):
        prev_rounds = [rid for rid in self.round_ids if rid <= round_id]
        used = len(prev_rounds)
        counts = {n: 0 for n in range(1, 46)}
        for rid in prev_rounds:
            for n in self.data["win"].get(rid, ()):
                if n is not None and 1 <= n <= 45:
                    counts[n] += 1
        next_rid = self._next_round(round_id)
        win_next = self.data["win"].get(next_rid, set()) if next_rid is not None else set()
        bonus_next = self.data["bonus"].get(next_rid, set()) if next_rid is not None else set()
        for num in range(1, 46):
            it0, it1, it2, it3 = self._num_items[num]
            pct = counts[num] / used if used else 0.0
            it1.setText(str(counts[num]))
            it1.setData(Qt.UserRole, counts[num])
            it2.setText(f"{pct:.2%}")
            it2.setData(Qt.UserRole, pct)
            if num in win_next:
                it3.setText("당첨")
                it3.setBackground(QColor("#00c0ff"))
                it3.setForeground(QColor("#000000"))
            elif num in bonus_next:
                it3.setText("보너스")
                it3.setBackground(QColor("#ffbb00"))
                it3.setForeground(QColor("#000000"))
            else:
                it3.setText("미출현")
                it3.setBackground(QBrush())
                it3.setForeground(QBrush())
        if next_rid is not None:
            self.table.horizontalHeaderItem(3).setText(f"다음 회차 출현 ({next_rid}회차)")
        else:
            self.table.horizontalHeaderItem(3).setText("다음 회차 출현")
        start = self.round_ids[0] if self.round_ids else round_id
        if next_rid is not None:
            self.rangeLabel.setText(f"누적 {start}회차 ~ {round_id}회차 | 다음 회차: {next_rid}회차")
        else:
            self.rangeLabel.setText(f"누적 {start}회차 ~ {round_id}회차 (마지막 회차)")

    def _copy_text(self):
        headers = [self.table.horizontalHeaderItem(c).text() for c in range(self.table.columnCount())]
        lines = ["\t".join(headers)]
        for r in range(self.table.rowCount()):
            lines.append("\t".join(self.table.item(r, c).text() for c in range(self.table.columnCount())))
        return self.rangeLabel.text() + "\n" + "\n".join(lines)

    def _copy(self):
        QApplication.clipboard().setText(self._copy_text())
