import os

from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QTabWidget, QHBoxLayout, QVBoxLayout, QLabel,
    QPushButton, QComboBox, QFileDialog, QMessageBox,
)

from winning_analysis_loader import DataLoader, SheetLister
from winning_analysis_widgets import LoadButtonPage
from winning_analysis_tabs import (
    RoundTab, RatioTab, GroupTab, GroupFocusTab, PreFocusTab, GapTab,
)

APP_DIR = os.path.dirname(os.path.abspath(__file__))


class MainWindow(QMainWindow):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("로또645 회차 분석")
        self.resize(900, 640)
        self.setMinimumSize(900, 580)
        self.setMaximumWidth(940)

        central = QWidget(self)
        main_layout = QVBoxLayout(central)
        main_layout.setContentsMargins(8, 8, 8, 8)
        main_layout.setSpacing(6)

        top = QHBoxLayout()
        self.openButton = QPushButton("파일 불러오기", central)
        self.openButton.clicked.connect(self.on_open_clicked)
        self.fileLabel = QLabel("파일: -", central)
        self.fileLabel.setObjectName("fileInfo")
        self.sheetLabel = QLabel("시트 이름:", central)
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

        self.page_round = self._make_message_page("분석할 엑셀 파일을 선택하세요")
        self.page_ratio = LoadButtonPage("당첨 비율 불러오기", self.load_ratio_tab)
        self.page_group = LoadButtonPage("그룹 통계 불러오기", self.load_group_tab)
        self.page_group_focus = LoadButtonPage("그룹 집중 회차 불러오기", self.load_group_focus_tab)
        self.page_pre_focus = LoadButtonPage("직전 회차 분석 불러오기", self.load_pre_focus_tab)
        self.page_gap = LoadButtonPage("그룹 간격 분석 불러오기", self.load_gap_tab)

        self.tabWidget.addTab(self.page_round, "회차 조회")
        self.tabWidget.addTab(self.page_ratio, "당첨 비율")
        self.tabWidget.addTab(self.page_group, "그룹 통계")
        self.tabWidget.addTab(self.page_group_focus, "그룹 집중 회차")
        self.tabWidget.addTab(self.page_pre_focus, "직전 회차 분석")
        self.tabWidget.addTab(self.page_gap, "그룹 간격 분석")

        self.tabWidget.currentChanged.connect(self.on_tab_changed)

        self.data = None
        self.loader = None
        self.sheet_lister = None
        self.round_tab = None
        self.ratio_tab = None
        self.group_tab = None
        self.group_focus_tab = None
        self.pre_focus_tab = None
        self.gap_tab = None
        self.filepath = APP_DIR
        self.tabWidget.setCurrentIndex(0)
        self.fileLabel.setText("파일: 선택 안 됨")

    def _make_message_page(self, message):
        page = QWidget(self)
        layout = QVBoxLayout(page)
        layout.setAlignment(Qt.AlignCenter)
        label = QLabel(message, page)
        label.setObjectName("loading")
        label.setAlignment(Qt.AlignCenter)
        layout.addWidget(label)
        return page

    def on_open_clicked(self):
        path, _ = QFileDialog.getOpenFileName(
            self, "엑셀 파일 선택", APP_DIR, "Excel Files (*.xlsx *.xlsm)"
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
        self.round_tab = None
        self.ratio_tab = None
        self.group_tab = None
        self.group_focus_tab = None
        self.pre_focus_tab = None
        self.gap_tab = None
        self.fileLabel.setText(f"파일: {os.path.basename(filepath)}")
        self.sheetCombo.blockSignals(True)
        self.sheetCombo.clear()
        self.sheetCombo.blockSignals(False)
        self.sheetCombo.setEnabled(False)
        self.sheetLabel.setText("시트 이름: -")
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
        self.sheetLabel.setText("시트 이름:")

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
        self._reset_tabs()
        self.load_round_tab()

    def _reset_tabs(self):
        self.tabs_loaded = set()
        self.round_tab = None
        self.ratio_tab = None
        self.group_tab = None
        self.group_focus_tab = None
        self.pre_focus_tab = None
        self.gap_tab = None
        pages = [
            (0, self.page_round, "회차 조회"),
            (1, self.page_ratio, "당첨 비율"),
            (2, self.page_group, "그룹 통계"),
            (3, self.page_group_focus, "그룹 집중 회차"),
            (4, self.page_pre_focus, "직전 회차 분석"),
            (5, self.page_gap, "그룹 간격 분석"),
        ]
        self.tabWidget.blockSignals(True)
        for idx, page, title in pages:
            self.tabWidget.removeTab(idx)
            self.tabWidget.insertTab(idx, page, title)
        self.tabWidget.setCurrentIndex(0)
        self.tabWidget.blockSignals(False)

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
        if 0 not in self.tabs_loaded:
            self.round_tab = RoundTab(self.data)
            self.round_tab.round_changed.connect(self.on_round_changed)
            self._replace_tab(0, self.round_tab, "회차 조회")
        self.tabWidget.setCurrentIndex(0)

    def load_ratio_tab(self):
        if self.data is None:
            return
        if 1 not in self.tabs_loaded:
            round_id = None
            if self.round_tab is not None:
                round_id = self.round_tab.current_round_id
            self.ratio_tab = RatioTab(self.data, round_id=round_id)
            self._replace_tab(1, self.ratio_tab, "당첨 비율")
        self.tabWidget.setCurrentIndex(1)

    def on_round_changed(self, round_id):
        if self.ratio_tab is not None and 1 in self.tabs_loaded:
            self.ratio_tab.update_for_round(round_id)
        if self.group_tab is not None and 2 in self.tabs_loaded:
            self.group_tab.update_for_round(round_id)

    def load_group_tab(self):
        if self.data is None:
            return
        if 2 not in self.tabs_loaded:
            round_id = None
            if self.round_tab is not None:
                round_id = self.round_tab.current_round_id
            self.group_tab = GroupTab(self.data, round_id=round_id)
            self._replace_tab(2, self.group_tab, "그룹 통계")
        self.tabWidget.setCurrentIndex(2)

    def load_group_focus_tab(self):
        if self.data is None:
            return
        if 3 not in self.tabs_loaded:
            self.group_focus_tab = GroupFocusTab(self.data)
            self._replace_tab(3, self.group_focus_tab, "그룹 집중 회차")
        self.tabWidget.setCurrentIndex(3)

    def load_pre_focus_tab(self):
        if self.data is None:
            return
        if 4 not in self.tabs_loaded:
            self.pre_focus_tab = PreFocusTab(self.data)
            self._replace_tab(4, self.pre_focus_tab, "직전 회차 분석")
        self.tabWidget.setCurrentIndex(4)

    def load_gap_tab(self):
        if self.data is None:
            return
        if 5 not in self.tabs_loaded:
            self.gap_tab = GapTab(self.data)
            self._replace_tab(5, self.gap_tab, "그룹 간격 분석")
        self.tabWidget.setCurrentIndex(5)

    def on_tab_changed(self, index):
        if index == 0 and self.data is not None:
            self.load_round_tab()
