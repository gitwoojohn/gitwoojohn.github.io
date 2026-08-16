from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, QLabel, QFrame,
    QSlider, QSpinBox, QScrollArea, QSizePolicy, QPushButton, QApplication,
)

from winning_analysis_widgets import StatCard
from winning_analysis_loader import compute_stats


class RoundSpinBox(QSpinBox):
    def __init__(self, round_ids, parent=None):
        super().__init__(parent)
        self._ids = round_ids
        self.setRange(1, len(round_ids))
        self.setValue(1)

    def textFromValue(self, value):
        return str(self._ids[value - 1])

    def valueFromText(self, text):
        try:
            v = int(text)
            if v in self._ids:
                return self._ids.index(v) + 1
            nearest = min(self._ids, key=lambda r: abs(r - v))
            return self._ids.index(nearest) + 1
        except ValueError:
            return self.value()


class RoundTab(QWidget):
    round_changed = Signal(int)

    def __init__(self, data, parent=None):
        super().__init__(parent)
        self.data = data
        self.rounds = data["rounds"]
        self.round_ids = data.get("round_ids", list(range(1, self.rounds + 1)))
        self.current_round_id = self.round_ids[0] if self.round_ids else 0
        layout = QVBoxLayout(self)

        top = QHBoxLayout()
        top.addWidget(QLabel("회차:"))
        self.spinBox = RoundSpinBox(self.round_ids, self)
        top.addWidget(self.spinBox)
        self.roundLabel = QLabel(f"/ {max(self.round_ids)}회차", self)
        top.addWidget(self.roundLabel)
        self.slider = QSlider(Qt.Horizontal, self)
        self.slider.setRange(1, self.rounds)
        self.slider.setValue(1)
        top.addWidget(self.slider, 1)
        self.copyButton = QPushButton("복사", self)
        self.copyButton.setFixedWidth(60)
        self.copyButton.clicked.connect(self._copy)
        top.addWidget(self.copyButton)
        layout.addLayout(top)

        self.scroll = QScrollArea(self)
        self.scroll.setWidgetResizable(True)
        self.scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        self.scroll.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        container = QWidget(self.scroll)
        self.groupRow = QHBoxLayout(container)
        self.groupRow.setSpacing(6)
        self.groupRow.setContentsMargins(6, 10, 6, 10)
        self.groupRow.setAlignment(Qt.AlignTop)
        self.scroll.setWidget(container)
        layout.addWidget(self.scroll, 1)

        self.spinBox.valueChanged.connect(self.slider.setValue)
        self.slider.valueChanged.connect(self.spinBox.setValue)
        self.spinBox.valueChanged.connect(self.refresh)
        self.refresh()

    def _clear_layout(self, layout):
        while layout.count():
            item = layout.takeAt(0)
            if item.widget():
                w = item.widget()
                w.setParent(None)
                w.deleteLater()
            elif item.layout():
                self._clear_layout(item.layout())

    def _vline(self):
        separator = QFrame(self)
        separator.setFrameShape(QFrame.VLine)
        separator.setFrameShadow(QFrame.Sunken)
        separator.setStyleSheet("color: #3a3a3a; background: #3a3a3a;")
        separator.setFixedWidth(2)
        return separator

    def _build_groups(self, numbers, win, bonus, target):
        for g in range(3):
            group_widget = QWidget(self)
            group_layout = QVBoxLayout(group_widget)
            group_layout.setContentsMargins(8, 4, 8, 4)
            group_layout.setSpacing(6)
            title = QLabel(f"그룹 {g+1}", group_widget)
            title.setAlignment(Qt.AlignCenter)
            title.setMaximumHeight(20)
            title.setStyleSheet(
                "font-size: 11px; font-weight: 600; color: #9fc0e8;"
                "background: transparent; border: 1px solid #3a5a7a;"
                "border-radius: 4px; padding: 0px 3px;"
            )
            group_layout.addWidget(title)
            grid = QGridLayout()
            grid.setSpacing(2)
            for i in range(15):
                num = numbers[g * 15 + i]
                label = QLabel(str(num), group_widget)
                label.setObjectName("numLabel")
                label.setAlignment(Qt.AlignCenter)
                label.setMinimumSize(32, 20)
                label.setMaximumSize(36, 36)
                if num in win:
                    label.setObjectName("numWin")
                elif num in bonus:
                    label.setObjectName("numBonus")
                grid.addWidget(label, i, 0)
                grid.setRowStretch(i, 1)
            group_layout.addLayout(grid, 1)
            target.addWidget(group_widget)

    def _build_stats(self, numbers, win, bonus, target, round_id):
        win_str = ", ".join(str(n) for n in sorted(win))
        bonus_str = ", ".join(str(n) for n in sorted(bonus))
        stats = compute_stats(numbers, win, bonus)

        column_specs = [
            (f"당첨 번호 ({round_id}회차)", win_str, "winNums"),
            ("보너스 번호", bonus_str, "bonusNums"),
            ("합계", stats["total"], "statTotal"),
            ("AC", stats["ac"], "statAc"),
            ("SD", f"{stats['sd']:.1f}", "statSd"),
            ("홀 : 짝", f"{stats['odd']} : {stats['even']}", "statOdd"),
            ("그룹 출현", " : ".join(str(c) for c in stats["group_counts"]), "statG1"),
        ]

        statsColumn = QVBoxLayout()
        statsColumn.setSpacing(6)
        statsColumn.setContentsMargins(0, 0, 16, 0)
        statsColumn.setAlignment(Qt.AlignTop)
        for name, value, obj in column_specs:
            card = StatCard(name, self)
            card.setFixedWidth(180)
            card.set_value(value, obj)
            statsColumn.addWidget(card, 0, Qt.AlignLeft)
        target.addLayout(statsColumn)

    def _next_round(self, round_id):
        try:
            idx = self.round_ids.index(round_id)
        except ValueError:
            return None
        if idx + 1 < len(self.round_ids):
            return self.round_ids[idx + 1]
        return None

    def _build_section(self, round_id):
        widget = QWidget(self)
        widget.setSizePolicy(QSizePolicy.Preferred, QSizePolicy.Fixed)
        v = QVBoxLayout(widget)
        v.setContentsMargins(0, 0, 0, 0)
        v.setSpacing(6)
        row = QHBoxLayout()
        row.setSpacing(6)
        row.setAlignment(Qt.AlignTop)
        v.addLayout(row)
        numbers = self.data["numbers"][round_id]
        win = self.data["win"][round_id]
        bonus = self.data["bonus"][round_id]
        self._build_groups(numbers, win, bonus, row)
        self._build_stats(numbers, win, bonus, row, round_id)
        return widget

    def refresh(self):
        idx = self.spinBox.value()
        round_id = self.round_ids[idx - 1]
        self.current_round_id = round_id
        self.roundLabel.setText(f"/ {round_id}회차")
        self._clear_layout(self.groupRow)
        self.groupRow.addStretch(1)

        self.groupRow.addWidget(self._build_section(round_id))

        next_rid = self._next_round(round_id)
        if next_rid is not None:
            self.groupRow.addWidget(self._vline())
            self.groupRow.addWidget(self._build_section(next_rid))
        self.groupRow.addStretch(1)
        self.round_changed.emit(round_id)

    def _copy_text(self):
        lines = []
        for rid in [self.current_round_id, self._next_round(self.current_round_id)]:
            if rid is None:
                continue
            numbers = self.data["numbers"][rid]
            win = self.data["win"][rid]
            bonus = self.data["bonus"][rid]
            stats = compute_stats(numbers, win, bonus)
            lines.append(f"=== {rid}회차 ===")
            lines.append(f"당첨번호: {', '.join(str(n) for n in sorted(win))}")
            lines.append(f"보너스번호: {', '.join(str(n) for n in sorted(bonus))}")
            lines.append(
                f"합계: {stats['total']} | AC: {stats['ac']} | SD: {stats['sd']:.1f} | "
                f"홀:짝: {stats['odd']}:{stats['even']} | 그룹출현: {' : '.join(str(c) for c in stats['group_counts'])}"
            )
        return "\n".join(lines)

    def _copy(self):
        QApplication.clipboard().setText(self._copy_text())
