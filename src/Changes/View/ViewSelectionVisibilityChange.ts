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
            const visibleParam = treeItem.visibleParam

            if (!this.viewIsInitialView()) {
                this.initialView.pose.storeParamValue(visibleParam, !visibility, true)
                this.initialView.updateHiddenPartsList()
            }


            this.view.pose.storeParamValue(visibleParam, visibility)
            this.view.updateHiddenPartsList()

            if (applyToAllViews) {
                this.viewsList.forEach((view) => {
                    view.pose.storeParamValue(visibleParam, visibility)
                    view.updateHiddenPartsList()
                })
            }
        })
    }

    private viewIsInitialView(): boolean {
        return this.view === this.initialView
    }
}

export { ViewSelectionVisibilityChange }
