document.addEventListener('DOMContentLoaded', function() {
    const viewRecordsBtn = document.getElementById('viewRecordsBtn');
    if (viewRecordsBtn) {
        viewRecordsBtn.addEventListener('click', function() {
            window.location.href = 'records.html';
        });
    }

    const goBackBtn = document.getElementById('goBackBtn');
    if (goBackBtn) {
        goBackBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            document.body.style.background = 'url(caminhao-azul.png) no-repeat center center white';
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        });
    }

    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', function() {
            html2canvas(document.body, {
                onrendered: function(canvas) {
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL();
                    link.download = 'registros.png';
                    link.click();
                }
            });
        });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterCargas);
    }

    loadCargas();

    const loadForm = document.getElementById('loadForm');
    if (loadForm) {
        loadForm.addEventListener('submit', addCarga);
    }

    const entryDateTimeInput = document.getElementById('entryDateTime');
    if (entryDateTimeInput) {
        entryDateTimeInput.value = formatDateTime(new Date());
    }
});

function generateID() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function formatDateTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function addCarga(e) {
    e.preventDefault();

    const carga = {
        id: generateID(),
        nfNumber: document.getElementById('nfNumber').value,
        driver: document.getElementById('driver').value,
        volume: document.getElementById('volume').value + ' kg',
        value: formatCurrency(parseFloat(document.getElementById('value').value)),
        entryDateTime: document.getElementById('entryDateTime').value,
        operationStartDateTime: '',
        exitDateTime: '',
        status: 'entrado'
    };

    let cargas = localStorage.getItem('cargas');
    cargas = cargas ? JSON.parse(cargas) : [];

    cargas.push(carga);
    localStorage.setItem('cargas', JSON.stringify(cargas));

    loadCargas();
    document.getElementById('loadForm').reset();

    const entryDateTimeInput = document.getElementById('entryDateTime');
    if (entryDateTimeInput) {
        entryDateTimeInput.value = formatDateTime(new Date());
    }
}

function loadCargas() {
    const tbody = document.querySelector('#loadTable tbody');
    if (tbody) {
        tbody.innerHTML = '';

        let cargas = localStorage.getItem('cargas');
        cargas = cargas ? JSON.parse(cargas) : [];

        const statusFilter = document.getElementById('statusFilter');
        const filterValue = statusFilter ? statusFilter.value : 'all';

        cargas.forEach(carga => {
            if (filterValue === 'all' || carga.status === filterValue) {
                const row = tbody.insertRow();

                const cellNFNumber = row.insertCell(0);
                const cellDriver = row.insertCell(1);
                const cellVolume = row.insertCell(2);
                const cellValue = row.insertCell(3);
                const cellEntryDateTime = row.insertCell(4);
                const cellOperationStartDateTime = row.insertCell(5);
                const cellExitDateTime = row.insertCell(6);
                const cellStatus = row.insertCell(7);
                const cellActions = row.insertCell(8);

                cellNFNumber.textContent = carga.nfNumber;
                cellDriver.textContent = carga.driver;
                cellVolume.textContent = carga.volume;
                cellValue.textContent = carga.value;
                cellEntryDateTime.textContent = carga.entryDateTime;
                cellOperationStartDateTime.textContent = carga.operationStartDateTime;
                cellExitDateTime.textContent = carga.exitDateTime;

                const statusSelect = document.createElement('select');
                statusSelect.innerHTML = `
                    <option value="entrado" ${carga.status === 'entrado' ? 'selected' : ''}>Entrado</option>
                    <option value="operando" ${carga.status === 'operando' ? 'selected' : ''}>Operando</option>
                    <option value="finalizado" ${carga.status === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                `;
                statusSelect.classList.add('status-select');
                statusSelect.addEventListener('change', () => changeStatus(carga.id, statusSelect.value, row, row.cells[5], row.cells[6]));
                cellStatus.appendChild(statusSelect);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Excluir';
                deleteBtn.addEventListener('click', () => deleteCarga(carga.id));
                cellActions.appendChild(deleteBtn);

                updateRowColor(row, carga.status);
            }
        });
    }
}

function filterCargas() {
    loadCargas();
}

function changeStatus(id, newStatus, row, operationStartDateTimeCell, exitDateTimeCell) {
    let cargas = localStorage.getItem('cargas');
    cargas = JSON.parse(cargas);

    const carga = cargas.find(c => c.id === id);
    if (newStatus && ['entrado', 'operando', 'finalizado'].includes(newStatus)) {
        carga.status = newStatus;
        if (newStatus === 'operando') {
            carga.operationStartDateTime = formatDateTime(new Date());
            operationStartDateTimeCell.textContent = carga.operationStartDateTime;
        } else if (newStatus === 'finalizado') {
            carga.exitDateTime = formatDateTime(new Date());
            exitDateTimeCell.textContent = carga.exitDateTime;
        }
        localStorage.setItem('cargas', JSON.stringify(cargas));
        updateRowColor(row, newStatus);
    } else {
        alert('Status inválido!');
    }
}

