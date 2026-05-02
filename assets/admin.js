const API = window.ZTR_API_URL;
const tokenKey = 'ztr_admin_token';
const loginPanel = document.getElementById('loginPanel');
const dashboard = document.getElementById('dashboard');
const loginMsg = document.getElementById('loginMsg');

function token(){ return localStorage.getItem(tokenKey); }
function headers(){ return {'Content-Type':'application/json','Authorization':`Bearer ${token()}`}; }

async function safeJson(res){
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; }
  catch { return { error: text || 'Resposta inválida do servidor.' }; }
}

async function login(email,password){
  const res = await fetch(`${API}/api/admin/login`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ email: email.trim(), password })
  });
  const data = await safeJson(res);
  if(!res.ok) throw new Error(data.error || `Erro no login (${res.status})`);
  localStorage.setItem(tokenKey, data.token);
  showDash();
}

async function showDash(){
  loginPanel.classList.add('hidden');
  dashboard.classList.remove('hidden');
  await loadReports();
}
function showLogin(){
  dashboard.classList.add('hidden');
  loginPanel.classList.remove('hidden');
}

document.getElementById('loginForm').addEventListener('submit', async e=>{
  e.preventDefault();
  loginMsg.textContent='Entrando...';
  try{
    await login(document.getElementById('adminEmail').value, document.getElementById('adminPassword').value);
    loginMsg.textContent='';
  } catch(err){
    loginMsg.textContent=err.message;
  }
});

document.getElementById('logoutBtn').onclick=()=>{localStorage.removeItem(tokenKey);showLogin();};

document.getElementById('catalogForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const payload={
    type:document.getElementById('newType').value,
    name:document.getElementById('newName').value.trim(),
    url:document.getElementById('newUrl').value.trim()
  };
  const res = await fetch(`${API}/api/admin/catalog`,{method:'POST',headers:headers(),body:JSON.stringify(payload)});
  const data = await safeJson(res);
  if(!res.ok){ alert(data.error || 'Erro ao adicionar item.'); return; }
  e.target.reset();
  alert('Item adicionado. Ele já aparece no formulário público.');
});

async function loadReports(){
  const list=document.getElementById('reportsList');
  list.innerHTML='<p>Carregando...</p>';

  let res;
  try {
    res=await fetch(`${API}/api/admin/reports`,{headers:headers()});
  } catch (err) {
    list.innerHTML='<p>Não foi possível conectar ao backend. Confira a URL em config.js.</p>';
    return;
  }

  if(res.status===401){localStorage.removeItem(tokenKey);return showLogin();}
  const reports=await safeJson(res);
  if(!Array.isArray(reports)){ list.innerHTML=`<p>${reports.error || 'Erro ao carregar reportes.'}</p>`; return; }
  if(!reports.length){list.innerHTML='<p>Nenhum reporte recebido ainda.</p>'; return;}
  list.innerHTML='';
  reports.forEach(r=>{
    const card=document.createElement('article'); card.className='report-card';
    card.innerHTML=`
      <span class="pill">#${r.id}</span><span class="pill">${labelType(r.report_type)}</span><span class="pill ${r.severity}">${r.severity}</span>
      <h3>${escapeHtml(r.title)}</h3>
      <p class="meta"><b>Item:</b> ${escapeHtml(r.item_name || '-')}<br><b>Site URL:</b> ${escapeHtml(r.site_url || '-')}<br><b>Player:</b> ${escapeHtml(r.player_name || '-')} | ${escapeHtml(r.player_email || '-')}<br><b>Data:</b> ${new Date(r.created_at).toLocaleString('pt-BR')}</p>
      <p>${escapeHtml(r.description)}</p>
      <p class="meta"><b>Passos:</b> ${escapeHtml(r.steps || '-')}<br><b>Dispositivo:</b> ${escapeHtml(r.device || '-')}<br><b>Versão:</b> ${escapeHtml(r.game_version || '-')}</p>
      <div class="status-row"><select><option value="open">Aberto</option><option value="reviewing">Em análise</option><option value="fixed">Corrigido</option><option value="closed">Fechado</option></select><button>Atualizar</button></div>`;
    const select=card.querySelector('select'); select.value=r.status;
    card.querySelector('button').onclick=async()=>{
      const res = await fetch(`${API}/api/admin/reports/${r.id}/status`,{method:'PATCH',headers:headers(),body:JSON.stringify({status:select.value})});
      const data = await safeJson(res);
      alert(res.ok ? 'Status atualizado' : (data.error || 'Erro ao atualizar status'));
    };
    list.appendChild(card);
  });
}
function labelType(t){return t==='game'?'Jogo':t==='site'?'Site':'App';}
function escapeHtml(str){return String(str).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
if(token()) showDash(); else showLogin();
