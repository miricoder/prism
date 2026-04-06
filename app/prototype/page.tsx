import React from 'react'

export const metadata = {
  title: 'Prototype — Map + Route Builder',
}

export default function Page() {
  return (
    <div style={{height:'100vh'}}>
      <iframe
        src="/prototype/prototype.html"
        title="Map + Route Builder Prototype"
        style={{width:'100%',height:'100%',border:'0'}}
      />
    </div>
  )
}
