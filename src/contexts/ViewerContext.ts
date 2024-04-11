import {createContext} from "react";
import {ModelLoader} from "../core";

export const ViewerContext =
    createContext<ViewerContextProps>(
        {
            loaded: undefined,
            setLoaded: () => {},
            modelLoader: undefined,
            setModelLoader: () => {},
            closeViewer: () => {}
        });

export interface ViewerContextProps {
    loaded?: boolean,
    setLoaded: (value?: boolean) => void
    modelLoader?: ModelLoader,
    setModelLoader?: (loader?: ModelLoader) => void
    closeViewer: () => void
}
