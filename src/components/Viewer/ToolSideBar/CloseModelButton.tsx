import {useCallback, useContext} from "react";
import {ViewerContext} from "../../../contexts";

const CloseModelButton = () => {
    const {closeViewer, setVoxelized} = useContext(ViewerContext)

    const handleCloseModel = useCallback(async () => {
        setVoxelized(false)
        closeViewer()
    }, [closeViewer])

    return (
        <button className='btn btn-danger mt-3' style={{backgroundColor: 'red'}} onClick={handleCloseModel}>Close model</button>
    );
};

export default CloseModelButton;