from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, QLabel, QFrame, QSlider, QSpinBox,
)

from winning_analysis_widgets import StatCard
from winning_analysis_loader import compute_stats


class RoundTab(QWidget):
    def __init__(self, data, parent=None):
        super().__init__(parent)
        self.data = data
        self.rounds = data["rounds"]
        self.round_ids = data.get("round_ids", list(range(1, self.rounds + 1)))
        layout = QVBoxLayout(self)

        top = QHBoxLayout()
        top.addWidget(QLabel("회차:"))
        self.spinBox = QSpinBox(self)
        self.spinBox.setRange(1, self.rounds)
        self.spinBox.setValue(1)
        top.addWidget(self.spinBox)
        self.roundLabel = QLabel(f"/ {self.rounds}회차", self)
        top.addWidget(self.roundLabel)
        self.slider = QSlider(Qt.Horizontal, self)
        self.slider.setRange(1, self.rounds)
        self.slider.setValue(1)
        top.addWidget(self.slider, 1)
        layout.addLayout(top)

        self.groupRow = QHBoxLayout()
        self.groupRow.setSpacing(0)
        self.groupRow.setAlignment(Qt.AlignTop)
        layout.addLayout(self.groupRow)
        layout.addStretch(1)

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

    def _build_groups(self, numbers, win, bonus):
        self._clear_layout(self.groupRow)

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
            title = QLabel(f"그룹 {g+1}", group_widget)
            title.setAlignment(Qt.AlignCenter)
            title.setStyleSheet(
                "font-size: 12px; font-weight: 600; color: #9fc0e8;"
                "background: transparent; border: 1px solid #3a5a7a;"
                "border-radius: 4px; padding: 1px 3px;"
            )
            group_layout.addWidget(title)
            grid = QGridLayout()
            grid.setSpacing(3)
            for i in range(15):
                num = numbers[g * 15 + i]
                label = QLabel(str(num), group_widget)
                label.setObjectName("numLabel")
                label.setAlignment(Qt.AlignCenter)
                label.setMinimumSize(40, 28)
                label.setMaximumSize(44, 32)
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

        specs = [
            ("당첨 번호", win_str, "winNums"),
            ("보너스 번호", bonus_str, "bonusNums"),
            ("합계", stats["total"], "statTotal"),
            ("AC", stats["ac"], "statAc"),
            ("SD", f"{stats['sd']:.1f}", "statSd"),
            ("홀 : 짝", f"{stats['odd']} : {stats['even']}", "statOdd"),
            ("그룹1", stats["group_counts"][0], "statG1"),
            ("그룹2", stats["group_counts"][1], "statG2"),
            ("그룹3", stats["group_counts"][2], "statG3"),
        ]
        self.statsRow = QHBoxLayout()
        self.statsRow.setSpacing(6)
        self.statsRow.setAlignment(Qt.AlignTop)
        for name, value, obj in specs:
            card = StatCard(name, self)
            card.set_value(value, obj)
            self.statsRow.addWidget(card, 0, Qt.AlignTop)
        self.statsRow.addStretch(1)
        self.groupRow.addLayout(self.statsRow)

    def refresh(self):
        idx = self.spinBox.value()
        round_id = self.round_ids[idx - 1]
        self.roundLabel.setText(f"/ {round_id}회차")
        numbers = self.data["numbers"][round_id]
        win = self.data["win"][round_id]
        bonus = self.data["bonus"][round_id]
        self._build_groups(numbers, win, bonus)
        self._build_stats(numbers, win, bonus)
