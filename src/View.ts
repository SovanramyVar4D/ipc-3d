import { Camera, MathFunctions, Scene, Vec3, Xfo } from '@zeainc/zea-engine'
import { Pose, PoseJson } from './Pose'

interface ViewJson {
  name: string
  cameraXfo: Record<string, any>
  cameraTarget: Record<string, any>
  pose: PoseJson
}

class View {
  name = 'View'
  cameraXfo: Xfo = new Xfo()
  cameraTarget: Vec3 = new Vec3()

  pose: Pose
  constructor(name: string = '', scene: Scene) {
    this.name = name
    this.pose = new Pose(scene)
  }

  setCameraParams(camera: Camera) {
    this.cameraXfo = camera.globalXfoParam.value.clone()
    this.cameraTarget = camera.getTargetPosition()
  }

  activate(camera: Camera) {
    // camera.globalXfoParam.value = this.cameraXfo.clone()

    const startXfo = camera.globalXfoParam.value.clone()
    startXfo.ori.alignWith(this.cameraXfo.ori)
    const startTarget = camera.getTargetPosition()
    const startDist = startXfo.tr.distanceTo(startTarget)
    const endDist = this.cameraXfo.tr.distanceTo(this.cameraTarget)

    const steps = 30
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
    }, 20)

    this.pose.activate()
  }

  // /////////////////////////////////////////
  // Persistence

  saveJson(): ViewJson {
    return {
      name: this.name,
      cameraXfo: this.cameraXfo.toJSON(),
      cameraTarget: this.cameraTarget.toJSON(),
      pose: this.pose.saveJson()
    }
  }

  loadJson(viewJson: ViewJson) {
    this.name = viewJson.name
    this.cameraXfo.fromJSON(viewJson.cameraXfo)
    this.cameraTarget.fromJSON(viewJson.cameraTarget)
    this.pose?.loadJson(viewJson.pose)
  }
}

export { View, ViewJson }
