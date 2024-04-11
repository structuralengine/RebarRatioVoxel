import {useCallback, useContext} from 'react';
import {ViewerContext} from "../../../contexts";
import {toast} from "react-toastify";

const VoxelizeButton = () => {
    const {modelLoader} = useContext(ViewerContext)

    const handleVoxelize = useCallback(async () => {
        if (modelLoader) {
            await modelLoader.voxelizeModel()
            toast('Successfully', {
                toastId: '1',
                type: 'success',
                position: 'top-center',
                autoClose: 3000
            })
        } else {
            toast('Model has not been uploaded yet', {
                type: 'error',
                position: 'top-center',
                autoClose: 3000
            })
        }
    }, [modelLoader])

    return (
        <button className='tool-sidebar-btn' onClick={handleVoxelize}>Voxelize model</button>
    );
};

export default VoxelizeButton;