function updateRowColor(row, status) {
    row.classList.remove('status-entrado', 'status-operando', 'status-finalizado');
    if (status === 'entrado') {
        row.classList.add('status-entrado');
    } else if (status === 'operando') {
        row.classList.add('status-operando');
    } else if (status === 'finalizado') {
        row.classList.add('status-finalizado');
    }
}

function deleteCarga(id) {
    let cargas = localStorage.getItem('cargas');
    cargas = JSON.parse(cargas);

    cargas = cargas.filter(c => c.id !== id);
    localStorage.setItem('cargas', JSON.stringify(cargas));
    loadCargas();
}

function exportToExcel() {
    let cargas = localStorage.getItem('cargas');
    cargas = cargas ? JSON.parse(cargas) : [];

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Número da NF,Motorista,Volume,Valor da NF,Data e Hora de Entrada,Data e Hora de Início de Operação,Data e Hora de Saída,Status\n";

    cargas.forEach(carga => {
        csvContent += `${carga.nfNumber},${carga.driver},${carga.volume},${carga.value},${carga.entryDateTime},${carga.operationStartDateTime},${carga.exitDateTime},${carga.status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'cargas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
document.addEventListener('DOMContentLoaded', function() {
    const statusFilter = document.getElementById('statusFilter');
    const motoristaFilter = document.getElementById('motoristaFilter');
    const nfNumberFilter = document.getElementById('nfNumberFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterCargas);
    }
    if (motoristaFilter) {
        motoristaFilter.addEventListener('input', filterCargas);
    }
    if (nfNumberFilter) {
        nfNumberFilter.addEventListener('input', filterCargas);
    }
});

function filterCargas() {
    const statusFilter = document.getElementById('statusFilter');
    const motoristaFilter = document.getElementById('motoristaFilter');
    const nfNumberFilter = document.getElementById('nfNumberFilter');
    const statusValue = statusFilter ? statusFilter.value : 'all';
    const motoristaValue = motoristaFilter ? motoristaFilter.value.toLowerCase() : '';
    const nfNumberValue = nfNumberFilter ? nfNumberFilter.value.toLowerCase() : '';

    let cargas = localStorage.getItem('cargas');
    cargas = cargas ? JSON.parse(cargas) : [];

    const tbody = document.querySelector('#loadTable tbody');
    if (tbody) {
        tbody.innerHTML = '';

        cargas.forEach(carga => {
            if ((statusValue === 'all' || carga.status === statusValue) &&
                carga.driver.toLowerCase().includes(motoristaValue) &&
                carga.nfNumber.toLowerCase().includes(nfNumberValue)) {
                const row = tbody.insertRow();

                const cellNFNumber = row.insertCell(0);
                const cellDriver = row.insertCell(1);
                const cellVolume = row.insertCell(2);
                const cellValue = row.insertCell(3);
                const cellEntryDateTime = row.insertCell(4);
                const cellOperationStartDateTime = row.insertCell(5);
                const cellExitDateTime = row.insertCell(6);
                const cellStatus = row.insertCell(7);
                const cellActions = row.insertCell(8);

                cellNFNumber.textContent = carga.nfNumber;
                cellDriver.textContent = carga.driver;
                cellVolume.textContent = carga.volume;
                cellValue.textContent = carga.value;
                cellEntryDateTime.textContent = carga.entryDateTime;
                cellOperationStartDateTime.textContent = carga.operationStartDateTime;
                cellExitDateTime.textContent = carga.exitDateTime;

                const statusSelect = document.createElement('select');
                statusSelect.innerHTML = `
                    <option value="entrado" ${carga.status === 'entrado' ? 'selected' : ''}>Entrado</option>
                    <option value="operando" ${carga.status === 'operando' ? 'selected' : ''}>Operando</option>
                    <option value="finalizado" ${carga.status === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                `;
                statusSelect.classList.add('status-select');
                statusSelect.addEventListener('change', () => changeStatus(carga.id, statusSelect.value, row, row.cells[5], row.cells[6]));
                cellStatus.appendChild(statusSelect);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Excluir';
                deleteBtn.addEventListener('click', () => deleteCarga(carga.id));
                cellActions.appendChild(deleteBtn);

                updateRowColor(row, carga.status);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Existing event listeners and functions

    // Initialize and update clock
    function updateClock() {
        const clock = document.getElementById('clock');
        if (clock) {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            clock.textContent = `Movimentações referentes às operações em: ${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        }
    }

    setInterval(updateClock, 1000);
    updateClock(); // Initial call to display the clock immediately
});