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
            text: 'Metode Regula Falsi dimulai dari interval [a₁, b₁] di mana f(a₁) dan f(b₁) berlainan tanda.',
            formula: 'f(a₁) × f(b₁) < 0'
        },
        {
            title: 'Langkah 2 — Tarik Garis Sekan dari (a₁, f(a₁)) ke (b₁, f(b₁))',
            text: 'Bukan sekadar membelah dua, Regula Falsi menghubungkan kedua titik dengan garis lurus (sekan).',
            formula: 'garis hubung titik A dan B'
        },
        {
            title: 'Langkah 3 — Hitung titik potong c₁',
            text: 'Titik c₁ adalah perpotongan garis sekan dengan sumbu-x.',
            formula: 'c₁ = (a₁ f(b₁) - b₁ f(a₁)) / (f(b₁) - f(a₁))'
        },
        {
            title: 'Langkah 4 — Evaluasi f(c₁)',
            text: 'Hitung f(c₁) untuk memeriksa seberapa dekat c₁ dengan akar sejati.',
            formula: 'hitung f(c₁)'
        },
        {
            title: 'Langkah 5 — Diperoleh Interval 2',
            text: 'Substitusi c₁ ke posisi a₁ atau b₁ tergantung tanda f(c₁), menghasilkan interval baru [a₂, b₂].',
            formula: 'f(a₁)f(c₁) < 0 → [a₂, b₂] = [a₁, c₁] | selain itu → [a₂, b₂] = [c₁, b₁]'
        },
        {
            title: 'Langkah 6 — Tarik Garis Sekan Baru & Hitung c₂ (Interval 2)',
            text: 'Tarik garis sekan baru pada [a₂, b₂] untuk memperoleh perkiraan akar c₂.',
            formula: 'c₂ = (a₂ f(b₂) - b₂ f(a₂)) / (f(b₂) - f(a₂))'
        },
        {
            title: 'Langkah 7 — Evaluasi f(c₂) & Potong ke Interval 3',
            text: 'Hitung nilai f(c₂), lalu perbarui interval menjadi interval ketiga [a₃, b₃]. Titik c mendekati akar sejati.',
            formula: 'f(a₂)f(c₂) < 0 → [a₃, b₃] = [a₂, c₂] | selain itu → [a₃, b₃] = [c₂, b₂]'
        }
    ];

    function f(x) {
        return x ** 2 - 2;
    }

    function hitungRegulaFalsi(a, b, maxSteps, batasSelisih) {
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
                message: 'Nilai a sudah merupakan akar fungsi.',
                iterations: [{ step: 1, a, b, c: a, fa, fb, fc: fa, errorInterval: 0, deltaC: 0 }]
            };
        }
        if (Math.abs(fb) < batasSelisih) {
            return {
                success: true,
                message: 'Nilai b sudah merupakan akar fungsi.',
                iterations: [{ step: 1, a, b, c: b, fa, fb, fc: fb, errorInterval: 0, deltaC: 0 }]
            };
        }

        if (fa * fb >= 0) {
            return {
                success: false,
                message: 'Nilai f(a) dan f(b) harus berlainan tanda. Saat ini f(' + format(a) + ') = ' + format(fa) + ' dan f(' + format(b) + ') = ' + format(fb) + '.',
                iterations: []
            };
        }

        let currA = a;
        let currB = b;

        for (let i = 1; i <= maxSteps; i++) {
            const currFa = f(currA);
            const currFb = f(currB);
            const currC = (currA * currFb - currB * currFa) / (currFb - currFa);
            const currFc = f(currC);

            const errorInterval = Math.abs(currFc);
            const deltaC = cSebelumnya === null ? 0 : Math.abs(currC - cSebelumnya);

            hasil.push({
                step: i,
                a: currA,
                b: currB,
                c: currC,
                fa: currFa,
                fb: currFb,
                fc: currFc,
                errorInterval,
                deltaC
            });

            if (Math.abs(currFc) < batasSelisih || Math.abs(currB - currA) < batasSelisih) {
                break;
            }

            if (currFa * currFc < 0) {
                currB = currC;
            } else {
                currA = currC;
            }

            cSebelumnya = currC;
        }

        return { success: true, message: 'Perhitungan Regula Falsi berhasil.', iterations: hasil };
    }

    function format(val) {
        if (val === null || val === undefined || Number.isNaN(val)) return '-';
        if (Math.abs(val) < 1e-6 && val !== 0) return val.toExponential(4);
        return val.toFixed(6).replace(/\.?0+$/, '');
    }

    function postEvent(type, payload) {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'REGULA_FALSI_' + type.toUpperCase(), payload }, '*');
        }
    }

    function setFormState(disabled) {
        const ids = ['a', 'b', 'step'];
        ids.forEach((id) => {
            const el = $(id);
            if (el) el.disabled = disabled;
        });
        const submitBtn = document.querySelector('#rfForm button[type="submit"]');
        if (submitBtn) submitBtn.disabled = disabled;
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

        const aVal = parseFloat($('a').value);
        const bVal = parseFloat($('b').value);
        const stepVal = parseInt($('step').value, 10) || 10;

        toggleError(false);

        const res = hitungRegulaFalsi(aVal, bVal, stepVal, TOLERANCE);
        if (!res.success) {
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
        minX = aVal;
        maxX = bVal;
        currentStep = 0;
        intuitionStep = 0;
        intuitionData = data.length > 0 ? data[0] : null;

        setControlButtonsState(false);
        updateSummary();
        renderTable();
        renderChart();
        renderStep();
        updateIntuition();

        postEvent('calculated', { a: aVal, b: bVal, steps: data.length });
    }

    function updateSummary() {
        const box = $('formulaSummary');
        if (!box) return;
        if (!isValid || data.length === 0) {
            box.innerHTML = 'Masukkan interval valid dengan <strong>f(a) × f(b) < 0</strong> untuk melihat simulasi.';
            return;
        }
        const last = data[data.length - 1];
        box.innerHTML = 'Fungsi: <strong>f(x) = x² - 2</strong> | Rumus Regula Falsi: <strong>c = (a f(b) - b f(a)) / (f(b) - f(a))</strong> | Hasil akhir c: <strong>' + format(last.c) + '</strong> (f(c) = ' + format(last.fc) + ') pada iterasi ke-' + data.length + '.';
    }

    function getIntuitionBounds() {
        if (!intuitionData) return { xMin: -0.5, xMax: 2.5, yMin: -2.5, yMax: 2.5 };
        const item = intuitionData;
        const pad = Math.max(0.5, Math.abs(item.b - item.a) * 0.4);
        const xMin = item.a - pad;
        const xMax = item.b + pad;
        const ys = [f(xMin), f(xMax), item.fa, item.fb, item.fc, 0];
        const yMin = Math.min(...ys) - 0.5;
        const yMax = Math.max(...ys) + 0.5;
        return { xMin, xMax, yMin, yMax };
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
        const canvas = $('rfIntuitionCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth || 800;
        const height = canvas.parentElement.clientHeight || 360;
        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        if (!isValid || !intuitionData) {
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
        drawIntuitionPoint(ctx, ax, ay, '#ef4444', 'A (a₁, f(a₁))');
        drawIntuitionPoint(ctx, bx, by, '#16a34a', 'B (b₁, f(b₁))');

        if (intuitionStep >= 1) {
            // Draw secant line connecting (a, fa) and (b, fb)
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();

            // Highlight intersection c1
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            drawIntuitionDashedLine(ctx, cx, margin.top, cx, height - margin.bottom, '#f59e0b');
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
            const nextAy = mapY(next.fa), nextBy = mapY(next.fb);

            // Draw secant line 2
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(nextA, nextAy); ctx.lineTo(nextB, nextBy); ctx.stroke();

            drawIntuitionPoint(ctx, nextC, xAxisY, '#0284c7', 'c₂');
        }
        if (intuitionStep >= 5 && data.length > 1) {
            const next = data[1];
            const nextC = mapX(next.c), nextCy = mapY(next.fc);
            drawIntuitionDashedLine(ctx, nextC, nextCy, nextC, xAxisY, '#0284c7');
            drawIntuitionPoint(ctx, nextC, nextCy, '#0284c7', 'f(c₂)');
        }
        if (intuitionStep >= 6) {
            ctx.fillStyle = '#334155';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('Regula Falsi menggunakan kemiringan garis sekan untuk konvergensi lebih cepat', margin.left + 10, margin.top + 20);
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
            $('valueA').textContent = '-';
            $('valueB').textContent = '-';
            $('valueC').textContent = '-';
            $('errorInterval').textContent = '-';
            $('errorC').textContent = '-';
            $('decision').textContent = 'Belum ada data iterasi.';
            $('activeInterval').style.width = '0%';
            return;
        }

        const item = data[currentStep];
        $('iterationCounter').textContent = 'Iterasi ' + item.step + ' / ' + data.length;
        $('valueA').innerHTML = format(item.a) + ' <small>(f(a)=' + format(item.fa) + ')</small>';
        $('valueB').innerHTML = format(item.b) + ' <small>(f(b)=' + format(item.fb) + ')</small>';
        $('valueC').innerHTML = format(item.c) + ' <small>(f(c)=' + format(item.fc) + ')</small>';

        $('errorInterval').textContent = format(item.errorInterval);
        $('errorC').textContent = format(item.deltaC);

        const keepLeft = item.fa * item.fc < 0;
        const nextA = keepLeft ? item.a : item.c;
        const nextB = keepLeft ? item.c : item.b;

        $('decision').innerHTML = '<strong>Evaluasi f(c):</strong> f(' + format(item.c) + ') = ' + format(item.fc) + '. ' +
            (keepLeft
                ? 'Tanda f(a) dan f(c) berlawanan → akar di [' + format(nextA) + ', ' + format(nextB) + '], ubah <strong>b = c</strong>.'
                : 'Tanda f(b) dan f(c) berlawanan → akar di [' + format(nextA) + ', ' + format(nextB) + '], ubah <strong>a = c</strong>.');

        const span = maxX - minX || 1;
        const leftPercent = Math.max(0, Math.min(100, ((item.a - minX) / span) * 100));
        const rightPercent = Math.max(0, Math.min(100, ((item.b - minX) / span) * 100));
        const cPercent = Math.max(0, Math.min(100, ((item.c - minX) / span) * 100));

        $('pointA').style.left = leftPercent + '%';
        $('pointB').style.left = rightPercent + '%';
        $('pointC').style.left = cPercent + '%';

        $('labelA').style.left = leftPercent + '%';
        $('labelA').textContent = 'a=' + format(item.a);
        $('labelB').style.left = rightPercent + '%';
        $('labelB').textContent = 'b=' + format(item.b);
        $('labelC').style.left = cPercent + '%';
        $('labelC').textContent = 'c=' + format(item.c);

        $('axisStart').textContent = format(minX);
        $('axisEnd').textContent = format(maxX);

        const activeInterval = $('activeInterval');
        activeInterval.style.left = Math.min(leftPercent, rightPercent) + '%';
        activeInterval.style.width = Math.abs(rightPercent - leftPercent) + '%';

        updateTableHighlight();
        renderChart();
        postEvent('step_changed', { step: item.step, c: item.c, fc: item.fc });
    }

    function renderTable() {
        const tbody = $('iterationTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!isValid || data.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="9">Tidak ada data untuk ditampilkan.</td></tr>';
            return;
        }

        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.id = 'row-step-' + index;
            tr.innerHTML = `
                <td>${row.step}</td>
                <td>${format(row.a)}</td>
                <td>${format(row.b)}</td>
                <td>${format(row.c)}</td>
                <td>${format(row.fa)}</td>
                <td>${format(row.fb)}</td>
                <td>${format(row.fc)}</td>
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

        // Grid background
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

        // Draw light background reference lines for full dataset
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

        // Slice data up to active currentStep for step-by-step progress
        const visibleData = data.slice(0, currentStep + 1);

        // Draw active |f(c)| line
        if (visibleData.length > 0) {
            ctx.beginPath();
            visibleData.forEach((d, idx) => {
                const px = getX(idx);
                const py = getY(d.errorInterval);
                if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw active |delta C| line
            ctx.beginPath();
            visibleData.forEach((d, idx) => {
                const px = getX(idx);
                const py = getY(d.deltaC);
                if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }

        // Draw point dots and x-axis labels
        data.forEach((d, idx) => {
            const px = getX(idx);
            const isVisible = idx <= currentStep;
            const isCurrent = idx === currentStep;

            // f(c) dot
            ctx.beginPath();
            ctx.arc(px, getY(d.errorInterval), isCurrent ? 7 : (isVisible ? 4 : 3), 0, Math.PI * 2);
            ctx.fillStyle = isVisible ? '#2563eb' : '#94a3b8';
            ctx.fill();
            if (isCurrent) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // delta C dot
            ctx.beginPath();
            ctx.arc(px, getY(d.deltaC), isCurrent ? 6 : (isVisible ? 3 : 2), 0, Math.PI * 2);
            ctx.fillStyle = isVisible ? '#f59e0b' : '#cbd5e1';
            ctx.fill();
            if (isCurrent) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Step Label
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

    $('rfForm').addEventListener('submit', (e) => {
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

    processFormInput();
})();
