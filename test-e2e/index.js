const DEFAULT_INACTIVE_ITEM_BUTTON_CLASSNAME = 'border rounded bg-gray-300 px-2 hover:bg-gray-100'
const DEFAULT_ACTIVE_ITEM_BUTTON_CLASSNAME = 'border rounded text-white bg-blue-300 px-2 border-blue-500 active'
const INITIAL_VIEW_INACTIVE_BUTTON_CLASSNAME = 'initial-view-button border rounded bg-gray-600 px-2 text-white'
const INITIAL_VIEW_ACTIVE_BUTTON_CLASSNAME = 'initial-view-button border rounded bg-red-300 px-2 border-black-500 active'

const $ipc3d = document.getElementById('ipc-3d')

// Set environment map at startup
const envMap = $ipc3d.getAttribute('asset-env')
$ipc3d.setEnvironmentMap(envMap)

$ipc3d.on('assetLoaded', (assetName) => {
  console.log('loaded', assetName)
  $ipc3d.setRectangleSelectionHotKey('r')
})

$ipc3d.on('selectionSetActivatedInView', (view) => {
  document.querySelectorAll('.selection-set-button .link-view-button').forEach((linkBtn) => {
    linkBtn.remove()
  })
  displayPanel('Views')
  alert(`SelectionSet activated in View ${view.name} : ${view.selectionSet.name}`)
})

$ipc3d.on('saveKeyboardShortcutTriggered', () => {
  saveProjectOnLocalStorage()
})

$ipc3d.on('viewCameraChanged', (viewName) => {
  console.log('View camera changed : ', viewName)
})

$ipc3d.on('viewsListChanged', () => {
  generateViewButtons()
})

$ipc3d.on('initialViewActivated', () => {
  const $button = document.querySelector('div.initial-view-button')
  if ($button) {
    $button.className = INITIAL_VIEW_ACTIVE_BUTTON_CLASSNAME
    $button.querySelector('button').classList.remove('hidden')
  }
})

$ipc3d.on('initialViewDeactivated', () => {
  const $button = document.querySelector('div.initial-view-button.active')
  if ($button) {
    $button.className = INITIAL_VIEW_INACTIVE_BUTTON_CLASSNAME
    $button.querySelector('button').classList.add('hidden')
  }
})

$ipc3d.on('viewActivated', (data) => {
  const $button = activateButton(data, 'div.view-button')
  if ($button) {
    $button.classList.add('view-button')
    $button.querySelectorAll('button')
      .forEach((btn) => btn.classList.remove('hidden'))
  }
})

$ipc3d.on('viewDeactivated', () => {
  const $button = deactivateButton('div.view-button.active')
  if ($button) {
    $button.classList.add('view-button')
    $button.querySelectorAll('button')
      .forEach((btn) => btn.classList.add('hidden'))
  }
})

$ipc3d.on('selectionSetsListChanged', () => {
  generateSelSetButtons()
})

$ipc3d.on('selectionSetActivated', (data) => {
  const $button = activateButton(data, 'div.selection-set-button')
  if ($button) {
    $button.classList.add('selection-set-button')
    $button.querySelectorAll('button')
      .forEach((btn) => btn.classList.remove('hidden'))
  }
})

$ipc3d.on('selectionSetDeactivated', () => {
  const $button = deactivateButton('div.selection-set-button.active')
  if ($button) {
    $button.classList.add('selection-set-button')
    $button.querySelectorAll('button')
      .forEach((btn) => btn.classList.add('hidden'))
  }
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

    const fr = new FileReader()

    fr.onload = function () {
      $ipc3d.loadJson(JSON.parse(fr.result))
        .then(() => console.log('Project file loaded'))
    }
    fr.readAsText(projFile)
  }
  input.click()
})

