import {TreeItem} from '@zeainc/zea-engine'
import {Change} from '@zeainc/zea-ux'
import {View} from '../../View'

class ViewSelectionVisibilityChange extends Change {
    private readonly propagateToAllViews: boolean = false

    constructor(
        public view: View,
        private initialView: View,
        private viewsList: View[],
        private selection: TreeItem[],
        private newVisibility: boolean,
    ) {
        super(view.name)
        if (this.viewIsInitialView()) this.propagateToAllViews = true
        this.applyVisibility(newVisibility, this.propagateToAllViews)
    }

    undo(): void {
        console.log('Undo ViewSelectionVisibilityChange')
        this.applyVisibility(!this.newVisibility, this.propagateToAllViews)
        this.view.pose.activate()
    }

    redo(): void {
        console.log('Redo ViewSelectionVisibilityChange')
        this.applyVisibility(this.newVisibility, this.propagateToAllViews)
        this.view.pose.activate()
    }

    private applyVisibility(visibility: boolean, applyToAllViews = false) {
        this.selection.forEach((treeItem) => {
            treeItem.traverse((item) => {
                const visibleParam = item.visibleParam

                if (!this.viewIsInitialView()) {
                    this.initialView.pose.storeParamValue(visibleParam, !visibility, true)
                }

                this.view.pose.storeParamValue(visibleParam, visibility)

                if (applyToAllViews) {
                    this.viewsList.forEach((view) => {
                        view.pose.storeParamValue(visibleParam, visibility)
                    })
                }
            }, true)
        })
    }

    private viewIsInitialView(): boolean {
        return this.view === this.initialView
    }
}

export { ViewSelectionVisibilityChange }
