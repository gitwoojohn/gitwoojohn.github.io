from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QGridLayout, QFrame, QSlider, QSpinBox,
)

from winning_analysis_widgets import StatCard
from winning_analysis_loader import compute_stats


class RoundTab(QWidget):
    def __init__(self, data, parent=None):
        super().__init__(parent)
        self.data = data
        self.rounds = data["rounds"]
        layout = QVBoxLayout(self)

        top = QHBoxLayout()
        top.addWidget(QLabel("회차:"))
        self.spinBox = QSpinBox(self)
        self.spinBox.setRange(1, self.rounds)
        self.spinBox.setValue(1)
        top.addWidget(self.spinBox)
        top.addWidget(QLabel(f"/ {self.rounds}회차", self))
        self.slider = QSlider(Qt.Horizontal, self)
        self.slider.setRange(1, self.rounds)
        self.slider.setValue(1)
        top.addWidget(self.slider, 1)
        layout.addLayout(top)

        self.groupRow = QHBoxLayout()
        self.groupRow.setSpacing(0)
        layout.addLayout(self.groupRow)

        self.statsGrid = QGridLayout()
        self.statsGrid.setHorizontalSpacing(10)
        self.statsGrid.setVerticalSpacing(8)
        layout.addLayout(self.statsGrid)

        self.spinBox.valueChanged.connect(self.slider.setValue)
        self.slider.valueChanged.connect(self.spinBox.setValue)
        self.spinBox.valueChanged.connect(self.refresh)
        self.refresh()

    def _clear_stats(self):
        while self.statsGrid.count():
            item = self.statsGrid.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

    def _build_groups(self, numbers, win, bonus):
        while self.groupRow.count():
            item = self.groupRow.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        for g in range(3):
            if g > 0:
                separator = QFrame(self)
                separator.setFrameShape(QFrame.VLine)
                separator.setFrameShadow(QFrame.Sunken)
                separator.setStyleSheet("color: #3a3a3a; background: #3a3a3a;")
                separator.setFixedWidth(2)
                self.groupRow.addWidget(separator)

            group_widget = QWidget(self)
            group_layout = QVBoxLayout(group_widget)
            group_layout.setContentsMargins(8, 4, 8, 4)
            group_layout.setSpacing(6)
            title = QLabel(f"그룹 {g+1} · {g*15+1}~{g*15+15}", group_widget)
            title.setAlignment(Qt.AlignCenter)
            title.setStyleSheet(
                "font-size: 13px; font-weight: 600; color: #9fc0e8;"
                "background: transparent; border: 1px solid #3a5a7a;"
                "border-radius: 4px; padding: 4px;"
            )
            group_layout.addWidget(title)
            grid = QGridLayout()
            grid.setSpacing(3)
            for i in range(15):
                num = numbers[g * 15 + i]
                label = QLabel(str(num), group_widget)
                label.setObjectName("numLabel")
                label.setAlignment(Qt.AlignCenter)
                label.setMinimumSize(44, 30)
                label.setMaximumSize(48, 34)
                if num in win:
                    label.setObjectName("numWin")
                elif num in bonus:
                    label.setObjectName("numBonus")
                grid.addWidget(label, i, 0)
            group_layout.addLayout(grid)
            self.groupRow.addWidget(group_widget)

    def _build_stats(self, numbers, win, bonus):
        win_str = ", ".join(str(n) for n in sorted(win))
        bonus_str = ", ".join(str(n) for n in sorted(bonus))
        stats = compute_stats(numbers, win, bonus)

        self._clear_stats()

        top_specs = [
            ("당첨 번호", win_str, "winNums"),
            ("보너스 번호", bonus_str, "bonusNums"),
            ("합계", stats["total"], None),
            ("AC", stats["ac"], None),
            ("SD", f"{stats['sd']:.1f}", None),
            ("홀 : 짝", f"{stats['odd']} : {stats['even']}", None),
        ]
        for i, (name, value, obj) in enumerate(top_specs):
            card = StatCard(name, self)
            card.set_value(value, obj)
            self.statsGrid.addWidget(card, 0, i)

        group_specs = ["그룹1", "그룹2", "그룹3"]
        for i, (name, value) in enumerate(zip(group_specs, stats["group_counts"])):
            card = StatCard(name, self)
            card.set_value(value)
            self.statsGrid.addWidget(card, 1, i + 2)

        for c in range(6):
            self.statsGrid.setColumnStretch(c, 1)

    def refresh(self):
        r = self.spinBox.value()
        numbers = self.data["numbers"][r]
        win = self.data["win"][r]
        bonus = self.data["bonus"][r]
        self._build_groups(numbers, win, bonus)
        self._build_stats(numbers, win, bonus)
