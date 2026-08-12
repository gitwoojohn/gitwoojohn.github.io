from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QTableWidget, QTableWidgetItem, QHeaderView,
)


class GroupTab(QWidget):
    def __init__(self, data, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        table = QTableWidget(len(data["group"]), 4, self)
        table.setHorizontalHeaderLabels(data["group_headers"])
        table.setAlternatingRowColors(True)
        table.verticalHeader().setVisible(False)
        table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        for i, row in enumerate(data["group"]):
            for j, val in enumerate(row):
                item = QTableWidgetItem(str(val))
                item.setTextAlignment(Qt.AlignCenter)
                table.setItem(i, j, item)
        layout.addWidget(table)
