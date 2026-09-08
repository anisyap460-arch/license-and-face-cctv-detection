const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

async function json(url, options) {
    const response = await fetch(url, options);
    return response.json();
}

async function loadCameras() {
    const result = await json('/api/cameras');
    const cameras = result.data || [];
    const count = document.getElementById('cameraCountTitle');
    if (count) count.textContent = cameras.length;
    const select = document.getElementById('cameraSelect');
    if (select) select.innerHTML = cameras.map(item => `<option value="${item.id}">${esc(item.name)}</option>`).join('') || '<option value="">Belum ada kamera</option>';
    const table = document.getElementById('cameraTable');
    if (table) table.innerHTML = cameras.map(camera => `<tr><td><strong>${esc(camera.name)}</strong></td><td class="camera-url">${esc(camera.url)}</td><td><span class="status ${camera.active ? 'success' : 'warning'}">${camera.active ? 'Aktif' : 'Nonaktif'}</span></td><td><div class="table-actions"><button class="action-toggle ${camera.active ? 'deactivate' : 'activate'}" data-action="toggle" data-id="${camera.id}">${camera.active ? 'Nonaktifkan' : 'Aktifkan'}</button><button class="action-edit" data-action="edit" data-id="${camera.id}">Edit</button><button class="action-delete" data-action="delete" data-id="${camera.id}">Hapus</button></div></td></tr>`).join('') || '<tr><td colspan="4" class="text-center text-muted py-5">Belum ada kamera.</td></tr>';
    return cameras;
}

function openCameraModal(camera = null) {
    const form = document.getElementById('cameraForm');
    if (!form) return;
    form.reset();
    document.getElementById('cameraId').value = camera?.id || '';
    if (camera) {
        document.getElementById('cameraNameInput').value = camera.name || '';
        document.getElementById('cameraUrl').value = camera.url || '';
        document.getElementById('cameraActive').checked = camera.active;
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('cameraModal')).show();
}

