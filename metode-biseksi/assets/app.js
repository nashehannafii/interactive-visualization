(function () {
    'use strict';

    const TOLERANCE = 1e-10;

    let data = [];
    let isValid = false;
    let minX = 0;
    let maxX = 2;
    let currentStep = 0;
    let timer = null;
    let intuitionStep = 0;
    let intuitionTimer = null;
    let intuitionData = null;

    const $ = (id) => document.getElementById(id);

    const intuitionSteps = [
        {
            title: 'Langkah 1 — Cari perubahan tanda (Interval 1)',
            text: 'Metode biseksi dimulai dari interval pertama [a₁, b₁] dengan f(a₁) dan f(b₁) berlainan tanda. secara geometris, kurva berada pada sisi berbeda dari sumbu-x.',
            formula: 'f(a₁) × f(b₁) < 0'
        },
        {
            title: 'Langkah 2 — Ambil titik tengah c₁ (Interval 1)',
            text: 'Membagi interval pertama [a₁, b₁] menjadi dua bagian sama panjang. Titik pembaginya adalah c₁.',
            formula: 'c₁ = (a₁ + b₁) / 2'
        },
        {
            title: 'Langkah 3 — Evaluasi f(c₁)',
            text: 'Hitung nilai f(c₁) dan periksa tandanya terhadap f(a₁) dan f(b₁).',
            formula: 'hitung f(c₁)'
        },
        {
            title: 'Langkah 4 — Potong ke Interval 2',
            text: 'Pilih setengah interval yang mengapit akar sebagai interval baru [a₂, b₂]. Setengah interval yang tidak mengapit akar dibuang.',
            formula: 'f(a₁)f(c₁) < 0 → [a₂, b₂] = [a₁, c₁] | selain itu → [a₂, b₂] = [c₁, b₁]'
        },
        {
            title: 'Langkah 5 — Titik tengah c₂ (Interval 2)',
            text: 'Prosedur diulangi pada interval kedua [a₂, b₂]. Hitung titik tengah baru c₂.',
            formula: 'c₂ = (a₂ + b₂) / 2'
        },
        {
            title: 'Langkah 6 — Evaluasi f(c₂) & Potong ke Interval 3',
            text: 'Evaluasi nilai f(c₂), lalu persempit kembali interval menjadi interval ketiga [a₃, b₃].',
            formula: 'f(a₂)f(c₂) < 0 → [a₃, b₃] = [a₂, c₂] | selain itu → [a₃, b₃] = [c₂, b₂]'
        },
        {
            title: 'Langkah 7 — Ketidakpastian terus dibelah dua',
            text: 'Setelah 2 iterasi (2 interval), lebar pencarian berkurang menjadi seperempat dari lebar awal. Batas error terus mengecil secara teratur.',
            formula: 'error (iterasi 2) ≤ |b₁ - a₁| / 4'
        }
    ];

    function f(x) {
        return x ** 2 - 2;
    }

    function hitungBiseksi(a, b, step, batasSelisih) {
        const hasil = [];
        let cSebelumnya = null;
        let fa = f(a);
        let fb = f(b);

        if (!Number.isFinite(a) || !Number.isFinite(b)) {
            return { success: false, message: 'Nilai a dan b harus berupa angka yang valid.', iterations: [] };
        }

        if (a >= b) {
            return { success: false, message: 'Nilai a harus lebih kecil dari b.', iterations: [] };
        }

        if (Math.abs(fa) < batasSelisih) {
            return {
                success: true,
                message: null,
                iterations: [{
                    iterasi: 0, a: a, b: b, c: a,
                    fa: fa, fb: fb, fc: fa,
                    error_interval: 0, error_c: null
                }]
            };
        }

        if (Math.abs(fb) < batasSelisih) {
            return {
                success: true,
                message: null,
                iterations: [{
                    iterasi: 0, a: a, b: b, c: b,
                    fa: fa, fb: fb, fc: fb,
                    error_interval: 0, error_c: null
                }]
            };
        }

        if (fa * fb > 0) {
            return {
                success: false,
                message: 'Interval [' + format(a) + ', ' + format(b) + '] tidak memenuhi syarat awal biseksi karena f(a) = ' + format(fa) + ' dan f(b) = ' + format(fb) + ' bertanda sama. Metode biseksi klasik membutuhkan f(a) × f(b) < 0.',
                iterations: []
            };
        }

        for (let i = 1; i <= step; i++) {
            const c = (a + b) / 2;
            fa = f(a);
            fb = f(b);
            const fc = f(c);
            const errorInterval = Math.abs(b - a) / 2;
            const errorC = cSebelumnya === null ? null : Math.abs(c - cSebelumnya);

            hasil.push({
                iterasi: i,
                a: a,
                b: b,
                c: c,
                fa: fa,
                fb: fb,
                fc: fc,
                error_interval: errorInterval,
                error_c: errorC
            });

            if (Math.abs(fc) < batasSelisih) {
                break;
            }

            if (fa * fc < 0) {
                b = c;
            } else {
                a = c;
            }

            cSebelumnya = c;
        }

        return { success: true, message: null, iterations: hasil };
    }

    function format(value) {
        if (value === null || value === undefined || !Number.isFinite(Number(value))) {
            return '-';
        }
        return Number(value).toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
    }

    function hasData() {
        return isValid && Array.isArray(data) && data.length > 0;
    }

    function postEvent(event, payload) {
        try {
            window.parent.postMessage({
                source: 'materi-interaktif',
                event: event,
                data: payload || {}
            }, '*');
        } catch (e) {
            // Materi tetap berjalan meski tidak berada di dalam host runtime.
        }
    }

    function setControlState() {
        const enabled = hasData();
        ['intuitionPrev', 'intuitionNext', 'intuitionPlay', 'intuitionReset', 'stepPrev', 'stepNext', 'stepPlay', 'stepPause', 'stepReset']
            .forEach((id) => { $(id).disabled = !enabled; });
    }

    function showError(message) {
        $('errorBox').textContent = message;
        $('errorBox').classList.remove('is-hidden');
    }

    function hideError() {
        $('errorBox').textContent = '';
        $('errorBox').classList.add('is-hidden');
    }

    function calculate() {
        pauseAnimation();
        stopIntuition();

        const a = Number($('a').value);
        const b = Number($('b').value);
        const step = Math.max(1, Math.min(100, parseInt($('step').value, 10) || 10));
        $('step').value = String(step);

        minX = a;
        maxX = b;

        const result = hitungBiseksi(a, b, step, TOLERANCE);
        isValid = result.success;
        data = result.iterations;
        currentStep = 0;
        intuitionStep = 0;
        intuitionData = data.length > 0 ? data[0] : null;

        $('formulaSummary').innerHTML = 'Fungsi <strong>f(x) = x² - 2</strong>, interval awal <strong>[' + format(a) + ', ' + format(b) + ']</strong>, maksimum <strong>' + step + ' iterasi</strong>.';
        $('axisStart').textContent = format(a);
        $('axisEnd').textContent = format(b);

        if (!result.success) {
            showError(result.message);
            $('decision').textContent = 'Pilih interval dengan f(a) dan f(b) berlainan tanda untuk menjalankan animasi.';
        } else {
            hideError();
        }

        renderIterationTable();
        setControlState();
        drawBisectionIntuition();

        if (hasData()) {
            showStep(0);
            postEvent('progress', { progress: 10 });
        } else {
            clearIterationView();
            drawErrorChart();
        }
    }

    function clearIterationView() {
        $('valueA').textContent = '-';
        $('valueB').textContent = '-';
        $('valueC').textContent = '-';
        $('errorInterval').textContent = '-';
        $('errorC').textContent = '-';
        $('iterationCounter').textContent = 'Tidak tersedia';
        $('activeInterval').style.width = '0';
        ['pointA', 'pointB', 'pointC', 'labelA', 'labelB', 'labelC'].forEach((id) => {
            $(id).style.display = 'none';
        });
    }

    function renderIterationTable() {
        const tbody = $('iterationTableBody');
        tbody.innerHTML = '';

        if (!data.length) {
            const tr = document.createElement('tr');
            tr.className = 'empty-row';
            const td = document.createElement('td');
            td.colSpan = 9;
            td.textContent = 'Tidak ada iterasi karena interval belum memenuhi syarat awal biseksi.';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        data.forEach((row) => {
            const tr = document.createElement('tr');
            tr.id = 'row-' + row.iterasi;
            const values = [
                row.iterasi,
                format(row.a),
                format(row.b),
                format(row.c),
                format(row.fa),
                format(row.fb),
                format(row.fc),
                format(row.error_interval),
                row.error_c === null ? '-' : format(row.error_c)
            ];
            values.forEach((value) => {
                const td = document.createElement('td');
                td.textContent = value;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    function getPosition(x) {
        if (maxX === minX) return 0;
        return ((x - minX) / (maxX - minX)) * 100;
    }

    function showStep(index) {
        if (!hasData() || index < 0 || index >= data.length) return;

        currentStep = index;
        const item = data[index];
        const posA = getPosition(item.a);
        const posB = getPosition(item.b);
        const posC = getPosition(item.c);

        ['pointA', 'pointB', 'pointC', 'labelA', 'labelB', 'labelC'].forEach((id) => {
            $(id).style.display = '';
        });

        $('pointA').style.left = posA + '%';
        $('pointB').style.left = posB + '%';
        $('pointC').style.left = posC + '%';
        $('labelA').style.left = posA + '%';
        $('labelB').style.left = posB + '%';
        $('labelC').style.left = posC + '%';
        $('labelA').textContent = 'a = ' + format(item.a);
        $('labelB').textContent = 'b = ' + format(item.b);
        $('labelC').textContent = 'c = ' + format(item.c);
        $('activeInterval').style.left = posA + '%';
        $('activeInterval').style.width = Math.max(0, posB - posA) + '%';
        $('iterationCounter').textContent = 'Iterasi ' + item.iterasi + ' / ' + data.length;
        $('valueA').innerHTML = format(item.a) + '<br><small>f(a) = ' + format(item.fa) + '</small>';
        $('valueB').innerHTML = format(item.b) + '<br><small>f(b) = ' + format(item.fb) + '</small>';
        $('valueC').innerHTML = format(item.c) + '<br><small>f(c) = ' + format(item.fc) + '</small>';
        $('errorInterval').textContent = format(item.error_interval);
        $('errorC').textContent = item.error_c === null ? 'Belum tersedia' : format(item.error_c);

        let decision = '';
        if (Math.abs(item.fc) < TOLERANCE) {
            decision = 'f(c) sudah sangat dekat dengan 0. Akar ditemukan di sekitar c = ' + format(item.c) + '.';
        } else if (item.fa * item.fc < 0) {
            decision = 'f(a) × f(c) < 0 → akar berada pada interval [a, c]. Pada iterasi berikutnya, b digeser ke posisi c.';
        } else {
            decision = 'f(c) × f(b) < 0 → akar berada pada interval [c, b]. Pada iterasi berikutnya, a digeser ke posisi c.';
        }
        $('decision').textContent = decision;

        document.querySelectorAll('#iterationTableBody tr').forEach((row) => row.classList.remove('active-row'));
        const activeRow = $('row-' + item.iterasi);
        if (activeRow) activeRow.classList.add('active-row');

        drawErrorChart();
        const progress = Math.min(95, 20 + Math.round(((index + 1) / data.length) * 70));
        postEvent('progress', { progress: progress, iteration: item.iterasi });

        if (index === data.length - 1) {
            postEvent('complete', { progress: 100 });
        }
    }

    function nextStep() {
        if (hasData() && currentStep < data.length - 1) showStep(currentStep + 1);
    }

    function previousStep() {
        if (hasData() && currentStep > 0) showStep(currentStep - 1);
    }

    function playAnimation() {
        if (!hasData()) return;
        pauseAnimation();
        timer = setInterval(() => {
            if (currentStep >= data.length - 1) {
                pauseAnimation();
                postEvent('complete', { progress: 100 });
                return;
            }
            nextStep();
        }, 1400);
    }

    function pauseAnimation() {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
    }

    function resetAnimation() {
        if (!hasData()) return;
        pauseAnimation();
        currentStep = 0;
        showStep(0);
    }

    function getIntuitionBounds() {
        const span = Math.max(Math.abs(maxX - minX), 1);
        const xPadding = span * 0.15;
        const xMin = minX - xPadding;
        const xMax = maxX + xPadding;
        const yValues = [0];

        for (let i = 0; i <= 180; i++) {
            const x = xMin + (i / 180) * (xMax - xMin);
            yValues.push(f(x));
        }

        let yMin = Math.min.apply(null, yValues);
        let yMax = Math.max.apply(null, yValues);
        let ySpan = yMax - yMin;
        if (ySpan < 1) ySpan = 1;
        yMin -= ySpan * 0.12;
        yMax += ySpan * 0.12;
        return { xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax };
    }

    function drawIntuitionPoint(ctx, x, y, color, label) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        if (label) {
            ctx.fillStyle = color;
            ctx.font = 'bold 13px Arial';
            ctx.fillText(label, x + 9, y - 9);
        }
    }

    function drawIntuitionDashedLine(ctx, x1, y1, x2, y2, color) {
        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    function drawBisectionIntuition() {
        const canvas = $('bisectionIntuitionCanvas');
        const container = canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(280, container.clientWidth);
        const height = Math.max(240, container.clientHeight);

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        if (!hasData()) {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Intuisi belum tersedia karena interval tidak memenuhi syarat biseksi.', width / 2, height / 2);
            $('intuitionStepTitle').textContent = 'Intuisi belum dapat dijalankan';
            $('intuitionStepText').textContent = 'Masukkan interval dengan f(a) × f(b) < 0 terlebih dahulu.';
            $('intuitionFormula').textContent = 'f(a) × f(b) harus < 0';
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

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        if (xAxisY >= margin.top && xAxisY <= height - margin.bottom) {
            ctx.beginPath(); ctx.moveTo(margin.left, xAxisY); ctx.lineTo(width - margin.right, xAxisY); ctx.stroke();
        }
        const zeroX = mapX(0);
        if (zeroX >= margin.left && zeroX <= width - margin.right) {
            ctx.beginPath(); ctx.moveTo(zeroX, margin.top); ctx.lineTo(zeroX, height - margin.bottom); ctx.stroke();
        }

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

        const ax = mapX(item.a), bx = mapX(item.b), cx = mapX(item.c);
        const ay = mapY(item.fa), by = mapY(item.fb), cy = mapY(item.fc);
        const keepLeft = item.fa * item.fc < 0;
        const keepStart = keepLeft ? ax : cx;
        const keepEnd = keepLeft ? cx : bx;
        const discardStart = keepLeft ? cx : ax;
        const discardEnd = keepLeft ? bx : cx;

        ctx.fillStyle = 'rgba(37, 99, 235, .08)';
        ctx.fillRect(Math.min(ax, bx), margin.top, Math.abs(bx - ax), plotHeight);
        drawIntuitionDashedLine(ctx, ax, ay, ax, xAxisY, '#ef4444');
        drawIntuitionDashedLine(ctx, bx, by, bx, xAxisY, '#16a34a');
        drawIntuitionPoint(ctx, ax, ay, '#ef4444', 'A');
        drawIntuitionPoint(ctx, bx, by, '#16a34a', 'B');

        if (intuitionStep >= 1) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx, margin.top); ctx.lineTo(cx, height - margin.bottom); ctx.stroke();
            drawIntuitionPoint(ctx, cx, xAxisY, '#f59e0b', 'c₁');
        }
        if (intuitionStep >= 2) {
            drawIntuitionDashedLine(ctx, cx, cy, cx, xAxisY, '#f59e0b');
            drawIntuitionPoint(ctx, cx, cy, '#f59e0b', 'f(c₁)');
        }
        if (intuitionStep >= 3) {
            ctx.fillStyle = 'rgba(34, 197, 94, .14)';
            ctx.fillRect(Math.min(keepStart, keepEnd), margin.top, Math.abs(keepEnd - keepStart), plotHeight);
            ctx.fillStyle = 'rgba(239, 68, 68, .08)';
            ctx.fillRect(Math.min(discardStart, discardEnd), margin.top, Math.abs(discardEnd - discardStart), plotHeight);
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(keepStart, xAxisY); ctx.lineTo(keepEnd, xAxisY); ctx.stroke();
        }
        if (intuitionStep >= 4 && data.length > 1) {
            const next = data[1];
            const nextA = mapX(next.a), nextB = mapX(next.b), nextC = mapX(next.c);
            ctx.save();
            ctx.setLineDash([8, 5]);
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(nextA, xAxisY + 28); ctx.lineTo(nextB, xAxisY + 28); ctx.stroke();
            ctx.restore();
            drawIntuitionPoint(ctx, nextC, xAxisY + 28, '#f59e0b', 'c₂');
        }
        if (intuitionStep >= 5 && data.length > 1) {
            const next = data[1];
            const nextC = mapX(next.c), nextCy = mapY(next.fc);
            drawIntuitionDashedLine(ctx, nextC, nextCy, nextC, xAxisY + 28, '#2563eb');
            drawIntuitionPoint(ctx, nextC, nextCy, '#2563eb', 'f(c₂)');
        }
        if (intuitionStep >= 6) {
            ctx.fillStyle = '#334155';
            ctx.font = 'bold 14px Arial';
            const initialWidth = Math.abs(item.b - item.a);
            ctx.fillText('Lebar awal = ' + format(initialWidth) + ' → Lebar (Iterasi 2) = ' + format(initialWidth / 4), margin.left + 10, margin.top + 20);
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
        if (!hasData()) return;
        if (intuitionStep < intuitionSteps.length - 1) {
            intuitionStep++;
            drawBisectionIntuition();
            postEvent('progress', { progress: 15 + Math.round(((intuitionStep + 1) / intuitionSteps.length) * 20) });
        }
    }

    function previousIntuitionStep() {
        if (!hasData()) return;
        if (intuitionStep > 0) {
            intuitionStep--;
            drawBisectionIntuition();
        }
    }

    function stopIntuition() {
        if (intuitionTimer !== null) {
            clearInterval(intuitionTimer);
            intuitionTimer = null;
        }
    }

    function playIntuition() {
        if (!hasData()) return;
        stopIntuition();
        intuitionTimer = setInterval(() => {
            if (intuitionStep >= intuitionSteps.length - 1) {
                stopIntuition();
                return;
            }
            nextIntuitionStep();
        }, 1800);
    }

    function resetIntuition() {
        if (!hasData()) return;
        stopIntuition();
        intuitionStep = 0;
        drawBisectionIntuition();
    }

    function drawErrorChart() {
        const canvas = $('errorChart');
        const container = canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(280, container.clientWidth);
        const height = Math.max(240, container.clientHeight);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        if (!hasData()) {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Grafik belum tersedia karena interval tidak memenuhi syarat biseksi.', width / 2, height / 2);
            return;
        }

        const visibleData = data.slice(0, currentStep + 1);
        const margin = { left: 70, right: 30, top: 25, bottom: 50 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;
        const allErrors = [];
        data.forEach((item) => {
            allErrors.push(Number(item.error_interval));
            if (item.error_c !== null) allErrors.push(Number(item.error_c));
        });
        const maxError = Math.max.apply(null, allErrors.concat([1e-12]));
        const getX = (index) => data.length === 1 ? margin.left + plotWidth / 2 : margin.left + (index / (data.length - 1)) * plotWidth;
        const getY = (value) => margin.top + (1 - value / maxError) * plotHeight;

        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= 5; i++) {
            const ratio = i / 5;
            const y = margin.top + ratio * plotHeight;
            const value = maxError * (1 - ratio);
            ctx.beginPath(); ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.moveTo(margin.left, y); ctx.lineTo(width - margin.right, y); ctx.stroke();
            ctx.fillStyle = '#64748b'; ctx.fillText(value.toFixed(4), margin.left - 10, y);
        }

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(margin.left, margin.top); ctx.lineTo(margin.left, height - margin.bottom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(margin.left, height - margin.bottom); ctx.lineTo(width - margin.right, height - margin.bottom); ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        data.forEach((item, index) => {
            ctx.fillStyle = '#64748b';
            ctx.fillText(item.iterasi, getX(index), height - margin.bottom + 10);
        });
        ctx.fillStyle = '#334155';
        ctx.font = '13px Arial';
        ctx.fillText('Iterasi', margin.left + plotWidth / 2, height - 15);

        ctx.save();
        ctx.translate(18, margin.top + plotHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Error', 0, 0);
        ctx.restore();

        function drawSeries(key, color) {
            let started = false;
            ctx.beginPath();
            visibleData.forEach((item, index) => {
                const value = item[key];
                if (value === null || value === undefined) return;
                const x = getX(index), y = getY(Number(value));
                if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
            });
            ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
            visibleData.forEach((item, index) => {
                const value = item[key];
                if (value === null || value === undefined) return;
                const x = getX(index), y = getY(Number(value));
                ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
                if (index === currentStep) {
                    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
                }
            });
        }

        drawSeries('error_interval', '#2563eb');
        drawSeries('error_c', '#f59e0b');
    }

    $('bisectionForm').addEventListener('submit', (event) => {
        event.preventDefault();
        calculate();
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
        drawBisectionIntuition();
        drawErrorChart();
    });

    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            window.location.reload();
        }
    });

    postEvent('ready', { title: 'Metode Biseksi' });
    calculate();
}());
