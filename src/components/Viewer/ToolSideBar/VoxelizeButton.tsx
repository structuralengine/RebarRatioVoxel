import {useCallback, useContext, useEffect} from 'react';
import {ViewerContext} from "../../../contexts";
import {toast} from "react-toastify";

const VoxelizeButton = () => {
    const { modelLoader, setVoxelized, voxelized } = useContext(ViewerContext)

    useEffect(() => {
        if (voxelized && modelLoader) {
            modelLoader.showVoxelModel()
        }

    }, [voxelized, modelLoader])

    const handleVoxelize = useCallback(async () => {
        if (modelLoader) {
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