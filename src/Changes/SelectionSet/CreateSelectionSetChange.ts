import {EventEmitter} from '@zeainc/zea-engine'
import {Change} from '@zeainc/zea-ux'
import {SelectionSet} from "../../SelectionSet";

export default class CreateSelectionSetChange extends Change {
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
    console.log('Undo CreateSelectionSet')
    this.selectionSetsList.pop()

    this.eventEmitter.emit('selectionSetsListChanged')
  }

  redo(): void {
    this.selectionSetsList.push(this.selectionSet)
    console.log('Redo CreateSelectionSet')
    this.eventEmitter.emit('selectionSetsListChanged')
  }
}

export { CreateSelectionSetChange }
