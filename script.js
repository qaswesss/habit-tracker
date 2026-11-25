let bazaPrivychek = [];

const spisokElement = document.getElementById('spisok-privychek');
const oknoFormy = document.getElementById('okno-formy');
const formaPrivychki = document.getElementById('forma-privychki');
const zagolovokOkna = document.getElementById('zagolovok-okna');

const poleId = document.getElementById('id-privychki');
const poleNazvanie = document.getElementById('nazvanie');
const poleCvet = document.getElementById('cvet');
const poleCel = document.getElementById('cel');

const knopkaDobavit = document.getElementById('knopka-dobavit');
const knopkaOtmеna = document.getElementById('knopka-otmena');

function poluchitSegodnya() {
    const segodnya = new Date();
    return segodnya.toISOString().split('T')[0];
}

function zagruzitDannye() {
    const dannye = localStorage.getItem('treker_privychek');
    if (dannye) {
        try {
            bazaPrivychek = JSON.parse(dannye);
        } catch (e) {
            bazaPrivychek = [];
        }
    }
}

function sohranitDannye() {
    localStorage.setItem('treker_privychek', JSON.stringify(bazaPrivychek));
}

function poschitatSeriyu(privychka) {
    let seriya = 0;
    let tekushchayaData = new Date();

    while (true) {
        const dataStr = tekushchayaData.toISOString().split('T')[0];
        const vypolneno = privychka.otmetki[dataStr] || 0;

        if (vypolneno >= privychka.cel) {
            seriya++;
            tekushchayaData.setDate(tekushchayaData.getDate() - 1);
        } else {
            break;
        }
    }
    return seriya;
}

function poschitatProcentZaNedelyu(privychka) {
    let vypolnennyhDney = 0;
    const segodnya = new Date();

    for (let i = 0; i < 7; i++) {
        const data = new Date(segodnya);
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];

        const vypolneno = privychka.otmetki[dataStr] || 0;
        if (vypolneno >= privychka.cel) {
            vypolnennyhDney++;
        }
    }
    return Math.round((vypolnennyhDney / 7) * 100);
}

function proveritZapushchennost(privychka) {
    const segodnya = new Date();

    for (let i = 1; i <= 3; i++) {
        const data = new Date(segodnya);
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];

        const vypolneno = privychka.otmetki[dataStr] || 0;
        if (vypolneno < privychka.cel) {
        } else {
            return false;
        }
    }
    return true;
}

function otrisovatVse() {
    spisokElement.innerHTML = '';
    const segodnyaStr = poluchitSegodnya();

    if (bazaPrivychek.length === 0) {
        spisokElement.innerHTML = '<div class="pustoy-spisok">Привычек пока нет. Нажмите «Добавить привычку».</div>';
        return;
    }

    bazaPrivychek.forEach(privychka => {
        const vypolnenoSegodnya = privychka.otmetki[segodnyaStr] || 0;
        const procent = Math.min(100, Math.round((vypolnenoSegodnya / privychka.cel) * 100));
        const seriya = poschitatSeriyu(privychka);
        const procentNedelya = poschitatProcentZaNedelyu(privychka);
        const zapushchena = proveritZapushchennost(privychka);

        const kartochka = document.createElement('div');
        kartochka.className = 'kartochka-privychki';
        kartochka.style.borderLeftColor = privychka.cvet;

        const metka = zapushchena ? '<span class="metka-zapushchena">Запущена</span>' : '';
        const kalendarHtml = sozdatKalendar(privychka);

        kartochka.innerHTML = `
            <div class="levaya-chast">
                <div class="shapka-kartochki">
                    <div class="nazvanie-privychki">
                        ${privychka.nazvanie} ${metka}
                    </div>
                </div>

                <div class="konteyner-progressa">
                    <div class="polosa-progressa" style="width: ${procent}%; background-color: ${privychka.cvet};">
                        ${procent}%
                    </div>
                </div>

                <div class="upravlenie-privychkoy">
                    <button class="knopka-plyus" data-id="${privychka.id}">+1</button>
                    <span>${vypolnenoSegodnya} / ${privychka.cel}</span>
                    <button class="knopka-sbrosa" data-id="${privychka.id}">Сбросить сегодня</button>
                </div>

                <div class="statistika-privychki">
                    Серия: ${seriya} дн. подряд<br>
                    За последнюю неделю: ${procentNedelya}% (${Math.round(procentNedelya * 7 / 100)} из 7 полных дней)
                </div>
            </div>

            <div class="pravaya-chast">
                <div class="statistika-privychki">Календарь на текущий месяц:</div>
                <div class="kalendar">
                    ${kalendarHtml}
                </div>
                <div style="margin-top: 10px; text-align: right;">
                    <button class="knopka-redaktirovat" data-id="${privychka.id}">Редактировать</button>
                    <button class="knopka-udaleniya" data-id="${privychka.id}">Удалить</button>
                </div>
            </div>
        `;

        spisokElement.appendChild(kartochka);
    });

    document.querySelectorAll('.knopka-plyus').forEach(btn => {
        btn.addEventListener('click', () => dobavitVypolnenie(btn.dataset.id));
    });
    document.querySelectorAll('.knopka-sbrosa').forEach(btn => {
        btn.addEventListener('click', () => sbrositSegodnya(btn.dataset.id));
    });
    document.querySelectorAll('.knopka-redaktirovat').forEach(btn => {
        btn.addEventListener('click', () => otkrytRedaktor(btn.dataset.id));
    });
    document.querySelectorAll('.knopka-udaleniya').forEach(btn => {
        btn.addEventListener('click', () => udalitPrivychku(btn.dataset.id));
    });
}

