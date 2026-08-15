from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QTableWidget, QTableWidgetItem, QHeaderView,
)


class NumericTableItem(QTableWidgetItem):
    def __init__(self, text, value):
        super().__init__(text)
        self.setData(Qt.UserRole, value)

    def __lt__(self, other):
        if isinstance(other, NumericTableItem):
            return self.data(Qt.UserRole) < other.data(Qt.UserRole)
        return super().__lt__(other)


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
                item = NumericTableItem(str(val), val)
                item.setTextAlignment(Qt.AlignCenter)
                table.setItem(i, j, item)
        table.setSortingEnabled(True)
        layout.addWidget(table)
