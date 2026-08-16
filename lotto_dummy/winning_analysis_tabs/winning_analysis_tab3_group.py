from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QHeaderView, QLabel, QPushButton, QApplication,
)


class GroupTab(QWidget):
    def __init__(self, data, round_id=None, parent=None):
        super().__init__(parent)
        self.all_rows = data["group"]
        self.round_ids = [r[0] for r in self.all_rows]
        self.last_round = self.round_ids[-1] if self.round_ids else 0
        layout = QVBoxLayout(self)

        top = QHBoxLayout()
        self.rangeLabel = QLabel("", self)
        self.rangeLabel.setObjectName("loading")
        top.addWidget(self.rangeLabel, 1)
        self.copyButton = QPushButton("복사", self)
        self.copyButton.setFixedWidth(60)
        self.copyButton.clicked.connect(self._copy)
        top.addWidget(self.copyButton)
        layout.addLayout(top)

        table = QTableWidget(0, 4, self)
        table.setHorizontalHeaderLabels(["회차", "누적 그룹1(1-15)", "누적 그룹2(16-30)", "누적 그룹3(31-45)"])
        table.setAlternatingRowColors(True)
        table.verticalHeader().setVisible(False)
        table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        table.setSortingEnabled(False)
        header = table.horizontalHeader()
        header.setSortIndicatorShown(True)
        header.setSectionsClickable(True)
        header.setSortIndicator(-1, Qt.AscendingOrder)
        header.sortIndicatorChanged.connect(self._on_sort)
        self.table = table
        layout.addWidget(table)

        self.update_for_round(round_id if round_id is not None else self.last_round)

    def _cumulative_rows(self, round_id):
        cum = [0, 0, 0]
        rows = []
        for row in self.all_rows:
            if row[0] > round_id:
                break
            cum[0] += row[1]
            cum[1] += row[2]
            cum[2] += row[3]
            rows.append([row[0], cum[0], cum[1], cum[2]])
        return rows

    def update_for_round(self, round_id):
        self.data_rows = self._cumulative_rows(round_id)
        start = self.round_ids[0] if self.round_ids else round_id
        self.rangeLabel.setText(f"누적 {start}회차 ~ {round_id}회차 그룹 통계")
        self.table.setRowCount(len(self.data_rows))
        self._populate(self.data_rows)
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
