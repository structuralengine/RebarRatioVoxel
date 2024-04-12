import {useContext} from "react";
import {ViewerContext} from "../../../../contexts";

const VoxelSetting = () => {
    const {modelLoader} = useContext(ViewerContext)

    return (
        <div className='element-show-container'>
            <br />
            <h4 style={{textAlign: 'center', width: '100%', display: 'inline-block'}}>Voxel setting</h4>
            <table>
                <tbody>
                <tr>
                    <td>Grid size:</td>
                    <td>{modelLoader?.settings.gridSize}</td>
                </tr>
                <tr>
                    <td>Box size:</td>
                    <td>{modelLoader?.settings.boxSize}</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default VoxelSetting;