function sozdatKalendar(privychka) {
    const segodnya = new Date();
    const god = segodnya.getFullYear();
    const mesyac = segodnya.getMonth();
    const dneyVMesyace = new Date(god, mesyac + 1, 0).getDate();

    let html = '';
    for (let den = 1; den <= dneyVMesyace; den++) {
        const dataStr = `${god}-${String(mesyac + 1).padStart(2, '0')}-${String(den).padStart(2, '0')}`;
        const vypolneno = privychka.otmetki[dataStr] || 0;
        const estVypolnenie = vypolneno >= privychka.cel;

        const stil = estVypolnenie
            ? `style="background-color: ${privychka.cvet}; color: white;"`
            : '';

        html += `<div class="den-kalendarya ${estVypolnenie ? 'vypolneno' : ''}" ${stil}>${den}</div>`;
    }
    return html;
}

function dobavitVypolnenie(id) {
    const privychka = bazaPrivychek.find(p => p.id === id);
    if (!privychka) return;

    const segodnyaStr = poluchitSegodnya();
    let tekushchee = privychka.otmetki[segodnyaStr] || 0;

    if (tekushchee < privychka.cel) {
        privychka.otmetki[segodnyaStr] = tekushchee + 1;
        sohranitDannye();
        otrisovatVse();
    } else {
        alert('Цель на сегодня уже достигнута!');
    }
}

function sbrositSegodnya(id) {
    const privychka = bazaPrivychek.find(p => p.id === id);
    if (!privychka) return;

    const segodnyaStr = poluchitSegodnya();
    if (privychka.otmetki[segodnyaStr]) {
        privychka.otmetki[segodnyaStr] = 0;
        sohranitDannye();
        otrisovatVse();
    }
}

function udalitPrivychku(id) {
    if (confirm('Вы уверены, что хотите удалить эту привычку?')) {
        bazaPrivychek = bazaPrivychek.filter(p => p.id !== id);
        sohranitDannye();
        otrisovatVse();
    }
}

function otkrytFormu() {
    poleId.value = '';
    poleNazvanie.value = '';
    poleCvet.value = '#4CAF50';
    poleCel.value = '';
    zagolovokOkna.textContent = 'Добавить привычку';
    oknoFormy.classList.remove('skryto');
}

function otkrytRedaktor(id) {
    const privychka = bazaPrivychek.find(p => p.id === id);
    poleId.value = privychka.id;
    poleNazvanie.value = privychka.nazvanie;
    poleCvet.value = privychka.cvet;
    poleCel.value = privychka.cel;
    zagolovokOkna.textContent = 'Редактировать привычку';
    oknoFormy.classList.remove('skryto');
}

function zakrytFormu() {
    oknoFormy.classList.add('skryto');
}

knopkaDobavit.addEventListener('click', otkrytFormu);
knopkaOtmеna.addEventListener('click', zakrytFormu);

formaPrivychki.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = poleId.value || Date.now().toString();
    const nazvanie = poleNazvanie.value.trim();
    const cvet = poleCvet.value;
    const cel = parseInt(poleCel.value);
    
    if (!nazvanie || !cel || cel < 1) return;

    if (poleId.value) {
        const privychka = bazaPrivychek.find(p => p.id === poleId.value);
        privychka.nazvanie = nazvanie;
        privychka.cvet = cvet;
        privychka.cel = cel;
    } else {
        bazaPrivychek.push({
            id: id,
            nazvanie: nazvanie,
            cvet: cvet,
            cel: cel,
            otmetki: {}
        });
    }
    
    sohranitDannye();
    zakrytFormu();
    otrisovatVse();
});

zagruzitDannye();
otrisovatVse();