/*
* Generates an unique ID
*/
import {CADAssembly, CADPart, GeomItem, TreeItem} from "@zeainc/zea-engine";

export const UUID = () => {
    function s(n: number) {
        return h((Math.random() * (1 << (n << 2))) ^ Date.now()).slice(-n)
    }

    function h(n: number) {
        return (n | 0).toString(16)
    }

    return [
        s(4) + s(4), s(4),
        '4' + s(3),                    // UUID version 4
        h(8 | (Math.random() * 4)) + s(3), // {8|9|A|B}xxx
        // s(4) + s(4) + s(4),
        Date.now().toString(16).slice(-10) + s(2) // Use timestamp to avoid collisions
    ].join('-')
}

/*
* Gets CADPart or CADAssembly from TreeItem
*/
export const filterItem = ((geomItem: TreeItem) => {
    let item = geomItem
    while (
        item &&
        !(item instanceof CADPart) &&
        !(item instanceof CADAssembly)
        ) {
        item = <TreeItem>item.getOwner()
    }
    return item
})



