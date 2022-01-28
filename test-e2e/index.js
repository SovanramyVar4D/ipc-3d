const $ipc3d = document.getElementById('ipc-3d')

document.getElementById('newProject').addEventListener('click', () => {
  $ipc3d.newProject()
})

document.getElementById('loadAsset').addEventListener('click', () => {
  $ipc3d.loadAsset('data/bike.zcad')
})

document.getElementById('frameView').addEventListener('click', () => {
  $ipc3d.frameView()
})

document.getElementById('save').addEventListener('click', () => {
  const json = $ipc3d.saveJson()
  console.log(json)

  localStorage.setItem('ipc-project', JSON.stringify(json))
})

document.getElementById('load').addEventListener('click', () => {
  const jsonStr = localStorage.getItem('ipc-project')

  if (!jsonStr) {
    console.warn('No project data available')
    return
  }

  $ipc3d.loadJson(JSON.parse(jsonStr))
})
