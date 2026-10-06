(function () {
    'use strict';

    const TOLERANCE = 1e-10;

    let data = [];
    let isValid = false;
    let minX = 0;
    let maxX = 3;
    let currentStep = 0;
    let timer = null;
    let intuitionStep = 0;
    let intuitionTimer = null;
    let intuitionData = null;

    const $ = (id) => document.getElementById(id);

    const intuitionSteps = [
        {
            title: 'Langkah 1 — Tentukan Tebakan Awal x₀',
            text: 'Metode Newton-Raphson dimulai dari satu titik tebakan awal x₀.',
            formula: 'tebakan awal = x₀'
        },
        {
            title: 'Langkah 2 — Evaluasi Nilai Fungsi f(x₀)',
            text: 'Tarik garis vertikal dari x₀ ke kurva untuk menentukan titik koordinat (x₀, f(x₀)).',
            formula: 'hitung f(x₀)'
        },
        {
            title: 'Langkah 3 — Hitung Kemiringan / Turunan f\'(x₀)',
            text: 'Hitung turunan f\'(x₀) yang mewakili gradien atau kemiringan garis singgung pada kurva di titik tersebut.',
            formula: 'f\'(x) = 2x  →  f\'(x₀) = 2x₀'
        },
        {
            title: 'Langkah 4 — Tarik Garis Singgung (Tangen) ke Sumbu-x',
            text: 'Garis singgung pada titik (x₀, f(x₀)) diproyeksikan hingga memotong sumbu-x di titik baru x₁.',
            formula: 'x₁ = x₀ - f(x₀) / f\'(x₀)'
        },
        {
            title: 'Langkah 5 — Evaluasi Titik Baru f(x₁)',
            text: 'Tarik garis vertikal dari x₁ ke kurva untuk mendapatkan titik (x₁, f(x₁)). Perhatikan bahwa x₁ sudah sangat dekat dengan akar!',
            formula: 'hitung f(x₁)'
        },
        {
            title: 'Langkah 6 — Tarik Garis Singgung Kedua di x₁',
            text: 'Buat garis singgung baru pada (x₁, f(x₁)) untuk menentukan titik potong x₂.',
            formula: 'x₂ = x₁ - f(x₁) / f\'(x₁)'
        },
        {
            title: 'Langkah 7 — Konvergensi Kuadratis Sangat Cepat',
            text: 'Hanya dalam 2-3 iterasi, titik x_n akan berimpit sempurna dengan akar sejati (√2 ≈ 1.414214).',
            formula: 'error mengecil secara kuadratis (order 2)'
        }
    ];

    function f(x) {
        return x ** 2 - 2;
    }

    function df(x) {
        return 2 * x;
    }

    function hitungNewtonRaphson(x0, maxSteps, batasSelisih) {
        const hasil = [];
        let currX = x0;

        if (!Number.isFinite(x0)) {
            return { success: false, message: 'Nilai x0 harus berupa angka yang valid.', iterations: [] };
        }

        for (let i = 1; i <= maxSteps; i++) {
            const fx = f(currX);
            const dfx = df(currX);

            if (Math.abs(dfx) < 1e-12) {
                return {
                    success: false,
                    message: 'Turunan f\'(x) bernilai mendekati nol di x = ' + format(currX) + '. Metode gagal karena pembagian dengan nol.',
                    iterations: hasil
                };
            }

            const nextX = currX - fx / dfx;
            const errorInterval = Math.abs(fx);
            const deltaC = Math.abs(nextX - currX);

            hasil.push({
                step: i,
                currX,
                fx,
                dfx,
                nextX,
                errorInterval,
                deltaC
            });

            if (Math.abs(fx) < batasSelisih || deltaC < batasSelisih) {
                break;
            }

            currX = nextX;
        }

        return { success: true, message: 'Perhitungan Newton-Raphson berhasil.', iterations: hasil };
    }

    function format(val) {
        if (val === null || val === undefined || Number.isNaN(val)) return '-';
        if (Math.abs(val) < 1e-6 && val !== 0) return val.toExponential(4);
        return val.toFixed(6).replace(/\.?0+$/, '');
    }

    function postEvent(type, payload) {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'NEWTON_RAPHSON_' + type.toUpperCase(), payload }, '*');
        }
    }

    function setControlButtonsState(disabled) {
        const ids = [
            'intuitionPrev', 'intuitionNext', 'intuitionPlay', 'intuitionReset',
            'stepPrev', 'stepNext', 'stepPlay', 'stepPause', 'stepReset'
        ];
        ids.forEach((id) => {
            const el = $(id);
            if (el) el.disabled = disabled;
        });
    }

    function toggleError(show, message = '') {
        const box = $('errorBox');
        if (!box) return;
        if (show) {
            box.textContent = message;
            box.classList.remove('is-hidden');
        } else {
            box.textContent = '';
            box.classList.add('is-hidden');
        }
    }

    function processFormInput() {
        pauseAnimation();
        stopIntuitionAnimation();

        const x0Val = parseFloat($('x0').value);
        const stepVal = parseInt($('step').value, 10) || 10;

        toggleError(false);

        const res = hitungNewtonRaphson(x0Val, stepVal, TOLERANCE);
        if (!res.success && res.iterations.length === 0) {
            isValid = false;
            data = [];
            currentStep = 0;
            intuitionStep = 0;
            intuitionData = null;
            toggleError(true, res.message);
            updateSummary();
            renderTable();
            renderChart();
            renderStep();
            updateIntuition();
            setControlButtonsState(true);
            return;
        }

        isValid = true;
        data = res.iterations;
        minX = Math.min(0, x0Val - 0.5);
        maxX = Math.max(2.5, x0Val + 0.5);
        currentStep = 0;
        intuitionStep = 0;
        intuitionData = data.length > 0 ? data[0] : null;

        setControlButtonsState(false);
        updateSummary();
        renderTable();
        renderChart();
        renderStep();
        updateIntuition();

        postEvent('calculated', { x0: x0Val, steps: data.length });
    }

    function updateSummary() {
        const box = $('formulaSummary');
        if (!box) return;
        if (!isValid || data.length === 0) {
            box.innerHTML = 'Masukkan nilai x₀ valid untuk melihat simulasi Newton-Raphson.';
            return;
        }
        const last = data[data.length - 1];
        box.innerHTML = 'Fungsi: <strong>f(x) = x² - 2</strong> | Turunan: <strong>f\'(x) = 2x</strong> | Rumus: <strong>xₙ₊₁ = xₙ - f(xₙ)/f\'(xₙ)</strong> | Hasil akhir x: <strong>' + format(last.nextX) + '</strong> (f(x) = ' + format(f(last.nextX)) + ') pada iterasi ke-' + data.length + '.';
    }

    function getIntuitionBounds() {
        if (!intuitionData) return { xMin: -0.5, xMax: 2.5, yMin: -2.5, yMax: 3.5 };
        const item = intuitionData;
        const xMin = Math.min(-0.5, item.currX - 0.8);
        const xMax = Math.max(2.5, item.currX + 0.8);
        return { xMin, xMax, yMin: -2.5, yMax: 3.5 };
    }

    function drawIntuitionPoint(ctx, x, y, color, label) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(label, x + 8, y - 8);
    }

    function drawIntuitionDashedLine(ctx, x1, y1, x2, y2, color) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    function updateIntuition() {
        const canvas = $('nrIntuitionCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth || 800;
        const height = canvas.parentElement.clientHeight || 360;
        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        if (!isValid || !intuitionData) {
            $('intuitionStepTitle').textContent = 'Intuisi belum dapat dijalankan';
            $('intuitionStepText').textContent = 'Masukkan nilai x₀ valid terlebih dahulu.';
            $('intuitionFormula').textContent = 'x₀ valid';
            $('intuitionStatus').textContent = 'Belum valid';
            return;
        }

        const item = intuitionData;
        const bounds = getIntuitionBounds();
        const margin = { left: 60, right: 30, top: 30, bottom: 50 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;
        const mapX = (x) => margin.left + ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * plotWidth;
        const mapY = (y) => margin.top + ((bounds.yMax - y) / (bounds.yMax - bounds.yMin)) * plotHeight;
        const xAxisY = mapY(0);

        // Grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 6; i++) {
            const x = margin.left + (i / 6) * plotWidth;
            ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, height - margin.bottom); ctx.stroke();
        }
        for (let i = 0; i <= 5; i++) {
            const y = margin.top + (i / 5) * plotHeight;
            ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(width - margin.right, y); ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        if (xAxisY >= margin.top && xAxisY <= height - margin.bottom) {
            ctx.beginPath(); ctx.moveTo(margin.left, xAxisY); ctx.lineTo(width - margin.right, xAxisY); ctx.stroke();
        }
        const zeroX = mapX(0);
        if (zeroX >= margin.left && zeroX <= width - margin.right) {
            ctx.beginPath(); ctx.moveTo(zeroX, margin.top); ctx.lineTo(zeroX, height - margin.bottom); ctx.stroke();
        }

        // Curve f(x) = x^2 - 2
        ctx.beginPath();
        for (let i = 0; i <= 400; i++) {
            const x = bounds.xMin + (i / 400) * (bounds.xMax - bounds.xMin);
            const px = mapX(x);
            const py = mapY(f(x));
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        const x0px = mapX(item.currX);
        const y0px = mapY(item.fx);
        const x1px = mapX(item.nextX);
        const y1px = mapY(f(item.nextX));

        // Step 0: Initial point x0
        drawIntuitionPoint(ctx, x0px, xAxisY, '#ef4444', 'x₀');

        if (intuitionStep >= 1) {
            // Vertical line to curve
            drawIntuitionDashedLine(ctx, x0px, xAxisY, x0px, y0px, '#ef4444');
            drawIntuitionPoint(ctx, x0px, y0px, '#ef4444', '(x₀, f(x₀))');
        }

        if (intuitionStep >= 2) {
            // Highlight slope text / derivative
            ctx.fillStyle = '#b45309';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('f\'(x₀) = ' + format(item.dfx), x0px + 12, y0px + 15);
        }

        if (intuitionStep >= 3) {
            // Draw Tangent line extending past x1
            const tangentXStart = bounds.xMin;
            const tangentYStart = item.fx + item.dfx * (tangentXStart - item.currX);
            const tangentXEnd = bounds.xMax;
            const tangentYEnd = item.fx + item.dfx * (tangentXEnd - item.currX);

            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(mapX(tangentXStart), mapY(tangentYStart));
            ctx.lineTo(mapX(tangentXEnd), mapY(tangentYEnd));
            ctx.stroke();

            // Point x1 on x-axis
            drawIntuitionPoint(ctx, x1px, xAxisY, '#f59e0b', 'x₁');
        }

        if (intuitionStep >= 4) {
            // Vertical line from x1 to curve
            drawIntuitionDashedLine(ctx, x1px, xAxisY, x1px, y1px, '#f59e0b');
            drawIntuitionPoint(ctx, x1px, y1px, '#f59e0b', '(x₁, f(x₁))');
        }

        if (intuitionStep >= 5 && data.length > 1) {
            const item2 = data[1];
            const x2px = mapX(item2.nextX);

            // Draw Tangent line 2
            const tangent2XStart = bounds.xMin;
            const tangent2YStart = item2.fx + item2.dfx * (tangent2XStart - item2.currX);
            const tangent2XEnd = bounds.xMax;
            const tangent2YEnd = item2.fx + item2.dfx * (tangent2XEnd - item2.currX);

            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(mapX(tangent2XStart), mapY(tangent2YStart));
            ctx.lineTo(mapX(tangent2XEnd), mapY(tangent2YEnd));
            ctx.stroke();

            drawIntuitionPoint(ctx, x2px, xAxisY, '#0284c7', 'x₂');
        }

        if (intuitionStep >= 6) {
            ctx.fillStyle = '#334155';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('Metode Newton-Raphson menggunakan garis singgung (tangen) untuk konvergensi sangat cepat!', margin.left + 10, margin.top + 20);
        }

        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        ctx.fillText('f(x) = x² - 2', Math.max(margin.left, width - margin.right - 105), margin.top + 16);

        const step = intuitionSteps[intuitionStep];
        $('intuitionStepTitle').textContent = step.title;
        $('intuitionStepText').textContent = step.text;
        $('intuitionFormula').textContent = step.formula;
        $('intuitionStatus').textContent = 'Langkah ' + (intuitionStep + 1) + ' / ' + intuitionSteps.length;
    }

    function nextIntuitionStep() {
        if (!isValid) return;
        if (intuitionStep < intuitionSteps.length - 1) {
            intuitionStep++;
            updateIntuition();
        }
    }

    function previousIntuitionStep() {
        if (!isValid) return;
        if (intuitionStep > 0) {
            intuitionStep--;
            updateIntuition();
        }
    }

    function stopIntuitionAnimation() {
        if (intuitionTimer !== null) {
            clearInterval(intuitionTimer);
            intuitionTimer = null;
        }
    }

    function playIntuition() {
        if (!isValid) return;
        stopIntuitionAnimation();
        if (intuitionStep >= intuitionSteps.length - 1) intuitionStep = 0;
        updateIntuition();
        intuitionTimer = setInterval(() => {
            if (intuitionStep >= intuitionSteps.length - 1) {
                stopIntuitionAnimation();
                return;
            }
            intuitionStep++;
            updateIntuition();
        }, 2200);
    }

    function resetIntuition() {
        stopIntuitionAnimation();
        intuitionStep = 0;
        updateIntuition();
    }

    function renderStep() {
        if (!isValid || data.length === 0) {
            $('iterationCounter').textContent = 'Iterasi 0';
            $('valueCurr').textContent = '-';
            $('valueDeriv').textContent = '-';
            $('valueNext').textContent = '-';
            $('errorInterval').textContent = '-';
            $('errorC').textContent = '-';
            $('decision').textContent = 'Belum ada data iterasi.';
            $('activeInterval').style.width = '0%';
            return;
        }

        const item = data[currentStep];
        $('iterationCounter').textContent = 'Iterasi ' + item.step + ' / ' + data.length;
        $('valueCurr').innerHTML = format(item.currX) + ' <small>(f(x)=' + format(item.fx) + ')</small>';
        $('valueDeriv').innerHTML = format(item.dfx);
        $('valueNext').innerHTML = format(item.nextX) + ' <small>(f(xₙ₊₁)=' + format(f(item.nextX)) + ')</small>';

        $('errorInterval').textContent = format(item.errorInterval);
        $('errorC').textContent = format(item.deltaC);

        $('decision').innerHTML = '<strong>Evaluasi Garis Singgung:</strong> Gradien f\'(' + format(item.currX) + ') = ' + format(item.dfx) +
            '. Perpotongan garis singgung dengan sumbu-x memberikan nilai x baru = <strong>' + format(item.nextX) + '</strong>.';

        const span = maxX - minX || 1;
        const currPercent = Math.max(0, Math.min(100, ((item.currX - minX) / span) * 100));
        const nextPercent = Math.max(0, Math.min(100, ((item.nextX - minX) / span) * 100));

        $('pointCurr').style.left = currPercent + '%';
        $('pointNext').style.left = nextPercent + '%';

        $('labelCurr').style.left = currPercent + '%';
        $('labelCurr').textContent = 'xₙ=' + format(item.currX);
        $('labelNext').style.left = nextPercent + '%';
        $('labelNext').textContent = 'xₙ₊₁=' + format(item.nextX);

        $('axisStart').textContent = format(minX);
        $('axisEnd').textContent = format(maxX);

        const activeInterval = $('activeInterval');
        activeInterval.style.left = Math.min(currPercent, nextPercent) + '%';
        activeInterval.style.width = Math.abs(nextPercent - currPercent) + '%';

        updateTableHighlight();
        renderChart();
        postEvent('step_changed', { step: item.step, x: item.currX, fx: item.fx });
    }

    function renderTable() {
        const tbody = $('iterationTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!isValid || data.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Tidak ada data untuk ditampilkan.</td></tr>';
            return;
        }

        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.id = 'row-step-' + index;
            tr.innerHTML = `
                <td>${row.step}</td>
                <td>${format(row.currX)}</td>
                <td>${format(row.fx)}</td>
                <td>${format(row.dfx)}</td>
                <td>${format(row.nextX)}</td>
                <td>${format(row.errorInterval)}</td>
                <td>${format(row.deltaC)}</td>
            `;
            tbody.appendChild(tr);
        });
        updateTableHighlight();
    }

    function updateTableHighlight() {
        if (!data || data.length === 0) return;
        data.forEach((_, index) => {
            const tr = $('row-step-' + index);
            if (tr) {
                if (index === currentStep) tr.classList.add('active-row');
                else tr.classList.remove('active-row');
            }
        });
    }

    function renderChart() {
        const canvas = $('errorChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth || 800;
        const height = canvas.parentElement.clientHeight || 360;
        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        if (!isValid || data.length === 0) {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Arial';
            ctx.fillText('Grafik konvergensi error akan tampil di sini setelah data valid.', 30, height / 2);
            return;
        }

        const margin = { left: 60, right: 30, top: 25, bottom: 40 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        const maxError = Math.max(...data.map(d => Math.max(d.errorInterval, d.deltaC)), 1e-6);
        const stepsCount = data.length;

        // Grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = margin.top + (i / 4) * plotHeight;
            ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(width - margin.right, y); ctx.stroke();
            const val = maxError * (1 - i / 4);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px Arial';
            ctx.fillText(format(val), 8, y + 4);
        }

        const getX = (idx) => margin.left + (stepsCount > 1 ? (idx / (stepsCount - 1)) * plotWidth : plotWidth / 2);
        const getY = (val) => margin.top + (1 - val / maxError) * plotHeight;

        // Background dashed full reference line
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;

        ctx.beginPath();
        data.forEach((d, idx) => {
            const px = getX(idx), py = getY(d.errorInterval);
            if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();

        ctx.beginPath();
        data.forEach((d, idx) => {
            const px = getX(idx), py = getY(d.deltaC);
            if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();

        const visibleData = data.slice(0, currentStep + 1);

        // Active lines
        if (visibleData.length > 0) {
            ctx.beginPath();
            visibleData.forEach((d, idx) => {
                const px = getX(idx), py = getY(d.errorInterval);
                if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            visibleData.forEach((d, idx) => {
                const px = getX(idx), py = getY(d.deltaC);
                if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }

        // Dots & Labels
        data.forEach((d, idx) => {
            const px = getX(idx);
            const isVisible = idx <= currentStep;
            const isCurrent = idx === currentStep;

            ctx.beginPath();
            ctx.arc(px, getY(d.errorInterval), isCurrent ? 7 : (isVisible ? 4 : 3), 0, Math.PI * 2);
            ctx.fillStyle = isVisible ? '#2563eb' : '#94a3b8';
            ctx.fill();
            if (isCurrent) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke(); }

            ctx.beginPath();
            ctx.arc(px, getY(d.deltaC), isCurrent ? 6 : (isVisible ? 3 : 2), 0, Math.PI * 2);
            ctx.fillStyle = isVisible ? '#f59e0b' : '#cbd5e1';
            ctx.fill();
            if (isCurrent) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke(); }

            ctx.fillStyle = isCurrent ? '#0f4c81' : '#64748b';
            ctx.font = isCurrent ? 'bold 12px Arial' : '11px Arial';
            ctx.fillText('i=' + d.step, px - 8, height - 12);
        });
    }

    function nextStep() {
        if (!isValid || data.length === 0) return;
        if (currentStep < data.length - 1) {
            currentStep++;
            renderStep();
        }
    }

    function previousStep() {
        if (!isValid || data.length === 0) return;
        if (currentStep > 0) {
            currentStep--;
            renderStep();
        }
    }

    function pauseAnimation() {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
    }

    function playAnimation() {
        if (!isValid || data.length === 0) return;
        pauseAnimation();
        if (currentStep >= data.length - 1) currentStep = 0;
        renderStep();
        timer = setInterval(() => {
            if (currentStep >= data.length - 1) {
                pauseAnimation();
                return;
            }
            currentStep++;
            renderStep();
        }, 1200);
    }

    function resetAnimation() {
        pauseAnimation();
        currentStep = 0;
        renderStep();
    }

    $('nrForm').addEventListener('submit', (e) => {
        e.preventDefault();
        processFormInput();
    });

    $('intuitionPrev').addEventListener('click', previousIntuitionStep);
    $('intuitionNext').addEventListener('click', nextIntuitionStep);
    $('intuitionPlay').addEventListener('click', playIntuition);
    $('intuitionReset').addEventListener('click', resetIntuition);

    $('stepPrev').addEventListener('click', previousStep);
    $('stepNext').addEventListener('click', nextStep);
    $('stepPlay').addEventListener('click', playAnimation);
    $('stepPause').addEventListener('click', pauseAnimation);
    $('stepReset').addEventListener('click', resetAnimation);

    window.addEventListener('resize', () => {
        updateIntuition();
        renderChart();
    });

    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            window.location.reload();
        }
    });

    processFormInput();
})();
