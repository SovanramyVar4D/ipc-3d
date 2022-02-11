import { Camera, MathFunctions, Vec3, Xfo } from '@zeainc/zea-engine'

interface ViewJson {
  name: string
  cameraXfo: Record<string, any>
  cameraTarget: Record<string, any>
}

class View {
  name = 'View'
  cameraXfo: Xfo = new Xfo()
  cameraTarget: Vec3 = new Vec3()
  constructor(name: string = '') {
    this.name = name
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
    const angle = startXfo.ori
      .inverse()
      .multiply(this.cameraXfo.ori)
      .getAngle()
    console.log(angle)

    const steps = 30
    let stepId = 0
    const id = setInterval(() => {
      stepId++

      const t = stepId / steps
      const smooth_t = MathFunctions.smoothStep(0, 1, t)
      const cameraTarg = startTarget.lerp(this.cameraTarget, smooth_t)
      const dist = MathFunctions.lerp(startDist, endDist, smooth_t)

      // console.log(startDist, endDist, dist)
      const cameraOri =
        angle > 0.0001
          ? startXfo.ori.slerp(this.cameraXfo.ori, smooth_t * 2)
          : this.cameraXfo.ori
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
  }

  // /////////////////////////////////////////
  // Persistence

  saveJson(): ViewJson {
    return {
      name: this.name,
      cameraXfo: this.cameraXfo.toJSON(),
      cameraTarget: this.cameraTarget.toJSON()
    }
  }

  loadJson(viewJson: ViewJson) {
    this.name = viewJson.name
    this.cameraXfo.fromJSON(viewJson.cameraXfo)
    this.cameraTarget.fromJSON(viewJson.cameraTarget)
  }
}

export { View, ViewJson }
