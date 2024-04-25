import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ViewerContext } from "../../../../contexts";
import { ModelHandler } from '../../../../core';

export type DataSettingsProps = {
    boxSize: number,
    boxRoundness: number,
    transparent: number,
}

const VoxelSetting = () => {
    const { modelLoader ,setLoaded, setIsModaling } = useContext(ViewerContext)
    const [data, setData] = useState<DataSettingsProps>({
        boxSize: 0,
        boxRoundness: 0,
        transparent: 0
    })
    const [sizeLimit, setsizeLimit] = useState<number>(0.1)

    useEffect(() => {
        if (modelLoader) {
            setData({
                boxSize: modelLoader?.getSetting().boxSize,
                boxRoundness: modelLoader?.getSetting().boxRoundness,
                transparent: modelLoader?.getSetting().transparent,
            })
            setsizeLimit(modelLoader?.getSetting().sizeLimit)
        }
    }, [modelLoader])

    const UiSettings = useMemo(() => [
        {
            id: 'boxSize',
            name: 'Voxel size',
            step: 0.1,
            value: data.boxSize,
            min: 0.1,
            max: sizeLimit,
        },
        {
            id: 'boxRoundness',
            name: 'Voxel roundness',
            step: 0.01,
            value: data.boxRoundness,
            min: 0,
            max: 0.1,
        },
        {
            id: 'transparent',
            name: 'Transparent',
            step: 0.1,
            value: data.transparent,
            min: 0.1,
            max: 1,
        },
    ], [data, modelLoader])

    const handleChangeSetting = (value: string, type: string) => {
        const postData = {
            ...data,
            [type]: parseFloat(value)
        }

        setData(postData)

    }

    const handleApplySetting = useCallback(async () => {
        setLoaded(false)
        setIsModaling(false)
        setTimeout(() => {
            if(data.boxSize !== modelLoader?.getSetting().boxSize) {
                modelLoader?.settings.setupSetting(data)
                modelLoader?.reSetupLoadModel()
            } 
            if(data.boxRoundness !== modelLoader?.getSetting().boxRoundness
                || data.transparent !== modelLoader?.getSetting().transparent) {
                    modelLoader?.settings.setupSetting(data)
                    modelLoader?.reRenderVoxel(data.boxSize, data.boxRoundness, data.transparent)
            }
            setLoaded(true)
        }, 100)
    }, [data])

    return (
        <>
            <div className='header'>Setting voxel</div>
            <div className='body'>
                {UiSettings.map((setting) =>
                    <div key={setting.id}>
                        <div className='element'>{setting.name}</div>
                        <div className='input'>
                            <input type="range" className="form-range" step={setting.step} min={setting.min} max={setting.max} value={setting.value} onChange={(e) => handleChangeSetting(e.target.value, setting.id)}></input>
                            <input readOnly className="input-range" value={setting.value}></input>
                        </div>
                    </div>
                )}
                <div className='button-setting'>
                    <button className='button' onClick={() => handleApplySetting()}>Apply</button>
                </div>
            </div>
        </>
    );
};

export default VoxelSetting;