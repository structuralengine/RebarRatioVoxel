import { left } from '@popperjs/core';
import { ChangeEvent, useCallback, useEffect } from 'react';

export type ItemElementType = {
    id: string
    name: string
    ratio: string
    isShow: boolean
    onChange?: (id: string, status: boolean) => void
    onShow?: (id: string) => void
    onRemove?: (id: string) => void
}

const ShowHideVoxel = ({ id, name, ratio, isShow, onChange, onShow, onRemove }: ItemElementType) => {

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
            <input type="checkbox" id={id} className="checkbox" checked={isShow} onChange={handleOnChange} />
            <label className="element" htmlFor={id}>
                <div className="square element" style={{ background: `${name.replace('0x', '#')}`, padding: `${name === 'All' ? 0 : '6px'}` }}>{name === 'All' && name }  </div>  
            </label>
            <label style={{marginLeft: '5px'}} className="element">{ratio}</label>
        </div>
    );
};

export default ShowHideVoxel;
