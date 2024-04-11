import '../../../styles/Viewer.css'
import VoxelizeButton from "./VoxelizeButton.tsx";
import CloseModelButton from "./CloseModelButton.tsx";

type ToolSideBarProps = {
    isShow: boolean
}

const ToolSideBar = ({isShow}: ToolSideBarProps) => {

    if (!isShow) return null
    return (
        <div className='tool-sidebar'>
            <VoxelizeButton />
            <CloseModelButton />
        </div>
    );
};

export default ToolSideBar;