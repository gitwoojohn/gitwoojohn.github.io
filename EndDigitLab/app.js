const RECENT_COUNT = 20;
const CSV_PATH = '../ReadWeb-WinningNumbers.csv';

let lastRows = [];

const $ = (id) => document.getElementById(id);

function showLoader(on) {
    $('loader').classList.toggle('hidden', !on);
}

async function loadData() {
    showLoader(true);
    try {
        const res = await fetch(CSV_PATH);
        if (!res.ok) throw new Error('CSV 로드 실패');
        const text = await res.text();
        const rows = parseCSV(text);
        lastRows = rows.slice(-RECENT_COUNT);

        const first = rows[0];
        const last = rows[rows.length - 1];
        $('dataRange').textContent = `최근 ${RECENT_COUNT}회 (${first.id}회 ~ ${last.id}회)`;

        render();
    } catch (err) {
        $('dataRange').textContent = '데이터 로드 실패';
        console.error(err);
    } finally {
        showLoader(false);
    }
}

function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    lines.shift();
    return lines.map((line) => {
        const cols = line.split(',');
        return {
            id: parseInt(cols[0], 10),
            nums: [2, 3, 4, 5, 6, 7].map((i) => parseInt(cols[i], 10)),
        };
    });
}

function digitFreq(rows) {
    const freq = new Array(10).fill(0);
    rows.forEach((r) => r.nums.forEach((n) => freq[n % 10]++));
    return freq;
}

function render() {
    const freq = digitFreq(lastRows);
    const total = freq.reduce((a, b) => a + b, 0);
    $('totalCount').textContent = `${total}개`;

    const max = Math.max(...freq);
    const sorted = freq
        .map((v, d) => ({ d, v }))
        .sort((a, b) => b.v - a.v);

    renderChart(freq, max);
    renderHotCold(sorted);
    generatePredictions(freq);
}

function renderChart(freq, max) {
    const chart = $('digitChart');
    chart.innerHTML = '';
    const sorted = freq.map((v, d) => ({ d, v })).sort((a, b) => b.v - a.v);
    const hotTop = sorted.slice(0, 3).map((x) => x.d);
    const coldBottom = sorted.slice(-3).map((x) => x.d);

    freq.forEach((v, d) => {
        const h = max > 0 ? (v / max) * 100 : 0;
        const col = document.createElement('div');
        col.className = 'digit-col';

        const val = document.createElement('span');
        val.className = 'digit-val';
        val.textContent = v;

        const wrap = document.createElement('div');
        wrap.className = 'digit-bar-wrap';

        const bar = document.createElement('div');
        bar.className = 'digit-bar';
        if (hotTop.includes(d)) bar.classList.add('hot');
        else if (coldBottom.includes(d)) bar.classList.add('cold');
        bar.style.height = `${h}%`;
        wrap.appendChild(bar);

        const label = document.createElement('span');
        label.className = 'digit-label';
        label.textContent = d;

        col.appendChild(val);
        col.appendChild(wrap);
        col.appendChild(label);
        chart.appendChild(col);
    });
}

function renderHotCold(sorted) {
    $('hotList').innerHTML = sorted
        .slice(0, 3)
        .map(
            (x) => `
            <div class="digit-item">
                <span><span class="d" style="background:#ef4444">${x.d}</span> <span class="cnt">${x.v}회</span></span>
            </div>`
        )
        .join('');

    $('coldList').innerHTML = sorted
        .slice(-3)
        .reverse()
        .map(
            (x) => `
            <div class="digit-item">
                <span><span class="d" style="background:#64748b">${x.d}</span> <span class="cnt">${x.v}회</span></span>
            </div>`
        )
        .join('');
}

function ballClass(n) {
    if (n <= 10) return 'ball-y';
    if (n <= 20) return 'ball-b';
    if (n <= 30) return 'ball-r';
    if (n <= 40) return 'ball-g';
    return 'ball-v';
}

function pickByDigit(freq) {
    const weighted = [];
    freq.forEach((v, d) => {
        for (let i = 0; i < v; i++) weighted.push(d);
    });
    if (!weighted.length) return [];
    const picks = [];
    while (picks.length < 6) {
        const d = weighted[Math.floor(Math.random() * weighted.length)];
        if (!picks.includes(d)) picks.push(d);
    }
    return picks.sort((a, b) => a - b);
}

function numForDigit(d) {
    const candidates = [];
    for (let n = d; n <= 45; n += 10) candidates.push(n);
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function calcAC(nums) {
    const diffs = new Set();
    for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
            diffs.add(nums[j] - nums[i]);
        }
    }
    return diffs.size - (nums.length - 1);
}

function calcSD(nums) {
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const variance = nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / nums.length;
    return Math.sqrt(variance).toFixed(1);
}

function generatePredictions(freq) {
    const usedNums = new Set();
    const picks = [];

    for (let i = 0; i < 5; i++) {
        let digits = pickByDigit(freq);
        let nums = [];
        let attempts = 0;
        while (nums.length < 6 && attempts < 300) {
            attempts++;
            const d = digits[nums.length];
            const n = numForDigit(d);
            if (!usedNums.has(n) && !nums.includes(n)) {
                nums.push(n);
                usedNums.add(n);
            }
        }
        if (nums.length === 6) {
            picks.push(nums.sort((a, b) => a - b));
        }
    }

    $('predictArea').innerHTML = picks
        .map((nums, i) => {
            const sum = nums.reduce((a, b) => a + b, 0);
            const odd = nums.filter((n) => n % 2 !== 0).length;
            const ac = calcAC(nums);
            const sd = calcSD(nums);
            const ballsHtml = nums
                .map(
                    (n) =>
                        `<span class="w-8 h-8 shrink-0 ${ballClass(n)} rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">${n}</span>`
                )
                .join('');
            return `
                <div class="bg-slate-900 text-white p-3 rounded-xl shadow-lg space-y-2 font-mono text-left overflow-visible">
                    <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-3">
                        <div class="flex gap-2 flex-1 justify-center overflow-x-auto overflow-y-visible py-1">
                            ${ballsHtml}
                        </div>
                    </div>
                    <div class="flex justify-between text-[11px] pt-1 text-slate-300">
                        <span>합계: <b class="text-white">${sum}</b></span>
                        <span>홀짝: <b class="text-white">${odd}:${6 - odd}</b></span>
                        <span>AC: <b class="text-white">${ac}</b></span>
                        <span>SD: <b class="text-white">${sd}</b></span>
                    </div>
                </div>`;
        })
        .join('');
}

$('btnGenerate').addEventListener('click', () => {
    if (lastRows.length) generatePredictions(digitFreq(lastRows));
});
$('btnReload').addEventListener('click', loadData);

document.addEventListener('DOMContentLoaded', loadData);
