import {
  MathFunctions,
  Parameter,
  Scene,
  TreeItem,
  Xfo
} from '@zeainc/zea-engine'

interface PoseJson {
  values: Record<string, Record<string, any>>
}

class Pose {
  values: Record<string, Xfo> = {}
  params: Record<string, Parameter<Xfo>> = {}

  constructor(private scene: Scene) {}

  storeParamValue(param: Parameter<Xfo>) {
    const path = param.getPath()
    const key = JSON.stringify(path)

    this.values[key] = param.getValue().clone()
    this.params[key] = param
  }

  storeTreeItemsPose(treeItems: TreeItem[]) {
    treeItems.forEach(treeItem => {
      this.storeParamValue(treeItem.globalXfoParam)
    })
  }

  activate(neutralPose?: Pose) {
    if (neutralPose) {
      for (const key in neutralPose.values) {
        if (!(key in this.values)) {
          const value = neutralPose.values[key]
          const param = neutralPose.params[key]
          param.setValue(value)
        }
      }
    }
    for (const key in this.values) {
      const value = this.values[key]
      const param = this.params[key]
      param.setValue(value)
    }
  }

  lerpPose() {
    const steps = 30
    let stepId = 0
    const id = setInterval(() => {
      stepId++

      const t = stepId / steps
      const smooth_t = MathFunctions.smoothStep(0, 1, t)

      if (stepId == steps) clearInterval(id)
    }, 20)
  }

  // /////////////////////////////////////////
  // Persistence

  saveJson(): PoseJson {
    const poseJson: PoseJson = {
      values: {}
    }
    for (const key in this.values) {
      const value = this.values[key]
      poseJson.values[key] = value.toJSON()
    }
    return poseJson
  }

  loadJson(poseJson: PoseJson) {
    for (const key in poseJson.values) {
      const xfo = new Xfo()
      xfo.fromJSON(poseJson.values[key])
      this.values[key] = xfo

      const path = JSON.parse(key)
      const param = <Parameter<Xfo>>this.scene.getRoot().resolvePath(path)
      this.params[key] = param
    }
  }
}

export { Pose, PoseJson }
