import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ViewerContext } from "../../../../contexts";

export type DataSettingsProps = {
    gridSize: number,
    boxSize: number,
    boxRoundness: number,
    transparent: number,
}

const VoxelSetting = () => {
    const { modelLoader, setLoaded } = useContext(ViewerContext)
    const [data, setData] = useState<DataSettingsProps>({
        gridSize: 0,
        boxSize: 0,
        boxRoundness: 0,
        transparent: 0
    })
    const [minGrid, setMinGrid] = useState<number>(0.1)

    useEffect(() => {
        if (modelLoader) {
            setLoaded(true)
            setData({
                gridSize: modelLoader?.getSetting().gridSize,
                boxSize: modelLoader?.getSetting().boxSize,
                boxRoundness: modelLoader?.getSetting().boxRoundness,
                transparent: modelLoader?.getSetting().transparent,
            })
            setMinGrid(modelLoader?.getSetting().minSizeLimit)
        }
    }, [modelLoader])

    const UiSettings = useMemo(() => [
        {
            id: 'gridSize',
            name: 'Grid size',
            step: 0.1,
            value: data.gridSize,
            min: minGrid,
            max: minGrid * 10,
        },
        {
            id: 'boxSize',
            name: 'Voxel size',
            step: 0.1,
            value: data.boxSize > data.gridSize ? data.gridSize : (data.boxSize < parseFloat((data.gridSize / 10).toFixed(1)) && data.gridSize >= 1) ? (data.gridSize / 10).toFixed(1) : data.boxSize,
            min: data.gridSize >= 1 ? (data.gridSize / 10).toFixed(1) : 0.1,
            max: data.gridSize,
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
        let postData = {
            ...data,
            [type]: parseFloat(value)
        }
        if (type === 'gridSize') {
            if (data.boxSize > parseFloat(value)) {
                postData = {
                    ...postData,
                    boxSize: parseFloat(value)
                }
            } else if ((data.boxSize < parseFloat((parseFloat(value) / 10).toFixed(1))) && parseFloat(value) >= 1) {
                postData = {
                    ...postData,
                    boxSize: parseFloat((parseFloat(value) / 10).toFixed(1))
                }
            }
        }

        setData(postData)

    }

    const handleApplySetting = useCallback(async () => {
        setLoaded(false)
        modelLoader?.settings.setupSetting(data)
        await modelLoader?.reSetupLoadModel()
        setLoaded(true)
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