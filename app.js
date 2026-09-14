const fmt = n => (n < 0 ? '-¥' : '¥') + Math.abs(Math.round(n)).toLocaleString('ja-JP');

let state = {
  balance: 127516,
  cards: [
    {
      id: 'c1',
      name: '固定費',
      entries: [
        { id: 'e1', name: '家賃',        amount: 70330, day: 27 },
        { id: 'e2', name: '美容',        amount: 9300,  day: 27 },
        { id: 'e3', name: 'みずほカードローン', amount: 10000, day: 10 },
        { id: 'e4', name: '県民共済',      amount: 2500,  day: 15 },
        { id: 'e5', name: '株',          amount: 5000,  day: 26 },
      ]
    },
    {
      id: 'c2',
      name: 'クレカ',
      entries: [
        { id: 'e6', name: 'ra', amount: 0,     day: 27 },
        { id: 'e7', name: 'o',  amount: 12256, day: 27 },
        { id: 'e8', name: 'V',  amount: 5000,  day: 28 },
      ]
    }
  ]
};

let idCounter = 100;
const newId = prefix => prefix + (idCounter++);

const PRESET_CARDS = [
  'オリコカード',
  '楽天カード',
  'アメリカンエキスプレス',
  'ENEOSカード',
  '三井住友カード',
  'イオンカード',
  'JCBカード',
  '家賃',
  'その他(自由入力)'
];

const today = new Date();
const todayDay = today.getDate();

function isUpcoming(day){
  return day > todayDay;
}

function cardFutureTotal(card){
  return card.entries.reduce((sum, e) => sum + (isUpcoming(e.day) ? e.amount : 0), 0);
}

function populatePresetSelect(){
  const select = document.getElementById('presetCardSelect');
  if (select.dataset.filled) return;
  PRESET_CARDS.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name === 'その他(自由入力)' ? 'custom' : name;
    opt.textContent = name;
    select.appendChild(opt);
  });
  select.dataset.filled = '1';
}

function render(){
  populatePresetSelect();
  document.getElementById('balanceInput').value = state.balance.toLocaleString('ja-JP');
  document.getElementById('asOf').textContent =
    today.getFullYear() + '年' + (today.getMonth()+1) + '月' + today.getDate() + '日 時点';

  const totalFuture = state.cards.reduce((s, c) => s + cardFutureTotal(c), 0);
  const projected = state.balance - totalFuture;

  document.getElementById('futureTotal').textContent = fmt(totalFuture);
  const amountEl = document.getElementById('projectedAmount');
  amountEl.textContent = fmt(projected);
  amountEl.classList.toggle('negative', projected < 0);

  const container = document.getElementById('cardsContainer');
  container.innerHTML = '';

  state.cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';

    const total = cardFutureTotal(card);

    cardEl.innerHTML = `
      <div class="card-head">
        <input class="card-name" data-card="${card.id}" value="${card.name}">
        <div class="card-total"><span class="lbl">今後の予定</span>${fmt(total)}</div>
      </div>
      <div class="col-headers">
        <span>項目名</span><span>金額</span><span>引落日</span><span>状態</span><span></span>
      </div>
    `;

    card.entries.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'entry-row';
      const upcoming = isUpcoming(entry.day);
      row.innerHTML = `
        <input type="text" value="${entry.name}" data-card="${card.id}" data-entry="${entry.id}" data-field="name">
        <input type="text" class="amount" value="${entry.amount}" data-card="${card.id}" data-entry="${entry.id}" data-field="amount" inputmode="numeric">
        <input type="text" class="day" value="${entry.day}" data-card="${card.id}" data-entry="${entry.id}" data-field="day" inputmode="numeric" maxlength="2">
        <span class="status ${upcoming ? 'upcoming' : 'done'}">${upcoming ? '予定' : '済'}</span>
        <button class="del-btn" data-card="${card.id}" data-entry="${entry.id}" title="削除">×</button>
      `;
      cardEl.appendChild(row);
    });

    const foot = document.createElement('div');
    foot.className = 'card-foot';
    foot.innerHTML = `<button class="add-entry-btn" data-card="${card.id}">+ 項目を追加</button>`;
    cardEl.appendChild(foot);

    container.appendChild(cardEl);
  });

  attachEvents();
}

function attachEvents(){
  document.getElementById('balanceInput').onchange = e => {
    const v = parseInt(e.target.value.replace(/[^0-9-]/g, ''), 10);
    state.balance = isNaN(v) ? 0 : v;
    render();
  };

  document.querySelectorAll('.card-name').forEach(el => {
    el.onchange = e => {
      const card = state.cards.find(c => c.id === e.target.dataset.card);
      card.name = e.target.value;
      render();
    };
  });

  document.querySelectorAll('.entry-row input').forEach(el => {
    el.onchange = e => {
      const card = state.cards.find(c => c.id === e.target.dataset.card);
      const entry = card.entries.find(en => en.id === e.target.dataset.entry);
      const field = e.target.dataset.field;
      if (field === 'amount'){
        const v = parseInt(e.target.value.replace(/[^0-9-]/g, ''), 10);
        entry.amount = isNaN(v) ? 0 : v;
      } else if (field === 'day'){
        let v = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
        if (isNaN(v)) v = 1;
        v = Math.min(31, Math.max(1, v));
        entry.day = v;
      } else {
        entry.name = e.target.value;
      }
      render();
    };
  });

  document.querySelectorAll('.del-btn').forEach(el => {
    el.onclick = e => {
      const card = state.cards.find(c => c.id === e.target.dataset.card);
      card.entries = card.entries.filter(en => en.id !== e.target.dataset.entry);
      render();
    };
  });

  document.querySelectorAll('.add-entry-btn').forEach(el => {
    el.onclick = e => {
      const card = state.cards.find(c => c.id === e.target.dataset.card);
      card.entries.push({ id: newId('e'), name: '新規項目', amount: 0, day: todayDay + 1 > 31 ? 31 : todayDay + 1 });
      render();
    };
  });

  const presetSelect = document.getElementById('presetCardSelect');
  const customInput = document.getElementById('customCardInput');

  presetSelect.onchange = () => {
    customInput.style.display = presetSelect.value === 'custom' ? 'block' : 'none';
    if (presetSelect.value === 'custom') customInput.focus();
  };

  document.getElementById('addCardBtn').onclick = () => {
    let name;
    if (presetSelect.value === 'custom'){
      name = customInput.value.trim();
      if (!name) { customInput.focus(); return; }
    } else if (presetSelect.value){
      name = presetSelect.value;
    } else {
      return; // nothing selected
    }
    state.cards.push({ id: newId('c'), name, entries: [] });
    presetSelect.value = '';
    customInput.value = '';
    customInput.style.display = 'none';
    render();
  };
}

render();
