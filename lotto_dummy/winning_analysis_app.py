import sys

from PySide6.QtWidgets import QApplication

from winning_analysis_styles import build_arrows, build_qss
from winning_analysis_main_window import MainWindow


def main():
    app = QApplication(sys.argv)
    build_arrows()
    app.setStyleSheet(build_qss())
    win = MainWindow()
    win.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
