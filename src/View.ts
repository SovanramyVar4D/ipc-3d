import {BooleanParameter, Camera, MathFunctions, Parameter, Scene, TreeItem, Vec3, Xfo} from '@zeainc/zea-engine'
import {Pose, PoseJson} from './Pose'
import {UUID} from "./Utils";
import {SelectionSet} from "./SelectionSet";
import {filter} from "cypress/types/minimatch";

interface ViewJson {
  id: string
  name: string
  cameraXfo: Record<string, any>
  cameraTarget: Record<string, any>
  pose: PoseJson
  selectionSets?: SelectionSetKey[]
}

interface SelectionSetKey {
  id: string
  name: string
}

class View {
  private id: string
  name = 'View'
  cameraXfo: Xfo = new Xfo()
  cameraTarget: Vec3 = new Vec3()
  selectionSets?: SelectionSet[] = []
  hiddenParts: TreeItem[] = []

  pose: Pose
  constructor(name: string = '', private scene: Scene) {
    this.id = UUID()
    this.name = name
    this.pose = new Pose(scene)
  }

  attachSelectionSet(selectionSet: SelectionSet) {
    if (!this.selectionSets) this.selectionSets = []
    this.selectionSets.push(selectionSet)
  }

  detachSelectionSet(selectionSet: SelectionSet) {
    if (this.selectionSets) {
      const selIndex = this.selectionSets.indexOf(selectionSet)
      this.selectionSets.splice(selIndex, 1)

      if (this.selectionSets.length < 1) this.selectionSets = undefined
    }
  }

  setCameraParams(camera: Camera) {
    this.cameraXfo = camera.globalXfoParam.value.clone()
    this.cameraTarget = camera.getTargetPosition()
  }

  activate(camera: Camera, neutralPose?: Pose) {
    camera.globalXfoParam.value = this.cameraXfo
    const dist = this.cameraXfo.tr.distanceTo(this.cameraTarget)
    camera.setFocalDistance(dist)
    this.pose.activate(neutralPose)
  }

  lerpPose(camera: Camera, neutralPose?: Pose) {
    // camera.globalXfoParam.value = this.cameraXfo.clone()

    const startXfo = camera.globalXfoParam.value.clone()
    startXfo.ori.alignWith(this.cameraXfo.ori)
    const startTarget = camera.getTargetPosition()
    const startDist = startXfo.tr.distanceTo(startTarget)
    const endDist = this.cameraXfo.tr.distanceTo(this.cameraTarget)

    const steps = 25
    const timeStep = 20
    let stepId = 0
    const id = setInterval(() => {
      stepId++

      const t = stepId / steps
      const smooth_t = MathFunctions.smoothStep(0, 1, t)
      const cameraTarg = startTarget.lerp(this.cameraTarget, smooth_t)
      const dist = MathFunctions.lerp(startDist, endDist, smooth_t)

      // console.log(startDist, endDist, dist)
      const cameraOri = startXfo.ori.slerp(this.cameraXfo.ori, smooth_t)
      const cameraPos = cameraTarg.add(cameraOri.getZaxis().scale(dist))
      const xfo = new Xfo()
      xfo.ori = cameraOri
      xfo.tr = cameraPos
      camera.globalXfoParam.value = xfo
      camera.setFocalDistance(dist)

      // const cameraPos = startXfo.tr.lerp(this.cameraXfo.tr, t)
      // camera.setPositionAndTarget(cameraPos, cameraTarg)

      if (stepId == steps) clearInterval(id)
    }, timeStep)

    this.pose.lerpPose(neutralPose, steps, timeStep)
  }

  copyFrom(view: View) {
    this.cameraTarget = view.cameraTarget.clone()
    this.cameraXfo = view.cameraXfo.clone()
    this.selectionSets = view.selectionSets
    this.pose.copyFrom(view.pose)
  }

  public updateHiddenPartsList() {
    this.hiddenParts = this.getHiddenPartsFromPose()
  }

  private getHiddenPartsFromPose(): TreeItem[] {
    const hiddenPartsList = []
    for (let key in this.pose.values) {
      const visibleParam = this.pose.params[key]
      const isVisible = this.pose.values[key]

      const partPath = (<TreeItem>visibleParam.getOwner()).getPath()

      if (visibleParam instanceof BooleanParameter
          && visibleParam.getName() === 'Visible'
          && !isVisible) {
        const part: TreeItem = <TreeItem>this.scene.getRoot().resolvePath(partPath)
        hiddenPartsList.push(part)
      }
    }
    return hiddenPartsList
  }

  // /////////////////////////////////////////
  // Persistence

  saveJson(): ViewJson {
    const json: ViewJson = {
      id: this.id,
      name: this.name,
      cameraXfo: this.cameraXfo.toJSON(),
      cameraTarget: this.cameraTarget.toJSON(),
      pose: this.pose.saveJson()
    }

    if (this.selectionSets && this.selectionSets.length > 0)
      json.selectionSets = this.selectionSets?.map((sel) => <SelectionSetKey>{
        id: sel.saveJson().id,
        name: sel.saveJson().name
      })
    return json
  }

  loadJson(viewJson: ViewJson) {
    this.id = viewJson.id
    this.name = viewJson.name
    this.cameraXfo.fromJSON(viewJson.cameraXfo)
    this.cameraTarget.fromJSON(viewJson.cameraTarget)
    this.pose?.loadJson(viewJson.pose)
    this.hiddenParts = this.getHiddenPartsFromPose()
  }
}

export { View, ViewJson }
