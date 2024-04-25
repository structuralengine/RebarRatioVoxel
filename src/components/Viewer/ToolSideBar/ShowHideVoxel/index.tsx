import { useCallback, useContext, useEffect, useState } from "react";
import ShowHideVoxel from "./ShowHideVoxel";
import { ItemElementType } from "./ShowHideVoxel";

import { ViewerContext } from "../../../../contexts";
import { materialColorlist } from "../../../../core";

const items: ItemElementType[] = [
    {
        id: 'all',
        name: 'All',
        ratio: '',
        quantity: 0,
        isShow: false
    },
    ...materialColorlist.map((color) => ({
        id: color.color,
        name: color.label,
        ratio: color.ratio,
        quantity: color.quantity,
        isShow: false
    }))
]

const ShowHideVoxelElement = () => {
    const [menuItem, setMenuItem] = useState<ItemElementType[]>(items)

    const { loaded, modelLoader, setIsSetting } = useContext(ViewerContext)

    useEffect(() => {
        if (loaded) {
            const colorQuantity: { [key: string]: number } = {}
            materialColorlist.forEach((color) => {
                colorQuantity[color.color] = color.quantity;
            });
            const menuItem = items.map((item: ItemElementType) => {
                if (item.id === 'all') {
                    return {
                        ...item,
                        isShow: true,
                        quantity: Object.values(colorQuantity).reduce((acc, curr) => acc + curr, 0)
                    };
                }

                return {
                    ...item,
                    isShow: true,
                    quantity: colorQuantity[item.id] || 0
                };
            });

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
                    <ShowHideVoxel key={item.id} id={item.id} name={item.name} ratio={item.ratio} quantity={item.quantity} isShow={item.isShow} onChange={handleOnChangeShow} onShow={handleShowModel} onRemove={handleRemoveModel} />)}
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setIsSetting(true)}>
                modal
            </button>
        </>
    );
};

export default ShowHideVoxelElement;