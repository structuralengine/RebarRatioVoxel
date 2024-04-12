import {useCallback, useContext, useState} from 'react';
import {ViewerContext} from "../../../contexts";
import {toast} from "react-toastify";

const VoxelizeButton = () => {
    const [voxelized, setVoxelized] = useState(false)
    const {modelLoader} = useContext(ViewerContext)

    const handleVoxelize = useCallback(async () => {
        if (modelLoader) {
            modelLoader.showVoxelModel()
            setVoxelized(true)
        } else {
            toast('Model has not been uploaded yet', {
                type: 'error',
                position: 'top-center',
                autoClose: 3000
            })
        }
    }, [modelLoader])

    const hideVoxelModel = useCallback(async () => {
        setVoxelized(false)
        modelLoader?.hideVoxelModel();
    }, [modelLoader])

    return (
        <>
            {
                voxelized ? <button className='btn btn-warning' onClick={hideVoxelModel}>Hide voxel</button>
                    : <button className='btn btn-success' onClick={handleVoxelize}>Show voxel</button>
            }
        </>
    );
};

export default VoxelizeButton;