import {ChangeEvent, useCallback, useEffect} from 'react';

export type ItemElementType = {
    id: string
    name: string
    isShow: boolean
    onChange?: (id: string, status: boolean) => void
    onShow?: (id: string) => void
    onRemove?: (id: string) => void
}

const ItemElementShow = ({id, name, isShow, onChange, onShow, onRemove}: ItemElementType) => {

    useEffect(() => {
        if (isShow) {
            onShow?.(id)
        } else {
            onRemove?.(id)
        }

        return () => {
            onRemove?.(id)
        }
    }, [id, isShow]);

    const handleOnChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(id, event.target.checked)
    }, [id, onChange])

    return (
        <div>
            <input type="checkbox" id={id} className="checkbox" checked={isShow} onChange={handleOnChange}/>
            <label className='element' htmlFor={id}> {name}</label>
        </div>
    );
};

export default ItemElementShow;