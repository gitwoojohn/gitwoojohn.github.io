const RECENT_COUNT = 20;
const CSV_PATH = '../ReadWeb-WinningNumbers.csv';

let lastRows = [];

const $ = (id) => document.getElementById(id);

function mulberry32(seed) {
    let state = seed >>> 0;
    return function () {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function isRandomMode() {
    const toggle = $('randomModeToggle');
    return toggle ? toggle.checked : false;
}

function showLoader(isVisible) {
    $('loader').classList.toggle('hidden', !isVisible);
}

async function loadData() {
    showLoader(true);
    try {
        const response = await fetch(CSV_PATH);
        if (!response.ok) throw new Error('CSV 로드 실패');
        const csvText = await response.text();
        const allRows = parseCSV(csvText);
        lastRows = allRows.slice(-RECENT_COUNT);

        const firstRow = allRows[0];
        const lastRow = allRows[allRows.length - 1];
        $('dataRange').textContent = `최근 ${RECENT_COUNT}회 (${firstRow.id}회 ~ ${lastRow.id}회)`;

        render();
    } catch (error) {
        $('dataRange').textContent = '데이터 로드 실패';
        console.error(error);
    } finally {
        showLoader(false);
    }
}

function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
    lines.shift();
    return lines.map((line) => {
        const columns = line.split(',');
        return {
            id: parseInt(columns[0], 10),
            numbers: [2, 3, 4, 5, 6, 7].map((index) => parseInt(columns[index], 10)),
        };
    });
}

function digitFrequencies(rows) {
    const frequencies = new Array(10).fill(0);
    rows.forEach((row) => row.numbers.forEach((number) => frequencies[number % 10]++));
    return frequencies;
}

function render() {
    const frequencies = digitFrequencies(lastRows);
    const total = frequencies.reduce((sum, count) => sum + count, 0);
    $('totalCount').textContent = `${total}개`;

    const maxCount = Math.max(...frequencies);
    const sortedDigits = frequencies
        .map((count, digit) => ({ digit, count }))
        .sort((a, b) => b.count - a.count);

    renderChart(frequencies, maxCount);
    renderHotCold(sortedDigits);
    generatePredictions(frequencies);
}
function renderChart(frequencies, maxCount) {
    const chart = $('digitChart');
    chart.innerHTML = '';
    const sortedDigits = frequencies.map((count, digit) => ({ digit, count })).sort((a, b) => b.count - a.count);
    const topHotDigits = sortedDigits.slice(0, 3).map((entry) => entry.digit);
    const bottomColdDigits = sortedDigits.slice(-3).map((entry) => entry.digit);

    frequencies.forEach((count, digit) => {
        const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const column = document.createElement('div');
        column.className = 'digit-col';

        const countLabel = document.createElement('span');
        countLabel.className = 'digit-val';
        countLabel.textContent = count;

        const barWrapper = document.createElement('div');
        barWrapper.className = 'digit-bar-wrap';

        const bar = document.createElement('div');
        bar.className = 'digit-bar';
        if (topHotDigits.includes(digit)) bar.classList.add('hot');
        else if (bottomColdDigits.includes(digit)) bar.classList.add('cold');
        bar.style.height = `${heightPercent}%`;
        barWrapper.appendChild(bar);

        const digitLabel = document.createElement('span');
        digitLabel.className = 'digit-label';
        digitLabel.textContent = digit;

        column.appendChild(countLabel);
        column.appendChild(barWrapper);
        column.appendChild(digitLabel);
        chart.appendChild(column);
    });
}

function renderHotCold(sortedDigits) {
    $('hotList').innerHTML = sortedDigits
        .slice(0, 3)
        .map(
            (entry) => `
            <div class="digit-item">
                <span><span class="d" style="background:#ef4444">${entry.digit}</span> <span class="cnt">${entry.count}회</span></span>
            </div>`
        )
        .join('');

    $('coldList').innerHTML = sortedDigits
        .slice(-3)
        .reverse()
        .map(
            (entry) => `
            <div class="digit-item">
                <span><span class="d" style="background:#64748b">${entry.digit}</span> <span class="cnt">${entry.count}회</span></span>
            </div>`
        )
        .join('');
}

function ballColorClass(number) {
    if (number <= 10) return 'ball-yellow';
    if (number <= 20) return 'ball-blue';
    if (number <= 30) return 'ball-red';
    if (number <= 40) return 'ball-gray';
    return 'ball-green';
}

function pickWeightedDigits(frequencies, rng) {
    const weightedDigits = [];
    frequencies.forEach((count, digit) => {
        for (let i = 0; i < count; i++) weightedDigits.push(digit);
    });
    if (!weightedDigits.length) return [];
    const pickedDigits = [];
    while (pickedDigits.length < 6) {
        const digit = weightedDigits[Math.floor(rng() * weightedDigits.length)];
        if (!pickedDigits.includes(digit)) pickedDigits.push(digit);
    }
    return pickedDigits.sort((a, b) => a - b);
}

function randomNumberForDigit(digit, rng) {
    const candidates = [];
    const start = digit === 0 ? 10 : digit;
    for (let number = start; number <= 45; number += 10) candidates.push(number);
    return candidates[Math.floor(rng() * candidates.length)];
}

function calcAC(numbers) {
    const differences = new Set();
    for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
            differences.add(numbers[j] - numbers[i]);
        }
    }
    return differences.size - (numbers.length - 1);
}

