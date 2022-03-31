import { EventEmitter } from '@zeainc/zea-engine'
import { Change } from '@zeainc/zea-ux'
import { View } from '../../View'

export default class CreateViewChange extends Change {
  view: View
  viewsList: View[]
  eventEmitter: EventEmitter
  constructor(view: View, viewsList: View[], eventEmitter: EventEmitter) {
    super(view.name)

    this.view = view
    this.viewsList = viewsList
    this.eventEmitter = eventEmitter
  }

  undo(): void {
    console.log('Undo CreateView')
    this.viewsList.pop()

    this.eventEmitter.emit('viewsListChanged')
  }

  redo(): void {
    this.viewsList.push(this.view)
    console.log('Redo CreateView')
    this.eventEmitter.emit('viewsListChanged')
  }
}

export { CreateViewChange }
