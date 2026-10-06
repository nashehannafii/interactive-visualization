(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);

    /* ------------------------------------------------------------------ */
    /*  Kompleksitas Big O                                                */
    /* ------------------------------------------------------------------ */

    const complexities = [
        { key: 'O1',     label: 'O(1)',       color: '#16a34a', alias: 'Konstan',       fn: () => 1 },
        { key: 'Ologn',  label: 'O(log n)',   color: '#0284c7', alias: 'Logaritmik',    fn: (n) => Math.max(1, Math.log2(n)) },
        { key: 'On',     label: 'O(n)',       color: '#7c3aed', alias: 'Linear',        fn: (n) => n },
        { key: 'Onlogn', label: 'O(n log n)', color: '#f59e0b', alias: 'Linearitmik',   fn: (n) => n * Math.max(1, Math.log2(n)) },
        { key: 'On2',    label: 'O(n²)',      color: '#ef4444', alias: 'Kuadratik',     fn: (n) => n * n },
        { key: 'O2n',    label: 'O(2ⁿ)',      color: '#be185d', alias: 'Eksponensial',  fn: (n) => Math.pow(2, n) }
    ];

    const cheatData = [
        { label: 'O(1)', alias: 'Konstan', color: '#16a34a', desc: 'Waktu eksekusi tetap, tidak tergantung jumlah input.', example: 'Mengakses elemen array: arr[5]' },
        { label: 'O(log n)', alias: 'Logaritmik', color: '#0284c7', desc: 'Input dibagi dua setiap iterasi. Sangat efisien untuk data terurut.', example: 'Binary Search' },
        { label: 'O(n)', alias: 'Linear', color: '#7c3aed', desc: 'Setiap elemen dikunjungi tepat satu kali.', example: 'Linear Search, traversal array' },
        { label: 'O(n log n)', alias: 'Linearitmik', color: '#f59e0b', desc: 'Terjadi pada algoritma sorting optimal yang membagi dan menggabungkan data.', example: 'Merge Sort, Quick Sort (avg)' },
        { label: 'O(n²)', alias: 'Kuadratik', color: '#ef4444', desc: 'Setiap elemen dibandingkan dengan semua elemen lain. Lambat untuk data besar.', example: 'Bubble Sort, Selection Sort' },
        { label: 'O(2ⁿ)', alias: 'Eksponensial', color: '#be185d', desc: 'Jumlah operasi berlipat dua setiap penambahan 1 input. Sangat tidak praktis.', example: 'Fibonacci rekursif, subset' }
    ];

    /* ------------------------------------------------------------------ */
    /*  Intuition Steps                                                   */
    /* ------------------------------------------------------------------ */

    const intuitionSteps = [
        {
            title: 'Langkah 1 — Apa itu Big O?',
            text: 'Big O Notation adalah cara matematis untuk menggambarkan batas atas (upper bound) pertumbuhan waktu atau ruang yang dibutuhkan oleh algoritma seiring meningkatnya ukuran input n.',
            formula: 'T(n) ≤ c · g(n)  untuk n ≥ n₀',
            draw: 'intro'
        },
        {
            title: 'Langkah 2 — O(1): Konstan',
            text: 'Operasi hanya butuh waktu tetap, berapapun ukuran input. Contoh: mengakses elemen array berdasarkan indeks.',
            formula: 'T(n) = 1',
            draw: 'O1'
        },
        {
            title: 'Langkah 3 — O(log n): Logaritmik',
            text: 'Setiap langkah membagi ruang pencarian menjadi dua. Contoh: Binary Search.',
            formula: 'T(n) = log₂(n)',
            draw: 'Ologn'
        },
        {
            title: 'Langkah 4 — O(n): Linear',
            text: 'Semua elemen diperiksa satu per satu. Contoh: mencari nilai dalam array tak terurut.',
            formula: 'T(n) = n',
            draw: 'On'
        },
        {
            title: 'Langkah 5 — O(n log n): Linearitmik',
            text: 'Algoritma membagi data lalu menggabungkan hasilnya. Contoh: Merge Sort, Quick Sort (rata-rata).',
            formula: 'T(n) = n · log₂(n)',
            draw: 'Onlogn'
        },
        {
            title: 'Langkah 6 — O(n²): Kuadratik',
            text: 'Dua loop bersarang yang masing-masing menelusuri seluruh elemen. Contoh: Bubble Sort.',
            formula: 'T(n) = n²',
            draw: 'On2'
        },
        {
            title: 'Langkah 7 — O(2ⁿ): Eksponensial',
            text: 'Jumlah operasi berlipat dua pada setiap penambahan elemen. Sangat tidak praktis!',
            formula: 'T(n) = 2ⁿ',
            draw: 'O2n'
        },
        {
            title: 'Langkah 8 — Perbandingan Keseluruhan',
            text: 'Lihat bagaimana semua kelas kompleksitas tumbuh secara berdampingan. O(1) hampir tidak terlihat sementara O(2ⁿ) meledak!',
            formula: 'O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)',
            draw: 'all'
        }
    ];

    let intuitionStep = 0;
    let intuitionTimer = null;

    /* ------------------------------------------------------------------ */
    /*  Helper drawing                                                    */
    /* ------------------------------------------------------------------ */

    function drawIntuitionCanvas() {
        const canvas = $('intuitionCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.parentElement.clientWidth || 800;
        const h = canvas.parentElement.clientHeight || 360;
        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);

        const margin = { left: 60, right: 30, top: 30, bottom: 50 };
        const pw = w - margin.left - margin.right;
        const ph = h - margin.top - margin.bottom;

        const step = intuitionSteps[intuitionStep];
        const drawKey = step.draw;

        // Determine which complexities to draw
        let toDraw = [];
        if (drawKey === 'intro') {
            toDraw = [];
        } else if (drawKey === 'all') {
            toDraw = complexities;
        } else {
            const found = complexities.find(c => c.key === drawKey);
            if (found) toDraw = [found];
        }

        const nMax = 20;
        let yMax = 25;
        if (toDraw.length > 0) {
            // cap yMax for readability, exclude O(2^n) from dominating scale unless it's the only one
            if (toDraw.length === 1 && toDraw[0].key === 'O2n') {
                yMax = Math.pow(2, nMax);
            } else {
                // Cap at n^2 height for multi-curve
                yMax = nMax * nMax;
                if (toDraw.some(c => c.key === 'O2n')) {
                    yMax = Math.min(Math.pow(2, nMax), nMax * nMax * 2);
                }
            }
        }

        const mapX = (n) => margin.left + (n / nMax) * pw;
        const mapY = (v) => margin.top + ph - Math.min(v / yMax, 1) * ph;

        // Grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = margin.top + (i / 5) * ph;
            ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(w - margin.right, y); ctx.stroke();
        }
        for (let i = 0; i <= 5; i++) {
            const x = margin.left + (i / 5) * pw;
            ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, h - margin.bottom); ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(margin.left, h - margin.bottom); ctx.lineTo(w - margin.right, h - margin.bottom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(margin.left, margin.top); ctx.lineTo(margin.left, h - margin.bottom); ctx.stroke();

        // Axis labels
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        ctx.fillText('n (ukuran input)', w / 2 - 40, h - 10);
        ctx.save();
        ctx.translate(14, h / 2 + 30);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('operasi', 0, 0);
        ctx.restore();

        // n-axis tick values
        for (let i = 0; i <= 5; i++) {
            const n = Math.round((i / 5) * nMax);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px Arial';
            ctx.fillText(n.toString(), mapX(n) - 5, h - margin.bottom + 16);
        }

        if (drawKey === 'intro') {
            // Draw intro text
            ctx.fillStyle = '#334155';
            ctx.font = 'bold 18px Arial';
            ctx.fillText('Big O Notation', w / 2 - 80, h / 2 - 30);
            ctx.font = '14px Arial';
            ctx.fillStyle = '#64748b';
            ctx.fillText('Mengukur efisiensi algoritma', w / 2 - 95, h / 2);
            ctx.fillText('berdasarkan pertumbuhan waktu/ruang.', w / 2 - 120, h / 2 + 22);
        }

        // Draw curves
        toDraw.forEach((comp) => {
            ctx.beginPath();
            for (let i = 0; i <= 200; i++) {
                const n = (i / 200) * nMax;
                const v = comp.fn(Math.max(n, 0.01));
                const px = mapX(n);
                const py = mapY(v);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = comp.color;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Label at the end
            const labelN = nMax * 0.92;
            const labelV = comp.fn(labelN);
            const lx = mapX(labelN);
            const ly = Math.max(margin.top + 12, mapY(labelV) - 8);
            ctx.fillStyle = comp.color;
            ctx.font = 'bold 12px Arial';
            ctx.fillText(comp.label, lx - 30, ly);
        });

        // Update text panel
        $('intuitionStepTitle').textContent = step.title;
        $('intuitionStepText').textContent = step.text;
        $('intuitionFormula').textContent = step.formula;
        $('intuitionStatus').textContent = 'Langkah ' + (intuitionStep + 1) + ' / ' + intuitionSteps.length;
    }

    /* ------------------------------------------------------------------ */
    /*  Intuition Controls                                                */
    /* ------------------------------------------------------------------ */

    function nextIntuitionStep() {
        if (intuitionStep < intuitionSteps.length - 1) { intuitionStep++; drawIntuitionCanvas(); }
    }
    function previousIntuitionStep() {
        if (intuitionStep > 0) { intuitionStep--; drawIntuitionCanvas(); }
    }
    function stopIntuitionAnimation() {
        if (intuitionTimer !== null) { clearInterval(intuitionTimer); intuitionTimer = null; }
    }
    function playIntuition() {
        stopIntuitionAnimation();
        if (intuitionStep >= intuitionSteps.length - 1) intuitionStep = 0;
        drawIntuitionCanvas();
        intuitionTimer = setInterval(() => {
            if (intuitionStep >= intuitionSteps.length - 1) { stopIntuitionAnimation(); return; }
            intuitionStep++;
            drawIntuitionCanvas();
        }, 2800);
    }
    function resetIntuition() {
        stopIntuitionAnimation();
        intuitionStep = 0;
        drawIntuitionCanvas();
    }

    $('intuitionPrev').addEventListener('click', previousIntuitionStep);
    $('intuitionNext').addEventListener('click', nextIntuitionStep);
    $('intuitionPlay').addEventListener('click', playIntuition);
    $('intuitionReset').addEventListener('click', resetIntuition);

    /* ------------------------------------------------------------------ */
    /*  Tahap 2: Comparison Chart                                         */
    /* ------------------------------------------------------------------ */

    function drawComparisonChart() {
        const canvas = $('comparisonChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.parentElement.clientWidth || 800;
        const h = canvas.parentElement.clientHeight || 420;
        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);

        const n = parseInt($('nSlider').value, 10);
        $('sliderValue').textContent = n;
        $('nValueLabel').textContent = 'n = ' + n;

        const margin = { left: 70, right: 30, top: 30, bottom: 50 };
        const pw = w - margin.left - margin.right;
        const ph = h - margin.top - margin.bottom;

        // Compute max y (cap exponential for readability)
        const rawMax = Math.max(...complexities.map(c => c.fn(n)));
        const yMax = Math.min(rawMax, n * n * 2) || 1;

        const mapX = (val) => margin.left + (val / n) * pw;
        const mapY = (val) => margin.top + ph - Math.min(val / yMax, 1.05) * ph;

        // Grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = margin.top + (i / 5) * ph;
            ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(w - margin.right, y); ctx.stroke();
            const val = yMax * (1 - i / 5);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px Arial';
            ctx.fillText(formatNum(val), 6, y + 4);
        }
        for (let i = 0; i <= 5; i++) {
            const x = margin.left + (i / 5) * pw;
            ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, h - margin.bottom); ctx.stroke();
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px Arial';
            ctx.fillText(Math.round((i / 5) * n).toString(), x - 5, h - margin.bottom + 16);
        }

        // Axes
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(margin.left, h - margin.bottom); ctx.lineTo(w - margin.right, h - margin.bottom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(margin.left, margin.top); ctx.lineTo(margin.left, h - margin.bottom); ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        ctx.fillText('n', w / 2, h - 8);

        // Curves
        complexities.forEach((comp) => {
            ctx.beginPath();
            const steps = 300;
            for (let i = 0; i <= steps; i++) {
                const xVal = (i / steps) * n;
                const yVal = comp.fn(Math.max(xVal, 0.01));
                const px = mapX(xVal);
                const py = mapY(yVal);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = comp.color;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // End dot
            const endY = mapY(comp.fn(n));
            const endX = mapX(n);
            ctx.beginPath();
            ctx.arc(endX, Math.max(margin.top, endY), 5, 0, Math.PI * 2);
            ctx.fillStyle = comp.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Build legend
        const legendEl = $('comparisonLegend');
        if (legendEl) {
            legendEl.innerHTML = complexities.map(c => {
                const ops = c.fn(n);
                return '<div class="legend-item"><span class="legend-line" style="background:' + c.color + '"></span>' +
                    c.label + ' = ' + formatNum(ops) + ' ops</div>';
            }).join('');
        }
    }

    $('nSlider').addEventListener('input', drawComparisonChart);

    /* ------------------------------------------------------------------ */
    /*  Tahap 3: Simulation Bars                                          */
    /* ------------------------------------------------------------------ */

    let simTimer = null;

    function buildBars() {
        const n = parseInt($('simSlider').value, 10);
        $('simSliderValue').textContent = n;

        const container = $('barContainer');
        container.innerHTML = '';

        const values = complexities.map(c => ({ ...c, ops: Math.round(c.fn(n)) }));
        const maxOps = Math.max(...values.map(v => v.ops), 1);

        values.forEach((v) => {
            const row = document.createElement('div');
            row.className = 'bar-row';

            const label = document.createElement('div');
            label.className = 'bar-label';
            label.textContent = v.label;
            label.style.color = v.color;

            const track = document.createElement('div');
            track.className = 'bar-track';

            const fill = document.createElement('div');
            fill.className = 'bar-fill';
            fill.style.background = v.color;
            fill.style.width = '0%';
            fill.dataset.target = Math.min((v.ops / maxOps) * 100, 100).toFixed(1);
            fill.textContent = v.alias;

            track.appendChild(fill);

            const count = document.createElement('div');
            count.className = 'bar-count';
            count.textContent = formatNum(v.ops) + ' ops';

            row.appendChild(label);
            row.appendChild(track);
            row.appendChild(count);
            container.appendChild(row);
        });
    }

    function animateBars() {
        const fills = document.querySelectorAll('.bar-fill');
        // Reset first
        fills.forEach(f => f.style.width = '0%');

        let idx = 0;
        if (simTimer) clearInterval(simTimer);
        simTimer = setInterval(() => {
            if (idx >= fills.length) { clearInterval(simTimer); simTimer = null; return; }
            fills[idx].style.width = fills[idx].dataset.target + '%';
            idx++;
        }, 250);
    }

    function resetBars() {
        if (simTimer) { clearInterval(simTimer); simTimer = null; }
        const fills = document.querySelectorAll('.bar-fill');
        fills.forEach(f => f.style.width = '0%');
    }

    $('simSlider').addEventListener('input', () => { buildBars(); });
    $('simPlay').addEventListener('click', () => { buildBars(); setTimeout(animateBars, 50); });
    $('simReset').addEventListener('click', () => { buildBars(); resetBars(); });

    /* ------------------------------------------------------------------ */
    /*  Tahap 4: Table                                                    */
    /* ------------------------------------------------------------------ */

    function buildTable() {
        const tbody = $('tableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const ns = [1, 2, 4, 8, 16, 32, 64];

        ns.forEach((n) => {
            const tr = document.createElement('tr');
            let cells = '<td>' + n + '</td>';
            complexities.forEach((c) => {
                const v = c.fn(n);
                cells += '<td>' + formatNum(v) + '</td>';
            });
            tr.innerHTML = cells;
            tbody.appendChild(tr);
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Tahap 5: Cheat Sheet                                              */
    /* ------------------------------------------------------------------ */

    function buildCheatSheet() {
        const el = $('cheatSheet');
        if (!el) return;
        el.innerHTML = cheatData.map((item) => {
            return '<div class="cheat-card" style="border-left-color: ' + item.color + ';">' +
                '<div class="cheat-name" style="color: ' + item.color + ';">' + item.label + '</div>' +
                '<div class="cheat-alias">' + item.alias + '</div>' +
                '<div class="cheat-desc">' + item.desc + '</div>' +
                '<div class="cheat-example">Contoh: ' + item.example + '</div>' +
                '</div>';
        }).join('');
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                           */
    /* ------------------------------------------------------------------ */

    function formatNum(val) {
        if (val === null || val === undefined || Number.isNaN(val)) return '-';
        if (val >= 1e9) return val.toExponential(2);
        if (val >= 1e6) return (val / 1e6).toFixed(1) + 'M';
        if (val >= 1e3) return (val / 1e3).toFixed(1) + 'K';
        if (Number.isInteger(val)) return val.toString();
        return val.toFixed(2);
    }

    /* ------------------------------------------------------------------ */
    /*  Init & resize                                                     */
    /* ------------------------------------------------------------------ */

    window.addEventListener('resize', () => {
        drawIntuitionCanvas();
        drawComparisonChart();
    });

    window.addEventListener('pageshow', (event) => {
        if (event.persisted) { window.location.reload(); }
    });

    drawIntuitionCanvas();
    drawComparisonChart();
    buildBars();
    buildTable();
    buildCheatSheet();
})();
