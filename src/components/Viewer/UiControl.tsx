import { useContext, useEffect, useMemo, useState } from 'react';
import { ViewerContext } from "../../contexts";

const UiControl = () => {
    const { modelLoader, voxelized } = useContext(ViewerContext)
    const [data, setData] = useState<any>({})
    const [minGrid, setMinGrid] = useState<any>(0.1)

    useEffect(() => {
        if (modelLoader) {
            setData({
                gridSize: modelLoader?.getSetting().gridSize,
                boxSize: modelLoader?.getSetting().boxSize,
                boxRoundness: modelLoader?.getSetting().boxRoundness,
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
            value: data.boxSize > data.gridSize ? data.gridSize : (data.boxSize < (data.gridSize / 10).toFixed(1) && data.gridSize >= 1) ? (data.gridSize / 10).toFixed(1) : data.boxSize,
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
        }
    ], [data, modelLoader])

    const handleChangeSetting = (value: string, type: any) => {
        let postData = {
            ...data,
            [type]: parseFloat(value)
        }
        if (type === 'gridSize') {
            if (data.boxSize > value) {
                postData = {
                    ...postData,
                    boxSize: parseFloat(value)
                }
            } else if ((data.boxSize < (parseFloat(value) / 10).toFixed(1)) && parseFloat(value) >= 1){
                postData = {
                    ...postData,
                    boxSize: parseFloat((parseFloat(value) / 10).toFixed(1))
                }
            }
        }

        setData(postData)
        modelLoader?.settings.setupSetting(postData)
        modelLoader?.reSetupLoadModel()
    }

    if (!voxelized) return null
    return (
        <>
            {
                voxelized &&
                <>
                    <div className='header'>Controls</div>
                    <div className='body'>
                        {UiSettings.map((setting) =>
                            <div key={setting.id}>
                                <div className='setting-element'>{setting.name}</div>
                                <div className='input'>
                                    <input type="range" className="form-range" step={setting.step} min={setting.min} max={setting.max} value={setting.value} onChange={(e) => handleChangeSetting(e.target.value, setting.id)}></input>
                                    <input readOnly className="input-range" value={setting.value}></input>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            }
        </>
    );
};

export default UiControl;