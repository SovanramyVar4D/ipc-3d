import {Change} from '@zeainc/zea-ux'
import {EventEmitter} from "@zeainc/zea-engine";
import {SelectionSet} from "../../SelectionSet";

export default class RenameSelectionSetChange extends Change {
  selectionSet: SelectionSet
  prevName: string
  newName: string
  eventEmitter: EventEmitter
  constructor(selectionSet: SelectionSet, newName: string, eventEmitter: EventEmitter) {
    super(selectionSet.name)

    this.selectionSet = selectionSet
    this.prevName = selectionSet.name
    this.newName = newName
    this.eventEmitter = eventEmitter
  }

  undo(): void {
    console.log('Undo RenameSelectionSet')
    this.selectionSet.name = this.prevName
    this.eventEmitter.emit('selectionSetsListChanged')
  }

  redo(): void {
    console.log('Redo RenameSelectionSet')
    this.selectionSet.name = this.newName
    this.eventEmitter.emit('selectionSetsListChanged')
  }
}

export { RenameSelectionSetChange }
