const CURRENT_CLASS = 'current'
const INITIAL_VIEW_INACTIVE_BUTTON_CLASSNAME = 'view-button initial-view-button border rounded p-2'

const $ipc3d = document.getElementById('ipc-3d')

// Set environment map at startup
const envMap = $ipc3d.getAttribute('asset-env')
$ipc3d.setEnvironmentMap(envMap)

$ipc3d.on('assetLoaded', (assetName) => {
  // console.log(envMap)
  console.log('loaded', assetName)
  $ipc3d.setRectangleSelectionHotKey('r')

  // update initialview viewpoint
  $ipc3d.frameView()
  $ipc3d.initialView.setCameraParams(
    $ipc3d.renderer.getViewport().getCamera()
  )
})

$ipc3d.on('selectionSetAttachedToCurrentView', (view) => {
  console.log(`SelectionSet activated in View ${view.name}`)
})

$ipc3d.on('saveKeyboardShortcutTriggered', () => {
  saveProjectOnLocalStorage()
})

$ipc3d.on('viewCameraChanged', (viewName) => {
  console.log('View camera changed : ', viewName)
})

$ipc3d.on('viewsListChanged', () => {
  console.log('viewsListChanged')
  generateViewList()
})

$ipc3d.on('initialViewActivated', () => {
  console.log('initialViewActivated')
  deactivateAll('.view-button')
  const $button = document.querySelector('.initial-view-button')
  if ($button) {
    $button.classList.add(CURRENT_CLASS)
  }
  updateSelectionSetList()
})

$ipc3d.on('viewActivated', (data) => {
  console.log('viewActivated', data)
  deactivateAll('.view-button')
  activateButton(data, '.view-button')
  updateSelectionSetList()
})

$ipc3d.on('selectionSetsListChanged', () => {
  console.log('selectionSetsListChanged')
  generateSelectionSetList()
  updateSelectionSetList()
})

$ipc3d.on('selectionSetActivated', (data) => {
  activateButton(data, '.selection-set-button')
})

$ipc3d.on('selectionSetDeactivated', () => {
  deactivateButton(`div.selection-set-button.${CURRENT_CLASS}`)
})

// ///////////////////////////////////////////////
// Projects
document.getElementById('newProject').addEventListener('click', () => {
  $ipc3d.newProject()
})

document.getElementById('save').addEventListener('click', () => {
  saveProjectOnLocalStorage()
})

document.getElementById('save-as').addEventListener('click', () => {
  downloadProjectFile()
})

document.getElementById('loadProjectFile').addEventListener('click', () => {
  // File picker
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.proj'

  input.onchange = (event) => {
    const projFile = event.target.files[0]

    const fileReader = new FileReader()

    fileReader.onload = () => {
      $ipc3d.loadJson(JSON.parse(fileReader.result))
        .then(() => console.log('Project file loaded'))
    }
    fileReader.readAsText(projFile)
  }
  input.click()
})

function loadProjectFromLocalStorage () {
  // Local Storage
  const jsonStr = localStorage.getItem('ipc-project')

  if (!jsonStr) {
    console.warn('No project data available')
    return
  }
  $ipc3d.loadJson(JSON.parse(jsonStr))
    .then(() => console.log('Last project reloaded.'))
}

document.getElementById('load').addEventListener('click', () => {
  loadProjectFromLocalStorage()
})

const urlParams = new URLSearchParams(window.location.search)
if (urlParams.has('proj')) {
  const projUrl = urlParams.get('proj')
  fetch(projUrl)
    .then(response => response.text())
    .then(txt => {
      $ipc3d.loadJson(JSON.parse(txt))
        .then(() => console.log(`Project '${projUrl}' loaded from URL`))
    })
} else {
  loadProjectFromLocalStorage()
}

function downloadProjectFile() {
  const projectJson = $ipc3d.saveJson()
  download('ipc.proj', JSON.stringify(projectJson))
}

function saveProjectOnLocalStorage() {
  const projectJson = $ipc3d.saveJson()
  console.log('saveProjectOnLocalStorage', projectJson)
  localStorage.setItem('ipc-project', JSON.stringify(projectJson))
}

