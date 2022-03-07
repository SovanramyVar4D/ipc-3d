import {
  MathFunctions,
  Parameter,
  Scene,
  TreeItem,
  Xfo,
  XfoParameter,
  BooleanParameter,
  NumberParameter
} from '@zeainc/zea-engine'

interface PoseJson {
  values: Record<string, any>
}

class Pose {
  values: Record<string, any> = {}
  params: Record<string, Parameter<any>> = {}

  constructor(private scene: Scene) {}

  storeParamValue(
    param: Parameter<any>,
    value: any,
    storeOnlyNewValues = false
  ) {
    const path = param.getPath()
    const key = JSON.stringify(path)

    // When storing neutral pose values, we only keep the initial value.
    if (storeOnlyNewValues && this.values[key]) return

    if (value instanceof Xfo) this.values[key] = value.clone()
    else if (
      typeof value == 'boolean' ||
      typeof value == 'number' ||
      typeof value == 'string'
    )
      this.values[key] = value

    this.params[key] = param
  }

  storeTreeItemsPose(treeItems: TreeItem[]) {
    treeItems.forEach(treeItem => {
      this.storeParamValue(
        treeItem.globalXfoParam,
        treeItem.globalXfoParam.value
      )
    })
  }

  storeNeutralPose(treeItems: TreeItem[]) {
    treeItems.forEach(treeItem => {
      this.storeParamValue(
        treeItem.globalXfoParam,
        treeItem.globalXfoParam.value,
        true
      )
    })
  }

  copyFrom(pose: Pose) {
    for (const key in pose.values) {
      const value = pose.values[key]
      const param = pose.params[key]
      this.values[key] = value
      this.params[key] = param
    }
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

  lerpPose(neutralPose?: Pose, steps: number = 25, timeStep: number = 20) {
    const startValues: Record<string, any> = {}
    const endValues: Record<string, any> = {}

    for (const key in this.values) {
      startValues[key] = this.params[key].value
      endValues[key] = this.values[key]
    }
    if (neutralPose) {
      for (const key in neutralPose.values) {
        if (!(key in this.values)) {
          startValues[key] = neutralPose.params[key].value
          endValues[key] = neutralPose.values[key]
        }
      }
    }

    let stepId = 0
    const id = setInterval(() => {
      stepId++

      const t = stepId / steps
      const smooth_t = MathFunctions.smoothStep(0, 1, t)

      for (const key in startValues) {
        if (startValues[key] instanceof Xfo) {
          const startVal = <Xfo>startValues[key]
          const endValue = <Xfo>endValues[key]
          const value = new Xfo()
          value.tr = startVal.tr.lerp(endValue.tr, smooth_t)
          value.ori = startVal.ori.slerp(endValue.ori, smooth_t)

          if (neutralPose && !(key in this.values)) {
            neutralPose.params[key].value = value
          } else {
            this.params[key].value = value
          }
        } else if (typeof startValues[key] == 'number') {
          const value = MathFunctions.lerp(
            <number>startValues[key],
            <number>endValues[key],
            smooth_t
          )

          if (neutralPose && !(key in this.values)) {
            neutralPose.params[key].value = value
          } else {
            this.params[key].value = value
          }
        } else {
          const endValue = <boolean>endValues[key]

          if (neutralPose && !(key in this.values)) {
            neutralPose.params[key].value = endValue
          } else {
            this.params[key].value = endValue
          }
        }
      }

      if (stepId == steps) clearInterval(id)
    }, timeStep)
  }

  // /////////////////////////////////////////
  // Persistence

  saveJson(): PoseJson {
    const poseJson: PoseJson = {
      values: {}
    }
    for (const key in this.values) {
      const value = this.values[key]
      if (value instanceof Xfo) poseJson.values[key] = value.toJSON()
      else poseJson.values[key] = value
    }
    return poseJson
  }

  loadJson(poseJson: PoseJson) {
    for (const key in poseJson.values) {
      const path = JSON.parse(key)
      const param = <XfoParameter | BooleanParameter>(
        this.scene.getRoot().resolvePath(path)
      )
      if (param instanceof XfoParameter) {
        const xfo = new Xfo()
        xfo.fromJSON(<Record<string, any>>poseJson.values[key])
        this.values[key] = xfo
        this.params[key] = param
      } else {
        this.values[key] = poseJson.values[key]
        this.params[key] = param
      }
    }
  }
}

export { Pose, PoseJson }
