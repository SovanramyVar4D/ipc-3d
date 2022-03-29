import {
  AssetLoadContext,
  BillboardItem,
  BooleanParameter,
  CADAssembly,
  CADAsset,
  CADPart,
  Camera,
  Color,
  EnvMap,
  EventEmitter,
  FlatSurfaceMaterial,
  GeomItem,
  GLRenderer,
  Label,
  Lines,
  Material,
  Ray,
  Scene,
  Sphere,
  StandardSurfaceMaterial,
  TreeItem,
  Vec2,
  Vec3,
  Vec3Attribute,
  Xfo,
  ZeaMouseEvent,
  ZeaPointerEvent
} from '@zeainc/zea-engine'

import {
  ParameterValueChange,
  SelectionManager,
  SelectionTool,
  SelectionXfoChange,
  UndoRedoManager
} from '@zeainc/zea-ux'

import './ParamEditor'

import { View, ViewJson } from './View'
import CreateViewChange from './Changes/CreateViewChange'
import ChangeViewCamera from './Changes/ChangeViewCamera'
import { Pose, PoseJson } from './Pose'
import { SelectionSet, SelectionSetJson } from './SelectionSet'

import CuttingPlaneWrapper, { CuttingPlaneJson } from './CuttingPlane'
import DeleteViewChange from './Changes/DeleteViewChange'
import RenameViewChange from './Changes/RenameViewChange'
import CreateSelectionSetChange from './Changes/CreateSelectionSetChange'
import DeleteSelectionSetChange from './Changes/DeleteSelectionSetChange'
import RenameSelectionSetChange from './Changes/RenameSelectionSetChange'

interface AssetJson {
  url: string
}

interface ProjectJson {
  assets: AssetJson[]
  views: ViewJson[]
  selectionSets: SelectionSetJson[]
  cuttingPlanes: CuttingPlaneJson[]
  neutralPose: PoseJson
  materials: Record<string, any>[]
  materialAssignments: Record<string, number>
}

class Ipd3d extends HTMLElement {
  private scene: Scene
  private renderer: GLRenderer
  private selectionManager: SelectionManager
  private undoRedoManager: UndoRedoManager
  private assets: CADAsset[] = []
  private views: View[] = []
  private cuttingPlanes: CuttingPlaneWrapper[] = []
  private selectionSets: SelectionSet[] = []
  private hiddenParts: TreeItem[] = []
  private activeView?: View
  private highlightedItem?: TreeItem

  private rectangleSelectionHotKey: string | undefined
  private rectangleSelectionOn: boolean = false

  private neutralPose: Pose
  private initialView!: View

  private materials: Material[] = []
  private materialAssignments: Record<string, number> = {}

  picking = false
  private callouts: BillboardItem[] = []

  // private highlightColor = new Color(0.8, 0.2, 0.2, 0.3)
  private selectionColor = new Color(1, 0.8, 0, 0.5)

  private eventEmitter = new EventEmitter()

  private autoSaveIntervalId?: NodeJS.Timer

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
    // this.renderer.outlineThickness = 0.5
    this.renderer.outlineSensitivity = 5

    this.scene = new Scene()

    // Replaced by an Initial View
    this.neutralPose = new Pose(this.scene)

    const envMap = new EnvMap()
    envMap.load('data/StudioG.zenv')
    this.scene.setEnvMap(envMap)

    // ////////////////////////////////////////////
    // Setup Selection Manager
    const selectionOutlineColor = new Color('gold')
    selectionOutlineColor.a = 0.1
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
    this.selectionManager.selectionGroup.highlightFillParam.value =
      selectionOutlineColor.a

    // this.selectionManager.on('selectionChanged', (event: any) => {
    //   console.log('selectionChanged', event)
    // })
    this.selectionManager.on('leadSelectionChanged', (event: any) => {
      // console.log('leadSelectionChanged', event)
      this.eventEmitter.emit('leadSelectionChanged', event)
    })

    this.undoRedoManager = UndoRedoManager.getInstance()

    // ////////////////////////////////////////////
    // Setup Selection Tool

    const cameraManipulator = this.renderer.getViewport().getManipulator()
    const selectionTool = new SelectionTool({
      scene: this.scene,
      renderer: this.renderer,
      selectionManager: this.selectionManager
    })

