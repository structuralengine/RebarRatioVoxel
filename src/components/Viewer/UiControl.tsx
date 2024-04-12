import ElementShow from "./ToolSideBar/ElementShow";
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
                      <ElementShow />
                    </div>
                </>
            }
        </>
    );
};

export default UiControl;