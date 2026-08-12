from PySide6.QtWidgets import QMainWindow, QTabWidget

from winning_analysis_loader import DataLoader
from winning_analysis_widgets import LoadingPage, LoadButtonPage
from winning_analysis_tabs import RoundTab, RatioTab, GroupTab


class MainWindow(QMainWindow):
    def __init__(self, filepath):
        super().__init__()
        self.setWindowTitle("Lotto645 분석 - lotto_dummy")
        self.resize(1000, 720)

        self.tabWidget = QTabWidget(self)
        self.tabs_loaded = set()
        self.setCentralWidget(self.tabWidget)

        self.page_round = LoadingPage()
        self.page_ratio = LoadButtonPage("당첨 비율 불러오기", self.load_ratio_tab)
        self.page_group = LoadButtonPage("그룹 통계 불러오기", self.load_group_tab)

        self.tabWidget.addTab(self.page_round, "회차 조회")
        self.tabWidget.addTab(self.page_ratio, "당첨 비율")
        self.tabWidget.addTab(self.page_group, "그룹 통계")

        self.tabWidget.currentChanged.connect(self.on_tab_changed)

        self.data = None
        self.loader = DataLoader(filepath)
        self.loader.loaded.connect(self.on_data_loaded)

        self.tabWidget.setCurrentIndex(0)
        self.loader.start()

    def on_data_loaded(self, data):
        self.data = data
        self.load_round_tab()

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
