const API = window.ZTR_API_URL;
const reportType = document.getElementById('reportType');
const itemSelect = document.getElementById('itemSelect');
const itemLabel = document.getElementById('itemLabel');
const siteLinkBox = document.getElementById('siteLinkBox');
const msg = document.getElementById('message');
let catalog = [];

async function loadCatalog(){
  try{
    const res = await fetch(`${API}/api/catalog`);
    catalog = await res.json();
    updateTypeUI();
  }catch(e){
    msg.textContent = 'Erro ao conectar com o servidor. Confira a URL em config.js.';
  }
}

function updateTypeUI(){
  const type = reportType.value;
  itemLabel.textContent = type === 'game' ? 'Qual jogo?' : type === 'site' ? 'Qual site?' : 'Qual app?';
  siteLinkBox.classList.toggle('hidden', type !== 'site');
  itemSelect.innerHTML = '';
  catalog.filter(i => i.type === type).forEach(i => {
    const opt = document.createElement('option');
    opt.value = i.id; opt.textContent = i.name; opt.dataset.name = i.name;
    itemSelect.appendChild(opt);
  });
  if(!itemSelect.children.length){
    const opt = document.createElement('option'); opt.value=''; opt.textContent='Nenhum item cadastrado'; itemSelect.appendChild(opt);
  }
}

reportType.addEventListener('change', updateTypeUI);

document.getElementById('reportForm').addEventListener('submit', async (e)=>{
  e.preventDefault(); msg.textContent='Enviando...';
  const selected = itemSelect.options[itemSelect.selectedIndex];
  const payload = {
    report_type: reportType.value,
    item_id: itemSelect.value || null,
    item_name: selected ? selected.textContent : null,
    site_url: document.getElementById('siteUrl').value,
    player_name: document.getElementById('playerName').value,
    player_email: document.getElementById('playerEmail').value,
    severity: document.getElementById('severity').value,
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    steps: document.getElementById('steps').value,
    device: document.getElementById('device').value,
    game_version: document.getElementById('gameVersion').value
  };
  try{
    const res = await fetch(`${API}/api/reports`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Erro ao enviar.');
    msg.textContent = `Reporte enviado com sucesso! ID #${data.report.id}`;
    e.target.reset(); updateTypeUI();
  }catch(err){ msg.textContent = err.message; }
});

loadCatalog();
