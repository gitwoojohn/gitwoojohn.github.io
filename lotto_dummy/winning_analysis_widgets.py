from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QLabel, QProgressBar, QPushButton, QFrame,
    QSizePolicy,
)


class LoadingPage(QWidget):
    def __init__(self, text="로딩 중...", parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)
        self.bar = QProgressBar(self)
        self.bar.setRange(0, 0)
        self.bar.setTextVisible(False)
        self.bar.setFixedSize(220, 12)
        self.label = QLabel(text, self)
        self.label.setObjectName("loading")
        self.label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.label)
        layout.addSpacing(10)
        layout.addWidget(self.bar)


class LoadButtonPage(QWidget):
    def __init__(self, text, on_load, parent=None, message=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)
        self.label = QLabel(message or "버튼을 눌러 데이터를 불러오세요", self)
        self.label.setObjectName("loading")
        self.label.setAlignment(Qt.AlignCenter)
        self.button = QPushButton(text, self)
        self.button.setFixedSize(200, 40)
        self.button.clicked.connect(on_load)
        layout.addWidget(self.label)
        layout.addSpacing(12)
        layout.addWidget(self.button)


class StatCard(QFrame):
    def __init__(self, label_text, parent=None):
        super().__init__(parent)
        self.setObjectName("statsBox")
        self.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Maximum)
        v = QVBoxLayout(self)
        v.setContentsMargins(10, 6, 10, 6)
        v.setSpacing(2)
        self.label = QLabel(label_text, self)
        self.label.setObjectName("statsLabel")
        self.label.setAlignment(Qt.AlignCenter)
        self.value = QLabel("0", self)
        self.value.setObjectName("statsValue")
        self.value.setAlignment(Qt.AlignCenter)
        self.value.setMinimumHeight(32)
        v.addWidget(self.label)
        v.addWidget(self.value)

    def set_value(self, text, object_name=None):
        if object_name:
            self.value.setObjectName(object_name)
        self.value.setText(str(text))
