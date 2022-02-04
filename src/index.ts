import {
  CADAsset,
  Camera,
  EnvMap,
  GLRenderer,
  Scene,
  Vec3,
  Xfo
} from '@zeainc/zea-engine'

interface AssetJson {
  url: string
}

interface ProjectJson {
  assets: AssetJson[]
}

class View {
  name = 'View'
  cameraXfo: Xfo = new Xfo()
  cameraTarget: Vec3 = new Vec3()
  constructor(name: string) {
    this.name = name
  }

  setCameraParams(camera: Camera) {
    this.cameraXfo = camera.globalXfoParam.value.clone()
    this.cameraTarget = camera.getTargetPosition()
  }

  activate(camera: Camera) {
    camera.globalXfoParam.value = this.cameraXfo.clone()
  }
}

class IPC_3D extends HTMLElement {
  private scene: Scene
  private renderer: GLRenderer
  private assets: CADAsset[] = []
  private views: View[] = []
  constructor() {
    super()

    this.attachShadow({ mode: 'open' })

    const $mainWrapper = document.createElement('div')
    $mainWrapper.style.width = '100%'
    $mainWrapper.style.height = '100%'

    const $canvas = document.createElement('canvas')
    $mainWrapper.appendChild($canvas)

    this.shadowRoot?.appendChild($mainWrapper)

    this.renderer = new GLRenderer($canvas)

    this.scene = new Scene()

    const envMap = new EnvMap()
    envMap.load('data/StudioG.zenv')
    this.scene.setEnvMap(envMap)

    this.renderer.setScene(this.scene)

    // renderer.getViewport().backgroundColorParam.value = new Color(1, 0, 0)
    this.newProject()
  }

  newProject(): void {
    this.renderer
      .getViewport()
      .getCamera()
      .setPositionAndTarget(new Vec3(2, 2, 2), new Vec3(0, 0, 0))

    this.scene.getRoot().removeAllChildren()
    this.scene.setupGrid(10, 10)
  }

  loadAsset(url: string) {
    const cadAsset = new CADAsset()
    cadAsset.load(url).then(() => {
      this.renderer.frameAll()
      console.log('loaded')
    })

    this.scene.getRoot().addChild(cadAsset)

    this.assets.push(cadAsset)
  }

  frameView() {
    this.renderer.frameAll()
  }

  createView() {
    const view = new View('View' + this.views.length)
    view.setCameraParams(this.renderer.getViewport().getCamera())
    this.views.push(view)
  }

  activateView(index: number) {
    const view = this.views[index]
    view.activate(this.renderer.getViewport().getCamera())
  }

  // /////////////////////////////////////////
  // Persistence

  saveJson(): ProjectJson {
    const projectJson: ProjectJson = { assets: [] }
    this.assets.forEach((asset: CADAsset) => {
      const assetJson: AssetJson = {
        url: asset.url
      }

      projectJson.assets.push(assetJson)
    })
    return projectJson
  }

  loadJson(projectJson: ProjectJson) {
    projectJson.assets.forEach((assetJson: AssetJson) => {
      this.loadAsset(assetJson.url)
    })
  }
}

customElements.define('ipc-3d', IPC_3D)