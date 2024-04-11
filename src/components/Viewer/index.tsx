import {ModelLoader} from "../../core";
import {useCallback, useEffect, useRef, useState} from "react";
import '../../styles/Viewer.css'
import DragAndDrop from "../DragAndDrop";
import ModelLoading from "./ModelLoading.tsx";
import {ViewerContext} from "../../contexts";
import ToolSideBar from "./ToolSideBar";
import {toast} from "react-toastify";
import UiControl from "./UiControl.tsx";
const Viewer = () => {
    const viewerRef = useRef<HTMLDivElement | null>(null)
    const [loaded, setLoaded] = useState<boolean | undefined>(undefined)
    const [voxelized, setVoxelized] = useState<boolean | undefined>(undefined)
    const [modelLoader, setModelLoader] = useState<ModelLoader | undefined>(undefined);

    useEffect(() => {
        return () => {
            cleanUpViewer().then(() => setLoaded(undefined))
        }
    }, []);

    const handleGetFileFromDrop = useCallback(async (file: File) => {
        if (viewerRef?.current !== null) {
            setLoaded(false)
            const loader = new ModelLoader(viewerRef.current, file);
            const isLoaded = await loader.setup();
            if (isLoaded) {
                setLoaded(true)
                setModelLoader(loader)
                setVoxelized(true)
                toast('Successfully', {
                    toastId: '1',
                    type: 'success',
                    position: 'top-center',
                    autoClose: 3000
                })
            } else {
                setLoaded(undefined)
                setVoxelized(undefined)
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
        if (viewerRef.current) {
            viewerRef.current.innerHTML = '';
            viewerRef.current.classList.remove('obc-viewer');
            viewerRef.current.style.position = '';
        }
    }, [modelLoader])

    return (
        <ViewerContext.Provider value={{loaded, setLoaded, modelLoader, setModelLoader, closeViewer: cleanUpViewer, setVoxelized, voxelized}}>
            <div className='viewer-container'>
                <div className='loading-container'>
                    <ModelLoading isShow={loaded === false}/>
                </div>
                <div className='drag-and-drop'>
                    <DragAndDrop onChangeFile={handleGetFileFromDrop} isShow={loaded === undefined} accept='.ifc'/>
                </div>
                <div className='sidebar'>
                    <ToolSideBar isShow={loaded === true}/>
                </div>
                <div className='ui-control'>
                    <UiControl/>
                </div>
                <div className='viewer' ref={viewerRef}></div>
            </div>
        </ViewerContext.Provider>
    );
};

export default Viewer;