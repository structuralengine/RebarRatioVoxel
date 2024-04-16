import { useCallback, useContext, useEffect, useState } from "react";
import ShowHideVoxel from "./ShowHideVoxel";
import { ItemElementType } from "./ShowHideVoxel";

import { ViewerContext } from "../../../../contexts";
import {materialColorlist} from "../../../../core";

const items: ItemElementType[] = [
    {
        id: 'all',
        name: 'All',
        isShow: false
    },
    ...materialColorlist.map((color) => ({
        id: color.color,
        name: color.label,
        isShow: false
    }))
]

const ShowHideVoxelElement = () => {
    const [menuItem, setMenuItem] = useState<ItemElementType[]>(items)

    const { loaded, modelLoader } = useContext(ViewerContext)

    useEffect(() => {
        if (loaded) {
            const menuItem = items.map((item: ItemElementType) => ({ ...item, isShow: true }))
            setMenuItem(menuItem)
        } else {
            const menuItem = items.map((item: ItemElementType) => ({ ...item, isShow: false }))
            setMenuItem(menuItem)
        }

        return () => {
            const menuItem = items.map((item: ItemElementType) => ({ ...item, isShow: false }))
            setMenuItem(menuItem)
        }
    }, [loaded]);

    const handleOnChangeShow = useCallback(async (id: string, status: boolean) => {
        const menus = menuItem.map((item: ItemElementType) => {
            if (id !== 'all' && !status && item.id === 'all') {
                return {
                    ...item,
                    isShow: false
                }
            }
            if (item.id === id || id === 'all') {
                return {
                    ...item,
                    isShow: status
                }
            }

            return {
                ...item
            }
        })
        setMenuItem(menus)
    }, [menuItem])

    const handleShowModel = useCallback(async (id: string) => {
        modelLoader?.showVoxelByColor(id)
    }, [modelLoader])

    const handleRemoveModel = useCallback(async (id: string) => {
        modelLoader?.hideVoxelByColor(id)
    }, [modelLoader])

    return (
        <>
        <div className='header'>Show/Hide Voxel by Color</div>
           <div className='body'>
            {menuItem.map((item: ItemElementType) =>
                <ShowHideVoxel key={item.id} id={item.id} name={item.name} isShow={item.isShow} onChange={handleOnChangeShow} onShow={handleShowModel} onRemove={handleRemoveModel} />)}
        </div>
        </>
    );
};

export default ShowHideVoxelElement;