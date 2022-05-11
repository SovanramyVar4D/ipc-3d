import {SelectionSetJson} from '../SelectionSet'
import {CuttingPlaneJson} from '../CuttingPlane'
import {AssetJson} from './AssetJson'
import {ViewJson} from './ViewJson'

export interface ProjectJson {
    assets: AssetJson[]
    initialView: ViewJson
    views?: ViewJson[]
    selectionSets?: SelectionSetJson[]
    cuttingPlanes?: CuttingPlaneJson[]
    materials?: Record<string, any>[]
    materialAssignments?: Record<string, number>
}
