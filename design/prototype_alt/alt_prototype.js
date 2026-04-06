const sample = [
  {id:'t1',name:'Lisbon Weekend',status:'locked-in',cities:['Lisbon'],start:'2026-04-01',end:'2026-04-04',planned:[{title:'Castle visit',cost:40},{title:'Fado show',cost:60}],notes:'Bring camera.'},
  {id:'t2',name:'Roadtrip CA',status:'planning',cities:['San Francisco','Big Sur'],start:'2026-05-10',end:'2026-05-18',planned:[{title:'Camping',cost:80}],notes:'Check permit.'},
  {id:'t3',name:'Conference NYC',status:'in-progress',cities:['New York'],start:'2026-03-12',end:'2026-03-15',planned:[{title:'Dinner',cost:120}],notes:'Meet with team.'}
]

const listEl = document.getElementById('listItems')
const timelineEl = document.getElementById('timelineItems')
const archiveEl = document.getElementById('archiveItems')
const overlay = document.getElementById('overlay')
const ovTitle = document.getElementById('ovTitle')
const ovMeta = document.getElementById('ovMeta')
const ovEntries = document.getElementById('ovEntries')
const ovNotes = document.getElementById('ovNotes')
const ovArchiveBtn = document.getElementById('ovArchive')
let archived = []
let active = null

function renderList(){
  listEl.innerHTML = ''
  sample.forEach(it => {
    const el = document.createElement('div')
    el.className = 'item'
    el.innerHTML = `<div><div style='font-weight:600'>${it.name}</div><div class='meta'>${it.cities.join(', ')} • ${it.start} → ${it.end}</div></div><div><button data-id='${it.id}' class='view small'>Open</button></div>`
    listEl.appendChild(el)
  })
}

function renderTimeline(){
  timelineEl.innerHTML = ''
  sample.forEach(it=>{
    const el = document.createElement('div')
    el.className='titem'
    el.innerHTML = `<div style='font-weight:600'>${it.name}</div><div class='meta'>${it.start} → ${it.end}</div>`
    timelineEl.appendChild(el)
  })
}

function renderArchive(){
  archiveEl.innerHTML = ''
  archived.forEach(it=>{
    const el = document.createElement('div')
    el.className='aitem'
    el.innerHTML = `<div style='font-weight:600'>${it.name}</div><div class='meta'>archived</div>`
    archiveEl.appendChild(el)
  })
}

function openOverlay(it){
  active = it
  ovTitle.textContent = it.name
  ovMeta.textContent = `${it.start} → ${it.end} · ${it.cities.join(', ')}`
  ovEntries.innerHTML = ''
  it.planned.forEach((p, idx)=>{
    const li = document.createElement('li')
    li.innerHTML = `<input type='checkbox' id='chk_${idx}' /> <label for='chk_${idx}'>${p.title} — $${p.cost}</label>`
    ovEntries.appendChild(li)
  })
  ovNotes.textContent = it.notes || '—'
  overlay.classList.remove('hidden')
}

// delegate open buttons
listEl.addEventListener('click',(e)=>{
  const b = e.target.closest('button.view')
  if(!b) return
  const id = b.dataset.id
  const it = sample.find(s=>s.id===id)
  if(it) openOverlay(it)
})

// overlay archive action
ovArchiveBtn.addEventListener('click',()=>{
  if(!active) return
  const idx = sample.findIndex(s=>s.id===active.id)
  if(idx>-1){
    archived.unshift(sample.splice(idx,1)[0])
    renderAll()
    overlay.classList.add('hidden')
    alert('Archived (soft) — visible in Archive tab')
  }
})

// tabs
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click', (e)=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'))
  e.target.classList.add('active')
  const target = e.target.dataset.tab
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'))
  document.getElementById('panel-'+target).classList.add('active')
}))

function renderAll(){ renderList(); renderTimeline(); renderArchive(); }

// map placeholder click behavior: focus first
document.getElementById('mapPlaceholder').addEventListener('click',()=>{ if(sample.length) openOverlay(sample[0]) })

renderAll()

// small new/route buttons
document.getElementById('newBtn').addEventListener('click', ()=>{
  const id = 'n'+Math.random().toString(36).slice(2,6)
  sample.unshift({id,name:'New Plan '+id,status:'planning',cities:[],start:'2026-07-01',end:'2026-07-03',planned:[],notes:''})
  renderAll()
})

document.getElementById('routeBtn').addEventListener('click', ()=>{ alert('Route builder (prototype) — will open route optimization') })
