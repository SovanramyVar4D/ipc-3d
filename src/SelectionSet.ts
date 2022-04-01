import { Scene, TreeItem } from '@zeainc/zea-engine'
import { UUID } from "./Utils";

export interface SelectionSetJson {
  id: string
  name: string
  items: Array<Array<string>>
}
export class SelectionSet {

  private _id: string
  name: any
  items: Array<TreeItem> = []
  scene: Scene

  constructor(name: string = '', items: Array<TreeItem>, scene: Scene) {
    this._id = UUID()
    this.name = name
    this.items = items
    this.scene = scene
  }

  getId(): string {
    return this._id;
  }

  // /////////////////////////////////////////
  // Persistence

  copyFrom(selectionSet: SelectionSet) {
    this.name = selectionSet.name
    this.items = selectionSet.items
    this.scene = selectionSet.scene
  }

  saveJson(): SelectionSetJson {
    const json: SelectionSetJson = { id: this._id, name: this.name, items: [] }

    this.items.forEach(item => {
      json.items.push(item.getPath())
    })

    return json
  }

  loadJson(selectionSetJson: SelectionSetJson) {
    this._id = selectionSetJson.id
    this.name = selectionSetJson.name
    this.items = []
    selectionSetJson.items.forEach(itemPath => {
      this.items.push(<TreeItem>this.scene.getRoot().resolvePath(itemPath))
    })
  }
}
