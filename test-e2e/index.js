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
  $ipc3d.views.forEach((view, i) => {
    const $button = document.createElement('button')
    $button.className = 'border rounded bg-gray-300 px-2  hover:bg-gray-100'
    $button.textContent = view.name

    $button.addEventListener('click', () => {
      $ipc3d.activateView(i)
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

// ////////////////////////////////////////////////////
// Selection Sets

document.getElementById('createSelectionSet').addEventListener('click', () => {
  $ipc3d.createSelectionSet()
})
function generateSelSetButtons() {
  const $selectionSetButtons = document.getElementById('selectionSetButtons')
  $selectionSetButtons.replaceChildren()

  let $highlightedSelectionSetBtn
  $ipc3d.selectionSets.forEach((selectionSet, i) => {
    const $button = document.createElement('button')
    $button.className = 'border rounded bg-gray-300 px-2  hover:bg-gray-100'
    $button.textContent = selectionSet.name

    $button.addEventListener('click', () => {
      $ipc3d.activateSelectionSet(i)
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
  $ipc3d.cuttingPlanes.forEach((cuttingPlane, i) => {
    const $button = document.createElement('button')
    $button.className = 'border rounded bg-gray-300 px-2  hover:bg-gray-100'
    $button.textContent = cuttingPlane.name

    $button.addEventListener('click', () => {
      $ipc3d.activateCuttingPlane(i)
      if ($highlightedSelectionSetBtn)
        $highlightedSelectionSetBtn.style.borderColor = ''
      $button.style.borderColor = 'red'
      $highlightedSelectionSetBtn = $button
    })

    $cuttingPlaneButtons.appendChild($button)
  })
}

// ////////////////////////////////////////////////////
// UIPanel

let expanded = false
const $paramEditor = document.getElementById('param-editor')
const expandButton = document.getElementById('expand-panel')
expandButton.addEventListener('click', () => {
  const rightPanel = document.getElementById('right-panel')
  if (!expanded) {
    rightPanel.classList.add('w-72')
    expandButton.textContent = '>'
    $paramEditor.style.visibility = 'visible'
    expanded = true
  } else {
    rightPanel.classList.remove('w-72')
    expandButton.textContent = '<'
    $paramEditor.style.visibility = 'hidden'
    expanded = false
  }
})

$ipc3d.on('leadSelectionChanged', event => {
  const { treeItem } = event
  console.log('leadSelectionChanged', event)
  $paramEditor.clear()
  if (treeItem) {
    $paramEditor.addParameterOwner(treeItem)
    // if (treeItem instanceof zeaEngine.GeomItem) {
    //   const material = treeItem.materialParam.value
    //   $paramEditor.addParameterOwner(material)
    // }
  }
})

// ////////////////////////////////////////////////////
// Bottom Panel
const $paramEditorFooter = document.querySelector('#paramEditorFooter')
$paramEditorFooter.editableNames = true

const $toggleFooter = document.getElementById('toggle-footer')

$toggleFooter.addEventListener('click', () => {
  const $footer = document.querySelector('footer')
  $footer.classList.toggle('hidden')
})

let activeMaterial = -1
function generateMaterialButtons() {
  const $materialButtons = document.getElementById('materialButtons')

  while ($materialButtons.childNodes.length > 2) {
    $materialButtons.removeChild($materialButtons.firstChild)
  }
  activeMaterial = -1
  $paramEditorFooter.clear()

  let $highlightedMaterialBtn
  $ipc3d.materials.forEach((material, i) => {
    const $button = document.createElement('button')
    $button.className =
      'Material border-2 rounded shadow h-32 w-32 transition-transform transform hover:scale-105 m-1'
    $button.textContent = material.getName()
    material.on('nameChanged', () => {
      $button.textContent = material.getName()
    })
    $button.style['background-color'] = material.baseColorParam.value.toHex()

    // here is what you need do to.
    // Listent to value changes on the 'parameter' not the material....
    material.baseColorParam.on('valueChanged', () => {
      $button.style['background-color'] = material.baseColorParam.value.toHex()
    })

    $button.addEventListener('click', () => {
      // $ipc3d.activateView(i)
      if ($highlightedMaterialBtn)
        $highlightedMaterialBtn.style.borderColor = ''
      $button.style.borderColor = 'red'
      $highlightedMaterialBtn = $button
      activeMaterial = i

      $paramEditorFooter.clear()
      $paramEditorFooter.addParameterOwner(material)
    })

    $materialButtons.insertBefore($button, $addMaterialButton)
  })
}

$ipc3d.on('materialsListChanged', () => {
  generateMaterialButtons()
})
const $addMaterialButton = document.getElementById('add-material')
$addMaterialButton.addEventListener('click', () => {
  $ipc3d.addNewMaterial()
})

const $assignMaterialButton = document.getElementById('assign-material')
$assignMaterialButton.addEventListener('click', () => {
  $ipc3d.assignMaterialToSelection(activeMaterial)
})
