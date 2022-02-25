import { Scene, TreeItem } from '@zeainc/zea-engine'

export interface SelectionSetJson {
  name: string
  items: Array<Array<string>>
}
export class SelectionSet {
  name: string
  items: Array<TreeItem> = []
  scene: Scene

  constructor(name: string = '', items: Array<TreeItem>, scene: Scene) {
    this.name = name
    this.items = items
    this.scene = scene
  }

  // /////////////////////////////////////////
  // Persistence

  saveJson(): SelectionSetJson {
    const json: SelectionSetJson = { name: this.name, items: [] }

    this.items.forEach(item => {
      json.items.push(item.getPath())
    })

    return json
  }

  loadJson(selectionSetJson: SelectionSetJson) {
    this.name = selectionSetJson.name
    this.items = []
    selectionSetJson.items.forEach(itemPath => {
      this.items.push(<TreeItem>this.scene.getRoot().resolvePath(itemPath))
    })
  }
}
