from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QTableWidget, QTableWidgetItem, QHeaderView,
)


class RatioTab(QWidget):
    def __init__(self, data, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        table = QTableWidget(45, 3, self)
        table.setHorizontalHeaderLabels(["번호", "당첨 횟수", "당첨 비율"])
        table.setAlternatingRowColors(True)
        table.verticalHeader().setVisible(False)
        table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        for i, num in enumerate(range(1, 46)):
            cnt, pct = data["ratio"][num]
            table.setItem(i, 0, QTableWidgetItem(str(num)))
            table.setItem(i, 1, QTableWidgetItem(str(cnt)))
            table.setItem(i, 2, QTableWidgetItem(str(pct)))
            table.item(i, 0).setTextAlignment(Qt.AlignCenter)
            table.item(i, 1).setTextAlignment(Qt.AlignCenter)
            table.item(i, 2).setTextAlignment(Qt.AlignCenter)
        layout.addWidget(table)