function download(file, text) {
  //creating an invisible element
  const element = document.createElement('a')
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

// ///////////////////////////////////////////////
// Undo and Redo

document.getElementById('undo').addEventListener('click', () => {
  console.log('undo')
  $ipc3d.undo()
})
document.getElementById('redo').addEventListener('click', () => {
  console.log('redo')
  $ipc3d.redo()
})

$ipc3d.undoRedoManager.on('changeAdded', () => console.log('changeAdded'))
$ipc3d.undoRedoManager.on('changeUndone', () => console.log('changeUndone'))
$ipc3d.undoRedoManager.on('changeRedone', () => console.log('changeRedone'))


// ///////////////////////////////////////////////
// Assets
document.getElementById('loadAsset').addEventListener('click',  event => {
  window.URL = window.URL || window.webkitURL

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.zcad'

  input.onchange = async (event) => {
    const projFile = event.target.files[0]
    const projFilePath = window.URL.createObjectURL(projFile)

    await $ipc3d.loadAsset(projFilePath)
      .then((assetName) => {
        window.URL.revokeObjectURL(projFilePath)
        $assetIndicator.textContent = assetName
      })
  }
  input.click()

  event.stopPropagation()
})

const $assetIndicator = document.querySelector('#assetIndicator')

document.getElementById('loadBike').addEventListener('click', async () => {
  $assetIndicator.textContent = await $ipc3d.loadAsset('data/Mountain Bike.zcad')
})
document.getElementById('loadGearbox').addEventListener('click', async () => {
  $assetIndicator.textContent = await $ipc3d.loadAsset('data/gear_box_final_asm.stp.zcad')
})

/* Fit scene/parts */
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
document.getElementById('enable-handle').addEventListener('change', changeEvent => {
  const checked = changeEvent.currentTarget.checked
  $ipc3d.selectionManager.showHandles(checked)
  $ipc3d.selectionManager.updateHandleVisibility()
})

// Auto save
let autoSaveIntervalId
document.getElementById('activate-auto-save')
  .addEventListener('change', changeEvent => {
    const delayTextField = document.getElementById('auto-save-delay')
    delayTextField.setAttribute('disabled', 'disabled')
    const delay = parseInt(delayTextField.value, 10)

    const checked = changeEvent.currentTarget.checked
    if (checked && delay) {
      autoSaveIntervalId = setInterval(() => this.saveProjectOnLocalStorage(), delay)
    }
    else {
      clearInterval(autoSaveIntervalId)
      delayTextField.removeAttribute('disabled')
    }
    changeEvent.stopPropagation()
  })


// ////////////////////////////////////////////////
//  Tabs
function displayPanel(tabId) {
  document.querySelectorAll('[data-tab-id]').forEach(($button) => {
    if ($button.getAttribute('data-tab-id') === tabId) {
      $button.classList.add('active')
    } else {
      $button.classList.remove('active')
    }
  })

  document.querySelectorAll('.tab-panel').forEach(($tab) => {
    if ($tab.id === tabId) {
      $tab.style.display = ''
    } else {
      $tab.style.display = 'none'
    }
  })
}
document.querySelectorAll('[data-tab-id]')
  .forEach((elem) => {
    elem.addEventListener('click', (event) => {
        let $tabButton = event.currentTarget
        let tabId = $tabButton.getAttribute('data-tab-id')
        displayPanel(tabId)
      })
    })

// ////////////////////////////////////////////////
//  Tree view
//const $treeView = document.querySelector('#treeView')


// ////////////////////////////////////////////////
//  Views

document.getElementById('createView').addEventListener('click', () => {
  const viewName = prompt('View Name').trim()
  if ($ipc3d.hasViewWithName(viewName)) {
    alert(`This view '${viewName}' already exists !`)
  } else if (viewName === '') {
    alert(`Invalid view name`)
  } else {
    $ipc3d.createView(viewName)
  }
})

function generateInitialViewButton($viewButtons) {
  const $initialViewButton = document.createElement('div')
  $initialViewButton.className = INITIAL_VIEW_INACTIVE_BUTTON_CLASSNAME

  const $initialViewText = document.createElement('span')
  $initialViewText.textContent = 'Initial View'
  $initialViewButton.appendChild($initialViewText)

  $initialViewButton.addEventListener('click', () => {
    const isInitialViewButtonActive = $initialViewButton.classList.contains(CURRENT_CLASS)
    if (!isInitialViewButtonActive) {
      $ipc3d.activateInitialView()
    }
  })

  // Save View Camera
  const $saveViewCameraButton = document.createElement('button')
  $saveViewCameraButton.className = 'border rounded text-black bg-green-200 px-2'

  const $saveViewCameraIcon = document.createElement('i')
  $saveViewCameraIcon.className = 'fa-solid fa-video'
  $saveViewCameraButton.appendChild($saveViewCameraIcon)

  $saveViewCameraButton.addEventListener('click', (event) => {
    event.stopPropagation()
    const changeCameraViewPoint = confirm("Are you sure to change the initial view camera viewpoint ?")
    if (changeCameraViewPoint) {
      $ipc3d.saveViewCamera()
    }
  })
  $initialViewButton.appendChild($saveViewCameraButton)


  $viewButtons.appendChild($initialViewButton)

  return $initialViewButton
}

function generateOneEditableViewButton (view, index) {
  const $viewButton = document.createElement('div')
  $viewButton.className = 'view-button border rounded bg-gray-300 px-2 hover:bg-gray-100'

  const $viewButtonText = document.createElement('span')
  $viewButtonText.textContent = view.name
  $viewButton.appendChild($viewButtonText)

  $viewButton.addEventListener('click', (event) => {
    $ipc3d.activateView(index)
    event.stopPropagation()
  })

  generateEditableViewActions(view, index, $viewButton)
  return $viewButton
}

function generateEditableViewActions (view, index, $viewButton) {
  // Rename
  const $renameViewButton = document.createElement('button')
  $renameViewButton.className = 'border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-yellow-150'
  setTooltip($renameViewButton, 'Rename')

  const renameViewIcon = document.createElement('i')
  renameViewIcon.className = 'fa-solid fa-pen-to-square'
  $renameViewButton.appendChild(renameViewIcon)

  $renameViewButton.addEventListener('click', event => {
    event.stopPropagation()
    let newName = prompt('Rename View', view.name).trim()
    if ($ipc3d.hasViewWithName(newName)) {
      alert(`This name already exists !`)
    } else if (newName === '') {
      alert(`Invalid name`)
    } else {
      $ipc3d.renameView(index, newName)
    }
    event.stopPropagation()
  })
  $viewButton.appendChild($renameViewButton)

  // Duplicate
  const $duplicateViewButton = document.createElement('button')
  $duplicateViewButton.className = 'border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-yellow-150'
  setTooltip($duplicateViewButton, 'Duplicate')

  const duplicateViewIcon = document.createElement('i')
  duplicateViewIcon.className = 'fa-solid fa-clone'
  $duplicateViewButton.appendChild(duplicateViewIcon)

  $duplicateViewButton.addEventListener('click', event => {
    event.stopPropagation()

    let newName = prompt('Duplicate view', view.name).trim()
    if ($ipc3d.hasViewWithName(newName)) {
      alert(`This name already exists !`)
    } else if (newName === '') {
      alert(`Invalid name`)
    } else {
      $ipc3d.duplicateView(index, newName)
    }

  })
  $viewButton.appendChild($duplicateViewButton)

  // Save View Camera
  const $saveViewCameraButton = document.createElement('button')
  $saveViewCameraButton.className = 'border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-yellow-150'
  setTooltip($saveViewCameraButton, 'Save viewpoint')

  const $saveViewCameraIcon = document.createElement('i')
  $saveViewCameraIcon.className = 'fa-solid fa-video'
  $saveViewCameraButton.appendChild($saveViewCameraIcon)

  $saveViewCameraButton.addEventListener('click', (event) => {
    event.stopPropagation()
    $ipc3d.saveViewCamera()
  })
  $viewButton.appendChild($saveViewCameraButton)

  // Delete
  const $deleteViewButton = document.createElement('button')
  $deleteViewButton.className = 'border rounded text-black bg-red-200 px-2 ml-5 hover:bg-red-150'
  setTooltip($deleteViewButton, 'Delete')

  const deleteViewIcon = document.createElement('i')
  deleteViewIcon.className = 'fa-solid fa-trash'
  $deleteViewButton.appendChild(deleteViewIcon)

  $deleteViewButton.addEventListener('click', event => {
    event.stopPropagation()

    if (confirm('Confirm view deletion')) {
      $ipc3d.deleteView(index)
    }
  })
  $viewButton.appendChild($deleteViewButton)
}

function generateEditableViews ($viewButtons) {
  $ipc3d.views.forEach((view, index) => {
    const $viewButton = generateOneEditableViewButton(view, index)
    $viewButtons.appendChild($viewButton)
  })
}

function generateViewList() {
  const $viewButtons = document.getElementById('viewButtons')
  $viewButtons.replaceChildren() // Clear previous content

  // //////////////////////////////////////////
  // Initial View (no editable/exportable view)
  const $initialViewButton = generateInitialViewButton($viewButtons)
  $initialViewButton.classList.add(CURRENT_CLASS)

  // //////////////////////////////////////////
  // Editable Views
  generateEditableViews($viewButtons)
}

// The project already has an 'initialView' so we need to display it.
generateViewList()

// ////////////////////////////////////////////////////
// Selection Sets

document.getElementById('createSelectionSet').addEventListener('click', () => {
  let selectionSetName = prompt('Selection Set Name').trim()
  if ($ipc3d.hasSelectionSetWithName(selectionSetName)) {
   alert('This selection set name already exists !')
  } else if (selectionSetName === '') {
    alert('Invalid selection set name')
  } else {
    $ipc3d.createSelectionSet(selectionSetName)
  }
})

function generateOneSelectionSetButton (selectionSet, index) {
  const $selectionSetButton = document.createElement('div')
  $selectionSetButton.className = 'selection-set-button border rounded bg-gray-300 px-2 hover:bg-gray-100'

  const $selectionSetText = document.createElement('span')
  $selectionSetText.textContent = selectionSet.name
  $selectionSetButton.appendChild($selectionSetText)

  $selectionSetButton.addEventListener('click', (event) => {
    event.stopPropagation()
    const $activeSelectionSetButton = document.querySelector(`div.selection-set-button.${CURRENT_CLASS}`)
    $ipc3d.deactivateSelectionSet()
    if ($activeSelectionSetButton !== $selectionSetButton) {
      $ipc3d.activateSelectionSet(index)
    }
  })

  // Rename
  const $renameSelectionSetButton = document.createElement('button')
  $renameSelectionSetButton.className = 'border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-yellow-150'
  setTooltip($renameSelectionSetButton, 'Rename')

  const renameSelectionSetIcon = document.createElement('i')
  renameSelectionSetIcon.className = 'fa-solid fa-pen-to-square'
  $renameSelectionSetButton.appendChild(renameSelectionSetIcon)

  $renameSelectionSetButton.addEventListener('click', event => {
    event.stopPropagation()
    const newName = prompt('Rename Selection Set', selectionSet.name).trim()

    if ($ipc3d.hasSelectionSetWithName(newName)) {
      alert(`This name already exists !`)
    } else if (newName === '') {
      alert(`Invalid selection set name`)
    } else {
      $ipc3d.renameSelectionSet(index, newName)
    }
  })
  $selectionSetButton.appendChild($renameSelectionSetButton)

  // Update
  const $updateSelectionSetButton = document.createElement('button')
  $updateSelectionSetButton.className = 'border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-red-150'
  setTooltip($updateSelectionSetButton, 'Update')

  const $updateSelectionSetIcon = document.createElement('i')
  $updateSelectionSetIcon.className = 'fa-solid fa-floppy-disk'

  $updateSelectionSetButton.addEventListener('click', () => {
    $ipc3d.updateSelectionSet(index)
    alert('SelectionSet saved !')
  })

  $updateSelectionSetButton.appendChild($updateSelectionSetIcon)
  $selectionSetButton.appendChild($updateSelectionSetButton)

  // Delete
  const $deleteSelectionSetButton = document.createElement('button')
  $deleteSelectionSetButton.className = 'delete-button border rounded text-black bg-red-200 px-5 ml-5 hover:bg-red-150'

  const deleteSelectionSetIcon = document.createElement('i')
  deleteSelectionSetIcon.className = 'fa-solid fa-trash'
  $deleteSelectionSetButton.appendChild(deleteSelectionSetIcon)
  $deleteSelectionSetButton.addEventListener('click', event => {
    event.stopPropagation()
    if (confirm('Confirm selection set deletion')) {
      $ipc3d.deleteSelectionSet(index)
    }
  })
  $selectionSetButton.appendChild($deleteSelectionSetButton)

  // Active in view
  const $activateSelectionSetInViewCheck = document.createElement('input')
  $activateSelectionSetInViewCheck.type = 'checkbox'
  $activateSelectionSetInViewCheck.className = 'delete-button border rounded text-black bg-red-200 px-5 ml-5 hover:bg-red-150'

  $activateSelectionSetInViewCheck.addEventListener('click', event => {
    event.stopPropagation()
    if (event.currentTarget.checked) {
      $ipc3d.attachSelectionSetToCurrentView(selectionSet)
    } else {
      $ipc3d.detachSelectionSetFromCurrentView(selectionSet)
    }
  })
  $selectionSetButton.appendChild($activateSelectionSetInViewCheck)

  if ($ipc3d.currentView) {
    $ipc3d.currentView.hasActiveSelectionSetWithName(selectionSet.name)
  }

  return $selectionSetButton
}

function generateSelectionSetList() {
  const $selectionSetButtons = document.getElementById('selectionSetButtons')
  $selectionSetButtons.replaceChildren() // Clear old content

  $ipc3d.selectionSets.forEach((selectionSet, index) => {
    const $selectionSetButton = generateOneSelectionSetButton(selectionSet, index)
    $selectionSetButtons.appendChild($selectionSetButton)
  })
}

function updateSelectionSetList() {
  const isOnInitialView = ($ipc3d.currentView == null)
  const $selectionSetButtons = document.querySelectorAll('.selection-set-button')
  $selectionSetButtons.forEach(($selectionSetButton) => {
    const selectionSetName = $selectionSetButton.querySelector('span').textContent
    const activeCheckBox = $selectionSetButton.querySelector('input[type=checkbox]')

    if (isOnInitialView) {
      // Initial view => you can't check the boxes
      activeCheckBox.checked = false
      activeCheckBox.disabled = true
    } else {
      activeCheckBox.checked = $ipc3d.currentView.hasActiveSelectionSetWithName(selectionSetName)
      activeCheckBox.disabled = false
    }

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

// ///////////////////////////
// HTML
function setTooltip($buttonElement, title) {
  $buttonElement.setAttribute('data-bs-toggle', 'tooltip')
  $buttonElement.setAttribute('data-bs-placement', 'bottom')
  $buttonElement.setAttribute('title', title)
}

function deactivateAll(selector) {
  const $buttonToActivate = [...document.querySelectorAll(selector)]
  if ($buttonToActivate) {
    $buttonToActivate.forEach($button => $button.classList.remove(CURRENT_CLASS))
  }
}

function activateButton(btnText, selector) {
  const $buttonToActivate = [...document.querySelectorAll(selector)]
      .find((btn) => btn.innerText === btnText)
  if ($buttonToActivate) {
    $buttonToActivate.classList.add(CURRENT_CLASS)
  }
}

function deactivateButton(selector) {
  const $buttonToDeactivate = document.querySelector(selector)
  if ($buttonToDeactivate) {
    $buttonToDeactivate.classList.remove(CURRENT_CLASS)
  }
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
  if ($footer.classList.toggle('hidden')) {
    $ipc3d.setSelectionFillParamValue(0.5)
  } else {
    $ipc3d.setSelectionFillParamValue(0)
  }
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
