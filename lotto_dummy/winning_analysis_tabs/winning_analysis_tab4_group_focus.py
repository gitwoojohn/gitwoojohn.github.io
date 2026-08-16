from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QHeaderView, QLabel, QPushButton, QSpinBox, QApplication,
)

from winning_analysis_loader import compute_stats


class GroupFocusTab(QWidget):
    def __init__(self, data, parent=None):
        super().__init__(parent)
        self.data = data
        self.group_rows = data["group"]
        self.win = data["win"]
        self.bonus = data["bonus"]
        self.numbers = data.get("numbers", {})
        layout = QVBoxLayout(self)

        top = QHBoxLayout()
        top.addWidget(QLabel("그룹당 기준 개수:"))
        self.thresholdSpin = QSpinBox(self)
        self.thresholdSpin.setRange(1, 7)
        self.thresholdSpin.setValue(4)
        self.thresholdSpin.valueChanged.connect(self._refresh)
        top.addWidget(self.thresholdSpin)
        self.rangeLabel = QLabel("", self)
        self.rangeLabel.setObjectName("loading")
        top.addWidget(self.rangeLabel, 1)
        self.copyButton = QPushButton("복사", self)
        self.copyButton.setFixedWidth(60)
        self.copyButton.clicked.connect(self._copy)
        top.addWidget(self.copyButton)
        layout.addLayout(top)

        table = QTableWidget(0, 11, self)
        table.setHorizontalHeaderLabels([
            "회차", "그룹1", "그룹2", "그룹3", "집중 그룹",
            "합계", "AC", "SD", "홀:짝", "당첨번호", "보너스",
        ])
        table.setAlternatingRowColors(True)
        table.verticalHeader().setVisible(False)
        table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeToContents)
        for c in (1, 2, 3):
            table.horizontalHeader().setSectionResizeMode(c, QHeaderView.Fixed)
        table.setSortingEnabled(False)
        header = table.horizontalHeader()
        header.setSortIndicatorShown(True)
        header.setSectionsClickable(True)
        header.setSortIndicator(-1, Qt.AscendingOrder)
        header.sortIndicatorChanged.connect(self._on_sort)
        self.table = table
        layout.addWidget(table)

        self.data_rows = []
        self._refresh()

    def _build_rows(self):
        thr = self.thresholdSpin.value()
        rows = []
        for row in self.group_rows:
            rid, g1, g2, g3 = row
            counts = [g1, g2, g3]
            if max(counts) < thr:
                continue
            focus = [
                f"그룹{g}: {cnt}개"
                for g, cnt in enumerate(counts, start=1)
                if cnt >= thr
            ]
            focus_str = " · ".join(focus) if focus else "-"
            win = self.win.get(rid, set())
            bonus = self.bonus.get(rid, set())
            win_clean = sorted(n for n in win if n is not None)
            stats = compute_stats(self.numbers.get(rid, []), win, bonus)
            rows.append([
                rid, g1, g2, g3, focus_str,
                stats["total"], stats["ac"], f"{stats['sd']:.1f}",
                f"{stats['odd']}:{stats['even']}",
                ", ".join(str(n) for n in win_clean),
                ", ".join(str(n) for n in bonus if n is not None),
            ])
        return rows

    def _refresh(self):
        self.data_rows = self._build_rows()
        thr = self.thresholdSpin.value()
        self.rangeLabel.setText(f"그룹당 {thr}개 이상: {len(self.data_rows)}회차")
        self.table.setRowCount(len(self.data_rows))
        self._populate(self.data_rows)
        for c, w in ((1, 42), (2, 42), (3, 42)):
            self.table.setColumnWidth(c, w)
        header = self.table.horizontalHeader()
        if header.sortIndicatorSection() >= 0:
            self._on_sort(header.sortIndicatorSection(), header.sortIndicatorOrder())

    def _populate(self, rows):
        for i, row in enumerate(rows):
            for j, val in enumerate(row):
                item = self.table.item(i, j)
                if item is None:
                    item = QTableWidgetItem(str(val))
                    item.setTextAlignment(Qt.AlignCenter)
                    self.table.setItem(i, j, item)
                else:
                    item.setText(str(val))
                    item.setTextAlignment(Qt.AlignCenter)

    def _on_sort(self, col, order):
        if col < 0 or not self.data_rows:
            return
        rows = sorted(self.data_rows, key=lambda r: r[0])
        rows = sorted(rows, key=lambda r: r[col], reverse=(order == Qt.DescendingOrder))
        self._populate(rows)

    def _copy_text(self):
        headers = [self.table.horizontalHeaderItem(c).text() for c in range(self.table.columnCount())]
        lines = ["\t".join(headers)]
        for r in range(self.table.rowCount()):
            lines.append("\t".join(self.table.item(r, c).text() for c in range(self.table.columnCount())))
        return self.rangeLabel.text() + "\n" + "\n".join(lines)

    def _copy(self):
        QApplication.clipboard().setText(self._copy_text())
