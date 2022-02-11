const $ipc3d = document.getElementById('ipc-3d')

// ///////////////////////////////////////////////
// PRojects
document.getElementById('newProject').addEventListener('click', () => {
  $ipc3d.newProject()
  generateViewButtons()
})

document.getElementById('save').addEventListener('click', event => {
  const json = $ipc3d.saveJson()
  console.log(json)

  if (event.ctrlKey) {
    download('ipc.proj', JSON.stringify(json))
  } else {
    localStorage.setItem('ipc-project', JSON.stringify(json))
  }
})

document.getElementById('load').addEventListener('click', () => {
  const jsonStr = localStorage.getItem('ipc-project')

  if (!jsonStr) {
    console.warn('No project data available')
    return
  }

  $ipc3d.loadJson(JSON.parse(jsonStr))
  generateViewButtons()
})

const urlParams = new URLSearchParams(window.location.search)
if (urlParams.has('proj')) {
  const projUrl = urlParams.get('proj')
  fetch(projUrl)
    .then(response => response.text())
    .then(txt => {
      $ipc3d.loadJson(JSON.parse(txt))
      generateViewButtons()
    })
}

// ///////////////////////////////////////////////
// Undo and Redo

$ipc3d.undoRedoManager.on('changeAdded', () => {
  console.log('changeAdded')
})

document.getElementById('undo').addEventListener('click', event => {
  console.log('undo')
  $ipc3d.undo()
})
document.getElementById('redo').addEventListener('click', event => {
  console.log('redo')
  $ipc3d.redo()
})

// ///////////////////////////////////////////////
// Assets
document.getElementById('loadBike').addEventListener('click', () => {
  $ipc3d.loadAsset('data/Mountain Bike.zcad')
})
document.getElementById('loadGearbox').addEventListener('click', () => {
  $ipc3d.loadAsset('data/gear_box_final_asm.zcad')
})

function download(file, text) {
  //creating an invisible element
  var element = document.createElement('a')
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8, ' + encodeURIComponent(text)
  )
  element.setAttribute('download', file)
  document.body.appendChild(element)
  //onClick property
  element.click()
  document.body.removeChild(element)
}

document.getElementById('frameView').addEventListener('click', () => {
  $ipc3d.frameView()
})

// ////////////////////////////////////////////////
//  Tabs
const $tab1 = document.querySelector('#tab1')
const $tab2 = document.querySelector('#tab2')

document.querySelector('#showTab1').addEventListener('click', () => {
  $tab1.style.visibility = 'visible'
  $tab2.style.visibility = 'hidden'
})

document.querySelector('#showTab2').addEventListener('click', () => {
  $tab1.style.visibility = 'hidden'
  $tab2.style.visibility = 'visible'
})

// ////////////////////////////////////////////////
//  Tree view
const $treeView = document.querySelector('#treeView')
$treeView.setTreeItem($ipc3d.scene.getRoot())
$treeView.setSelectionManager($ipc3d.selectionManager)

// ////////////////////////////////////////////////
//  Views

document.getElementById('createView').addEventListener('click', () => {
  $ipc3d.createView()
  generateViewButtons()
})

function generateViewButtons() {
  const $viewButtons = document.getElementById('viewButtons')
  $viewButtons.replaceChildren()

  let $highlightedViewBtn
  $ipc3d.views.forEach((view, index) => {
    const $button = document.createElement('button')
    $button.className = 'border rounded bg-gray-300 px-2  hover:bg-gray-100'
    $button.textContent = view.name

    $button.addEventListener('click', () => {
      $ipc3d.activateView(index)
      if ($highlightedViewBtn) $highlightedViewBtn.style.borderColor = ''
      $button.style.borderColor = 'red'
      $highlightedViewBtn = $button
    })

    $viewButtons.appendChild($button)
  })
}

// document.getElementById('view0').addEventListener('click', () => {
//   $ipc3d.activateView(0)
// })

// document.getElementById('view1').addEventListener('click', () => {
//   $ipc3d.activateView(1)
// })
