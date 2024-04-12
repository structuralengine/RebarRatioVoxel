import '../../../styles/Viewer.css'
import VoxelizeButton from "./VoxelizeButton.tsx";
import CloseModelButton from "./CloseModelButton.tsx";
import ElementShow from "./ElementShow";
import VoxelSetting from "./VoxelSetting";

type ToolSideBarProps = {
    isShow: boolean
}

const ToolSideBar = ({isShow}: ToolSideBarProps) => {

    if (!isShow) return null
    return (
        <div className='tool-sidebar'>
            <VoxelizeButton />
            <CloseModelButton />
            <ElementShow />
            <VoxelSetting />
        </div>
    );
};

export default ToolSideBar;