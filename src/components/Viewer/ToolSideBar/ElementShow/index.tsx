import { useCallback, useContext, useEffect, useState } from "react";
import ItemElementShow, { ItemElementType } from "./ItemElementShow.tsx";
import { ViewerContext } from "../../../../contexts";
import { IFCBUILDINGELEMENTPROXY, IFCREINFORCINGBAR } from "web-ifc";

type ElementShowProps = {
    setIsVoxelChecked: React.Dispatch<React.SetStateAction<boolean>>;
};

const items: ItemElementType[] = [
    {
        id: 'all',
        name: 'All',
        isShow: false
    },
    {
        id: 'voxel',
        name: 'Voxel',
        isShow: false
    },
    {
        id: 'concrete',
        name: 'Concrete',
        isShow: false
    },
    {
        id: 'reinforcingBar',
        name: 'Reinforcing Bar',
        isShow: false
    }
]

const ElementShow = ({ setIsVoxelChecked }: ElementShowProps) => {
    const [menuItem, setMenuItem] = useState<ItemElementType[]>(items)

    const { loaded, modelLoader, isSetting, setIsSetting } = useContext(ViewerContext)

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
            const changeMenuItem = menuItem.map((item: ItemElementType) => {
                if (item.id === 'voxel') {
                    return ({ ...item, isShow: true })
                } else {
                    return item
                }
            })
            setMenuItem(changeMenuItem)
        }
    }, [isSetting])

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
            case 'concrete': {
                modelLoader?.showModel(IFCBUILDINGELEMENTPROXY)
                break
            }
            case 'reinforcingBar': {
                modelLoader?.showModel(IFCREINFORCINGBAR)
                break
            }
            case 'voxel': {
                modelLoader?.showVoxelModel()
                setIsVoxelChecked(true)
                break
            }
        }
    }, [modelLoader])

    const handleRemoveModel = useCallback(async (id: string) => {
        switch (id) {
            case 'concrete': {
                modelLoader?.removeModel(IFCBUILDINGELEMENTPROXY)
                break
            }
            case 'reinforcingBar': {
                modelLoader?.removeModel(IFCREINFORCINGBAR)
                break
            }
            case 'voxel': {
                modelLoader?.hideVoxelModel()
                setIsVoxelChecked(false)
                setIsSetting(false)
                break
            }
        }
    }, [modelLoader, setIsSetting])

    return (
        <>
            <div className='header'>Element show</div>
            <div className='body'>
                <div className='element-show-container'>
                    {menuItem.map((item: ItemElementType) =>
                        <ItemElementShow key={item.id} id={item.id} name={item.name} isShow={item.isShow}
                            onChange={handleOnChangeShow}
                            onShow={handleShowModel}
                            onRemove={handleRemoveModel}
                        />
                    )}
                </div>
            </div>
        </>

    );
};

export default ElementShow;