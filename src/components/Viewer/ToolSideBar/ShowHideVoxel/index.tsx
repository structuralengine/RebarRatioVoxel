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
        name: 'Blue',
        isShow: false
    },
    {
        id: 'color 1',
        name: 'Aqua',
        isShow: false
    },
    {
        id: 'color 2',
        name: 'Green',
        isShow: false
    },
    {
        id: 'color 3',
        name: 'Yellow',
        isShow: false
    },
    {
        id: 'color 4',
        name: 'Red',
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

    useEffect(() => {
        if (isSetting) {
            const changeMenuItem = menuItem.map((item: ItemElementType) => ({ ...item, isShow: true }));
            setMenuItem(changeMenuItem);
            setIsSetting(false)
        }
    }, [isSetting]);

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
                modelLoader?.showVoxelByColor(0x00d4ff)
                break
            }
            case 'color 1': {
                modelLoader?.showVoxelByColor(0x09e8cd)
                break
            }
            case 'color 2': {
                modelLoader?.showVoxelByColor(0x09e810)
                break
            }
            case 'color 3': {
                modelLoader?.showVoxelByColor(0xe8de09)
                break
            }
            case 'color 4': {
                modelLoader?.showVoxelByColor(0xe80909)
                break
            }
        }
    }, [modelLoader])

    const handleRemoveModel = useCallback(async (id: string) => {
        switch (id) {
            case 'color 0': {
                modelLoader?.hideVoxelByColor(0x00d4ff)
                break
            }
            case 'color 1': {
                modelLoader?.hideVoxelByColor(0x09e8cd)
                break
            }
            case 'color 2': {
                modelLoader?.hideVoxelByColor(0x09e810)
                break
            }
            case 'color 3': {
                modelLoader?.hideVoxelByColor(0xe8de09)
                break
            }
            case 'color 4': {
                modelLoader?.hideVoxelByColor(0xe80909)
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