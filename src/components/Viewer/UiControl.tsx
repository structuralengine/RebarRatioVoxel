import { useState } from "react";
import ElementShow from "./ToolSideBar/ElementShow";
import ShowHideVoxel from "./ToolSideBar/ShowHideVoxel";
import VoxelSetting from "./ToolSideBar/VoxelSetting";


type ToolSideBarProps = {
    isShow: boolean
}

const UiControl = ({isShow}: ToolSideBarProps) => {
const [isVoxelChecked, setIsVoxelChecked] = useState<boolean>(false);

    if (!isShow) return null
    return (
        <>
            {
                isShow &&
                <>
                    <div className='header'>Controls</div>
                    <div className='body'>
                      <VoxelSetting />
                      <ElementShow setIsVoxelChecked={setIsVoxelChecked}/>
                      {isVoxelChecked && <ShowHideVoxel />}
                    </div>
                </>
            }
        </>
    );
};

export default UiControl;