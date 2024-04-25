import { useCallback, useContext, useEffect, useState } from "react";
import ShowHideVoxel from "./ShowHideVoxel";
import { ItemElementType } from "./ShowHideVoxel";
import { ViewerContext } from "../../../../contexts";

const ShowHideVoxelElement = () => {
    const [menuItem, setMenuItem] = useState<ItemElementType[]>([])

    const { isModaling, loaded, modelLoader, setLoaded, setIsSetting, setIsModaling } = useContext(ViewerContext)

    const materialColorList = JSON.parse(localStorage.getItem('materialColorList') || '[]')

    const items: ItemElementType[] = [
        {
            id: 'all',
            name: 'All',
            ratio: '',
            quantity: 0,
            isShow: false
        },
        ...materialColorList.map((color: any) => ({
            id: color.color,
            name: color.label,
            ratio: `${color.ratio.min}% - ${color.ratio.max}%`,
            quantity: color.quantity,
            isShow: false
        }))
    ]

    useEffect(() => {

        if (loaded ) {
            const colorQuantity: { [key: string]: number } = {}
            materialColorList.forEach((color: any) => {
                colorQuantity[color.color] = color.quantity;
            });
            const menuItem = items.map((item: ItemElementType) => {
                if (isModaling) {
                    setIsModaling(false)
                    return {
                        ...item,
                        isShow: true,
                        quantity: 0
                    };
                }  else {
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
                }
            });

            console.log('----', menuItem)
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

    const handleDetectRebar = useCallback(async () => {
        setLoaded(false)
        setTimeout(() => {
            const rebarMesh = modelLoader?.getElement().reinforcingBarMesh
            if (rebarMesh) {
                modelLoader?.detectRebarAndVoxel(rebarMesh)
            }
            setLoaded(true)

        }, 100)

    }, [modelLoader])

    return (
        <>
            <div className='header'>Show/Hide Voxel by Color</div>
            <div className='body'>
                {materialColorList.length !== 0 && menuItem.map((item: ItemElementType) =>
                    <ShowHideVoxel key={item.id} id={item.id} name={item.name} ratio={item.ratio} quantity={item.quantity} isShow={item.isShow} onChange={handleOnChangeShow} onShow={handleShowModel} onRemove={handleRemoveModel} />)}
                <div className="button-setting">
                    <button type="button" className="button" onClick={() => setIsSetting(true)}>
                        Modal
                    </button>
                </div>
                <div className="button-setting">
                    <button className="button" disabled={materialColorList.length == 0} onClick={() => handleDetectRebar()}>Detect</button>
                </div>

            </div>
        </>
    );
};

export default ShowHideVoxelElement;