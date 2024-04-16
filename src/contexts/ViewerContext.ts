import { createContext } from "react";
import { ModelLoader } from "../core";
import { DataSettingsProps } from "../components/Viewer/ToolSideBar/VoxelSetting";

export const ViewerContext =
    createContext<ViewerContextProps>(
        {
            loaded: undefined,
            setLoaded: () => { },
            modelLoader: undefined,
            setModelLoader: () => { },
            closeViewer: () => { },
            voxelized: undefined,
            setVoxelized: () => { },
            isSetting: undefined,
            setIsSetting: () => {},
        });

export interface ViewerContextProps {
    loaded?: boolean,
    setLoaded: (value?: boolean) => void
    modelLoader?: ModelLoader,
    setModelLoader?: (loader?: ModelLoader) => void
    closeViewer: () => void,
    voxelized?: boolean,
    setVoxelized: (value?: boolean) => void,
    isSetting?: DataSettingsProps,
    setIsSetting: (value?: DataSettingsProps) => void,
}
