import { Scene, TreeItem, CuttingPlane, Vec3, Xfo } from '@zeainc/zea-engine'

export interface CuttingPlaneJson {
  name: string
  items: string[][]
}

export default class CuttingPlaneWrapper {
  cuttingPlane: CuttingPlane
  constructor(
    private scene: Scene,
    public name: string,
    items: Array<TreeItem>
  ) {
    this.cuttingPlane = new CuttingPlane(name)

    const cuttingPlaneXfo = new Xfo()
    cuttingPlaneXfo.ori.setFromAxisAndAngle(new Vec3(1, 0, 0), Math.PI * 0.5)
    this.cuttingPlane.localXfoParam.value = cuttingPlaneXfo
    this.cuttingPlane.cutAwayEnabledParam.value = true

    items.forEach((item: TreeItem) => {
      this.cuttingPlane.addItem(item)
    })

    scene.getRoot().addChild(this.cuttingPlane)
  }

  // /////////////////////////////////////////
  // Persistence

  saveJson(): CuttingPlaneJson {
    const itemPaths: string[][] = []
    const items = this.cuttingPlane.getItems()
    items?.forEach(treeItem => {
      itemPaths.push(treeItem.getPath())
    })

    return {
      name: this.cuttingPlane.getName(),
      items: itemPaths
    }
  }

  loadJson(planeJson: CuttingPlaneJson) {
    this.cuttingPlane.setName(planeJson.name)
    planeJson.items.forEach(path => {
      const item = this.scene.getRoot().resolvePath(path)
      if (item instanceof TreeItem) this.cuttingPlane.addItem(item)
    })
  }
}
