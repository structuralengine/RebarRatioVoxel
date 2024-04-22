import { ModelLoader } from "../../core";
import { useCallback, useEffect, useRef, useState } from "react";
import '../../styles/Viewer.css'
import DragAndDrop from "../DragAndDrop";
import ModelLoading from "./ModelLoading.tsx";
import { ViewerContext } from "../../contexts";
import UiControl from "./UiControl.tsx";
import { IFCBUILDINGELEMENTPROXY } from "web-ifc";
import { DataSettingsProps } from "./ToolSideBar/VoxelSetting/index.tsx";
const Viewer = () => {
    const viewerRef = useRef<HTMLDivElement | null>(null)
    const [loaded, setLoaded] = useState<boolean | undefined>(undefined)
    const [isSetting, setIsSetting] = useState<DataSettingsProps | undefined>(undefined)
    const [modelLoader, setModelLoader] = useState<ModelLoader | undefined>(undefined);
    const [voxelized, setVoxelized] = useState<boolean | undefined>(undefined)

    console.log('loaded', loaded)

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

    const handleVoxelModel = useCallback((value: boolean | undefined, isLoading: boolean) => {
        if (value) {
            setLoaded(isLoading)
        } else {
            setLoaded(undefined)
        }
        setVoxelized(value)
    }, [])

    const handleGetFileFromDrop = useCallback(async (file: File) => {
        if (viewerRef?.current !== null) {
            setLoaded(false)
            const loader = new ModelLoader(viewerRef.current, file, (value, isLoading) => handleVoxelModel(value, isLoading), cleanUpViewer);
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
        setVoxelized(undefined)
        setIsSetting(undefined)
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