document.getElementById('load').addEventListener('click', () => {
  // Local Storage
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

function downloadProjectFile() {
  const json = $ipc3d.saveJson()
  download('ipc.proj', JSON.stringify(json))
}

function saveProjectOnLocalStorage() {
  const json = $ipc3d.saveJson()
  console.log(json)
  localStorage.setItem('ipc-project', JSON.stringify(json))
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
  const assetName = await $ipc3d.loadAsset('data/Mountain Bike.zcad')
  $assetIndicator.textContent = assetName
})
document.getElementById('loadGearbox').addEventListener('click', async () => {
  const assetName = await $ipc3d.loadAsset('data/gear_box_final_asm.stp.zcad')
  $assetIndicator.textContent = assetName
})

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
    const checked = changeEvent.currentTarget.checked
    $ipc3d.selectionManager.showHandles(checked)
    $ipc3d.selectionManager.updateHandleVisibility()
  })

// Auto save
let autoSaveIntervalId
document
  .getElementById('activate-auto-save')
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
function displayPanel(panel) {
  const panels = document.querySelectorAll('.tab-panel')
  panels.forEach((tab) => {
    switch (panel) {
      case 'Views':
        if (tab.id === 'tab1') tab.style.display = ''
        else tab.style.display = 'none'
        break
      case 'Tree':
        if (tab.id === 'tab2') tab.style.display = ''
        else tab.style.display = 'none'
        break
      case 'SelectionSets':
        if (tab.id === 'tab3') tab.style.display = ''
        else tab.style.display = 'none'
        break
      case 'CuttingPlanes':
        if (tab.id === 'tab4') tab.style.display = ''
        else tab.style.display = 'none'
        break
    }
  })
}
document.querySelector('#showTab1').addEventListener('click', () => displayPanel('Views'))
document.querySelector('#showTab2').addEventListener('click', () => displayPanel('Tree'))
document.querySelector('#showTab3').addEventListener('click', () => displayPanel('SelectionSets'))
document.querySelector('#showTab4').addEventListener('click', () => displayPanel('CuttingPlanes'))

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

