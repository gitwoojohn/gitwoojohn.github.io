from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QHeaderView, QLabel, QPushButton, QSpinBox, QApplication,
)


class GapTab(QWidget):
    def __init__(self, data, parent=None):
        super().__init__(parent)
        self.group_rows = data["group"]
        layout = QVBoxLayout(self)

        top = QHBoxLayout()
        top.addWidget(QLabel("기준 개수:"))
        self.thresholdSpin = QSpinBox(self)
        self.thresholdSpin.setRange(1, 7)
        self.thresholdSpin.setValue(5)
        top.addWidget(self.thresholdSpin)
        self.rangeLabel = QLabel("", self)
        self.rangeLabel.setObjectName("loading")
        self.rangeLabel.setWordWrap(True)
        top.addWidget(self.rangeLabel, 1)
        self.copyButton = QPushButton("복사", self)
        self.copyButton.setFixedWidth(60)
        self.copyButton.clicked.connect(self._copy)
        top.addWidget(self.copyButton)
        layout.addLayout(top)

        table = QTableWidget(0, 4, self)
        table.setHorizontalHeaderLabels(["그룹", "5+ 회차", "직전 5+ 회차", "간격(회차)"])
        table.setAlternatingRowColors(True)
        table.verticalHeader().setVisible(False)
        table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeToContents)
        table.setSortingEnabled(False)
        header = table.horizontalHeader()
        header.setSortIndicatorShown(True)
        header.setSectionsClickable(True)
        header.setSortIndicator(-1, Qt.AscendingOrder)
        header.sortIndicatorChanged.connect(self._on_sort)
        self.table = table
        layout.addWidget(table)

        self.thresholdSpin.valueChanged.connect(self._refresh)
        self.data_rows = []
        self._refresh()

    def _build(self):
        thr = self.thresholdSpin.value()
        rows = []
        gaps = {g: [] for g in range(3)}
        for g in range(3):
            prev = None
            for row in self.group_rows:
                rid = row[0]
                cnt = row[g + 1]
                if cnt >= thr:
                    gap = rid - prev if prev is not None else None
                    rows.append([f"그룹{g + 1}", rid, prev, gap])
                    if prev is not None:
                        gaps[g].append(gap)
                    prev = rid
        return rows, gaps

    def _refresh(self):
        rows, gaps = self._build()
        self.data_rows = rows
        thr = self.thresholdSpin.value()
        parts = []
        for g in range(3):
            gs = gaps[g]
            if gs:
                avg = sum(gs) / len(gs)
                parts.append(
                    f"그룹{g + 1}: {len(gs) + 1}회 | 평균 간격 {avg:.1f} | "
                    f"최소 {min(gs)} | 최대 {max(gs)}"
                )
            else:
                parts.append(f"그룹{g + 1}: 0회")
        self.rangeLabel.setText(f"그룹당 {thr}개 이상 발생 간격\n" + " | ".join(parts))
        self.table.horizontalHeaderItem(0).setText(f"{thr}+ 그룹")
        self.table.horizontalHeaderItem(1).setText(f"{thr}+ 회차")
        self.table.horizontalHeaderItem(2).setText(f"직전 {thr}+ 회차")
        self.table.setRowCount(len(rows))
        self._populate(rows)
        header = self.table.horizontalHeader()
        if header.sortIndicatorSection() >= 0:
            self._on_sort(header.sortIndicatorSection(), header.sortIndicatorOrder())

    def _populate(self, rows):
        for i, row in enumerate(rows):
            for j, val in enumerate(row):
                text = "-" if val is None else str(val)
                item = self.table.item(i, j)
                if item is None:
                    item = QTableWidgetItem(text)
                    item.setTextAlignment(Qt.AlignCenter)
                    self.table.setItem(i, j, item)
                else:
                    item.setText(text)
                    item.setTextAlignment(Qt.AlignCenter)

    def _on_sort(self, col, order):
        if col < 0 or not self.data_rows:
            return

        def key(r):
            v = r[col]
            if isinstance(v, (int, float)):
                return (0, v)
            return (1, str(v))

        rows = sorted(self.data_rows, key=lambda r: r[1])
        rows = sorted(rows, key=key, reverse=(order == Qt.DescendingOrder))
        self._populate(rows)

    def _copy_text(self):
        lines = [self.rangeLabel.text().replace("\n", "\t")]
        headers = [self.table.horizontalHeaderItem(c).text() for c in range(self.table.columnCount())]
        lines.append("\t".join(headers))
        for r in range(self.table.rowCount()):
            lines.append("\t".join(self.table.item(r, c).text() for c in range(self.table.columnCount())))
        return "\n".join(lines)

    def _copy(self):
        QApplication.clipboard().setText(self._copy_text())
