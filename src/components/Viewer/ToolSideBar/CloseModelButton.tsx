import {useCallback, useContext} from "react";
import {ViewerContext} from "../../../contexts";

const CloseModelButton = () => {
    const {closeViewer} = useContext(ViewerContext)

    const handleCloseModel = useCallback(async () => {
        closeViewer()
    }, [closeViewer])

    return (
        <button className='btn btn-danger mt-3' style={{backgroundColor: 'red'}} onClick={handleCloseModel}>Close model</button>
    );
};

export default CloseModelButton;