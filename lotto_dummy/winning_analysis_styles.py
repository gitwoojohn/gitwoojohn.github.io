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
    padding: 3px 22px 3px 6px;
}
QSpinBox::up-button {
    subcontrol-origin: border;
    subcontrol-position: top right;
    width: 18px;
    height: 13px;
    border: 1px solid #3a3a3a;
    background: #3d3d3d;
    border-top-right-radius: 2px;
}
QSpinBox::down-button {
    subcontrol-origin: border;
    subcontrol-position: bottom right;
    width: 18px;
    height: 13px;
    border: 1px solid #3a3a3a;
    background: #3d3d3d;
    border-bottom-right-radius: 2px;
}
QSpinBox::up-button:hover, QSpinBox::down-button:hover {
    background: #536dfe;
}
QSpinBox::up-arrow {
    width: 8px;
    height: 5px;
    border-top: 2px solid #e0e0e0;
    border-left: 2px solid #e0e0e0;
    transform: rotate(45deg);
}
QSpinBox::down-arrow {
    width: 8px;
    height: 5px;
    border-bottom: 2px solid #e0e0e0;
    border-left: 2px solid #e0e0e0;
    transform: rotate(-45deg);
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
QLabel#fileInfo {
    color: #9fc0e8;
    font-weight: 600;
    padding: 4px 6px;
    background: #252526;
    border: 1px solid #3a5a7a;
    border-radius: 4px;
}
QLabel#numLabel {
    border: 1px solid #3a3a3a;
    border-radius: 3px;
    font-size: 13px;
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
    padding: 0px 8px;
    font-size: 14px;
    font-weight: bold;
    color: #00c0ff;
}
QLabel#bonusNums {
    background: #332b1a;
    border: 1px solid #7a6a2f;
    border-radius: 6px;
    padding: 0px 8px;
    font-size: 14px;
    color: #ffbb00;
}
QLabel#statTotal {
    background: #1a3328;
    border: 1px solid #2f7a5a;
    border-radius: 6px;
    padding: 0px 8px;
    font-size: 14px;
    font-weight: bold;
    color: #00ff88;
}
QLabel#statAc {
    background: #332b1a;
    border: 1px solid #7a6a2f;
    border-radius: 6px;
    padding: 0px 8px;
    font-size: 14px;
    font-weight: bold;
    color: #ffcc00;
}
QLabel#statSd {
    background: #33201a;
    border: 1px solid #7a4a2f;
    border-radius: 6px;
    padding: 0px 8px;
    font-size: 14px;
    font-weight: bold;
    color: #ff8844;
}
QLabel#statOdd {
    background: #1a2a33;
    border: 1px solid #2f5f7a;
    border-radius: 6px;
    padding: 0px 8px;
    font-size: 14px;
    font-weight: bold;
    color: #44ccff;
}
QLabel#statG1, QLabel#statG2, QLabel#statG3 {
    background: #262633;
    border: 1px solid #5a5a7a;
    border-radius: 6px;
    font-size: 14px;
    font-weight: bold;
    color: #b088ff;
}
"""
