const $ipc3d = document.getElementById('ipc-3d')

$ipc3d.on('viewsListChanged', () => {
  generateViewButtons()
})

$ipc3d.on('selectionSetsListChanged', () => {
  generateSelSetButtons()
})

// ///////////////////////////////////////////////
// Projects
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
const $assetIndicator = document.querySelector('#assetIndicator')

document.getElementById('loadBike').addEventListener('click', async () => {
  const assetName = await $ipc3d.loadAsset('data/Mountain Bike.zcad')
  $assetIndicator.textContent = assetName
})
document.getElementById('loadGearbox').addEventListener('click', async () => {
  const assetName = await $ipc3d.loadAsset('data/gear_box_final_asm.stp.zcad')
  $assetIndicator.textContent = assetName
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
/* Callouts */
document.getElementById('addCallout').addEventListener('click', () => {
  if (!$ipc3d.picking) {
    $ipc3d.startPickingSession()
    document.getElementById('addCallout').classList.add('bg-gray-100')
    $ipc3d.once('pickingEnded', () => {
      document.getElementById('addCallout').classList.remove('bg-gray-100')
    })
  } else {
    $ipc3d.endPickingSession()
  }
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
  let viewName = prompt('View Name')
  while ($ipc3d.views.map(view => view.name).includes(viewName)) {
    viewName = prompt(
      'This view name already exists ! \n Please enter a new name for the View'
    )
  }
  if (viewName) $ipc3d.createView(null, viewName)
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

  $ipc3d.views.forEach((view, index) => {
    const $viewButton = document.createElement('div')
    $viewButton.className = 'border rounded bg-gray-300 px-2 hover:bg-gray-100'
    $viewButton.style.textAlign = 'center'
    $viewButton.textContent = view.name

    const setButtonActive = () => {
      $viewButton.className =
        'border rounded text-white bg-blue-300 px-2 border-blue-500'
      $viewButton.classList.add('active-view')
    }

    if ($ipc3d.getActiveViewName() == view.name) {
      setButtonActive()
    }

    $viewButton.addEventListener('click', event => {
      const $activeViewButton = document.querySelector('.active-view')
      event.stopPropagation()
      $ipc3d.activateView(index)

      if ($activeViewButton) {
        $activeViewButton.className =
          'border rounded bg-gray-300 px-2  hover:bg-gray-100'
        $activeViewButton.classList.remove('active-view')
      }

      if ($activeViewButton === $viewButton) {
        $ipc3d.deactivateView()
      } else {
        setButtonActive()
      }
    })

    // ////////////////////////////
    // Options Buttons
    const $optionsWrapper = document.createElement('div')
    $optionsWrapper.style.display = 'block'

    // Rename
    const $RenameViewButton = document.createElement('button')
    $RenameViewButton.className =
      'border rounded text-black bg-yellow-200 px-5 mx-0.5 hover:bg-yellow-150'

    const renameViewIcon = document.createElement('i')
    renameViewIcon.className = 'fa-solid fa-pen-to-square'
    $RenameViewButton.appendChild(renameViewIcon)

    $RenameViewButton.addEventListener('click', event => {
      event.stopPropagation()
      let newName = prompt('Rename View', view.name + '-renamed')
      while ($ipc3d.views.map(view => view.name).includes(newName)) {
        newName = prompt(
          `This name already exists ! \n Please enter a new name for the View \'${view.name}\'`,
          view.name + '-renamed'
        )
      }
      if (newName) $ipc3d.renameView(index, newName)
    })
    $optionsWrapper.appendChild($RenameViewButton)

    // Duplicate
    const $duplicateViewButton = document.createElement('button')
    $duplicateViewButton.className =
      'border rounded text-black bg-yellow-200 px-5 mx-0.5 hover:bg-red-150'

    const duplicateViewIcon = document.createElement('i')
    duplicateViewIcon.className = 'fa-solid fa-clone'
    $duplicateViewButton.appendChild(duplicateViewIcon)

    $duplicateViewButton.addEventListener('click', event => {
      event.stopPropagation()
      $ipc3d.duplicateView(index)
    })
    $optionsWrapper.appendChild($duplicateViewButton)

    // Delete
    const $deleteViewButton = document.createElement('button')
    $deleteViewButton.className =
      'border rounded text-black bg-red-200 px-5 ml-5 hover:bg-red-150'

    const deleteViewIcon = document.createElement('i')
    deleteViewIcon.className = 'fa-solid fa-trash'
    $deleteViewButton.appendChild(deleteViewIcon)

    $deleteViewButton.addEventListener('click', event => {
      event.stopPropagation()
      $ipc3d.deleteView(index)
    })
    $optionsWrapper.appendChild($deleteViewButton)

    $viewButton.appendChild($optionsWrapper)
    $viewButtons.appendChild($viewButton)
  })
}

// ////////////////////////////////////////////////////
// Selection Sets

document.getElementById('createSelectionSet').addEventListener('click', () => {
  let selectionSetName = prompt('Selection Set Name')
  while (
    $ipc3d.selectionSets
      .map(selectionSet => selectionSet.name)
      .includes(selectionSetName)
  ) {
    selectionSetName = prompt(
      'This view name already exists ! \n Please enter a new name for the Selection Set'
    )
  }
  if (selectionSetName) $ipc3d.createSelectionSet(null, selectionSetName)
})

function generateSelSetButtons() {
  const $selectionSetButtons = document.getElementById('selectionSetButtons')
  $selectionSetButtons.replaceChildren()

  $ipc3d.selectionSets.forEach((selectionSet, index) => {
    const $selectionSetButton = document.createElement('div')
    $selectionSetButton.className =
      'border rounded bg-gray-300 px-2 hover:bg-gray-100'
    $selectionSetButton.style.textAlign = 'center'
    $selectionSetButton.textContent = selectionSet.name

    $selectionSetButton.addEventListener('click', event => {
      event.stopPropagation()
      $ipc3d.activateSelectionSet(index)

      const $activeSelectionSetButton = document.querySelector(
        '.active-selection-set'
      )
      if ($activeSelectionSetButton) {
        $activeSelectionSetButton.className =
          'border rounded bg-gray-300 px-2 hover:bg-gray-100'
        $activeSelectionSetButton.classList.remove('active-selection-set')
      }

      if ($activeSelectionSetButton === $selectionSetButton) {
        $ipc3d.deactivateSelectionSet()
      } else {
        $selectionSetButton.className =
          'border rounded text-white bg-blue-300 px-2 border-blue-500'
        $selectionSetButton.classList.add('active-selection-set')
      }
    })

    // ////////////////////////////
    // Options Buttons
    const $optionsWrapper = document.createElement('div')
    $optionsWrapper.style.display = 'block'

    // Rename
    const $RenameSelectionSetButton = document.createElement('button')
    $RenameSelectionSetButton.className =
      'border rounded text-black bg-yellow-200 px-5 mx-0.5 hover:bg-yellow-150'

    const renameSelectionSetIcon = document.createElement('i')
    renameSelectionSetIcon.className = 'fa-solid fa-pen-to-square'
    $RenameSelectionSetButton.appendChild(renameSelectionSetIcon)

    $RenameSelectionSetButton.addEventListener('click', event => {
      event.stopPropagation()
      let newName = prompt(
        'Rename Selection Set',
        selectionSet.name + '-renamed'
      )
      while (
        $ipc3d.selectionSets
          .map(selectionSet => selectionSet.name)
          .includes(newName)
      ) {
        newName = prompt(
          `This name already exists ! \n Please enter a new name for the Selection Set \'${selectionSet.name}\'`,
          selectionSet.name + '-renamed'
        )
      }
      if (newName) $ipc3d.renameSelectionSet(index, newName)
    })
    $optionsWrapper.appendChild($RenameSelectionSetButton)

    // Duplicate
    const $duplicateSelectionSetButton = document.createElement('button')
    $duplicateSelectionSetButton.className =
      'border rounded text-black bg-yellow-200 px-5 mx-0.5 hover:bg-red-150'

    const duplicateSelectionSetIcon = document.createElement('i')
    duplicateSelectionSetIcon.className = 'fa-solid fa-clone'
    $duplicateSelectionSetButton.appendChild(duplicateSelectionSetIcon)

    $duplicateSelectionSetButton.addEventListener('click', event => {
      event.stopPropagation()
      $ipc3d.duplicateSelectionSet(index)
    })
    $optionsWrapper.appendChild($duplicateSelectionSetButton)

    // Delete
    const $deleteSelectionSetButton = document.createElement('button')
    $deleteSelectionSetButton.className =
      'border rounded text-black bg-red-200 px-5 ml-5 hover:bg-red-150'

    const deleteSelectionSetIcon = document.createElement('i')
    deleteSelectionSetIcon.className = 'fa-solid fa-trash'
    $deleteSelectionSetButton.appendChild(deleteSelectionSetIcon)

    $deleteSelectionSetButton.addEventListener('click', event => {
      event.stopPropagation()
      $ipc3d.deleteSelectionSet(index)
    })
    $optionsWrapper.appendChild($deleteSelectionSetButton)

    $selectionSetButton.appendChild($optionsWrapper)
    $selectionSetButtons.appendChild($selectionSetButton)
  })
}

// ////////////////////////////////////////////////////
// Cut Planes

document.getElementById('createCuttingPlane').addEventListener('click', () => {
  $ipc3d.addCuttingPlane()
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
