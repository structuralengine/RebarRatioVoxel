import ElementShow from "./ToolSideBar/ElementShow";
import ShowHideVoxelElement from "./ToolSideBar/ShowHideVoxel";
import VoxelSetting from "./ToolSideBar/VoxelSetting";


type ToolSideBarProps = {
    isShow: boolean
}

const UiControl = ({isShow}: ToolSideBarProps) => {

    if (!isShow) return null
    return (
        <>
            {
                isShow &&
                <>
                    <div className='header'>Controls</div>
                    <div className='body'>
                      <VoxelSetting />
                      <ShowHideVoxelElement />
                      <ElementShow />
                    </div>
                </>
            }
        </>
    );
};

export default UiControl;