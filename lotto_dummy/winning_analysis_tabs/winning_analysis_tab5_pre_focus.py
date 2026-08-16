from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QHeaderView, QLabel, QPushButton, QSpinBox, QApplication,
)


class PreFocusTab(QWidget):
    def __init__(self, data, parent=None):
        super().__init__(parent)
        self.group_rows = data["group"]
        layout = QVBoxLayout(self)

        top = QHBoxLayout()
        top.addWidget(QLabel("이벤트 기준:"))
        self.thresholdSpin = QSpinBox(self)
        self.thresholdSpin.setRange(1, 7)
        self.thresholdSpin.setValue(5)
        top.addWidget(self.thresholdSpin)
        top.addSpacing(12)
        top.addWidget(QLabel("직전 회차 수:"))
        self.prevSpin = QSpinBox(self)
        self.prevSpin.setRange(1, 20)
        self.prevSpin.setValue(5)
        top.addWidget(self.prevSpin)
        self.copyButton = QPushButton("복사", self)
        self.copyButton.setFixedWidth(60)
        self.copyButton.clicked.connect(self._copy)
        top.addWidget(self.copyButton)
        layout.addLayout(top)

        self.summaryLabel = QLabel("", self)
        self.summaryLabel.setObjectName("loading")
        self.summaryLabel.setWordWrap(True)
        layout.addWidget(self.summaryLabel)

        table = QTableWidget(0, 4, self)
        table.setHorizontalHeaderLabels([
            "이벤트 회차", "집중 그룹", "직전 5회차 평균(G1/G2/G3)", "직전 5회차 상세(G1:G2:G3)",
        ])
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
        self.prevSpin.valueChanged.connect(self._refresh)
        self.data_rows = []
        self._refresh()

    def _build(self):
        thr = self.thresholdSpin.value()
        m = self.prevSpin.value()
        rows_data = self.group_rows
        n = len(rows_data)
        if n == 0:
            return [], (0.0, 0.0, 0.0), (0.0, 0.0, 0.0)
        total = [0, 0, 0]
        for r in rows_data:
            for k in range(3):
                total[k] += r[k + 1]
        overall_avg = [t / n for t in total]

        rows = []
        pre_sum = [0, 0, 0]
        pre_n = 0
        for i, r in enumerate(rows_data):
            rid, g1, g2, g3 = r
            if max(g1, g2, g3) < thr:
                continue
            pre = rows_data[max(0, i - m):i]
            if not pre:
                continue
            pavg = [
                sum(p[k + 1] for p in pre) / len(pre)
                for k in range(3)
            ]
            for p in pre:
                pre_sum[0] += p[1]
                pre_sum[1] += p[2]
                pre_sum[2] += p[3]
            pre_n += len(pre)
            focus = " · ".join(
                f"그룹{k + 1}: {g}개"
                for k, g in enumerate((g1, g2, g3))
                if g >= thr
            )
            rows.append([
                rid,
                focus,
                f"{pavg[0]:.1f} / {pavg[1]:.1f} / {pavg[2]:.1f}",
                " → ".join(f"{p[1]}:{p[2]}:{p[3]}" for p in pre),
            ])
        event_pre_avg = (
            [pre_sum[k] / pre_n for k in range(3)] if pre_n else [0.0, 0.0, 0.0]
        )
        return rows, overall_avg, tuple(event_pre_avg)

    def _refresh(self):
        rows, overall, pre = self._build()
        self.data_rows = rows
        thr = self.thresholdSpin.value()
        m = self.prevSpin.value()
        diff = [pre[k] - overall[k] for k in range(3)]
        self.summaryLabel.setText(
            f"전체 평균 그룹: {overall[0]:.2f} · {overall[1]:.2f} · {overall[2]:.2f}\n"
            f"이벤트 직전 {m}회차 평균: {pre[0]:.2f} · {pre[1]:.2f} · {pre[2]:.2f}\n"
            f"편차(직전-전체): {diff[0]:+.2f} · {diff[1]:+.2f} · {diff[2]:+.2f} | "
            f"이벤트: {len(rows)}건"
        )
        self.table.horizontalHeaderItem(2).setText(f"직전 {m}회차 평균(G1/G2/G3)")
        self.table.horizontalHeaderItem(3).setText(f"직전 {m}회차 상세(G1:G2:G3)")
        self.table.setRowCount(len(rows))
        self._populate(rows)
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
        lines = [self.summaryLabel.text().replace("\n", "\t")]
        headers = [self.table.horizontalHeaderItem(c).text() for c in range(self.table.columnCount())]
        lines.append("\t".join(headers))
        for r in range(self.table.rowCount()):
            lines.append("\t".join(self.table.item(r, c).text() for c in range(self.table.columnCount())))
        return "\n".join(lines)

    def _copy(self):
        QApplication.clipboard().setText(self._copy_text())
