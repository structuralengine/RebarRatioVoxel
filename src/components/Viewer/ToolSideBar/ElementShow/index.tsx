import {useCallback, useContext, useEffect, useState} from "react";
import ItemElementShow, {ItemElementType} from "./ItemElementShow.tsx";
import {ViewerContext} from "../../../../contexts";
import {IFCBUILDINGELEMENTPROXY, IFCREINFORCINGBAR} from "web-ifc";

const items: ItemElementType[] = [
    {
        id: 'all',
        name: 'All',
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

const ElementShow = () => {
    const [menuItem, setMenuItem] = useState<ItemElementType[]>(items)

    const {loaded, modelLoader} = useContext(ViewerContext)

    useEffect(() => {
        if (loaded) {
            const menuItem = items.map((item: ItemElementType) => ({...item, isShow: true}))
            setMenuItem(menuItem)
        } else {
            const menuItem = items.map((item: ItemElementType) => ({...item, isShow: false}))
            setMenuItem(menuItem)
        }

        return () => {
            const menuItem = items.map((item: ItemElementType) => ({...item, isShow: false}))
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
            case 'concrete': {
                modelLoader?.showModel(IFCBUILDINGELEMENTPROXY)
                break
            }
            case 'reinforcingBar': {
                modelLoader?.showModel(IFCREINFORCINGBAR)
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
        }
    }, [modelLoader])

    return (
        <div className='element-show-container'>
            <br />
            <h4 style={{textAlign: 'center', width: '100%', display: 'inline-block'}}>Element show</h4>
            {menuItem.map((item: ItemElementType) => <ItemElementShow key={item.id} id={item.id} name={item.name} isShow={item.isShow} onChange={handleOnChangeShow} onShow={handleShowModel} onRemove={handleRemoveModel}/>)}
        </div>
    );
};

export default ElementShow;