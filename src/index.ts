import {
  AssetLoadContext,
  BooleanParameter,
  CADAssembly,
  CADAsset,
  CADPart,
  Color,
  EnvMap,
  GLRenderer,
  Scene,
  TreeItem,
  Vec3,
  ZeaMouseEvent,
  ZeaPointerEvent
} from '@zeainc/zea-engine'

import {ParameterValueChange, SelectionManager, SelectionXfoChange, UndoRedoManager} from '@zeainc/zea-ux'

import {View, ViewJson} from './View'
import CreateViewChange from './Changes/CreateViewChange'
import ChangeViewCamera from './Changes/ChangeViewCamera'
import {Pose, PoseJson} from './Pose'
import {SelectionSet, SelectionSetJson} from './SelectionSet'

interface AssetJson {
  url: string
}

interface ProjectJson {
  assets: AssetJson[]
  views: ViewJson[]
  selectionSets: SelectionSetJson[]
  neutralPose: PoseJson
}

class Ipd3d extends HTMLElement {
  private scene: Scene
  private renderer: GLRenderer
  private selectionManager: SelectionManager
  private undoRedoManager: UndoRedoManager
  private assets: CADAsset[] = []
  private views: View[] = []
  private selectionSets: SelectionSet[] = []
  private hiddenParts: TreeItem[] = []
  private activeView?: View
  private highlightedItem?: TreeItem

  private neutralPose: Pose

  private highlightColor = new Color(0.8, 0.2, 0.2, 0.3)
  private selectionColor = new Color(1,0.8,0, 0.6)

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

    this.neutralPose = new Pose(this.scene)

    const envMap = new EnvMap()
    envMap.load('data/StudioG.zenv')
    this.scene.setEnvMap(envMap)

    this.selectionManager = new SelectionManager(
      {
        scene: this.scene,
        renderer: this.renderer
      },
      {
        enableXfoHandles: true,
        selectionOutlineColor: this.selectionColor,
        branchSelectionOutlineColor: this.selectionColor
      }
    )
    this.selectionManager.selectionGroup.highlightFillParam.value = this.selectionColor.a

    this.undoRedoManager = UndoRedoManager.getInstance()

    this.undoRedoManager.on('changeAdded', (event: Object) => {
      // @ts-ignore
      const change = event.change
      if (change instanceof SelectionXfoChange) {
        if (this.activeView) {
          this.neutralPose.storeNeutralPose(change.treeItems)
          this.activeView.pose.storeTreeItemsPose(change.treeItems)
        } else {
          this.neutralPose.storeTreeItemsPose(change.treeItems)
        }
      } else if (change instanceof ParameterValueChange) {
        const param = <BooleanParameter>change.param
        if (this.activeView) {
          this.neutralPose.storeParamValue(param, change.prevValue, true)
          this.activeView.pose.storeParamValue(param, change.nextValue)
        } else {
          this.neutralPose.storeParamValue(param, change.nextValue)
        }
      }
    })

    this.undoRedoManager.on('changeUpdated', (event: Object) => {
      const change = this.undoRedoManager.getCurrentChange()
      if (change instanceof SelectionXfoChange) {
        if (this.activeView) {
          this.activeView.pose.storeTreeItemsPose(change.treeItems)
        } else {
          this.neutralPose.storeTreeItemsPose(change.treeItems)
        }
      }
    })

    this.renderer.setScene(this.scene)

    this.renderer.getViewport().on('pointerMove', (event: ZeaPointerEvent) => {
      if (event.intersectionData) {
        const item = this.filterItem(event.intersectionData.geomItem)
        if (item) {
          if (this.highlightedItem) {
            this.highlightedItem.removeHighlight('highlight', true)
          }
          item.addHighlight('highlight', this.highlightColor, true)
          this.highlightedItem = item
        }
      } else {
        if (this.highlightedItem) {
          this.highlightedItem.removeHighlight('highlight', true)
          this.highlightedItem = undefined
        }
      }
      event.stopPropagation()
    })

    this.renderer.getViewport().on('pointerDown', (event: ZeaPointerEvent) => {
      if (event.intersectionData) {
        const item = this.filterItem(event.intersectionData.geomItem)
        this.selectionManager.toggleItemSelection(item, !(<ZeaMouseEvent>event).ctrlKey)
      } else {
        if (!(<ZeaMouseEvent>event).ctrlKey) {
          this.selectionManager.setSelection(new Set(), true)
        }
      }
    })

