DARK_QSS = """
QMainWindow, QWidget {
    background-color: #1e1e1e;
    color: #e0e0e0;
    font-size: 13px;
}
QTabWidget::pane {
    border: 1px solid #3a3a3a;
    background: #1e1e1e;
}
QTabBar::tab {
    background: #2b2b2b;
    color: #e0e0e0;
    padding: 8px 18px;
    border: 1px solid #3a3a3a;
    border-bottom: none;
}
QTabBar::tab:selected {
    background: #333a42;
    color: #ffffff;
}
QTabBar::tab:hover:!selected {
    background: #2f2f2f;
}
QTableWidget {
    background: #252526;
    alternate-background-color: #2b2b2b;
    gridline-color: #3a3a3a;
    border: none;
}
QHeaderView::section {
    background: #333333;
    color: #e0e0e0;
    border: 1px solid #3a3a3a;
    padding: 5px;
}
QComboBox {
    background: #2b2b2b;
    color: #e0e0e0;
    border: 1px solid #3a3a3a;
    padding: 5px;
}
QComboBox QAbstractItemView {
    background: #2b2b2b;
    color: #e0e0e0;
    selection-background-color: #3d5afe;
}
QPushButton {
    background: #3d5afe;
    color: #ffffff;
    border: none;
    padding: 6px 14px;
    border-radius: 4px;
}
QPushButton:hover { background: #536dfe; }
QPushButton:pressed { background: #303f9f; }
QSlider::groove:horizontal {
    height: 6px;
    background: #3a3a3a;
    border-radius: 3px;
}
QSlider::handle:horizontal {
    width: 16px;
    height: 16px;
    margin: -5px 0;
    border-radius: 8px;
    background: #3d5afe;
}
QSpinBox {
    background: #2b2b2b;
    color: #e0e0e0;
    border: 1px solid #3a3a3a;
    padding: 3px 6px;
}
QSpinBox::up-button, QSpinBox::down-button {
    background: #333333;
    border: 1px solid #3a3a3a;
    width: 18px;
}
QProgressBar {
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    text-align: center;
    color: #e0e0e0;
}
QProgressBar::chunk {
    background-color: #3d5afe;
    border-radius: 3px;
}
QLabel#loading {
    color: #9e9e9e;
    font-size: 14px;
}
QLabel#numLabel {
    border: 1px solid #3a3a3a;
    border-radius: 3px;
    font-size: 12px;
    font-weight: bold;
    background: #252526;
}
QLabel#numWin {
    background: #00c0ff;
    color: #000000;
}
QLabel#numBonus {
    background: #ffbb00;
    color: #000000;
}
QFrame#statsBox {
    background: #252526;
    border: 1px solid #3a3a3a;
    border-radius: 6px;
}
QLabel#statsLabel {
    color: #9e9e9e;
    font-size: 11px;
    font-weight: bold;
}
QLabel#statsValue {
    color: #ffffff;
    font-size: 14px;
    font-weight: bold;
}
QLabel#winNums {
    background: #1a2a33;
    border: 1px solid #2f5f7a;
    border-radius: 6px;
    padding: 8px;
    font-size: 14px;
    font-weight: bold;
    color: #00c0ff;
}
QLabel#bonusNums {
    background: #332b1a;
    border: 1px solid #7a6a2f;
    border-radius: 6px;
    padding: 8px;
    font-size: 14px;
    color: #ffbb00;
}
"""
