import {
  AssetLoadContext,
  BaseTool,
  BillboardItem,
  CADAssembly,
  CADAsset,
  CADPart,
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

import {View} from './View'
import {SelectionSet, SelectionSetJson} from './SelectionSet'

import {
  CreateSelectionSetChange,
  CreateViewChange,
  DeleteSelectionSetChange,
  DeleteViewChange,
  RenameSelectionSetChange,
  RenameViewChange,
  UpdateSelectionSetChange,
  UpdateViewCameraChange,
  ViewSelectionVisibilityChange
} from './Changes'

import CuttingPlaneWrapper, {CuttingPlaneJson} from './CuttingPlane'
import {AttachSelectionSetChange} from "./Changes/View/AttachSelectionSetChange";
import {filterItem} from "./Utils";
import {ProjectJson} from './types/ProjectJson'
import {AssetJson} from './types/AssetJson'
import {ViewJson} from './types/ViewJson'


export class Ipd3d extends HTMLElement {
  public scene: Scene
  private readonly renderer: GLRenderer

  public selectionManager: SelectionManager
  public undoRedoManager: UndoRedoManager
  private assets: CADAsset[] = []
  public views: View[] = []
  public cuttingPlanes: CuttingPlaneWrapper[] = []
  public selectionSets: SelectionSet[] = []

  public currentView?: View
  public currentSelectionSet?: SelectionSet
  public highlightedItem?: TreeItem

  private rectangleSelectionHotKey: string = ''
  private rectangleSelectionOn: boolean = false
  private readonly cameraManipulator: BaseTool
  private readonly rectangleSelectionManipulator: SelectionTool

  public initialView!: View

  public materials: Material[] = []
  private materialAssignments: Record<string, number> = {}

  picking = false
  public callouts: BillboardItem[] = []

  private highlightColor = new Color(0.8, 0.2, 0.2, 0.3)
  private _selectionColor = new Color(1, 0.8, 0, 0.5)

  private eventEmitter = new EventEmitter()

  // Undo redo management
  private undoLimit?: number
  private undoCounter: number = 0

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
    this.setOutlineThickness(0)
    this.setOutlineSensitivity(5)

    this.scene = new Scene()
    this.renderer.setScene(this.scene)

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
          selectionOutlineColor: this._selectionColor,
          branchSelectionOutlineColor: this._selectionColor
      }
    )
    this.setSelectionFillParamValue(this._selectionColor.a)

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

    this.cameraManipulator = this.renderer.getViewport().getManipulator()

    this.rectangleSelectionManipulator = new SelectionTool({
      scene: this.scene,
      renderer: this.renderer,
      selectionManager: this.selectionManager
    })
    this.setRectangleSelectionColor(
        new Color(0.2, 0.2, 0.2).toHex()
    )

    // ////////////////////////////////////////////
    // HotKeys
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.key) {
        case this.rectangleSelectionHotKey:
          if (!this.rectangleSelectionOn) this.setSelectionToolToRectangle()
      }
    })

    document.addEventListener('keyup', (e: KeyboardEvent) => {
      e.preventDefault()

      switch (e.key) {
        case this.rectangleSelectionHotKey:
          if (this.rectangleSelectionOn) this.setSelectionToolToCamera()
          break
        case 's':
          if (e.ctrlKey) {
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
        if (this.currentView && this.currentView !== this.initialView) {
          this.initialView.pose.storeNeutralPose(change.treeItems)
          this.currentView.pose.storeTreeItemsPose(change.treeItems)
        } else {
          this.initialView.pose.storeTreeItemsPose(change.treeItems)
        }
      } else if (change instanceof ParameterValueChange) {
        const param = change.param
        if (param.getOwner() instanceof Material) return
        if (this.currentView && this.currentView !== this.initialView) {
          this.initialView.pose.storeParamValue(param, change.prevValue)
          this.currentView.pose.storeParamValue(param, change.nextValue)
        } else {
          this.initialView.pose.storeParamValue(param, change.nextValue, true)
        }
      }
    })

    this.undoRedoManager.on('changeUpdated', () => {
      const change = this.undoRedoManager.getCurrentChange()
      if (change instanceof SelectionXfoChange) {
        if (this.currentView && this.currentView !== this.initialView) {
          this.currentView.pose.storeTreeItemsPose(change.treeItems)
        }
      } else if (change instanceof ParameterValueChange) {
        const param = change.param
        if (this.currentView && this.currentView !== this.initialView) {
          this.currentView.pose.storeParamValue(param, change.nextValue)
        }
      }
    })

    this.undoRedoManager.on('changeUndone', () => {
      const change = this.undoRedoManager.__redoStack[this.undoRedoManager.__redoStack.length - 1]
      if (change instanceof ViewSelectionVisibilityChange || change instanceof UpdateViewCameraChange) {
        const view = change.view
        if (view === this.initialView){
          this.activateInitialView(false)
        } else {
          this.activateView(this.views.indexOf(view), false)
        }
      }
    })

    this.undoRedoManager.on('changeRedone', () => {
      const change = this.undoRedoManager.__undoStack[this.undoRedoManager.__undoStack.length - 1]
      if (change instanceof ViewSelectionVisibilityChange || change instanceof UpdateViewCameraChange) {
        const view = change.view
        if (view === this.initialView) {
          this.activateInitialView(false)
        } else {
          this.activateView(this.views.indexOf(view), false)
        }
      }
    })


    // Disabling the highlighting as it is distracting.
    this.renderer.getViewport().on('pointerMove', (event: ZeaPointerEvent) => {
      // If the SelectionTool is on, it will draw a selection rect during pointerMove events.
      if (this.rectangleSelectionOn) return
      if (event.intersectionData) {
        const item = filterItem(event.intersectionData.geomItem)
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
        const item = filterItem(event.intersectionData.geomItem)
        this._toggleSelection(item, !(<ZeaMouseEvent>event).ctrlKey)
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

    this.newProject()
  }



// //////////////////////////////
// Private functions

  // Initial View
  private _createInitialView() {
    const initialView = new View('Initial View', this.scene)
    initialView.setCameraParams(this.renderer.getViewport().getCamera())
    this.initialView = initialView
    this.eventEmitter.emit('viewsListChanged')
    this.activateInitialView()
  }

  // Modifiable Views
  private _duplicateView(name: string, view: View) {
    if (name.trim() === '') return

    const newView = new View(name, this.scene)
    newView.copyFrom(view)
    newView.setCameraParams(this.renderer.getViewport().getCamera())

    this._addView(newView)
    this.activateView(this.views.indexOf(newView))
  }

  private _addView(newView: View) {
    const change = new CreateViewChange(newView, this.views, this.eventEmitter)
    this.undoRedoManager.addChange(change)

    this.views.push(newView)
    this.eventEmitter.emit('viewsListChanged')
  }

  // SelectionSets
  private _addSelectionSet(selectionSet: SelectionSet) {
    const change = new CreateSelectionSetChange(
        selectionSet,
        this.selectionSets,
        this.eventEmitter
    )
    this.selectionSets.push(selectionSet)
    this.undoRedoManager.addChange(change)
    this.eventEmitter.emit('selectionSetsListChanged')
  }

  // Undo Limit
  private _increaseUndoCounter() {
    this.undoCounter += 1
  }

  private _decreaseUndoCounter() {
    if (this.undoCounter > 0) {
      this.undoCounter -= 1
    }
  }

  // Items / Selection

  /*
  * Same as SelectionManager.toggleItemSelection without undo/redo (only possible in SelectionManager.setSelection function)
  * Remark: rectangle selection emit selectionChange, is not possible to disable undo / redo with it (SelectionManager.toggleItemSelection function called).
  */
  private _toggleSelection(item: CADPart | CADAssembly, replaceSelection?: boolean | undefined) {
    const selection = Array.from(this.selectionManager.getSelection())

    if (selection.length == 1 && selection.includes(item)) {
      this.selectionManager.clearSelection(false)
    } else {
      if (replaceSelection != undefined && replaceSelection) {
        this.selectionManager.setSelection(new Set([item]), false)
      } else {
        const newSelection = selection
        if (selection.includes(item)) {
          newSelection.splice(selection.indexOf(item),1)
          this.selectionManager.setSelection(new Set(newSelection), false)
        } else {
          newSelection.push(item)
          this.selectionManager.setSelection(new Set(newSelection), false)
        }
      }
    }
  }

// //////////////////////////////
// Public functions

  public getSelectionColor(): string {
    return this._selectionColor.toHex()
  }

  public setSelectionColor(hexColorString: string) {
    const color = new Color()
    color.setFromHex(hexColorString)

    this._selectionColor = color
  }

  public setSelectionFillParamValue(transparency: number) {
    this.selectionManager.selectionGroup.highlightFillParam.value = transparency

    const selection = Array.from(this.selectionManager.getSelection())
    this.selectionManager.setSelection(new Set(selection), false)
  }

  // Selection Tool (Rectangle/Camera manipulator)
  public setRectangleSelectionColor(hexColorString: string) {
    const color = new Color()
    color.setFromHex(hexColorString)

    this.rectangleSelectionManipulator
        .selectionRectMat.getParameter('BaseColor')!.value = color
  }

  public setSelectionToolToRectangle() {
    this.renderer.getViewport().setManipulator(this.rectangleSelectionManipulator)
    this.rectangleSelectionOn = true
  }
  public setSelectionToolToCamera() {
    this.renderer.getViewport().setManipulator(this.cameraManipulator)
    this.rectangleSelectionOn = false
  }

  public setRectangleSelectionHotKey(key: string) {
    this.rectangleSelectionHotKey = key
  }

  // Project
  public newProject(): void {
    this.renderer
      .getViewport()
      .getCamera()
      .setPositionAndTarget(new Vec3(1200, 1200, 1200), new Vec3(0, 0, 0))

    this.scene.getRoot().removeAllChildren()

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
        this._createInitialView()
      })

      cadAsset.geomLibrary.once('loaded', () => {
        const assetName = cadAsset.getName();
        this.eventEmitter.emit('assetLoaded', assetName)
        resolve(assetName)
      })

      this.scene.getRoot().addChild(cadAsset)

      this.assets.push(cadAsset)
    })
  }

  public setSceneBackgroundColor(hexColorString: string) {
    const color = new Color()
    color.setFromHex(hexColorString)

    this.renderer.getViewport().backgroundColorParam.value = color
  }


  // Initial View
  public activateInitialView(lerpPose: boolean = true) {
    console.log('activateInitialView')
    const view = this.initialView
    if (lerpPose) view.lerpPose(this.renderer.getViewport().getCamera())

    this.currentView = view
    this.eventEmitter.emit('initialViewActivated')
  }

  public isInitialView (): boolean {
    return (this.currentView == null) || (this.currentView == this.initialView)
  }

  // Views
  public createView(name: string): View {
    const newView = new View(name, this.scene)
    newView.setCameraParams(this.renderer.getViewport().getCamera())
    this._addView(newView)

    this.activateView(this.views.indexOf(newView))

    return newView
  }

  public deleteView(index: number) {
    const view = this.views[index]

    const change = new DeleteViewChange(view, this.views, this.eventEmitter)

    this.views.splice(index, 1)
    this.undoRedoManager.addChange(change)

    this.eventEmitter.emit('viewsListChanged')
  }

  public duplicateView(baseViewIndex: number, name: string = '') {
    const baseView = this.views[baseViewIndex]
    this._duplicateView(name, baseView)
  }

  public renameView(index: number, newName: string) {
    const view = this.views[index]

    const change = new RenameViewChange(view, newName, this.eventEmitter)
    view.name = newName
    this.undoRedoManager.addChange(change)

    this.eventEmitter.emit('viewsListChanged')
  }

  public activateView(index: number, lerpPose: boolean = true) {
    console.log('activateView', index)
    const view = this.views[index]
    if (lerpPose) {
      view.lerpPose(this.renderer.getViewport().getCamera(), this.initialView.pose)
    }

    this.currentView = view
    this.eventEmitter.emit('viewActivated', view.name)
  }

  public hasViewWithName(viewName: string): boolean {
    return this.views.some((view: View) => view.name == viewName)
  }

  public saveViewCamera() {
    if (this.currentView) {
      const camera = this.renderer.getViewport().getCamera()

      const change = new UpdateViewCameraChange(this.currentView, camera)
      this.currentView.setCameraParams(camera)
      this.undoRedoManager.addChange(change)

      this.eventEmitter.emit('viewCameraChanged', this.currentView.name)
    }
  }

  public frameView() {
    const selection = this.selectionManager.getSelection()
    if (selection.size == 0) {
      this.renderer.frameAll()
    } else {
      this.renderer.getViewport().frameView(Array.from(selection))
    }
  }

  // /////////////////////////////////////////
  // Selection Sets

  public createSelectionSet(name: string): SelectionSet {
    let newSelectionSet
    const set = Array.from(this.selectionManager.getSelection())
    if (set.length > 0) {
      newSelectionSet = new SelectionSet(name, set, this.scene)
      if (newSelectionSet) {
        this._addSelectionSet(newSelectionSet)
        this.activateSelectionSet(this.selectionSets.indexOf(newSelectionSet))
      }
    } else {
      alert('No item for selection set')
    }
    // @ts-ignore
    return newSelectionSet
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

    this.currentSelectionSet = selectionSet
    this.eventEmitter.emit('selectionSetActivated', selectionSet.name)
  }

  public deactivateSelectionSet() {
    this.selectionManager.clearSelection(false)
    this.currentSelectionSet = undefined
    this.eventEmitter.emit('selectionSetDeactivated')
  }

  public hasSelectionSetWithName(selectionSetName: string): boolean {
    return this.selectionSets.some((selectionSet: SelectionSet) => selectionSet.name == selectionSetName)
  }

  // View <=> SelectionSet

  public attachSelectionSetToCurrentView(selectionSet: SelectionSet) {
    if (this.currentView) {
      const change = new AttachSelectionSetChange(this.currentView, selectionSet)

      this.currentView.attachSelectionSet(selectionSet)

      this.undoRedoManager.addChange(change)
      this.eventEmitter.emit('selectionSetAttachedToCurrentView', this.currentView)
    }
  }

  public detachSelectionSetFromCurrentView(selectionSet: SelectionSet) {
    if (this.currentView) {
      const change = new AttachSelectionSetChange(this.currentView, selectionSet, true)

      this.currentView.detachSelectionSet(selectionSet)

      this.undoRedoManager.addChange(change)
      this.eventEmitter.emit('selectionSetDeactivatedInView', this.currentView)
    }
  }

  // /////////////////////////////////////////
  // Selection Management
  public hideSelection() {
    const selection = Array.from(this.selectionManager.getSelection())

    this.undoRedoManager.addChange(
        new ViewSelectionVisibilityChange(
            this.currentView!,
            this.initialView,
            this.views,
            selection,
            false
        )
    )
    this.selectionManager.clearSelection(false)
    this.currentView!.pose.activate()
  }

  public unHideAll() {
    const lockedHiddenParts = this.initialView.getHiddenParts()

    let partsToUnHide
    if (this.isInitialView()) {
      partsToUnHide = lockedHiddenParts
    } else {
      partsToUnHide = this.currentView!.getHiddenParts().filter(
          (part) => !lockedHiddenParts.includes(part))
    }

    this.undoRedoManager.addChange(
        new ViewSelectionVisibilityChange(
            this.currentView!,
            this.initialView,
            this.views,
            partsToUnHide,
            true
        )
    )
    this.selectionManager.clearSelection(false)
    this.currentView!.pose.activate()
  }

  // /////////////////////////////////////////
  // Cutting Planes

  public addCuttingPlane():CuttingPlaneWrapper {
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

    return cuttingPlane
  }

  public activateCuttingPlane(index: number) {
    // const cuttingPlane = this.cuttingPlanes[ index ]
    // cuttingPlane.cuttingPlane.cutAwayEnabledParam.value = !cuttingPlane.cuttingPlane.cutAwayEnabledParam.value)
    // console.log('do something', index)
  }

  // /////////////////////////////////////////
  // Materials

  public addNewMaterial():Material {
    const material = new StandardSurfaceMaterial(
      'Material' + this.materials.length
    )
    material.baseColorParam.value = Color.random(0.24)
    material.edgeColorParam.value = new Color(0, 0, 0)
    this.materials.push(material)
    this.eventEmitter.emit('materialsListChanged')

    return material
  }

  public assignMaterialToSelection(materialIndex: number) {
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

  public startPickingSession() {
    this.picking = true
  }
  public endPickingSession() {
    this.picking = false
    this.eventEmitter.emit('pickingEnded')
  }

  public addCallout(basePos: Vec3 = new Vec3(0, 0, 1)) {
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

  public saveJson(): ProjectJson {
    const projectJson: ProjectJson = {
      assets: [],
      initialView: this.initialView.saveJson(),
    }
    this.assets.forEach((asset: CADAsset) => {
      const assetJson: AssetJson = {
        url: asset.url
      }
      projectJson.assets.push(assetJson)
    })
    if (this.views && this.views.length > 0) {
      projectJson.views = this.views.map((view) => view.saveJson()
      )
    }

    if (this.selectionSets && this.selectionSets.length > 0) {
      projectJson.selectionSets = this.selectionSets.map(
          (selectionSet) => selectionSet.saveJson()
      )
    }

    if (this.cuttingPlanes && this.cuttingPlanes.length > 0) {
      projectJson.cuttingPlanes = this.cuttingPlanes.map(
          (cuttingPlane) => cuttingPlane.saveJson()
      )
    }

    if (this.materials && this.materials.length > 0) {
      projectJson.materials = this.materials.map(
          (material) => material.toJSON()
      )
    }
    if (this.materialAssignments && this.materialAssignments.length > 0) {
      projectJson.materialAssignments = this.materialAssignments
    }
    return projectJson
  }

  public loadJson(projectJson: ProjectJson): Promise<void> {
    console.info('LOAD Project')
    this.newProject()
    return new Promise<void>(resolve => {
      this.loadAssetsFromProject(projectJson).then(() => {
        this.initSelectionSetsFromProject(projectJson)
        this.initViewsFromProject(projectJson)
        this.initCuttingPlanesFromProject(projectJson)
        this.initMaterialsFromJson(projectJson)
        resolve()
      })
    })
  }

  private loadAssetsFromProject(projectJson: ProjectJson) {
    const promises = projectJson.assets.map((assetJson: AssetJson) => {
      return this.loadAsset(assetJson.url)
    })
    return Promise.all(promises)
  }

  private initMaterialsFromJson(projectJson: ProjectJson) {
    this.materials = []
    if (projectJson.materials) {
      projectJson.materials.forEach((materialJson: Record<string, any>) => {
        const material = new StandardSurfaceMaterial()
        material.fromJSON(materialJson)
        this.materials.push(material)
      })
    }

    if (projectJson.materialAssignments) {
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
    }
  }

  private initCuttingPlanesFromProject(projectJson: ProjectJson) {
    this.cuttingPlanes = []
    if (projectJson.cuttingPlanes) {
      projectJson.cuttingPlanes.forEach(
          (cuttingPlaneJson: CuttingPlaneJson) => {
            const cuttingPlane = new CuttingPlaneWrapper(this.scene, '', [])
            cuttingPlane.loadJson(cuttingPlaneJson)
            this.cuttingPlanes.push(cuttingPlane)
          }
      )
      this.eventEmitter.emit('cuttingPlaneListChanged')
    }
  }

  private initViewsFromProject(projectJson: ProjectJson) {
    this.initialView.loadJson(projectJson.initialView)
    this.initialView.activate(this.renderer.getViewport().getCamera())

    this.views = []
    if (projectJson.views) {
      projectJson.views.forEach((viewJson: ViewJson) => {
        const view = new View('', this.scene)
        view.loadJson(viewJson)
        viewJson.selectionSets?.forEach((selKey) => {
          const selectionSet = this.selectionSets.find(selSet => selSet.getId() === selKey.id)
          if (selectionSet) view.attachSelectionSet(selectionSet)
        })
        this.views.push(view)
      })
      this.eventEmitter.emit('viewsListChanged')
    }
  }

  private initSelectionSetsFromProject(projectJson: ProjectJson) {
    this.selectionSets = []
    if (projectJson.selectionSets) {
      projectJson.selectionSets.forEach(
          (selectionSetJson: SelectionSetJson) => {
            const sel = new SelectionSet('', [], this.scene)
            sel.loadJson(selectionSetJson)
            this.selectionSets.push(sel)
          }
      )
      this.eventEmitter.emit('selectionSetsListChanged')
    }
  }

// /////////////////////////////////////////
  // Events

  public on(eventName: string, listener?: (event: any) => void): number {
    return this.eventEmitter.on(eventName, listener)
  }

  public once(eventName: string, listener?: (event: any) => void): number {
    // @ts-ignore
    return this.eventEmitter.once(eventName, listener)
  }

  // /////////////////////////////////////////
  // Undo /Redo

  public undo() {
    if (this.undoLimit) {
      if (this.undoCounter < this.undoLimit) {
        this._increaseUndoCounter()
        this.undoRedoManager.undo()
      } else {
        console.log('Undo limit reached')
      }
    } else {
      this.undoRedoManager.undo()
    }
  }

  public redo() {
    if (this.undoLimit) {
      if (this.undoCounter > 0) {
        this._decreaseUndoCounter()
        this.undoRedoManager.redo()
      }
    } else {
      this.undoRedoManager.redo()
    }
  }

  public setUndoLimit(limit: number) {
    this.undoLimit = limit
  }

  public setEnvironmentMap(zenvFilePath: string) {
    const envMap = new EnvMap()
    envMap.load(zenvFilePath)
        .then(() => {
          this.scene.setEnvMap(envMap)
        })
  }

  public setOutlineThickness(thickness: number) {
    let thicknessValue: number = 0
    if (!(thickness < 0) && !(thickness > 1)) {
      thicknessValue = thickness
    }
    this.renderer.outlineThickness = thicknessValue
  }

  public setOutlineSensitivity(outlineSensitivity: number) {
    this.renderer.outlineSensitivity = outlineSensitivity
  }
}

customElements.define('ipc-3d', Ipd3d)
