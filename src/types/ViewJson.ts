import {PoseJson} from '../Pose'
import {SelectionSetIdent} from './SelectionSetIdentJson'

export interface ViewJson {
    id: string
    name: string
    cameraXfo: Record<string, any>
    cameraTarget: Record<string, any>
    pose: PoseJson
    selectionSets?: SelectionSetIdent[]
}