async function initMonitoring() {
    let cameras = await loadCameras();
    document.getElementById('cameraForm')?.addEventListener('submit', async event => {
        event.preventDefault();
        const id = document.getElementById('cameraId').value;
        const data = { name: document.getElementById('cameraNameInput').value, url: document.getElementById('cameraUrl').value, active: document.getElementById('cameraActive').checked };
        await json(id ? `/api/cameras/${id}` : '/api/cameras', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        bootstrap.Modal.getInstance(document.getElementById('cameraModal')).hide();
        cameras = await loadCameras();
    });
    document.getElementById('cameraTable')?.addEventListener('click', async event => {
        const button = event.target.closest('button');
        if (!button) return;
        const id = Number(button.dataset.id);
        const camera = cameras.find(item => item.id === id);
        if (button.dataset.action === 'analytics') alert('Analitik akan tersedia setelah pipeline CCTV aktif.');
        if (button.dataset.action === 'edit') openCameraModal(camera);
        if (button.dataset.action === 'delete' && confirm('Hapus kamera ini?')) { await json(`/api/cameras/${id}`, { method: 'DELETE' }); cameras = await loadCameras(); }
        if (button.dataset.action === 'toggle') { await json(`/api/cameras/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !camera.active }) }); cameras = await loadCameras(); }
    });
}

async function initDashboard() {
    const result = await Promise.all([json('/api/plate/history'), json('/api/face/history'), json('/api/cameras')]);
    const plates = result[0].data || [], faces = result[1].data || [], cameras = result[2].data || [];
    document.getElementById('totalVehicle').textContent = faces.reduce((sum, item) => sum + Number(item.face_count || 0), 0);
    document.getElementById('plateRead').textContent = plates.filter(item => item.status === 'Terbaca').length;
    document.getElementById('needCheck').textContent = [...plates, ...faces].filter(item => item.status === 'Perlu cek').length;
    document.getElementById('cameraStatus').textContent = `${cameras.filter(item => item.active).length} / ${cameras.length}`;
    const select = document.getElementById('cameraSelect');
    if (select) select.innerHTML = cameras.map(item => `<option value="${item.id}">${esc(item.name)}</option>`).join('') || '<option value="">Belum ada kamera</option>';
    const history = [...plates.map(item => ({ ...item, type: 'plate' })), ...faces.map(item => ({ ...item, type: 'face' }))].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
    const recent = document.getElementById('recentList');
    if (recent) recent.innerHTML = history.slice(0, 5).map(item => `<div class="recent"><div class="plate-icon">${item.type === 'face' ? '<i class="bi bi-person-fill"></i>' : 'P'}</div><div class="recent-info"><strong>${item.type === 'face' ? `${item.face_count} wajah` : esc(item.plate)}</strong><span>${esc(item.camera)} · ${esc(item.timestamp)}</span></div><b>${item.confidence_percent}%</b></div>`).join('') || '<div class="empty-state">Belum ada deteksi</div>';
}

async function initTablePage() {
    const target = document.getElementById('detectionTable') || document.getElementById('plateHistoryTable');
    if (!target) return;
    const isPlate = target.id === 'plateHistoryTable';
    const result = await json(isPlate ? '/api/plate/history' : '/api/plate/history');
    const rows = result.data || [];
    target.innerHTML = rows.map(item => `<tr><td><strong>${esc(item.plate)}</strong></td><td>${esc(item.camera)}</td><td>${item.confidence_percent}%</td><td>${esc(item.timestamp)}</td><td><span class="status ${item.status === 'Terbaca' ? 'success' : 'warning'}">${esc(item.status)}</span></td></tr>`).join('') || `<tr><td colspan="5" class="text-center text-muted py-5">Belum ada data.</td></tr>`;
}

async function initStatistics() {
    if (!document.getElementById('plateBar')) return;
    const [plates, faces, cameras] = await Promise.all([json('/api/plate/history'), json('/api/face/history'), json('/api/cameras')]);
    const plateData = plates.data || [], faceData = faces.data || [], total = Math.max(plateData.length, faceData.length, 1);
    document.getElementById('storedCount').textContent = plateData.length + faceData.length;
    document.getElementById('activeCameras').textContent = (cameras.data || []).filter(item => item.active).length;
    document.getElementById('plateBar').style.width = `${plateData.length / total * 100}%`;
    document.getElementById('faceBar').style.width = `${faceData.length / total * 100}%`;
    document.getElementById('checkBar').style.width = `${[...plateData, ...faceData].filter(item => item.status === 'Perlu cek').length / Math.max(plateData.length + faceData.length, 1) * 100}%`;
}

function initSettings() {
    const form = document.getElementById('settingsForm');
    if (!form) return;
    const saved = JSON.parse(localStorage.getItem('platevision.settings') || 'null');
    if (saved) Object.entries(saved).forEach(([key, value]) => { const element = document.getElementById(key === 'operator' ? 'operatorName' : key === 'refreshInterval' ? 'refreshInterval' : 'streamUrl'); if (element) element.value = value; });
    form.addEventListener('submit', event => { event.preventDefault(); localStorage.setItem('platevision.settings', JSON.stringify({ operator: operatorName.value, refreshInterval: refreshInterval.value, streamUrl: streamUrl.value })); settingsMessage.textContent = 'Pengaturan tersimpan'; });
}

function updateClock() { const clock = document.getElementById('clock'); if (clock) clock.textContent = new Date().toLocaleTimeString('id-ID', { hour12: false, timeZone: 'Asia/Jakarta' }) + ' WIB'; }
if (document.getElementById('cameraTable')) initMonitoring();
if (document.getElementById('totalVehicle')) initDashboard();
if (document.getElementById('detectionTable') || document.getElementById('plateHistoryTable')) initTablePage();
if (document.getElementById('settingsForm')) initSettings();
if (document.getElementById('plateBar')) initStatistics();
setInterval(updateClock, 1000); updateClock();
