import os

from PySide6.QtWidgets import (
    QMainWindow, QWidget, QTabWidget, QHBoxLayout, QVBoxLayout, QLabel,
    QPushButton, QComboBox, QFileDialog, QMessageBox,
)

from winning_analysis_loader import DataLoader, SheetLister
from winning_analysis_widgets import LoadButtonPage
from winning_analysis_tabs import RoundTab, RatioTab, GroupTab


class MainWindow(QMainWindow):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Lotto645 분석 - lotto_dummy")
        self.resize(1000, 720)

        central = QWidget(self)
        main_layout = QVBoxLayout(central)
        main_layout.setContentsMargins(8, 8, 8, 8)
        main_layout.setSpacing(6)

        top = QHBoxLayout()
        self.openButton = QPushButton("엑셀 열기", central)
        self.openButton.clicked.connect(self.on_open_clicked)
        self.fileLabel = QLabel("파일: -", central)
        self.fileLabel.setObjectName("fileInfo")
        self.sheetLabel = QLabel("시트:", central)
        self.sheetLabel.setObjectName("fileInfo")
        self.sheetCombo = QComboBox(central)
        self.sheetCombo.setMinimumWidth(220)
        self.sheetCombo.setMinimumHeight(30)
        self.sheetCombo.setEnabled(False)
        self.sheetCombo.currentIndexChanged.connect(self.on_sheet_changed)
        top.addWidget(self.openButton)
        top.addSpacing(8)
        top.addWidget(self.fileLabel)
        top.addSpacing(16)
        top.addWidget(self.sheetLabel)
        top.addWidget(self.sheetCombo)
        top.addStretch(1)
        main_layout.addLayout(top)

        self.tabWidget = QTabWidget(central)
        self.tabs_loaded = set()
        main_layout.addWidget(self.tabWidget, 1)
        self.setCentralWidget(central)

        self.page_round = LoadButtonPage(
            "엑셀 파일 열기", self.on_open_clicked,
            message="분석할 엑셀 파일을 선택하세요",
        )
        self.page_ratio = LoadButtonPage("당첨 비율 불러오기", self.load_ratio_tab)
        self.page_group = LoadButtonPage("그룹 통계 불러오기", self.load_group_tab)

        self.tabWidget.addTab(self.page_round, "회차 조회")
        self.tabWidget.addTab(self.page_ratio, "당첨 비율")
        self.tabWidget.addTab(self.page_group, "그룹 통계")

        self.tabWidget.currentChanged.connect(self.on_tab_changed)

        self.data = None
        self.loader = None
        self.sheet_lister = None
        self.filepath = os.getcwd()
        self.tabWidget.setCurrentIndex(0)
        self.fileLabel.setText("파일: 선택 안 됨")

    def on_open_clicked(self):
        start_dir = self.filepath if os.path.isfile(self.filepath) else os.getcwd()
        path, _ = QFileDialog.getOpenFileName(
            self, "엑셀 파일 선택", start_dir, "Excel Files (*.xlsx *.xlsm)"
        )
        if path:
            self.list_sheets(path)

    def list_sheets(self, filepath):
        if self.loader is not None and self.loader.isRunning():
            self.loader.requestInterruption()
        if self.sheet_lister is not None and self.sheet_lister.isRunning():
            self.sheet_lister.requestInterruption()
        self.filepath = filepath
        self.data = None
        self.tabs_loaded = set()
        self.fileLabel.setText(f"파일: {os.path.basename(filepath)}")
        self.sheetCombo.blockSignals(True)
        self.sheetCombo.clear()
        self.sheetCombo.blockSignals(False)
        self.sheetCombo.setEnabled(False)
        self.sheetLabel.setText("시트: -")
        self.sheet_lister = SheetLister(filepath)
        self.sheet_lister.listed.connect(self.on_sheets_listed)
        self.sheet_lister.failed.connect(self.on_load_failed)
        self.sheet_lister.start()

    def on_sheets_listed(self, sheets):
        self.sheetCombo.blockSignals(True)
        self.sheetCombo.clear()
        self.sheetCombo.addItems(sheets)
        self.sheetCombo.setCurrentIndex(-1)
        self.sheetCombo.blockSignals(False)
        self.sheetCombo.setEnabled(True)
        self.sheetLabel.setText("시트:")

    def on_load_failed(self, message):
        QMessageBox.warning(self, "로드 실패", message)

    def load_data(self, sheet_name):
        if self.loader is not None and self.loader.isRunning():
            self.loader.requestInterruption()
        self.sheetCombo.setEnabled(False)
        self.loader = DataLoader(self.filepath, sheet_name)
        self.loader.loaded.connect(self.on_data_loaded)
        self.loader.failed.connect(self.on_load_failed)
        self.loader.start()

    def on_data_loaded(self, data):
        self.data = data
        self.sheetCombo.blockSignals(True)
        self.sheetCombo.clear()
        self.sheetCombo.addItems(data["sheets"])
        self.sheetCombo.setCurrentText(data["sheet_name"])
        self.sheetCombo.blockSignals(False)
        self.sheetCombo.setEnabled(True)
        self.load_round_tab()

    def on_sheet_changed(self, index):
        if index < 0:
            return
        sheet_name = self.sheetCombo.itemText(index)
        if self.data is not None and sheet_name == self.data.get("sheet_name"):
            return
        self.load_data(sheet_name)

    def _replace_tab(self, index, widget, title):
        if index in self.tabs_loaded:
            return
        self.tabs_loaded.add(index)
        self.tabWidget.removeTab(index)
        self.tabWidget.insertTab(index, widget, title)

    def load_round_tab(self):
        if self.data is None:
            return
        self._replace_tab(0, RoundTab(self.data), "회차 조회")
        self.tabWidget.setCurrentIndex(0)

    def load_ratio_tab(self):
        if self.data is None:
            return
        self._replace_tab(1, RatioTab(self.data), "당첨 비율")
        self.tabWidget.setCurrentIndex(1)

    def load_group_tab(self):
        if self.data is None:
            return
        self._replace_tab(2, GroupTab(self.data), "그룹 통계")
        self.tabWidget.setCurrentIndex(2)

    def on_tab_changed(self, index):
        if index == 0 and self.data is not None:
            self.load_round_tab()
