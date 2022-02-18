import { Change } from '@zeainc/zea-ux'
import { View } from '../View'

export default class CreateViewChange extends Change {
  view: View
  viewsList: View[]
  constructor(view: View, viewsList: View[]) {
    super(view.name)

    this.view = view
    this.viewsList = viewsList
  }

  undo(): void {
    console.log('Undo CreateView')
    this.viewsList.pop()
  }

  redo(): void {
    this.viewsList.push(this.view)
    console.log('Redo CreateView')
  }
}

export { CreateViewChange }
