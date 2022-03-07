const $ipc3d = document.getElementById('ipc-3d')

$ipc3d.on('viewsListChanged', () => {
  generateViewButtons()
})

$ipc3d.on('selectionSetListChanged', () => {
  generateSelSetButtons()
})

// ///////////////////////////////////////////////
// PRojects
document.getElementById('newProject').addEventListener('click', () => {
  $ipc3d.newProject()
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

  $ipc3d.loadJson(JSON.parse(jsonStr)).then(() => {})
})

const urlParams = new URLSearchParams(window.location.search)
if (urlParams.has('proj')) {
  const projUrl = urlParams.get('proj')
  fetch(projUrl)
    .then(response => response.text())
    .then(txt => {
      $ipc3d.loadJson(JSON.parse(txt)).then(() => {})
    })
}

// ///////////////////////////////////////////////
// Undo and Redo

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
  $ipc3d.loadAsset('data/gear_box_final_asm.stp.zcad')
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

/* SHOW HIDE */
document.getElementById('hideSelection').addEventListener('click', () => {
  $ipc3d.hideSelection()
})
document.getElementById('unHideAll').addEventListener('click', () => {
  $ipc3d.unHideAll()
})
/* Misc */
document
  .getElementById('enable-handle')
  .addEventListener('change', changeEvent => {
    var checked = changeEvent.currentTarget.checked
    $ipc3d.selectionManager.showHandles(checked)
    $ipc3d.selectionManager.updateHandleVisibility()
  })

// ////////////////////////////////////////////////
//  Tabs
const $tab1 = document.querySelector('#tab1')
const $tab2 = document.querySelector('#tab2')
const $tab3 = document.querySelector('#tab3')
const $tab4 = document.querySelector('#tab4')

document.querySelector('#showTab1').addEventListener('click', () => {
  $tab1.style.display = ''
  $tab2.style.display = 'none'
  $tab3.style.display = 'none'
  $tab4.style.display = 'none'
})

document.querySelector('#showTab2').addEventListener('click', () => {
  $tab1.style.display = 'none'
  $tab2.style.display = ''
  $tab3.style.display = 'none'
  $tab4.style.display = 'none'
})

document.querySelector('#showTab3').addEventListener('click', () => {
  $tab1.style.display = 'none'
  $tab2.style.display = 'none'
  $tab3.style.display = ''
  $tab4.style.display = 'none'
})
document.querySelector('#showTab4').addEventListener('click', () => {
  $tab1.style.display = 'none'
  $tab2.style.display = 'none'
  $tab3.style.display = 'none'
  $tab4.style.display = ''
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
})
document.getElementById('saveViewCamera').addEventListener('click', () => {
  $ipc3d.saveViewCamera()
})
document.getElementById('activateNeutralPose').addEventListener('click', () => {
  $ipc3d.activateNeutralPose()
})

$ipc3d.undoRedoManager.on('changeAdded', () => {
  console.log('changeAdded')
})

$ipc3d.undoRedoManager.on('changeUndone', () => {
  console.log('changeUndone')
})

$ipc3d.undoRedoManager.on('changeRedone', () => {
  console.log('changeRedone')
})

function generateViewButtons() {
  const $viewButtons = document.getElementById('viewButtons')
  $viewButtons.replaceChildren()

  let $highlightedViewBtn
  $ipc3d.views.forEach((view, index) => {
    const $viewWrapper = document.createElement('div')
    $viewWrapper.className = 'border rounded bg-gray-300 px-2  hover:bg-gray-100'
    $viewWrapper.style.textAlign = 'center'
    $viewWrapper.textContent = view.name

    $viewWrapper.addEventListener('click', (event) => {
      event.stopPropagation()
      $ipc3d.activateView(index)
      if ($highlightedViewBtn) $highlightedViewBtn.style.borderColor = ''
      $viewWrapper.style.borderColor = 'red'
      $highlightedViewBtn = $viewWrapper
    })

    // ////////////////////////////
    // Options Buttons
    const $optionsWrapper = document.createElement('div')
    $optionsWrapper.style.display = 'block'

    // Rename
    const $renameBtn = document.createElement('button')
    $renameBtn.textContent = 'Rename'
    $renameBtn.className = 'border rounded bg-yellow-300 px-2  hover:bg-yellow-200'

    $renameBtn.addEventListener('click', (event) => {
      event.stopPropagation()
      let newName = prompt('Rename View',view.name+'-renamed')
      while ($ipc3d.views.map((view) => view.name).includes(newName)) {
        newName = prompt(`This name already exists ! \n Please enter a new name for the view \'${view.name}\'`,view.name+'-renamed')
      }
      $ipc3d.renameView(index, newName)
    })
    $optionsWrapper.appendChild($renameBtn)
  })
}

// document.getElementById('view0').addEventListener('click', () => {
//   $ipc3d.activateView(0)
// })

// document.getElementById('view1').addEventListener('click', () => {
//   $ipc3d.activateView(1)
// })

// ////////////////////////////////////////////////////
// Selection Sets

document.getElementById('createSelectionSet').addEventListener('click', () => {
  $ipc3d.createSelectionSet()
})
function generateSelSetButtons() {
  const $selectionSetButtons = document.getElementById('selectionSetButtons')
  $selectionSetButtons.replaceChildren()

  let $highlightedSelectionSetBtn
  $ipc3d.selectionSets.forEach((selectionSet, index) => {
    const $button = document.createElement('button')
    $button.className = 'border rounded bg-gray-300 px-2  hover:bg-gray-100'
    $button.textContent = selectionSet.name

    $button.addEventListener('click', () => {
      $ipc3d.activateSelectionSet(index)
      if ($highlightedSelectionSetBtn)
        $highlightedSelectionSetBtn.style.borderColor = ''
      $button.style.borderColor = 'red'
      $highlightedSelectionSetBtn = $button
    })

    $selectionSetButtons.appendChild($button)
  })
}

// ////////////////////////////////////////////////////
// Selection Sets

document.getElementById('createCuttingPlane').addEventListener('click', () => {
  $ipc3d.addCuttingPlane()
  generateCuttingPlanes()
})
function generateCuttingPlanes() {
  const $cuttingPlaneButtons = document.getElementById('cuttingPlaneButtons')
  $cuttingPlaneButtons.replaceChildren()

  let $highlightedSelectionSetBtn
  $ipc3d.cuttingPlanes.forEach((cuttingPlane, index) => {
    const $button = document.createElement('button')
    $button.className = 'border rounded bg-gray-300 px-2  hover:bg-gray-100'
    $button.textContent = cuttingPlane.name

    $button.addEventListener('click', () => {
      $ipc3d.activateCuttingPlane(index)
      if ($highlightedSelectionSetBtn)
        $highlightedSelectionSetBtn.style.borderColor = ''
      $button.style.borderColor = 'red'
      $highlightedSelectionSetBtn = $button
    })

    $cuttingPlaneButtons.appendChild($button)
  })
}
