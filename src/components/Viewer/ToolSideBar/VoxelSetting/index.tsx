import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ViewerContext } from "../../../../contexts";

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
            name: 'ボクセルサイズ',
            step: 0.1,
            value: data.boxSize,
            min: 0.1,
            max: sizeLimit,
        },
        {
            id: 'transparent',
            name: '透明度',
            step: 0.1,
            value: data.transparent,
            min: 0.1,
            max: 1,
        },

        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])

    return (
        <>
            <div className='header'>ボクセルの設定</div>
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
                    <button className='button' onClick={() => handleApplySetting()}>適用</button>
                </div>
            </div>
        </>
    );
};

export default VoxelSetting;