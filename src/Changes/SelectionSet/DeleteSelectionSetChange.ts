import {EventEmitter} from '@zeainc/zea-engine'
import {Change} from '@zeainc/zea-ux'
import {SelectionSet} from "../../SelectionSet";

class DeleteSelectionSetChange extends Change {
  selectionSet: SelectionSet
  selectionSetsList: SelectionSet[]
  eventEmitter: EventEmitter
  constructor(selectionSet: SelectionSet, selectionSetsList: SelectionSet[], eventEmitter: EventEmitter) {
    super(selectionSet.name)

    this.selectionSet = selectionSet
    this.selectionSetsList = selectionSetsList
    this.eventEmitter = eventEmitter
  }

  undo(): void {
    console.log('Undo DeleteSelectionSet')
    this.selectionSetsList.push(this.selectionSet)

    this.eventEmitter.emit('selectionSetsListChanged')
  }

  redo(): void {
    this.selectionSetsList.pop()
    console.log('Redo DeleteSelectionSet')
    this.eventEmitter.emit('selectionSetsListChanged')
  }
}

export { DeleteSelectionSetChange }