function generateViewButtons() {
  const $viewButtons = document.getElementById('viewButtons')
  $viewButtons.replaceChildren()

  // //////////////////////////////////////////
  // Initial View (no editable/exportable view)
  const $initialViewButton = document.createElement('div')

  $initialViewButton.className = INITIAL_VIEW_INACTIVE_BUTTON_CLASSNAME
  $initialViewButton.style.textAlign = 'center'
  $initialViewButton.textContent = 'Initial View'

  $initialViewButton.addEventListener('click', () => {
    const isInitialViewButtonActive = $initialViewButton.classList.contains('active')
    if (isInitialViewButtonActive) {
      $ipc3d.deactivateView()
    } else {
      $ipc3d.deactivateView()
      $ipc3d.activateInitialView()
    }
  })
  /// Options Buttons ///
  const $optionsWrapper = document.createElement('div')
  $optionsWrapper.style.display = 'block'

  // Save View Camera
  const $saveViewCameraButton = document.createElement('button')
  $saveViewCameraButton.className = 'hidden border rounded text-black bg-yellow-200 px-5 mx-0.5 hover:bg-yellow-150'

  const $saveViewCameraIcon = document.createElement('i')
  $saveViewCameraIcon.className = 'fa-solid fa-video'
  $saveViewCameraButton.appendChild($saveViewCameraIcon)

  $saveViewCameraButton.addEventListener('click', (event) => {
    const changeCameraViewPoint = confirm("Are you sure to change the initial view camera viewpoint ?")
    if (changeCameraViewPoint) $ipc3d.saveViewCamera()
  })
  $optionsWrapper.appendChild($saveViewCameraButton)
  $initialViewButton.appendChild($optionsWrapper)

  $viewButtons.appendChild($initialViewButton)


  // //////////////////////////////////////////
  // Editable Views
  $ipc3d.views.forEach((view, index) => {
    const $viewButton = document.createElement('div')
    $viewButton.className = 'view-button border rounded bg-gray-300 px-2  hover:bg-gray-100'
    $viewButton.style.textAlign = 'center'
    $viewButton.textContent = view.name

    $viewButton.addEventListener('click', (event) => {
      const $activeViewButton = document.querySelector('div.view-button.active')
       if ($activeViewButton === $viewButton) {
         $ipc3d.deactivateView()
       } else {
         $ipc3d.deactivateView()
         $ipc3d.activateView(index)
       }
      event.stopPropagation()
    })

    /// Options Buttons ///
    const $optionsWrapper = document.createElement('div')
    $optionsWrapper.style.display = 'block'

    // Rename
    const $RenameViewButton = document.createElement('button')
    $RenameViewButton.className =
      'hidden border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-yellow-150'
    setTooltip($RenameViewButton, 'Rename')

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
      event.stopPropagation()
    })
    $optionsWrapper.appendChild($RenameViewButton)

    // Duplicate
    const $duplicateViewButton = document.createElement('button')
    $duplicateViewButton.className =
      'hidden border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-yellow-150'
    setTooltip($duplicateViewButton, 'Duplicate')

    const duplicateViewIcon = document.createElement('i')
    duplicateViewIcon.className = 'fa-solid fa-clone'
    $duplicateViewButton.appendChild(duplicateViewIcon)

    $duplicateViewButton.addEventListener('click', event => {
      event.stopPropagation()
      $ipc3d.duplicateView(index)
      event.stopPropagation()
    })
    $optionsWrapper.appendChild($duplicateViewButton)

    // Save View Camera
    const $saveViewCameraButton = document.createElement('button')
    $saveViewCameraButton.className = 'hidden border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-yellow-150'
    setTooltip($saveViewCameraButton, 'Save viewpoint')

    const $saveViewCameraIcon = document.createElement('i')
    $saveViewCameraIcon.className = 'fa-solid fa-video'
    $saveViewCameraButton.appendChild($saveViewCameraIcon)

    $saveViewCameraButton.addEventListener('click', (event) => {
      $ipc3d.saveViewCamera()
      event.stopPropagation()
    })
    $optionsWrapper.appendChild($saveViewCameraButton)

    // Link SelectionSet
    const $linkSelectionSetButton = document.createElement('button')
    $linkSelectionSetButton.className = 'hidden border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-yellow-150'
    if ($ipc3d.views[index].selectionSet === undefined) {
      setTooltip($linkSelectionSetButton, 'Link SelectionSet')
    } else {
      setTooltip($linkSelectionSetButton, `Linked SelectionSet : ${$ipc3d.views[index].selectionSet.name}&#013;Click to change`)
    }

    const $linkSelectionSetIcon = document.createElement('i')
    $linkSelectionSetIcon.className = 'fa-solid fa-link'
    $linkSelectionSetButton.appendChild($linkSelectionSetIcon)

    $linkSelectionSetButton.addEventListener('click', (event) => {
      $ipc3d.deactivateSelectionSet()
      displayPanel("SelectionSets")

      document.querySelectorAll('.selection-set-button').forEach((btn) => {
        const $linkViewBtn = document.createElement('button')
        $linkViewBtn.className = 'hidden border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-yellow-150 link-view-button'
        setTooltip($linkViewBtn, 'Link View')

        const $linkViewIcon = document.createElement('i')
        $linkViewIcon.className = 'fa-solid fa-link'

        $linkViewBtn.addEventListener('click', (event) => {
          const currentElement = event.currentTarget
          const container = currentElement.closest('.selection-set-button')
          const currentSelectionSet =  $ipc3d.selectionSets.find((selSet) => selSet.name === container.textContent)
          $ipc3d.activateSelectionSetInActiveView(currentSelectionSet)

          event.stopPropagation()
        })
        $linkViewBtn.appendChild($linkViewIcon)
        btn.querySelector('.delete-button').before($linkViewBtn)
      })
      event.stopPropagation()
    })

    $optionsWrapper.appendChild($linkSelectionSetButton)

    // Delete
    const $deleteViewButton = document.createElement('button')
    $deleteViewButton.className =
      'hidden border rounded text-black bg-red-200 px-2 ml-5 hover:bg-red-150'
    setTooltip($deleteViewButton, 'Delete')

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
    $selectionSetButton.className = 'selection-set-button border rounded bg-gray-300 px-2 hover:bg-gray-100'
    $selectionSetButton.style.textAlign = 'center'
    $selectionSetButton.textContent = selectionSet.name

    $selectionSetButton.addEventListener('click', (event) => {
      const $activeSelectionSetButton = document.querySelector('div.selection-set-button.active')

      if ($activeSelectionSetButton === $selectionSetButton) {
        $ipc3d.deactivateSelectionSet()
      } else {
        $ipc3d.deactivateSelectionSet()
        $ipc3d.activateSelectionSet(index)
      }

      event.stopPropagation()
    })

    // ////////////////////////////
    // Options Buttons
    const $optionsWrapper = document.createElement('div')
    $optionsWrapper.style.display = 'block'

    // Rename
    const $RenameSelectionSetButton = document.createElement('button')
    $RenameSelectionSetButton.className =
      'hidden border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-yellow-150'
    $RenameSelectionSetButton.className = 'hidden border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-yellow-150'
    setTooltip($RenameSelectionSetButton, 'Rename')

    const renameSelectionSetIcon = document.createElement('i')
    renameSelectionSetIcon.className = 'fa-solid fa-pen-to-square'
    $RenameSelectionSetButton.appendChild(renameSelectionSetIcon)

    $RenameSelectionSetButton.addEventListener('click', event => {
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

      event.stopPropagation()
    })
    $optionsWrapper.appendChild($RenameSelectionSetButton)

    // Duplicate
    const $duplicateSelectionSetButton = document.createElement('button')
    $duplicateSelectionSetButton.className =
      'hidden border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-red-150'
    setTooltip($duplicateSelectionSetButton, 'Duplicate')

    const duplicateSelectionSetIcon = document.createElement('i')
    duplicateSelectionSetIcon.className = 'fa-solid fa-clone'

    $duplicateSelectionSetButton.addEventListener('click', () => $ipc3d.duplicateSelectionSet(index))

    $duplicateSelectionSetButton.appendChild(duplicateSelectionSetIcon)

    $duplicateSelectionSetButton.addEventListener('click', event => {
      event.stopPropagation()
      $ipc3d.duplicateSelectionSet(index)
    })
    $optionsWrapper.appendChild($duplicateSelectionSetButton)

    // Update
    const $updateSelectionSetButton = document.createElement('button')
    $updateSelectionSetButton.className = 'hidden border rounded text-black bg-yellow-200 px-2 mx-0.5 hover:bg-red-150'
    setTooltip($updateSelectionSetButton, 'Update')

    const $updateSelectionSetIcon = document.createElement('i')
    $updateSelectionSetIcon.className = 'fa-solid fa-arrows-rotate'

    $updateSelectionSetButton.addEventListener('click', (event) => {
      $ipc3d.updateSelectionSet(index)
      alert("SelectionSet updated !")
    })

    $updateSelectionSetButton.appendChild($updateSelectionSetIcon)
    $optionsWrapper.appendChild($updateSelectionSetButton)

    // Delete
    const $deleteSelectionSetButton = document.createElement('button')
    $deleteSelectionSetButton.className =
      'hidden border rounded text-black bg-red-200 px-5 ml-5 hover:bg-red-150'

    const deleteSelectionSetIcon = document.createElement('i')
    deleteSelectionSetIcon.className = 'fa-solid fa-trash'

    $deleteSelectionSetButton.addEventListener('click', event => {
      $ipc3d.deleteSelectionSet(index)
      event.stopPropagation()
    })

    $deleteSelectionSetButton.appendChild(deleteSelectionSetIcon)
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

function activateButton(btnText, selector) {
  const $buttonToActivate =
    [...document.querySelectorAll(selector)]
      .find((btn) => btn.innerText === btnText)

  if ($buttonToActivate) {
    $buttonToActivate.className = DEFAULT_ACTIVE_ITEM_BUTTON_CLASSNAME
  }
  return $buttonToActivate
}

function deactivateButton(selector) {
  const $buttonToDeactivate = document.querySelector(selector)

  if ($buttonToDeactivate) {
    $buttonToDeactivate.className = DEFAULT_INACTIVE_ITEM_BUTTON_CLASSNAME
  }
  return $buttonToDeactivate
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