function calcSD(numbers) {
    const mean = numbers.reduce((sum, number) => sum + number, 0) / numbers.length;
    const variance = numbers.reduce((sum, number) => sum + Math.pow(number - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance).toFixed(1);
}

function generatePredictions(frequencies) {
    const nextRoundId = lastRows.length ? lastRows[lastRows.length - 1].id + 1 : 0;
    const seedBase = isRandomMode() ? Date.now() : nextRoundId;

    const predictions = [];

    for (let predictionIndex = 0; predictionIndex < 5; predictionIndex++) {
        const rng = mulberry32(seedBase * 100 + predictionIndex);
        const usedNumbers = new Set();
        const targetDigits = pickWeightedDigits(frequencies, rng);
        const chosenNumbers = [];
        let attempts = 0;
        while (chosenNumbers.length < 6 && attempts < 300) {
            attempts++;
            const digit = targetDigits[chosenNumbers.length];
            const number = randomNumberForDigit(digit, rng);
            if (!usedNumbers.has(number) && !chosenNumbers.includes(number)) {
                chosenNumbers.push(number);
                usedNumbers.add(number);
            }
        }
        if (chosenNumbers.length === 6) {
            predictions.push(chosenNumbers.sort((a, b) => a - b));
        }
    }

    $('predictArea').innerHTML = predictions
        .map((numbers, predictionIndex) => {
            const totalSum = numbers.reduce((sum, number) => sum + number, 0);
            const oddCount = numbers.filter((number) => number % 2 !== 0).length;
            const acValue = calcAC(numbers);
            const sdValue = calcSD(numbers);
            const ballsHtml = numbers
                .map(
                    (number) =>
                        `<span class="w-8 h-8 shrink-0 ${ballColorClass(number)} rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">${number}</span>`
                )
                .join('');
            return `
                <div class="predict-card rank-${predictionIndex + 1} bg-slate-900 text-white p-3 rounded-xl shadow-lg space-y-2 font-mono text-left overflow-visible">
                    <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-3">
                        <div class="flex gap-2 flex-1 justify-center overflow-x-auto overflow-y-visible py-1">
                            ${ballsHtml}
                        </div>
                    </div>
                    <div class="flex justify-between text-[11px] pt-1 text-slate-300">
                        <span>합계: <b class="text-white">${totalSum}</b></span>
                        <span>홀짝: <b class="text-white">${oddCount}:${6 - oddCount}</b></span>
                        <span>AC: <b class="text-white">${acValue}</b></span>
                        <span>SD: <b class="text-white">${sdValue}</b></span>
                    </div>
                </div>
                ${predictionIndex < predictions.length - 1 ? '<div class="predict-divider"></div>' : ''}`;
        })
        .join('');
}

$('btnGenerate').addEventListener('click', () => {
    if (lastRows.length) generatePredictions(digitFrequencies(lastRows));
});
$('btnReload').addEventListener('click', loadData);

document.addEventListener('DOMContentLoaded', loadData);
