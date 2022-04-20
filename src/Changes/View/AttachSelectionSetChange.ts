import {Change} from '@zeainc/zea-ux'
import {View} from '../../View'
import {SelectionSet} from "../../SelectionSet"

class AttachSelectionSetChange extends Change {

  constructor(
      private view: View,
      private selectionSet: SelectionSet,
      private detach?: boolean
  ) {
    super(view.name)
  }

  undo(): void {
    console.log('Undo AttachSelectionSetChange')
    if (this.detach)
      this.view.attachSelectionSet(this.selectionSet)
    else
      this.view.detachSelectionSet(this.selectionSet)
  }

  redo(): void {
    console.log('Redo AttachSelectionSetChange')
    if (this.detach)
      this.view.detachSelectionSet(this.selectionSet)
    else
      this.view.attachSelectionSet(this.selectionSet)
  }
}

export { AttachSelectionSetChange }
