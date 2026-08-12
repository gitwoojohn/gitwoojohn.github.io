import os
import sys

from PySide6.QtWidgets import QApplication

from winning_analysis_styles import DARK_QSS
from winning_analysis_main_window import MainWindow


def main():
    app = QApplication(sys.argv)
    app.setStyleSheet(DARK_QSS)
    filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lotto_dummy.xlsx")
    win = MainWindow(filepath)
    win.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