    selectionTool.selectionRectMat.getParameter('BaseColor')!.value = new Color(
      0.2,
      0.2,
      0.2
    )

    const setToolToSelectionTool = () => {
      this.renderer.getViewport().setManipulator(selectionTool)
      this.activateRectangleSelection()
    }

    const setToolToCameraManipulator = () => {
      this.renderer.getViewport().setManipulator(cameraManipulator)
      this.deactivateRectangleSelection()
    }

    // ////////////////////////////////////////////
    // HotKeys

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.key) {
        case 'q':
          if (!this.rectangleSelectionOn) setToolToSelectionTool()
      }
    })

    document.addEventListener('keyup', (e: KeyboardEvent) => {
      switch (e.key) {
        case 'q':
          if (this.rectangleSelectionOn) setToolToCameraManipulator()
          break
        case 's':
          if (!selectionOn) setToolToSelectionTool()
          if (e.ctrlKey) {
            e.preventDefault()
            this.eventEmitter.emit('saveKeyboardShortcutTriggered')
          }
          break
        case 'n':
          if (e.ctrlKey) this.newProject()
          break
        case 'y':
          if (e.ctrlKey) this.redo()
          break
        case 'z':
          if (e.ctrlKey) this.undo()
          break
      }
    })
    // ////////////////////////////////////////////
    // Pose Editing

    this.undoRedoManager.on('changeAdded', (event: Object) => {
      // @ts-ignore
      const change = event.change
      if (change instanceof SelectionXfoChange) {
        if (this.activeView && this.activeView !== this.initialView) {
          this.neutralPose.storeNeutralPose(change.treeItems)
          this.activeView.pose.storeTreeItemsPose(change.treeItems)
        } else {
          this.neutralPose.storeTreeItemsPose(change.treeItems)
        }
      }
    })

    this.undoRedoManager.on('changeUpdated', (event: Object) => {
      const change = this.undoRedoManager.getCurrentChange()
      if (change instanceof SelectionXfoChange) {
        if (this.activeView && this.activeView !== this.initialView) {
          this.activeView.pose.storeTreeItemsPose(change.treeItems)
        }
      } else if (change instanceof ParameterValueChange) {
        const param = change.param
        if (this.activeView && this.activeView !== this.initialView) {
          this.activeView.pose.storeParamValue(param, change.nextValue)
        }
      }
    })

    this.renderer.setScene(this.scene)

    // Disabling the highlighting as it is distracting.
    this.renderer.getViewport().on('pointerMove', (event: ZeaPointerEvent) => {
      // If the SelectionTool is on, it will draw a selection rect during pointerMove events.
      if (this.rectangleSelectionOn) return
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

    let pointerDownPos: Vec2 | null = null
    this.renderer.getViewport().on('pointerDown', (event: ZeaPointerEvent) => {
      // If the SelectionTool is on, it will handle selection changes.
      if (this.rectangleSelectionOn) return
      pointerDownPos = event.pointerPos
    })
    this.renderer.getViewport().on('pointerUp', (event: ZeaPointerEvent) => {
      if (this.picking) {
        if (event.intersectionData) {
          const hitPos = event.intersectionData.intersectionPos
          console.log(hitPos)

          this.addCallout(hitPos)

          this.endPickingSession()
          return
        }
      }
      // If the SelectionTool is on, it will handle selection changes.
      if (this.rectangleSelectionOn) return
      if (!event.intersectionData) {
        if (!(<ZeaMouseEvent>event).ctrlKey) {
          // Clear the selection if the pointer is released close to the press location.
          if (
            pointerDownPos &&
            event.pointerPos.distanceTo(pointerDownPos) < 2
          ) {
            this.selectionManager.clearSelection(false)
          }
        }
      } else {
        const item = this.filterItem(event.intersectionData.geomItem)
        this.toggleSelection(item, !(<ZeaMouseEvent>event).ctrlKey)
      }
    })

    /// ///////////////////////////////

    const $viewCube = document.createElement('zea-view-cube')
    $viewCube.setAttribute('id', 'view-cube')
    $mainWrapper.appendChild($viewCube)

    // @ts-ignore
    $viewCube.setViewport(this.renderer.getViewport())

    const styleTag = document.createElement('style')
    styleTag.appendChild(
      document.createTextNode(`
      #view-cube {
        position: absolute;
        top: 8px;
        right: 8px;
      }
      `)
    )
    this.shadowRoot?.appendChild(styleTag)

    //
    // this.renderer.getViewport().backgroundColorParam.value = new Color(.9, .4, .4)
    this.newProject()
  }


  // ///////////////////////////////
  // Public functions

  // Rectangle Selection
  public setRectangleSelectionHotKey(key: string) {
    this.rectangleSelectionHotKey = key
  }

  public activateRectangleSelection() {
    this.rectangleSelectionOn = true
  }

  public deactivateRectangleSelection() {
    this.rectangleSelectionOn = false
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
    this.selectionSets = []
    this.materials = []
    this.materialAssignments = {}

    this.undoRedoManager.flush()

    this.eventEmitter.emit('viewsListChanged')
    this.eventEmitter.emit('selectionSetsListChanged')
    this.eventEmitter.emit('materialsListChanged')
  }

  public async loadAsset(url: string): Promise<string> {
    return new Promise<string>(resolve => {
      const cadAsset = new CADAsset()

      const context = new AssetLoadContext()
      context.units = 'Millimeters'

      cadAsset.load(url, context).then(() => {
        this.renderer.frameAll()
      })

      cadAsset.geomLibrary.once('loaded', () => {
        resolve(cadAsset.getName())
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
    const selection = this.selectionManager.getSelection()
    if (selection.size == 0) this.renderer.frameAll()
    else {
      this.renderer.getViewport().frameView(Array.from(selection))
    }
  }

  private createInitialView() {
    const initialView = new View('Initial View', this.scene)
    initialView.setCameraParams(this.renderer.getViewport().getCamera())
    this.initialView = initialView
  }

  public getInitialView(): View {
    return this.initialView
  }

  public createView(view?: View, name?: string) {
    const viewName = name ? name : 'View' + this.views.length

    const newView = new View(viewName, this.scene)

    if (view) newView.copyFrom(view)


    const change = new CreateViewChange(newView, this.views, this.eventEmitter)
    newView.setCameraParams(this.renderer.getViewport().getCamera())
    this.views.push(newView)

    this.undoRedoManager.addChange(change)

    this.eventEmitter.emit('viewsListChanged')

    this.activateView(this.views.indexOf(newView))
  }

  public deleteView(index: number) {
    const view = this.views[index]

    const change = new DeleteViewChange(view, this.views, this.eventEmitter)

    this.views.splice(index, 1)
    this.undoRedoManager.addChange(change)

    this.eventEmitter.emit('viewsListChanged')
  }

  public duplicateView(fromViewIndex: number) {
    const view = this.views[fromViewIndex]
    this.createView(view, view.name + '-duplicated')
  }

  public renameView(index: number, newName: string) {
    const view = this.views[index]

    const change = new RenameViewChange(view, newName, this.eventEmitter)
    view.name = newName
    this.undoRedoManager.addChange(change)

    this.eventEmitter.emit('viewsListChanged')
  }

  public activateInitialView() {
    this.selectionManager.clearSelection(false)

    const view = this.initialView
    view.activate(this.renderer.getViewport().getCamera(), this.neutralPose)

    this.activeView = view
    this.eventEmitter.emit('initialViewActivated')
  }

  public activateView(index: number) {
    this.selectionManager.clearSelection(false)

    const view = this.views[index]
    view.activate(this.renderer.getViewport().getCamera(), this.neutralPose)

    this.activeView = view
    this.eventEmitter.emit('viewActivated', view.name)
  }

  public getActiveViewName(): string {
    if (this.activeView) return this.activeView.name
    return ''
  }

  public saveViewCamera() {
    if (this.activeView) {
      const camera = this.renderer.getViewport().getCamera()

      const change = new ChangeViewCamera(this.activeView, camera)
      this.activeView.setCameraParams(camera)
      this.undoRedoManager.addChange(change)

      this.eventEmitter.emit('viewCameraChanged', this.activeView.name)
    }
  }

  public deactivateView() {
    this.selectionManager.clearSelection(false)
    if (this.activeView === this.initialView) {
      this.eventEmitter.emit('initialViewDeactivated')
    } else {
      this.eventEmitter.emit('viewDeactivated')
    }
    this.activeView = undefined
  }

  // /////////////////////////////////////////
  // Selection Sets

  public createSelectionSet(selectionSet?: SelectionSet, name?: string) {
    const selectionSetName = name
      ? name
      : 'SelectionSet-' + this.selectionSets.length

    let newSelectionSet
    if (selectionSet) {
      newSelectionSet = new SelectionSet(
        selectionSetName,
        selectionSet.items,
        selectionSet.scene
      )
    } else {
      const set = Array.from(this.selectionManager.getSelection().values())
      if (set.length > 0) {
        newSelectionSet = new SelectionSet(selectionSetName, set, this.scene)
      }
    }
    if (newSelectionSet) {
      const change = new CreateSelectionSetChange(
        newSelectionSet,
        this.selectionSets,
        this.eventEmitter
      )
      this.selectionSets.push(newSelectionSet)
      this.undoRedoManager.addChange(change)

      this.eventEmitter.emit('selectionSetsListChanged')
      this.activateSelectionSet(this.selectionSets.indexOf(newSelectionSet))
    }
  }

  public deleteSelectionSet(index: number) {
    const selectionSet = this.selectionSets[index]

    this.selectionManager.clearSelection(false)

    const change = new DeleteSelectionSetChange(
      selectionSet,
      this.selectionSets,
      this.eventEmitter
    )
    this.selectionSets.splice(index, 1)
    this.undoRedoManager.addChange(change)

    this.eventEmitter.emit('selectionSetsListChanged')
  }

  public renameSelectionSet(index: number, newName: string) {
    const selectionSet = this.selectionSets[index]
    const change = new RenameSelectionSetChange(
      selectionSet,
      newName,
      this.eventEmitter
    )
    selectionSet.name = newName
    this.undoRedoManager.addChange(change)
    this.eventEmitter.emit('selectionSetsListChanged')
  }

  public duplicateSelectionSet(fromSelectionSetIndex: number) {
    const selectionSet = this.selectionSets[fromSelectionSetIndex]
    this.createSelectionSet(selectionSet, selectionSet.name + '-duplicated')
    this.eventEmitter.emit('selectionSetsListChanged')
  }


  public updateSelectionSet(index: number) {
    const selectionSet = this.selectionSets[index]

    const selection = Array.from(this.selectionManager.getSelection())
    const change = new UpdateSelectionSetChange(selectionSet, selection)
    this.undoRedoManager.addChange(change)

    selectionSet.items = selection
  }

  public activateSelectionSet(index: number) {
    const selectionSet = this.selectionSets[index]
    const set = new Set(selectionSet.items)
    this.selectionManager.setSelection(set, false)
    this.eventEmitter.emit('selectionSetActivated', selectionSet.name)
  }

  public deactivateSelectionSet() {
    this.selectionManager.clearSelection(false)
    this.eventEmitter.emit('selectionSetDeactivated')
  }

  public hideSelection() {
    const set = this.selectionManager.getSelection()
    set.forEach((treeItem: TreeItem) => {
      treeItem.setVisible(false)
      this.hiddenParts.push(treeItem)
    })
  }

  public unHideAll() {
    this.hiddenParts.forEach((treeItem: TreeItem) => {
      treeItem.setVisible(true)
    })
    this.hiddenParts = []
  }

  public activateSelectionSetInActiveView(selectionSet: SelectionSet) {
    if (this.activeView) {
      this.activeView.selectionSet = selectionSet.getIdAndName()
      this.eventEmitter.emit('selectionSetActivatedInView', this.activeView)
    }
  }

  // /////////////////////////////////////////
  // Cutting Planes

  addCuttingPlane() {
    const selection = this.selectionManager.getSelection()
    const cuttingPlane = new CuttingPlaneWrapper(
      this.scene,
      'CuttingPlane' + this.cuttingPlanes.length,
      Array.from(selection)
    )

    this.cuttingPlanes.push(cuttingPlane)

    this.selectionManager.setSelection(
      new Set<TreeItem>([cuttingPlane.cuttingPlane]),
        false
    )
    this.eventEmitter.emit('cuttingPlaneListChanged')
  }

  activateCuttingPlane(index: number) {
    // const cuttingPlane = this.cuttingPlanes[ index ]
    // cuttingPlane.cuttingPlane.cutAwayEnabledParam.value = !cuttingPlane.cuttingPlane.cutAwayEnabledParam.value)
    // console.log('do something', index)
  }

  // /////////////////////////////////////////
  // Materials

  addNewMaterial() {
    const material = new StandardSurfaceMaterial(
      'Material' + this.materials.length
    )
    material.baseColorParam.value = Color.random(0.24)
    material.edgeColorParam.value = new Color(0, 0, 0)
    this.materials.push(material)
    this.eventEmitter.emit('materialsListChanged')
  }

  assignMaterialToSelection(materialIndex: number) {
    const material = this.materials[materialIndex]
    const selection = this.selectionManager.getSelection()

    const assignToGeomItems = (treeItem: TreeItem) => {
      treeItem.traverse((childItem: TreeItem) => {
        if (childItem instanceof GeomItem) {
          childItem.materialParam.value = material

          const path = childItem.getPath()
          const key = JSON.stringify(path)
          this.materialAssignments[key] = materialIndex
        }
      })
    }

    selection.forEach(item => {
      assignToGeomItems(item)
    })
  }

  // /////////////////////////////////////////
  // Callouts

  startPickingSession() {
    this.picking = true
  }
  endPickingSession() {
    this.picking = false
    this.eventEmitter.emit('pickingEnded')
  }

  addCallout(basePos: Vec3 = new Vec3(0, 0, 1)) {
    const labelText = '' + this.callouts.length
    const label = new Label(labelText)
    label.fontSizeParam.setValue(48)
    label.borderRadiusParam.value = 20
    // label.getParameter('FontColor').setValue(color)
    label.backgroundColorParam.setValue(new Color(1, 1, 1))

    const sphere = new Sphere(0.1)
    const material = new FlatSurfaceMaterial()
    material.baseColorParam.value = new Color(0, 0, 0)
    const sphereXfo = new Xfo(basePos)
    const sphereItem = new GeomItem('sphere', sphere, material, sphereXfo)

    this.scene.getRoot().addChild(sphereItem)

    const line = new Lines() //new Lines(0.0)
    line.setNumVertices(2)
    line.setNumSegments(1)
    line.setSegmentVertexIndices(0, 0, 1)
    const positions = <Vec3Attribute>line.getVertexAttribute('positions')
    positions.setValue(0, new Vec3())
    positions.setValue(1, new Vec3(0, 0, 1))
    line.setBoundingBoxDirty()

    const len = 100
    const lineXfo = new Xfo()
    lineXfo.sc.z = len
    const geomItemLine = new GeomItem('line', line, material, lineXfo)

    sphereItem.addChild(geomItemLine, false)

    const billboard = new BillboardItem('Callout' + this.callouts.length, label)
    const labelPos = basePos.add(new Vec3(0, 0, len))
    const xfo = new Xfo(labelPos)
    billboard.localXfoParam.value = xfo
    billboard.pixelsPerMeterParam.setValue(3)
    billboard.alignedToCameraParam.setValue(true)
    billboard.alphaParam.setValue(1)

    const plane = new Ray()
    billboard.on('pointerDown', (event: ZeaPointerEvent) => {
      plane.start = event.intersectionData!.intersectionPos
      plane.dir = event.pointerRay.dir

      this.renderer.getViewport().on('pointerMove', moveLabel)
      this.renderer.getViewport().once('pointerUp', releaseLabel)
      event.stopPropagation()
    })

    const moveLabel = (event: ZeaPointerEvent) => {
      const dist = event.pointerRay.intersectRayPlane(plane)
      xfo.tr = event.pointerRay.pointAtDist(dist)
      billboard.globalXfoParam.value = xfo

      const dir = xfo.tr.subtract(sphereXfo.tr).normalize()
      lineXfo.ori.setFromDirectionAndUpvector(dir, new Vec3(0, 0, 1))
      lineXfo.sc.z = xfo.tr.distanceTo(sphereXfo.tr)
      lineXfo.tr = sphereXfo.tr
      geomItemLine.globalXfoParam.value = lineXfo
      event.stopPropagation()
    }
    const releaseLabel = (event: any) => {
      this.renderer.getViewport().off('pointerMove', moveLabel)
      event.stopPropagation()
    }

    sphereItem.addChild(billboard)

    this.callouts.push(billboard)
  }

  // /////////////////////////////////////////
  // Persistence

  public activateAutoSave(delay: number = 1000) {
    this.autoSaveIntervalId = setInterval(this.saveJson, delay)
  }

  public deactivateAutoSave() {
    if (this.autoSaveIntervalId) clearInterval(this.autoSaveIntervalId)
  }

  public saveJson(): ProjectJson {
    const projectJson: ProjectJson = {
      assets: [],
      views: [],
      selectionSets: [],
      cuttingPlanes: [],
      materials: [],
      materialAssignments: this.materialAssignments,
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
    this.cuttingPlanes.forEach((cuttingPlane: CuttingPlaneWrapper) => {
      projectJson.cuttingPlanes.push(cuttingPlane.saveJson())
    })
    this.materials.forEach((material: Material) => {
      projectJson.materials.push(material.toJSON())
    })
    return projectJson
  }

  public loadJson(projectJson: ProjectJson): Promise<void> {
    this.newProject()
    return new Promise<void>(resolve => {
      const promises: Promise<string>[] = []
      projectJson.assets.forEach((assetJson: AssetJson) => {
        promises.push(this.loadAsset(assetJson.url)
            .then(() => this.createInitialView())
        )
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
        this.eventEmitter.emit('viewsListChanged')

        this.selectionSets = []
        projectJson.selectionSets.forEach(
          (selectionSetJson: SelectionSetJson) => {
            const sel = new SelectionSet('', [], this.scene)
            sel.loadJson(selectionSetJson)
            this.selectionSets.push(sel)
          }
        )
        this.eventEmitter.emit('selectionSetsListChanged')

        projectJson.cuttingPlanes.forEach(
          (cuttingPlaneJson: CuttingPlaneJson) => {
            const cuttingPlane = new CuttingPlaneWrapper(this.scene, '', [])
            cuttingPlane.loadJson(cuttingPlaneJson)
            this.cuttingPlanes.push(cuttingPlane)
          }
        )
        this.eventEmitter.emit('cuttingPlaneListChanged')

        projectJson.materials.forEach((materialJson: Record<string, any>) => {
          const material = new StandardSurfaceMaterial()
          material.fromJSON(materialJson)
          this.materials.push(material)
        })

        let index = 0
        for (let key in projectJson.materialAssignments) {
          const path = JSON.parse(key)
          console.log(index, projectJson.materialAssignments[key])
          const material = this.materials[projectJson.materialAssignments[key]]
          const item = this.scene.getRoot().resolvePath(path)
          if (item instanceof GeomItem && material) {
            item.materialParam.value = material
          }
          index++
        }
        this.materialAssignments = projectJson.materialAssignments

        this.eventEmitter.emit('materialsListChanged')

        resolve()
      })
    })
  }

  // /////////////////////////////////////////
  // Events

  on(eventName: string, listener?: (event: any) => void): number {
    return this.eventEmitter.on(eventName, listener)
  }

  once(eventName: string, listener?: (event: any) => void): number {
    // @ts-ignore
    return this.eventEmitter.once(eventName, listener)
  }

  // /////////////////////////////////////////
  // Undo /Redo

  public undo() {
    this.undoRedoManager.undo()
  }

  public redo() {
    this.undoRedoManager.redo()
  }

  // Same as SelectionManager.toggleItemSelection without undo/redo (only possible in setSelection function)
  private toggleSelection(item: CADPart | CADAssembly, replaceSelection?: boolean | undefined) {
    const selection = Array.from(this.selectionManager.getSelection())

    if (selection.length == 1 && selection.includes(item)) {
      this.selectionManager.clearSelection(false)
    } else {
      if (replaceSelection != undefined && replaceSelection) {
        this.selectionManager.setSelection(new Set([item]), false)
      } else {
        const newSelection = selection
        // newSelection.push(item)
        if (selection.includes(item)) {
          newSelection.splice(selection.indexOf(item),1)
          this.selectionManager.setSelection(new Set(newSelection), false)
          console.log(selection)
        } else {
          newSelection.push(item)
          this.selectionManager.setSelection(new Set(newSelection), false)
        }
      }
    }
  }
}

customElements.define('ipc-3d', Ipd3d)
