import { ModelLoader } from "../../core";
import { useCallback, useEffect, useRef, useState } from "react";
import '../../styles/Viewer.css'
import DragAndDrop from "../DragAndDrop";
import ModelLoading from "./ModelLoading.tsx";
import { ViewerContext } from "../../contexts";
import UiControl from "./UiControl.tsx";
import { IFCBUILDINGELEMENTPROXY } from "web-ifc";
const Viewer = () => {
    const viewerRef = useRef<HTMLDivElement | null>(null)
    const [loaded, setLoaded] = useState<boolean | undefined>(undefined)
    const [isSetting, setIsSetting] = useState<boolean | undefined>(undefined)
    const [modelLoader, setModelLoader] = useState<ModelLoader | undefined>(undefined);
    const [voxelized, setVoxelized] = useState<boolean | undefined>(undefined)

    useEffect(() => {
        return () => {
            cleanUpViewer().then(() => setLoaded(undefined))
        }
    }, []);

    useEffect(() => {
        if (!voxelized && modelLoader) {
            modelLoader.showModel(IFCBUILDINGELEMENTPROXY)
        }
    }, [voxelized, modelLoader])

    const handleGetFileFromDrop = useCallback(async (file: File) => {
        if (viewerRef?.current !== null) {
            setLoaded(false)
            const loader = new ModelLoader(viewerRef.current, file, (value) => setVoxelized(value), cleanUpViewer);
            const isLoaded = await loader.setup();
            if (isLoaded) {
                setLoaded(true)
                setModelLoader(loader)
            } else {
                setLoaded(undefined)
                await loader.cleanUp()
                alert('Error load model IFC. Please try again!')
            }
        }
    }, [])

    const cleanUpViewer = useCallback(async () => {
        if (modelLoader) {
            await modelLoader.cleanUp()
        }

        setModelLoader(undefined)
        setLoaded(undefined)
        if (viewerRef.current) {
            viewerRef.current.innerHTML = '';
            viewerRef.current.classList.remove('obc-viewer');
            viewerRef.current.style.position = '';
        }
    }, [modelLoader])

    return (
        <ViewerContext.Provider value={{ loaded, setLoaded, modelLoader, setModelLoader, closeViewer: cleanUpViewer, voxelized, setVoxelized, isSetting, setIsSetting }}>
            <div className='viewer-container'>
                <div className='loading-container'>
                    <ModelLoading isShow={loaded === false} />
                </div>
                <div className='drag-and-drop'>
                    <DragAndDrop onChangeFile={handleGetFileFromDrop} isShow={loaded === undefined} accept='.ifc' />
                </div>
                <div className='ui-control'>
                    <UiControl isShow={voxelized === true} />
                </div>
                <div className='viewer' ref={viewerRef}></div>
            </div>
        </ViewerContext.Provider>
    );
};

export default Viewer;