import '../../../styles/Viewer.css'
import VoxelizeButton from "./VoxelizeButton.tsx";
import ElementShow from "./ElementShow";
import VoxelSetting from "./VoxelSetting";
import ShowHideVoxelElement from './ShowHideVoxel';
import { useState } from 'react';

type ToolSideBarProps = {
    isShow: boolean
}

const ToolSideBar = ({ isShow }: ToolSideBarProps) => {
    const [showVoxelElement, setShowVoxelElement] = useState(false);

    const handleVoxelButtonClick = () => {
        setShowVoxelElement(prevState => !prevState);
    };

    if (!isShow) return null
    return (
        <div className='tool-sidebar'>
            <VoxelizeButton onVoxelButtonClick={handleVoxelButtonClick} />
            <ElementShow />
            <VoxelSetting />
            {showVoxelElement && <ShowHideVoxelElement />}
        </div>
    );
};

export default ToolSideBar;