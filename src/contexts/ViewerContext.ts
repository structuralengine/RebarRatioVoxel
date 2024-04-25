import { createContext } from "react";
import { ModelLoader } from "../core";

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
            isModaling: undefined,
            setIsModaling: () => {},
        });

export interface ViewerContextProps {
    loaded?: boolean,
    setLoaded: (value?: boolean) => void
    modelLoader?: ModelLoader,
    setModelLoader?: (loader?: ModelLoader) => void
    closeViewer: () => void,
    voxelized?: boolean,
    setVoxelized: (value?: boolean) => void,
    isSetting?: boolean,
    setIsSetting: (value?: boolean | undefined) => void,
    isModaling?: boolean,
    setIsModaling: (value?: boolean) => void,
}
