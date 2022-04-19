import {Change} from '@zeainc/zea-ux'
import {TreeItem} from "@zeainc/zea-engine";
import {SelectionSet} from "../../SelectionSet";

class UpdateSelectionSetChange extends Change {
  selectionSet: SelectionSet
  prevItems: TreeItem[]
  newItems: TreeItem[]

  constructor(selectionSet: SelectionSet, newItems: TreeItem[]) {
    super(selectionSet.name)

    this.selectionSet = selectionSet
    this.prevItems = selectionSet.items
    this.newItems = newItems
  }

  undo(): void {
    console.log('Undo UpdateSelectionSet')
    this.selectionSet.items = this.prevItems
  }

  redo(): void {
    console.log('Redo UpdateSelectionSet')
    this.selectionSet.items = this.newItems
  }
}

export { UpdateSelectionSetChange }
