const cardsEl = document.getElementById('cards');
const runNowBtn = document.getElementById('run-now');
const refreshBtn = document.getElementById('refresh');
const addForm = document.getElementById('add-form');

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso + 'Z').toLocaleString('ru-RU');
}

function statusBadge(run) {
  if (!run) return '<span class="badge none">нет данных</span>';
  const map = { ok: 'Ответ получен', timeout: 'Таймаут', error: 'Ошибка', pending: 'В процессе' };
  return `<span class="badge ${run.status}">${map[run.status] || run.status}</span>`;
}

function renderCard(account) {
  const run = account.latest_run;
  const div = document.createElement('div');
  div.className = 'card' + (account.active ? '' : ' inactive');
  div.innerHTML = `
    <div class="card-head">
      <div>
        <div class="card-label">${account.label ? escapeHtml(account.label) : 'Без метки'}</div>
        <div class="card-title">${escapeHtml(account.tiktok_url)}</div>
      </div>
      ${statusBadge(run)}
    </div>
    ${run && run.response_text ? `<div class="response">${escapeHtml(run.response_text)}</div>` : ''}
    <div class="meta">
      ${run ? `Отправлено: ${fmtDate(run.sent_at)}${run.responded_at ? ` · Ответ: ${fmtDate(run.responded_at)}` : ''}` : 'Ещё не отправлялось'}
    </div>
    <div class="card-actions">
      <button class="secondary" data-action="toggle" data-id="${account.id}">${account.active ? 'Отключить' : 'Включить'}</button>
      <button class="danger" data-action="delete" data-id="${account.id}">Удалить</button>
    </div>
  `;
  return div;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

async function loadAccounts() {
  const res = await fetch('/api/accounts');
  if (!res.ok) throw new Error('Не удалось загрузить список аккаунтов');
  const accounts = await res.json();
  cardsEl.innerHTML = '';
  if (!accounts.length) {
    cardsEl.innerHTML = '<div class="empty">Пока нет ни одного аккаунта — добавьте ссылку выше.</div>';
    return;
  }
  for (const account of accounts) {
    cardsEl.appendChild(renderCard(account));
  }
}

cardsEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'delete') {
    if (!confirm('Удалить аккаунт и историю отправок?')) return;
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
  } else if (btn.dataset.action === 'toggle') {
    const active = btn.textContent.trim() === 'Включить';
    await fetch(`/api/accounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
  }
  await loadAccounts();
});

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = document.getElementById('new-url').value.trim();
  const label = document.getElementById('new-label').value.trim();
  if (!url) return;
  await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tiktok_url: url, label }),
  });
  document.getElementById('new-url').value = '';
  document.getElementById('new-label').value = '';
  await loadAccounts();
});

runNowBtn.addEventListener('click', async () => {
  runNowBtn.disabled = true;
  runNowBtn.textContent = 'Отправка…';
  try {
    await fetch('/api/run-now', { method: 'POST' });
    await loadAccounts();
  } finally {
    runNowBtn.disabled = false;
    runNowBtn.textContent = 'Отправить сейчас';
  }
});

refreshBtn.addEventListener('click', loadAccounts);

loadAccounts().catch((err) => {
  cardsEl.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
});

setInterval(() => loadAccounts().catch(() => {}), 30000);
