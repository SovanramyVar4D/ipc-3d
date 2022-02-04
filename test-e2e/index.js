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
})

const urlParams = new URLSearchParams(window.location.search)
if (urlParams.has('proj')) {
  const projUrl = urlParams.get('proj')
  fetch(projUrl)
    .then(response => response.text())
    .then(txt => {
      $ipc3d.loadJson(JSON.parse(txt))
    })
}

//////////////////////////////////////////////////
//  Views

document.getElementById('createView').addEventListener('click', () => {
  $ipc3d.createView()
  generateViewButtons()
})

function generateViewButtons() {
  const $viewButtons = document.getElementById('viewButtons')
  $viewButtons.replaceChildren()

  $ipc3d.views.forEach((view, index) => {
    const $button = document.createElement('button')
    $button.className = 'border rounded bg-gray-300 px-2'
    $button.textContent = view.name

    $button.addEventListener('click', () => {
      $ipc3d.activateView(index)

      $viewButtons.childNodes.forEach($button => {
        $button.style.borderColor = ''
      })
      $button.style.borderColor = 'red'
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
