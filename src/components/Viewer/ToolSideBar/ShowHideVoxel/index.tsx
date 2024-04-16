import { useCallback, useContext, useEffect, useState } from "react";
import ShowHideVoxel from "./ShowHideVoxel";
import { ItemElementType } from "./ShowHideVoxel";

import { ViewerContext } from "../../../../contexts";

const items: ItemElementType[] = [
    {
        id: 'all',
        name: 'All',
        isShow: false
    },
    {
        id: 'color 0',
        name: '0x057400',
        isShow: false
    },
    {
        id: 'color 1',
        name: '0x00ffec',
        isShow: false
    },
    {
        id: 'color 2',
        name: '0x0228ac',
        isShow: false
    },
    {
        id: 'color 3',
        name: '0xafb300',
        isShow: false
    },
    {
        id: 'color 4',
        name: '0xc70000',
        isShow: false
    }
]

const ShowHideVoxelElement = () => {
    const [menuItem, setMenuItem] = useState<ItemElementType[]>(items)

    const { loaded, modelLoader, isSetting, setIsSetting} = useContext(ViewerContext)

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
        switch (id) {
            case 'color 0': {
                modelLoader?.showVoxelByColor(0x057400)
                break
            }
            case 'color 1': {
                modelLoader?.showVoxelByColor(0x00ffec)
                break
            }
            case 'color 2': {
                modelLoader?.showVoxelByColor(0x0228ac)
                break
            }
            case 'color 3': {
                modelLoader?.showVoxelByColor(0xafb300)
                break
            }
            case 'color 4': {
                modelLoader?.showVoxelByColor(0xc70000)
                break
            }
        }
    }, [modelLoader])

    const handleRemoveModel = useCallback(async (id: string) => {
        switch (id) {
            case 'color 0': {
                modelLoader?.hideVoxelByColor(0x057400)
                break
            }
            case 'color 1': {
                modelLoader?.hideVoxelByColor(0x00ffec)
                break
            }
            case 'color 2': {
                modelLoader?.hideVoxelByColor(0x0228ac)
                break
            }
            case 'color 3': {
                modelLoader?.hideVoxelByColor(0xafb300)
                break
            }
            case 'color 4': {
                modelLoader?.hideVoxelByColor(0xc70000)
                break
            }
        }
    }, [modelLoader])

    return (
        <>
        <div className='header'>Show/Hide Voxel by Color</div>
           <div className='body'>
            {menuItem.map((item: ItemElementType) => <ShowHideVoxel key={item.id} id={item.id} name={item.name} isShow={item.isShow} onChange={handleOnChangeShow} onShow={handleShowModel} onRemove={handleRemoveModel} />)}
        </div>
        </>
    );
};

export default ShowHideVoxelElement;