    // this.renderer.getViewport().backgroundColorParam.value = new Color(.9, .4, .4)
    this.newProject()
  }

  public newProject(): void {
    this.renderer
      .getViewport()
      .getCamera()
      .setPositionAndTarget(new Vec3(2, 2, 2), new Vec3(0, 0, 0))

    this.scene.getRoot().removeAllChildren()
    this.scene.setupGrid(1000, 10)

    this.assets = []
    this.views = []

    this.undoRedoManager.flush()
  }

  public async loadAsset(url: string): Promise<void> {
    return new Promise<void>(resolve => {
      const cadAsset = new CADAsset()

      const context = new AssetLoadContext()
      context.units = 'Millimeters'

      cadAsset.load(url, context).then(() => {
        this.renderer.frameAll()
        console.log('loaded')
        resolve()
      })

      this.scene.getRoot().addChild(cadAsset)

      this.assets.push(cadAsset)
    })
  }

  private filterItem(geomItem: TreeItem) {
    let item = geomItem
    while (
        item &&
        !(item instanceof CADPart) &&
        !(item instanceof CADAssembly)
        ) {
      // console.log(item.getName(), item.getClassName())
      item = <TreeItem>item.getOwner()
    }
    return item
  }

  public frameView() {
    this.renderer.frameAll()
  }

  public createView() {
    const view = new View('View' + this.views.length, this.scene)
    if (this.activeView) {
      view.copyFrom(this.activeView)
    }
    const change = new CreateViewChange(view, this.views)
    view.setCameraParams(this.renderer.getViewport().getCamera())
    this.views.push(view)

    this.undoRedoManager.addChange(change)

    this.activeView = view
  }

  public deleteView(index: string) {}

  public activateView(index: number) {
    const view = this.views[index]
    view.activate(this.renderer.getViewport().getCamera(), this.neutralPose)

    this.activeView = view
  }

  public saveViewCamera() {
    if (this.activeView) {
      const change = new ChangeViewCamera(this.activeView)
      this.activeView.setCameraParams(this.renderer.getViewport().getCamera())
      change.updateCameraView()
      this.undoRedoManager.addChange(change)
    }
  }

  public activateNeutralPose() {
    this.neutralPose.lerpPose()
    this.activeView = undefined
  }

  public deactivateView() {
    this.activeView = undefined
  }

  // /////////////////////////////////////////
  // Selection Sets

  public createSelectionSet() {
    const set = Array.from(this.selectionManager.getSelection().values())
    this.selectionSets.push(
      new SelectionSet('SelSet' + this.selectionSets.length, set, this.scene)
    )
  }

  public activateSelectionSet(index: number) {
    const selectionSet = this.selectionSets[index]
    const set = new Set(selectionSet.items)
    this.selectionManager.setSelection(set)
  }

  public hideSelection() {
    const set = this.selectionManager.getSelection()
    set.forEach((treeItem:TreeItem) => {
      treeItem.setVisible(false)
      this.hiddenParts.push(treeItem)
    })
  }

  public unHideAll(){
    this.hiddenParts.forEach((treeItem: TreeItem) => {
      treeItem.setVisible(true)
    })
    this.hiddenParts = []
  }

  // /////////////////////////////////////////
  // Persistence

  public saveJson(): ProjectJson {
    const projectJson: ProjectJson = {
      assets: [],
      views: [],
      selectionSets: [],
      neutralPose: this.neutralPose.saveJson()
    }
    this.assets.forEach((asset: CADAsset) => {
      const assetJson: AssetJson = {
        url: asset.url
      }

      projectJson.assets.push(assetJson)
    })
    this.views.forEach((view: View) => {
      projectJson.views.push(view.saveJson())
    })
    this.selectionSets.forEach((selectionSet: SelectionSet) => {
      projectJson.selectionSets.push(selectionSet.saveJson())
    })
    return projectJson
  }

  public loadJson(projectJson: ProjectJson): Promise<void> {
    return new Promise<void>(resolve => {
      const promises: Promise<void>[] = []
      projectJson.assets.forEach((assetJson: AssetJson) => {
        promises.push(this.loadAsset(assetJson.url))
      })

      Promise.all(promises).then(() => {
        this.neutralPose.loadJson(projectJson.neutralPose)
        this.neutralPose.activate()
        this.views = []
        projectJson.views.forEach((viewJson: ViewJson) => {
          const view = new View('', this.scene)
          view.loadJson(viewJson)
          this.views.push(view)
        })
        projectJson.selectionSets.forEach(
          (selectionSetJson: SelectionSetJson) => {
            const sel = new SelectionSet('', [], this.scene)
            sel.loadJson(selectionSetJson)
            this.selectionSets.push(sel)
          }
        )

        resolve()
      })
    })
  }

  // /////////////////////////////////////////
  // Undo /Redo

  public undo() {
    this.undoRedoManager.undo()
  }

  public redo() {
    this.undoRedoManager.redo()
  }
}

customElements.define('ipc-3d', Ipd3d)
