import {Change} from '@zeainc/zea-ux'
import {View} from '../../View'
import {EventEmitter} from "@zeainc/zea-engine";
import * as events from "events";

export default class RenameViewChange extends Change {
  view: View
  prevName: string
  newName: string
  eventEmitter: EventEmitter
  constructor(view: View, newName: string, eventEmitter: EventEmitter) {
    super(view.name)
    this.view = view
    this.prevName = view.name
    this.newName = newName
    this.eventEmitter = eventEmitter
  }

  undo(): void {
    console.log('Undo RenameView')
    this.view.name = this.prevName
    this.eventEmitter.emit('viewsListChanged')
  }

  redo(): void {
    console.log('Redo RenameView')
    this.view.name = this.newName
    this.eventEmitter.emit('viewsListChanged')
  }
}

export { RenameViewChange }
