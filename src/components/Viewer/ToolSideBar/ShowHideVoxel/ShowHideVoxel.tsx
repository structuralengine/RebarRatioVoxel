import {ChangeEvent, useCallback, useEffect} from 'react';

export type ItemElementType = {
    id: string
    name: string
    isShow: boolean
    onChange?: (id: string, status: boolean) => void
    onShow?: (id: string) => void
    onRemove?: (id: string) => void
}

const ShowHideVoxel = ({id, name, isShow, onChange, onShow, onRemove}: ItemElementType) => {

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
            <input type="checkbox" id={id} name="checkbox" checked={isShow} onChange={handleOnChange}/>
            <label htmlFor={id}><div className="square" style={{ background: '#00d4ff' }}>{name}</div></label>
        </div>
    );
};

export default ShowHideVoxel;
