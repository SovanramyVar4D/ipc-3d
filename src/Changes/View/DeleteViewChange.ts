import { EventEmitter } from '@zeainc/zea-engine'
import { Change } from '@zeainc/zea-ux'
import { View } from '../../View'

class DeleteViewChange extends Change {
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
    console.log('Undo DeleteView')
    this.viewsList.push(this.view)

    this.eventEmitter.emit('viewsListChanged')
  }

  redo(): void {
    this.viewsList.pop()
    console.log('Redo DeleteView')
    this.eventEmitter.emit('viewsListChanged')
  }
}

export { DeleteViewChange }
