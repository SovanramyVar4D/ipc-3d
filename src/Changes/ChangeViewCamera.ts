import { Vec3, Xfo } from '@zeainc/zea-engine'
import { Change } from '@zeainc/zea-ux'
import { View } from '../View'

export default class ChangeViewCamera extends Change {
  view: View
  prevCameraXfo: Xfo
  prevCameraTarget: Vec3
  newCameraXfo: Xfo = new Xfo()
  newCameraTarget: Vec3 = new Vec3()
  constructor(view: View) {
    super(view.name)

    this.view = view
    this.prevCameraXfo = view.cameraXfo.clone()
    this.prevCameraTarget = view.cameraTarget.clone()
  }

  updateCameraView(): void {
    this.newCameraXfo = this.view.cameraXfo.clone()
    this.newCameraTarget = this.view.cameraTarget.clone()
  }

  undo(): void {
    this.view.cameraXfo = this.prevCameraXfo
    this.view.cameraTarget = this.prevCameraTarget
  }

  redo(): void {
    console.log('Redo ChangeViewCamera')
    this.view.cameraXfo = this.newCameraXfo
    this.view.cameraTarget = this.newCameraTarget
  }
}

export { ChangeViewCamera }
