const sample = [
  {id:'a1',title:'Weekend in Lisbon',status:'locked',budget:3200,committed:1100,desc:'3-day trip exploring Alfama'},
  {id:'b2',title:'Family Roadtrip',status:'planning',budget:5000,committed:600,desc:'Drive up the coast'},
  {id:'c3',title:'Conference Visit',status:'live',budget:2200,committed:1900,desc:'Work + networking'},
  {id:'d4',title:'Weekend Hike',status:'planning',budget:450,committed:50,desc:'Trail and camping'}
]

const cardsEl = document.getElementById('cards')
const sheetList = document.getElementById('sheetList')
const detailOverlay = document.getElementById('detailOverlay')
const detailTitle = document.getElementById('detailTitle')
const detailBody = document.getElementById('detailBody')
const closeDetail = document.getElementById('closeDetail')
const archiveBtn = document.getElementById('archiveBtn')
let activeItem = null

function renderCards(list){
  cardsEl.innerHTML = ''
  list.forEach(it=>{
    const c = document.createElement('div')
    c.className = 'card'
    c.innerHTML = `<div class="left"><span class="ribbon">${it.status}</span><strong>${it.title}</strong><div class="badges">Budget $${it.budget} · Committed $${it.committed} · Remaining $${it.budget - it.committed}</div></div><div class="actions"><button class='btn small' data-id='${it.id}'>Open</button></div>`
    cardsEl.appendChild(c)
  })
}

function renderSheet(list){
  sheetList.innerHTML = ''
  list.forEach(it=>{
    const c = document.createElement('div')
    c.className = 'sheet-card'
    c.innerHTML = `<strong>${it.title}</strong><div style='font-size:12px;color:#6b7280'>Budget $${it.budget} · Committed $${it.committed}</div>`
    c.addEventListener('click',()=>openDetail(it))
    sheetList.appendChild(c)
  })
}

function openDetail(it){
  activeItem = it
  detailTitle.textContent = it.title
  detailBody.innerHTML = `<p style='color:#374151'>${it.desc}</p><p style='font-size:13px;color:#6b7280'>Budget: $${it.budget} · Committed: $${it.committed} · Remaining: $${it.budget - it.committed}</p>`
  detailOverlay.classList.remove('hidden')
}

closeDetail.addEventListener('click',()=>{detailOverlay.classList.add('hidden')})

// delegate open buttons
cardsEl.addEventListener('click',(e)=>{
  const btn = e.target.closest('button')
  if(!btn) return
  const id = btn.dataset.id
  const item = sample.find(s=>s.id===id)
  if(item) openDetail(item)
})

archiveBtn.addEventListener('click',()=>{
  if(!activeItem) return
  // soft-archive simulation: remove from sample
  const idx = sample.findIndex(s=>s.id===activeItem.id)
  if(idx>-1) sample.splice(idx,1)
  renderCards(sample)
  renderSheet(sample)
  detailOverlay.classList.add('hidden')
  alert('Archived (soft) — item removed from active list. You can implement restore via API.')
})

// filters
document.getElementById('filters').addEventListener('click',(e)=>{
  const btn = e.target.closest('button')
  if(!btn) return
  document.querySelectorAll('#filters .pill').forEach(p=>p.classList.remove('active'))
  btn.classList.add('active')
  const f = btn.dataset.filter
  if(f==='all'){ renderCards(sample); renderSheet(sample); return }
  const list = sample.filter(s=>s.status===f)
  renderCards(list)
  renderSheet(list)
})

// bottom sheet drag (simple)
const sheet = document.getElementById('sheet')
const drag = document.getElementById('drag')
let startY = 0, startH = 0

drag.addEventListener('touchstart', (e)=>{ startY = e.touches[0].clientY; startH = sheet.getBoundingClientRect().height })

drag.addEventListener('touchmove', (e)=>{
  const dy = startY - e.touches[0].clientY
  let h = startH + dy
  h = Math.max(120, Math.min(window.innerHeight - 80, h))
  sheet.style.maxHeight = h + 'px'
})

// init
renderCards(sample)
renderSheet(sample)

// responsive demo: clicking new plan adds a sample itinerary
document.getElementById('newPlan').addEventListener('click',()=>{
  const id = 'n'+Math.random().toString(36).slice(2,6)
  const it = {id,title:'New Plan '+id,status:'planning',budget:600,committed:0,desc:'New plan created via FAB'}
  sample.unshift(it)
  renderCards(sample)
  renderSheet(sample)
})

// small helper: clicking map placeholder focuses first item
document.getElementById('map').addEventListener('click',()=>{
  if(sample.length) openDetail(sample[0])
})
